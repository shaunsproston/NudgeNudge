# NudgeNudge

> A lightweight Chrome extension for managing reminders with recurring schedules and desktop notifications.

## Overview

NudgeNudge is a minimalist reminder application built as a Chrome Extension using Manifest V3. It provides a simple, no-nonsense interface for creating one-time and recurring reminders with reliable desktop notifications—all without requiring external dependencies or frameworks.

## Features

- ✅ **Multiple Reminder Types**: Once, Hourly, Daily, Weekly, Monthly, and Custom intervals
- ✅ **Desktop Notifications**: Chrome native notifications with snooze support
- ✅ **Recurring Reminders**: Full support for complex recurring schedules
- ✅ **Pause/Resume**: Control active reminders without deleting them
- ✅ **Persistent Storage**: Reminders survive browser restarts
- ✅ **Dark/Light Mode**: Automatic theme support
- ✅ **Zero Dependencies**: Pure vanilla JavaScript—no build step required

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Chrome Extension Manifest V3 |
| **Language** | Vanilla JavaScript (ES Modules) |
| **Storage** | `chrome.storage.local` |
| **Scheduling** | `chrome.alarms` API |
| **Notifications** | `chrome.notifications` API |
| **UI** | HTML5 + CSS3 (no frameworks) |
| **Build Tools** | None (runs directly in Chrome) |

## Project Structure

```
NudgeNudge/
│
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker entry point
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic & event handlers
├── popup.css              # Popup styles (dark/light mode)
│
├── icons/                 # Extension icons (16, 32, 48, 128)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── services/              # Core business logic (ES modules)
│   ├── storage.js         # CRUD operations for reminders
│   ├── reminders.js       # Alarm scheduling & recurrence logic
│   └── notifications.js   # Desktop notification handling
│
└── utils/                 # Shared utilities
    └── dates.js           # Date/time calculations
```

## Installation

### For Development

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `NudgeNudge/` directory
6. The extension icon should appear in your toolbar

### For Users

*Publishing to Chrome Web Store coming soon.*

## Usage

### Creating a Reminder

1. Click the NudgeNudge icon in your Chrome toolbar
2. Click **New Reminder** (or the **+** button)
3. Fill in the form:
   - **Title**: Brief description
   - **Description** (optional): Additional details
   - **Type**: Once, Hourly, Daily, Weekly, Monthly, or Custom
   - **Schedule**: Configure date/time or recurrence pattern
4. Click **Save**

### Managing Reminders

- **Edit**: Click the ✏️ icon on any reminder card
- **Delete**: Click the 🗑️ icon
- **Pause/Resume**: Click the ⏸️/▶️ button
- **View Details**: Expand the reminder card to see full description

### Notification Behaviour

When a reminder triggers:
- A desktop notification appears
- Two action buttons are available:
  - **OK**: Dismiss the notification
  - **Snooze 10m**: Delay the reminder by 10 minutes
- If ignored, the notification **auto-snoozes after 30 seconds**

## Development

### Prerequisites

- Chrome browser (version 88+)
- Basic understanding of Chrome Extension APIs
- No build tools or package managers required

### Debugging

#### Service Worker (Background Script)
```bash
1. Go to chrome://extensions/
2. Find NudgeNudge
3. Click "Service worker" link
4. DevTools opens with console logs from background.js
```

#### Popup UI
```bash
1. Click the NudgeNudge icon to open popup
2. Right-click anywhere in the popup
3. Select "Inspect"
4. DevTools opens with popup context
```

#### Checking Storage
```javascript
// In popup DevTools console:
chrome.storage.local.get(null, (data) => console.log(data));
```

#### Checking Alarms
```javascript
// In service worker DevTools console:
chrome.alarms.getAll().then(alarms => console.log('All alarms:', alarms));
```

### Architecture Notes

- **Service Worker Lifecycle**: The background script (`background.js`) runs as a service worker and may go inactive after 30 seconds of inactivity. This is normal—alarms will wake it up when needed.
- **Static Imports Only**: Manifest V3 service workers don't support dynamic imports. All modules are statically imported at the top of each file.
- **Alarm Persistence**: Chrome persists alarms across browser restarts automatically. The extension syncs storage with alarms on startup.
- **Unique Alarm IDs**: Each reminder uses its `id` as the alarm name to prevent duplicates.

## Troubleshooting

### Extension Won't Load
- Check `chrome://extensions/` for error messages
- Verify `manifest.json` is valid JSON
- Ensure all file paths in `manifest.json` are correct

### Service Worker Errors
- Click the "Service worker" link on `chrome://extensions/`
- Check console for errors
- Look for module import failures or permission issues

### Notifications Not Appearing
1. **Check macOS/Windows notification permissions:**
   - macOS: System Settings → Notifications → Google Chrome (must be enabled)
   - Windows: Settings → Notifications → Google Chrome
2. **Check Chrome notification settings:**
   - Navigate to `chrome://settings/content/notifications`
   - Ensure notifications are allowed
3. **Test notifications manually:**
   ```javascript
   // In service worker console:
   chrome.notifications.create('test', {
     type: 'basic',
     iconUrl: 'icons/icon128.png',
     title: 'Test',
     message: 'Testing notifications'
   });
   ```

### Reminders Not Persisting
- Check Application → Local Storage in popup DevTools
- Verify `nudgenudge_reminders` key exists
- Check for console errors during save operation

### Alarms Not Firing
- Verify alarm was created: `chrome.alarms.getAll()`
- Check that `nextTrigger` timestamp is in the future
- Ensure Chrome is running (alarms don't fire if Chrome is closed)

## Reminder Object Schema

```javascript
{
  id: string,              // Unique identifier (UUID)
  title: string,           // Display title
  description: string,     // Optional details
  repeatType: string,      // "once" | "hourly" | "daily" | "weekly" | "monthly" | "custom"
  repeatConfig: {          // Type-specific configuration
    interval?: number,     // For custom intervals
    unit?: string,         // "minutes" | "hours" | "days"
    weekdays?: number[],   // For weekly (0=Sunday, 6=Saturday)
    dayOfMonth?: number,   // For monthly (1-31)
    time?: string          // "HH:MM" format for daily/weekly/monthly
  },
  nextTrigger: number,     // Unix timestamp (ms) of next alarm
  paused: boolean,         // Whether reminder is active
  createdAt: number,       // Unix timestamp (ms)
  updatedAt: number        // Unix timestamp (ms)
}
```
