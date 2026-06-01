// NudgeNudge Background Service Worker
// Handles alarms, notifications, and background tasks

import { getReminder, updateReminder, getAllReminders } from './services/storage.js';
import { showReminderNotification } from './services/notifications.js';
import { rescheduleReminder, syncAlarmsWithStorage } from './services/reminders.js';

// Service worker lifecycle
self.addEventListener('install', (event) => {
  console.log('[NudgeNudge] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[NudgeNudge] Service worker activated');
  event.waitUntil(
    clients.claim().then(() => {
      return syncAlarmsWithStorage();
    })
  );
});

// Sync alarms on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[NudgeNudge] Browser started, syncing alarms');
  await syncAlarmsWithStorage();
});

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[NudgeNudge] Alarm triggered:', alarm.name);
  await handleAlarm(alarm);
});

// Listen for notification interactions
chrome.notifications.onClicked.addListener(async (notificationId) => {
  console.log('[NudgeNudge] Notification clicked:', notificationId);
  await handleNotificationClick(notificationId);
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('[NudgeNudge] Notification button clicked:', notificationId, buttonIndex);
  await handleNotificationButton(notificationId, buttonIndex);
});

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  console.log('[NudgeNudge] Notification closed:', notificationId, byUser);
  
  // If dismissed by system (timeout), treat as snooze
  if (!byUser) {
    await handleAutoSnooze(notificationId);
  }
});

// Handle alarm triggers
async function handleAlarm(alarm) {
  try {
    // Check if this is a snooze alarm
    if (alarm.name.startsWith('snooze_')) {
      const reminderId = alarm.name.replace('snooze_', '');
      const reminder = await getReminder(reminderId);
      
      if (reminder && !reminder.paused) {
        await showReminderNotification(reminder);
      }
      
      // Clear the snooze alarm
      await chrome.alarms.clear(alarm.name);
      return;
    }
    
    // Regular reminder alarm
    const reminder = await getReminder(alarm.name);
    
    if (!reminder) {
      console.log('[NudgeNudge] Reminder not found, clearing alarm:', alarm.name);
      await chrome.alarms.clear(alarm.name);
      return;
    }
    
    if (reminder.paused) {
      console.log('[NudgeNudge] Reminder is paused, skipping:', alarm.name);
      return;
    }
    
    // Show notification
    await showReminderNotification(reminder);
    
    // Reschedule if recurring
    if (reminder.repeatType !== 'once') {
      await rescheduleReminder(reminder);
    } else {
      // For 'once' reminders, clear the alarm
      await chrome.alarms.clear(alarm.name);
    }
  } catch (error) {
    console.error('[NudgeNudge] Error handling alarm:', error);
  }
}

// Handle notification clicks
async function handleNotificationClick(notificationId) {
  try {
    // Clear the notification
    await chrome.notifications.clear(notificationId);
  } catch (error) {
    console.error('[NudgeNudge] Error handling notification click:', error);
  }
}

// Handle notification button clicks
async function handleNotificationButton(notificationId, buttonIndex) {
  try {
    const reminderId = notificationId;
    
    if (buttonIndex === 0) {
      // OK button - just dismiss
      await chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // Snooze 10m button
      await handleSnooze(reminderId);
      await chrome.notifications.clear(notificationId);
    }
  } catch (error) {
    console.error('[NudgeNudge] Error handling notification button:', error);
  }
}

// Handle snooze
async function handleSnooze(reminderId) {
  try {
    console.log('[NudgeNudge] Snoozing reminder for 10 minutes:', reminderId);
    
    // Create a snooze alarm for 10 minutes from now
    const snoozeTime = Date.now() + (10 * 60 * 1000);
    await chrome.alarms.create(`snooze_${reminderId}`, {
      when: snoozeTime
    });
  } catch (error) {
    console.error('[NudgeNudge] Error snoozing reminder:', error);
  }
}

// Handle auto-snooze on timeout
async function handleAutoSnooze(notificationId) {
  try {
    // Only auto-snooze if the notification was a reminder
    const reminder = await getReminder(notificationId);
    
    if (reminder && !reminder.paused) {
      console.log('[NudgeNudge] Auto-snoozing reminder:', notificationId);
      await handleSnooze(notificationId);
    }
  } catch (error) {
    console.error('[NudgeNudge] Error auto-snoozing:', error);
  }
}

// Initialize extension on startup
console.log('[NudgeNudge] Background service worker loaded');
