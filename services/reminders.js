// Reminders Service
// Handles reminder scheduling and alarm management

import { getReminder, updateReminder, getAllReminders } from './storage.js';
import { calculateNextTriggerTime } from '../utils/dates.js';
import { showReminderNotification } from './notifications.js';

// Schedule a reminder alarm
export async function scheduleReminder(reminder) {
  console.log('[Reminders] scheduleReminder called with:', reminder);
  try {
    if (reminder.paused) {
      console.log('[Reminders] Skipping alarm for paused reminder:', reminder.id);
      return false;
    }
    
    // Clear any existing alarm first
    console.log('[Reminders] Clearing any existing alarm for:', reminder.id);
    await chrome.alarms.clear(reminder.id);
    
    // Calculate when the alarm should fire
    const when = reminder.nextTrigger;
    console.log('[Reminders] Next trigger time:', when, new Date(when));
    console.log('[Reminders] Current time:', Date.now(), new Date(Date.now()));
    
    if (when <= Date.now()) {
      console.log('[Reminders] Next trigger is in the past, recalculating:', reminder.id);
      const newNextTrigger = calculateNextTriggerTime(reminder);
      await updateReminder(reminder.id, { nextTrigger: newNextTrigger });
      return scheduleReminder({ ...reminder, nextTrigger: newNextTrigger });
    }
    
    // Create the alarm
    console.log('[Reminders] Creating alarm with chrome.alarms.create...');
    await chrome.alarms.create(reminder.id, { when });
    
    // Verify alarm was created
    const createdAlarm = await chrome.alarms.get(reminder.id);
    console.log('[Reminders] Alarm created and verified:', createdAlarm);
    
    console.log('[Reminders] Scheduled alarm for:', reminder.id, new Date(when));
    return true;
  } catch (error) {
    console.error('[Reminders] Error scheduling reminder:', error);
    console.error('[Reminders] Error stack:', error.stack);
    throw error;
  }
}

// Clear a scheduled reminder alarm
export async function clearReminder(reminderId) {
  try {
    const cleared = await chrome.alarms.clear(reminderId);
    console.log('[Reminders] Cleared alarm:', reminderId, cleared);
    return cleared;
  } catch (error) {
    console.error('[Reminders] Error clearing reminder:', error);
    throw error;
  }
}

// Reschedule a recurring reminder after it fires
export async function rescheduleReminder(reminder) {
  try {
    if (reminder.repeatType === 'once') {
      console.log('[Reminders] Once reminder, not rescheduling:', reminder.id);
      return false;
    }
    
    // Calculate next trigger time
    const nextTrigger = calculateNextTriggerTime(reminder);
    
    // Update the reminder with new trigger time
    await updateReminder(reminder.id, { nextTrigger });
    
    // Schedule the alarm
    await scheduleReminder({ ...reminder, nextTrigger });
    
    console.log('[Reminders] Rescheduled reminder:', reminder.id, new Date(nextTrigger));
    return true;
  } catch (error) {
    console.error('[Reminders] Error rescheduling reminder:', error);
    throw error;
  }
}

// Get information about a scheduled alarm
export async function getReminderAlarm(reminderId) {
  try {
    const alarm = await chrome.alarms.get(reminderId);
    return alarm;
  } catch (error) {
    console.error('[Reminders] Error getting alarm:', error);
    return null;
  }
}

// Get all scheduled alarms
export async function getAllAlarms() {
  try {
    const alarms = await chrome.alarms.getAll();
    return alarms;
  } catch (error) {
    console.error('[Reminders] Error getting all alarms:', error);
    return [];
  }
}

