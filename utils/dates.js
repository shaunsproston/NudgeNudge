// Date Utilities
// Helper functions for date/time handling and formatting

// Format a timestamp to readable date/time string
export function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format a timestamp to time only
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format a timestamp to date only
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Get relative time description (e.g., "in 5 minutes", "2 hours ago")
export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (absDiff < minute) {
    return diff > 0 ? 'in less than a minute' : 'just now';
  } else if (absDiff < hour) {
    const minutes = Math.floor(absDiff / minute);
    return diff > 0 
      ? `in ${minutes} minute${minutes > 1 ? 's' : ''}`
      : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (absDiff < day) {
    const hours = Math.floor(absDiff / hour);
    return diff > 0
      ? `in ${hours} hour${hours > 1 ? 's' : ''}`
      : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(absDiff / day);
    return diff > 0
      ? `in ${days} day${days > 1 ? 's' : ''}`
      : `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Check if a timestamp is in the past
export function isPast(timestamp) {
  return timestamp < Date.now();
}

// Check if a timestamp is today
export function isToday(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Add minutes to a timestamp
export function addMinutes(timestamp, minutes) {
  return timestamp + (minutes * 60 * 1000);
}

// Add hours to a timestamp
export function addHours(timestamp, hours) {
  return timestamp + (hours * 60 * 60 * 1000);
}

// Add days to a timestamp
export function addDays(timestamp, days) {
  return timestamp + (days * 24 * 60 * 60 * 1000);
}

// Round timestamp to nearest minute
export function roundToMinute(timestamp) {
  return Math.round(timestamp / (60 * 1000)) * (60 * 1000);
}

// Calculate next trigger time for a reminder
export function calculateNextTriggerTime(reminder) {
  try {
    console.log('[Dates] calculateNextTriggerTime called with:', reminder);
    
    if (!reminder) {
      console.error('[Dates] Reminder is null or undefined');
      return Date.now() + (5 * 60 * 1000);
    }
    
    if (!reminder.repeatType) {
      console.error('[Dates] Reminder missing repeatType:', reminder);
      return Date.now() + (5 * 60 * 1000);
    }
    
    const now = Date.now();
    
    // Support both old structure (direct properties) and new structure (repeatConfig)
    const config = reminder.repeatConfig || reminder;
    
    switch (reminder.repeatType) {
      case 'once': {
        // For once reminders, use the original datetime
        if (reminder.datetime) {
          const timestamp = new Date(reminder.datetime).getTime();
          console.log('[Dates] Once reminder calculated:', timestamp);
          return timestamp;
        }
        console.log('[Dates] Once reminder using nextTrigger or default');
        return reminder.nextTrigger || now + (5 * 60 * 1000);
      }
      
      case 'hourly': {
        const interval = config.interval || 1;
        const intervalMs = interval * 60 * 60 * 1000;
        
        // If we have a previous trigger, use that as base
        if (reminder.nextTrigger && reminder.nextTrigger > 0) {
          let next = reminder.nextTrigger;
          // Keep adding interval until we're in the future
          while (next <= now) {
            next += intervalMs;
          }
          console.log('[Dates] Hourly reminder calculated:', next);
          return next;
        }
        
        // First time, start from now
        const nextTime = now + intervalMs;
        console.log('[Dates] Hourly reminder (first time):', nextTime);
        return nextTime;
      }
      
      case 'daily': {
        const timeStr = config.time || '09:00';
        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
          console.error('[Dates] Invalid time format for daily:', timeStr);
          return now + (24 * 60 * 60 * 1000); // Default to 24 hours from now
        }
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.error('[Dates] Invalid hours/minutes for daily:', hours, minutes);
          return now + (24 * 60 * 60 * 1000);
        }
        
        const next = new Date();
        next.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, move to tomorrow
        if (next.getTime() <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        console.log('[Dates] Daily reminder calculated:', next.getTime());
        return next.getTime();
      }
      
      case 'weekly': {
        const weekdays = config.weekdays || [1];
        const timeStr = config.time || '09:00';
        
        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
          console.error('[Dates] Invalid time format for weekly:', timeStr);
          return now + (24 * 60 * 60 * 1000);
        }
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.error('[Dates] Invalid hours/minutes for weekly:', hours, minutes);
          return now + (24 * 60 * 60 * 1000);
        }
        
        const next = new Date();
        next.setHours(hours, minutes, 0, 0);
        
        let daysToAdd = 0;
        let currentDay = next.getDay();
        
        // If today's time has passed, start from tomorrow
        if (next.getTime() <= now) {
          daysToAdd = 1;
          currentDay = (currentDay + 1) % 7;
        }
        
        // Find the next day in weekdays array
        let attempts = 0;
        while (!weekdays.includes(currentDay) && attempts < 7) {
          daysToAdd++;
          currentDay = (currentDay + 1) % 7;
          attempts++;
        }
        
        // If no valid day found, default to tomorrow
        if (attempts >= 7) {
          daysToAdd = 1;
        }
        
        next.setDate(next.getDate() + daysToAdd);
        console.log('[Dates] Weekly reminder calculated:', next.getTime());
        return next.getTime();
      }
      
      case 'monthly': {
        const day = config.dayOfMonth || 1;
        const timeStr = config.time || '09:00';
        
        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
          console.error('[Dates] Invalid time format for monthly:', timeStr);
          return now + (30 * 24 * 60 * 60 * 1000);
        }
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.error('[Dates] Invalid hours/minutes for monthly:', hours, minutes);
          return now + (30 * 24 * 60 * 60 * 1000);
        }
        
        const next = new Date();
        next.setHours(hours, minutes, 0, 0);
        
        // Try to set to the target day of this month
        const currentMonth = next.getMonth();
        next.setDate(day);
        
        // If the date overflowed to next month (e.g., Feb 31 -> Mar 3)
        // or if the time has passed this month, move to next month
        if (next.getMonth() !== currentMonth || next.getTime() <= now) {
          next.setMonth(currentMonth + 1);
          next.setDate(1); // Start from first of next month
          next.setDate(day);
          
          // Handle overflow again (e.g., setting day 31 in a 30-day month)
          const targetMonth = (currentMonth + 1) % 12;
          if (next.getMonth() !== targetMonth) {
            // Use last day of target month
            next.setDate(0); // Go back to last day of previous month
          }
        }
        
        console.log('[Dates] Monthly reminder calculated:', next.getTime());
        return next.getTime();
      }
      
      case 'custom': {
        const interval = config.interval || 1;
        const unit = config.unit || 'hours';
        
        let intervalMs = 0;
        switch (unit) {
          case 'minutes':
            intervalMs = interval * 60 * 1000;
            break;
          case 'hours':
            intervalMs = interval * 60 * 60 * 1000;
            break;
          case 'days':
            intervalMs = interval * 24 * 60 * 60 * 1000;
            break;
          default:
            console.error('[Dates] Invalid unit for custom:', unit);
            intervalMs = interval * 60 * 60 * 1000; // Default to hours
        }
        
        // If we have a previous trigger, use that as base
        if (reminder.nextTrigger && reminder.nextTrigger > 0) {
          let next = reminder.nextTrigger;
          // Keep adding interval until we're in the future
          while (next <= now) {
            next += intervalMs;
          }
          console.log('[Dates] Custom reminder calculated:', next);
          return next;
        }
        
        // First time, start from now
        const nextTime = now + intervalMs;
        console.log('[Dates] Custom reminder (first time):', nextTime);
        return nextTime;
      }
      
      default:
        console.warn('[Dates] Unknown repeat type:', reminder.repeatType);
        return now + (5 * 60 * 1000);
    }
  } catch (error) {
    console.error('[Dates] Error calculating next trigger time:', error);
    console.error('[Dates] Error stack:', error.stack);
    console.error('[Dates] Reminder data:', reminder);
    // Return a safe default (5 minutes from now)
    return Date.now() + (5 * 60 * 1000);
  }
}
