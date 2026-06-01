// NudgeNudge Popup Script
// Manages the popup UI and user interactions

console.log('[NudgeNudge] popup.js loading...');

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[NudgeNudge] Uncaught error:', event.error);
  console.error('[NudgeNudge] Error message:', event.message);
  console.error('[NudgeNudge] Error filename:', event.filename);
  console.error('[NudgeNudge] Error line:', event.lineno);
});

import { getAllReminders, createReminder, updateReminder, deleteReminder } from './services/storage.js';
import { 
  generateReminderSummary,
  toggleReminderPaused,
  scheduleReminder,
  clearReminder
} from './services/reminders.js';
import { formatDateTime } from './utils/dates.js';
import { calculateNextTriggerTime } from './utils/dates.js';

console.log('[NudgeNudge] Imports successful');

// DOM elements
let reminderForm;
let titleInput;
let descriptionInput;
let repeatTypeSelect;
let saveBtn;
let cancelBtn;
let emptyState;
let remindersList;

// Dynamic field containers
let onceFields, hourlyFields, dailyFields, weeklyFields, monthlyFields, customFields;

// State
let editingReminderId = null;

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[NudgeNudge] Popup initialized - DOMContentLoaded fired');
  
  // Get DOM references
  reminderForm = document.getElementById('reminderForm');
  titleInput = document.getElementById('titleInput');
  descriptionInput = document.getElementById('descriptionInput');
  repeatTypeSelect = document.getElementById('repeatTypeSelect');
  saveBtn = document.getElementById('saveBtn');
  cancelBtn = document.getElementById('cancelBtn');
  emptyState = document.getElementById('emptyState');
  remindersList = document.getElementById('remindersList');
  
  console.log('[NudgeNudge] DOM elements retrieved:', {
    reminderForm: !!reminderForm,
    titleInput: !!titleInput,
    descriptionInput: !!descriptionInput,
    repeatTypeSelect: !!repeatTypeSelect
  });
  
  // Dynamic field groups
  onceFields = document.getElementById('onceFields');
  hourlyFields = document.getElementById('hourlyFields');
  dailyFields = document.getElementById('dailyFields');
  weeklyFields = document.getElementById('weeklyFields');
  monthlyFields = document.getElementById('monthlyFields');
  customFields = document.getElementById('customFields');
  
  // Set up event listeners
  console.log('[NudgeNudge] Setting up event listeners...');
  reminderForm.addEventListener('submit', handleFormSubmit);
  cancelBtn.addEventListener('click', handleCancelEdit);
  repeatTypeSelect.addEventListener('change', handleRepeatTypeChange);
  console.log('[NudgeNudge] Event listeners attached');
  
  // Initialize form with default datetime
  console.log('[NudgeNudge] Initializing default date/time...');
  initializeDefaultDateTime();
  
  // Load and render reminders
  console.log('[NudgeNudge] Loading reminders...');
  await loadReminders();
  console.log('[NudgeNudge] Popup initialization complete');
});

// Initialize default date/time values
function initializeDefaultDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  
  document.getElementById('onceDatetime').value = formatDatetimeLocal(now);
  
  const timeString = formatTimeLocal(now);
  document.getElementById('dailyTime').value = timeString;
  document.getElementById('weeklyTime').value = timeString;
  document.getElementById('monthlyTime').value = timeString;
}