// Sync alarms with storage (on startup or reload)
export async function syncAlarmsWithStorage() {
  try {
    console.log('[Reminders] Syncing alarms with storage');
    
    // Get all reminders from storage
    const reminders = await getAllReminders();
    console.log('[Reminders] Found reminders:', reminders.length);
    
    // If no reminders, nothing to sync
    if (reminders.length === 0) {
      console.log('[Reminders] No reminders to sync');
      return;
    }
    
    // Get all current alarms
    const alarms = await getAllAlarms();
    console.log('[Reminders] Found alarms:', alarms.length);
    
    // Clear orphaned alarms (alarms without corresponding reminders)
    for (const alarm of alarms) {
      if (alarm.name.startsWith('snooze_')) continue;
      
      const reminder = reminders.find(r => r.id === alarm.name);
      if (!reminder) {
        console.log('[Reminders] Clearing orphaned alarm:', alarm.name);
        await chrome.alarms.clear(alarm.name);
      }
    }
    
    // Process each reminder
    const now = Date.now();
    for (const reminder of reminders) {
      try {
        console.log('[Reminders] Processing reminder:', reminder.id);
        
        // Validate reminder has required fields
        if (!reminder.id || !reminder.repeatType || !reminder.nextTrigger) {
          console.error('[Reminders] Skipping invalid reminder (missing required fields):', reminder);
          continue;
        }
        
        if (reminder.paused) {
          // Clear alarm for paused reminders
          console.log('[Reminders] Reminder is paused, clearing alarm');
          await chrome.alarms.clear(reminder.id);
          continue;
        }
        
        // Check if reminder was missed
        if (reminder.nextTrigger <= now) {
          console.log('[Reminders] Missed reminder detected:', reminder.id);
          
          // Show missed notification immediately
          try {
            await showReminderNotification(reminder);
          } catch (err) {
            console.error('[Reminders] Error showing notification:', err);
            console.error('[Reminders] Stack:', err.stack);
          }
          
          // Recalculate next trigger
          if (reminder.repeatType !== 'once') {
            const nextTrigger = calculateNextTriggerTime(reminder);
            await updateReminder(reminder.id, { nextTrigger });
            await scheduleReminder({ ...reminder, nextTrigger });
          }
        } else {
          // Schedule or reschedule the alarm
          console.log('[Reminders] Scheduling reminder for future trigger');
          await scheduleReminder(reminder);
        }
      } catch (err) {
        console.error('[Reminders] Error processing reminder:', reminder?.id || 'unknown', err);
        console.error('[Reminders] Error stack:', err.stack);
      }
    }
    
    console.log('[Reminders] Alarm sync complete');
  } catch (error) {
    console.error('[Reminders] Error syncing alarms:', error);
    console.error('[Reminders] Stack:', error.stack);
    // Don't throw - allow service worker to continue
  }
}

// Toggle reminder paused state
export async function toggleReminderPaused(id) {
  try {
    const reminder = await getReminder(id);
    if (!reminder) {
      throw new Error(`Reminder ${id} not found`);
    }
    
    const newPausedState = !reminder.paused;
    await updateReminder(id, { paused: newPausedState });
    
    if (newPausedState) {
      // Clear alarm when pausing
      await clearReminder(id);
    } else {
      // Schedule alarm when resuming
      await scheduleReminder({ ...reminder, paused: false });
    }
    
    console.log('[Reminders] Toggled pause state:', id, newPausedState);
    return newPausedState;
  } catch (error) {
    console.error('[Reminders] Error toggling pause:', error);
    throw error;
  }
}

// Generate human-readable summary of reminder repeat pattern
export function generateReminderSummary(reminder) {
  const config = reminder.repeatConfig || reminder;
  
  switch (reminder.repeatType) {
    case 'once':
      return 'Once';
    
    case 'hourly':
      return config.interval === 1 
        ? 'Every hour' 
        : `Every ${config.interval} hours`;
    
    case 'daily':
      return 'Every day';
    
    case 'weekly': {
      if (!config.weekdays || config.weekdays.length === 0) {
        return 'Weekly';
      }
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = config.weekdays
        .sort((a, b) => a - b)
        .map(d => dayNames[d])
        .join(', ');
      return `Every ${days}`;
    }
    
    case 'monthly':
      return `Monthly on day ${config.dayOfMonth || 1}`;
    
    case 'custom': {
      const { interval, unit } = config;
      const unitLabel = interval === 1 
        ? unit.slice(0, -1) 
        : unit;
      return `Every ${interval} ${unitLabel}`;
    }
    
    default:
      return 'Unknown';
  }
}
