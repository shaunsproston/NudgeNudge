// Storage Service
// Handles all Chrome storage operations for reminders

const STORAGE_KEY = 'nudgenudge_reminders';

// Get all reminders from storage
export async function getAllReminders() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Storage] Error getting reminders:', error);
    return [];
  }
}

// Get a single reminder by ID
export async function getReminder(id) {
  const reminders = await getAllReminders();
  return reminders.find(r => r.id === id);
}

// Save a new reminder
export async function createReminder(reminder) {
  console.log('[Storage] createReminder called with:', reminder);
  try {
    const reminders = await getAllReminders();
    console.log('[Storage] Current reminders count:', reminders.length);
    const now = Date.now();
    const newReminder = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      paused: false,
      ...reminder
    };
    console.log('[Storage] New reminder object:', newReminder);
    reminders.push(newReminder);
    console.log('[Storage] Saving to chrome.storage.local...');
    await chrome.storage.local.set({ [STORAGE_KEY]: reminders });
    console.log('[Storage] Created reminder:', newReminder.id);
    return newReminder;
  } catch (error) {
    console.error('[Storage] Error creating reminder:', error);
    throw error;
  }
}

// Update an existing reminder
export async function updateReminder(id, updates) {
  try {
    const reminders = await getAllReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Reminder ${id} not found`);
    }
    reminders[index] = { 
      ...reminders[index], 
      ...updates,
      updatedAt: Date.now()
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: reminders });
    console.log('[Storage] Updated reminder:', id);
    return reminders[index];
  } catch (error) {
    console.error('[Storage] Error updating reminder:', error);
    throw error;
  }
}

// Delete a reminder
export async function deleteReminder(id) {
  try {
    const reminders = await getAllReminders();
    const filtered = reminders.filter(r => r.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
    return true;
  } catch (error) {
    console.error('[Storage] Error deleting reminder:', error);
    throw error;
  }
}

// Clear all reminders
export async function clearAllReminders() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing reminders:', error);
    throw error;
  }
}

// Generate a unique ID
function generateId() {
  return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
