// Notifications Service
// Handles desktop notification display and interactions

// Show a reminder notification
export async function showReminderNotification(reminder) {
  try {
    console.log('[Notifications] showReminderNotification called with:', reminder);
    
    // Validate reminder object
    if (!reminder) {
      console.error('[Notifications] Reminder is null or undefined');
      throw new Error('Reminder is required');
    }
    
    if (!reminder.id) {
      console.error('[Notifications] Reminder missing id:', reminder);
      throw new Error('Reminder must have an id');
    }
    
    if (!reminder.title) {
      console.error('[Notifications] Reminder missing title:', reminder);
      throw new Error('Reminder must have a title');
    }
    
    const options = {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: reminder.title,
      message: reminder.description || 'NudgeNudge Reminder',
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'OK' },
        { title: 'Snooze 10m' }
      ]
    };
    
    console.log('[Notifications] Creating notification with options:', options);
    await chrome.notifications.create(reminder.id, options);
    console.log('[Notifications] Notification created successfully for:', reminder.id);
    return true;
  } catch (error) {
    console.error('[Notifications] Error showing notification:', error);
    console.error('[Notifications] Error stack:', error.stack);
    console.error('[Notifications] Reminder data:', reminder);
    throw error;
  }
}

// Clear a notification
export async function clearNotification(notificationId) {
  try {
    const cleared = await chrome.notifications.clear(notificationId);
    console.log('[Notifications] Cleared notification:', notificationId, cleared);
    return cleared;
  } catch (error) {
    console.error('[Notifications] Error clearing notification:', error);
    return false;
  }
}

// Show a simple notification (without reminder data)
export async function showSimpleNotification(title, message) {
  try {
    const options = {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 1
    };
    
    const notificationId = `simple_${Date.now()}`;
    await chrome.notifications.create(notificationId, options);
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error showing simple notification:', error);
    throw error;
  }
}