// Format date for datetime-local input
function formatDatetimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Format time for time input
function formatTimeLocal(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Handle repeat type change
function handleRepeatTypeChange() {
  const repeatType = repeatTypeSelect.value;
  
  // Hide all dynamic fields
  onceFields.classList.add('hidden');
  hourlyFields.classList.add('hidden');
  dailyFields.classList.add('hidden');
  weeklyFields.classList.add('hidden');
  monthlyFields.classList.add('hidden');
  customFields.classList.add('hidden');
  
  // Show relevant fields
  switch (repeatType) {
    case 'once':
      onceFields.classList.remove('hidden');
      break;
    case 'hourly':
      hourlyFields.classList.remove('hidden');
      break;
    case 'daily':
      dailyFields.classList.remove('hidden');
      break;
    case 'weekly':
      weeklyFields.classList.remove('hidden');
      break;
    case 'monthly':
      monthlyFields.classList.remove('hidden');
      break;
    case 'custom':
      customFields.classList.remove('hidden');
      break;
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  console.log('[NudgeNudge] Form submitted');
  
  try {
    console.log('[NudgeNudge] Building reminder data...');
    const reminderData = buildReminderData();
    console.log('[NudgeNudge] Reminder data built:', reminderData);
    
    if (editingReminderId) {
      // Update existing reminder
      console.log('[NudgeNudge] Updating reminder:', editingReminderId);
      await updateReminder(editingReminderId, reminderData);
      
      // Clear old alarm and schedule new one
      await clearReminder(editingReminderId);
      const updatedReminder = await getAllReminders().then(reminders => 
        reminders.find(r => r.id === editingReminderId)
      );
      if (updatedReminder && !updatedReminder.paused) {
        console.log('[NudgeNudge] Scheduling updated reminder...');
        await scheduleReminder(updatedReminder);
      }
      
      console.log('[NudgeNudge] Reminder updated:', editingReminderId);
    } else {
      // Create new reminder
      console.log('[NudgeNudge] Creating new reminder...');
      const newReminder = await createReminder(reminderData);
      console.log('[NudgeNudge] Reminder created:', newReminder);
      
      // Schedule alarm
      if (!newReminder.paused) {
        console.log('[NudgeNudge] Scheduling alarm for:', newReminder.id);
        const scheduled = await scheduleReminder(newReminder);
        console.log('[NudgeNudge] Alarm scheduled:', scheduled);
      }
      
      console.log('[NudgeNudge] Reminder creation complete');
    }
    
    // Reset form and reload
    console.log('[NudgeNudge] Resetting form and reloading...');
    resetForm();
    await loadReminders();
  } catch (error) {
    console.error('[NudgeNudge] Error saving reminder:', error);
    console.error('[NudgeNudge] Error stack:', error.stack);
    alert(`Error: ${error.message}`);
    titleInput.focus();
  }
}

// Build reminder data from form
function buildReminderData() {
  console.log('[NudgeNudge] buildReminderData called');
  
  const title = titleInput.value.trim();
  console.log('[NudgeNudge] Title:', title);
  if (!title) {
    throw new Error('Title is required');
  }
  
  const description = descriptionInput.value.trim();
  const repeatType = repeatTypeSelect.value;
  console.log('[NudgeNudge] Repeat type:', repeatType);
  
  const data = {
    title,
    description,
    repeatType,
    paused: false,
    repeatConfig: {}
  };
  
  // Build type-specific config
  switch (repeatType) {
    case 'once': {
      const datetime = document.getElementById('onceDatetime').value;
      console.log('[NudgeNudge] Once datetime value:', datetime);
      if (!datetime) throw new Error('Date and time required');
      const timestamp = new Date(datetime).getTime();
      console.log('[NudgeNudge] Once timestamp:', timestamp, 'Current time:', Date.now());
      if (timestamp <= Date.now()) {
        throw new Error('Reminder date/time must be in the future');
      }
      data.datetime = datetime;
      data.nextTrigger = timestamp;
      console.log('[NudgeNudge] Once reminder data ready:', data);
      break;
    }
    case 'hourly': {
      const interval = parseInt(document.getElementById('hourlyInterval').value) || 1;
      data.repeatConfig.interval = interval;
      data.nextTrigger = calculateNextTriggerTime({ 
        repeatType, 
        interval, 
        nextTrigger: 0 
      });
      break;
    }
    case 'daily': {
      const time = document.getElementById('dailyTime').value;
      if (!time) throw new Error('Time required');
      data.repeatConfig.time = time;
      data.nextTrigger = calculateNextTriggerTime({ repeatType, time });
      break;
    }
    case 'weekly': {
      const weekdays = Array.from(document.querySelectorAll('input[name="weekday"]:checked'))
        .map(cb => parseInt(cb.value));
      if (weekdays.length === 0) throw new Error('Select at least one day');
      const time = document.getElementById('weeklyTime').value;
      if (!time) throw new Error('Time required');
      data.repeatConfig.weekdays = weekdays;
      data.repeatConfig.time = time;
      data.nextTrigger = calculateNextTriggerTime({ repeatType, weekdays, time });
      break;
    }
    case 'monthly': {
      const day = parseInt(document.getElementById('monthlyDay').value) || 1;
      if (day < 1 || day > 31) throw new Error('Day must be between 1 and 31');
      const time = document.getElementById('monthlyTime').value;
      if (!time) throw new Error('Time required');
      data.repeatConfig.dayOfMonth = day;
      data.repeatConfig.time = time;
      data.nextTrigger = calculateNextTriggerTime({ 
        repeatType, 
        day, 
        time 
      });
      break;
    }
    case 'custom': {
      const interval = parseInt(document.getElementById('customInterval').value) || 1;
      if (interval < 1) throw new Error('Interval must be at least 1');
      const unit = document.getElementById('customUnit').value;
      data.repeatConfig.interval = interval;
      data.repeatConfig.unit = unit;
      data.nextTrigger = calculateNextTriggerTime({ 
        repeatType, 
        interval, 
        unit, 
        nextTrigger: 0 
      });
      break;
    }
  }
  
  return data;
}

// Reset form to initial state
function resetForm() {
  reminderForm.reset();
  editingReminderId = null;
  cancelBtn.classList.add('hidden');
  saveBtn.innerHTML = `
    <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    Save Reminder
  `;
  
  repeatTypeSelect.value = 'once';
  handleRepeatTypeChange();
  
  initializeDefaultDateTime();
  
  document.querySelectorAll('input[name="weekday"]').forEach(cb => {
    cb.checked = false;
  });
}

// Handle cancel edit
function handleCancelEdit() {
  resetForm();
}

// Load reminders from storage and render
async function loadReminders() {
  try {
    const reminders = await getAllReminders();
    console.log('[NudgeNudge] Loaded reminders:', reminders.length);
    
    if (reminders.length === 0) {
      showEmptyState();
    } else {
      renderReminders(reminders);
    }
  } catch (error) {
    console.error('[NudgeNudge] Error loading reminders:', error);
  }
}

// Show empty state
function showEmptyState() {
  emptyState.classList.remove('hidden');
  remindersList.classList.add('hidden');
}

// Render reminders list
function renderReminders(reminders) {
  emptyState.classList.add('hidden');
  remindersList.classList.remove('hidden');
  
  remindersList.innerHTML = '';
  
  const sorted = [...reminders].sort((a, b) => a.nextTrigger - b.nextTrigger);
  
  sorted.forEach(reminder => {
    const reminderElement = createReminderCard(reminder);
    remindersList.appendChild(reminderElement);
  });
}

// Create a reminder card element
function createReminderCard(reminder) {
  const card = document.createElement('div');
  card.className = `reminder-card${reminder.paused ? ' paused' : ''}`;
  
  const summary = generateReminderSummary(reminder);
  const nextTriggerText = formatDateTime(reminder.nextTrigger);
  
  card.innerHTML = `
    <div class="reminder-header">
      <div class="reminder-title">${escapeHtml(reminder.title)}</div>
      ${reminder.paused ? '<div class="reminder-status">Paused</div>' : ''}
    </div>
    ${reminder.description ? `<div class="reminder-description">${escapeHtml(reminder.description)}</div>` : ''}
    <div class="reminder-meta">
      <div class="reminder-repeat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>${summary}</span>
      </div>
      <div class="reminder-next">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>Next: ${nextTriggerText}</span>
      </div>
    </div>
    <div class="reminder-actions">
      <button class="reminder-btn btn-edit" data-id="${reminder.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit
      </button>
      <button class="reminder-btn btn-pause ${reminder.paused ? 'btn-success' : ''}" data-id="${reminder.id}">
        ${reminder.paused ? `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Resume
        ` : `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
          Pause
        `}
      </button>
      <button class="reminder-btn btn-delete btn-danger" data-id="${reminder.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Delete
      </button>
    </div>
  `;
  
  card.querySelector('.btn-edit').addEventListener('click', () => handleEditReminder(reminder.id));
  card.querySelector('.btn-pause').addEventListener('click', () => handlePauseReminder(reminder.id));
  card.querySelector('.btn-delete').addEventListener('click', () => handleDeleteReminder(reminder.id));
  
  return card;
}

// Handle edit reminder
async function handleEditReminder(id) {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find(r => r.id === id);
    
    if (!reminder) return;
    
    editingReminderId = id;
    titleInput.value = reminder.title;
    descriptionInput.value = reminder.description || '';
    repeatTypeSelect.value = reminder.repeatType;
    
    cancelBtn.classList.remove('hidden');
    saveBtn.innerHTML = `
      <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Update Reminder
    `;
    
    handleRepeatTypeChange();
    
    const config = reminder.repeatConfig || {};
    
    switch (reminder.repeatType) {
      case 'once':
        if (reminder.datetime) {
          document.getElementById('onceDatetime').value = reminder.datetime;
        }
        break;
      case 'hourly':
        document.getElementById('hourlyInterval').value = config.interval || 1;
        break;
      case 'daily':
        if (config.time) {
          document.getElementById('dailyTime').value = config.time;
        }
        break;
      case 'weekly':
        if (config.weekdays) {
          config.weekdays.forEach(day => {
            const checkbox = document.querySelector(`input[name="weekday"][value="${day}"]`);
            if (checkbox) checkbox.checked = true;
          });
        }
        if (config.time) {
          document.getElementById('weeklyTime').value = config.time;
        }
        break;
      case 'monthly':
        document.getElementById('monthlyDay').value = config.dayOfMonth || 1;
        if (config.time) {
          document.getElementById('monthlyTime').value = config.time;
        }
        break;
      case 'custom':
        document.getElementById('customInterval').value = config.interval || 1;
        document.getElementById('customUnit').value = config.unit || 'hours';
        break;
    }
    
    document.querySelector('.main').scrollTop = 0;
    titleInput.focus();
  } catch (error) {
    console.error('[NudgeNudge] Error editing reminder:', error);
  }
}

// Handle pause/resume reminder
async function handlePauseReminder(id) {
  try {
    await toggleReminderPaused(id);
    await loadReminders();
  } catch (error) {
    console.error('[NudgeNudge] Error pausing reminder:', error);
  }
}

// Handle delete reminder
async function handleDeleteReminder(id) {
  try {
    await clearReminder(id);
    await deleteReminder(id);
    console.log('[NudgeNudge] Reminder deleted:', id);
    await loadReminders();
  } catch (error) {
    console.error('[NudgeNudge] Error deleting reminder:', error);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
