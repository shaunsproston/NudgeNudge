# NudgeNudge Chrome Extension

A lightweight reminder extension with recurring reminders and desktop notifications.

## Tech Stack
- Chrome Extension Manifest V3
- Vanilla JavaScript (ES Modules)
- Plain HTML/CSS
- No frameworks, no dependencies

## Project Structure
```
nudge-nudge/
│
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── popup.css             # Popup styles
│
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── services/             # Business logic modules
│   ├── storage.js        # Chrome storage operations
│   ├── reminders.js      # Alarm scheduling
│   └── notifications.js  # Desktop notifications
│
└── utils/                # Utility functions
    └── dates.js          # Date/time helpers
```

## Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `nudge-nudge/` folder
5. The extension should now appear in your extensions list

## Testing

1. **View the popup:**
   - Click the NudgeNudge icon in the Chrome toolbar
   - You should see the empty state with "New Reminder" button

2. **Check background logs:**
   - Go to `chrome://extensions/`
   - Find NudgeNudge and click **Service worker**
   - DevTools will open showing background script logs

3. **Debug the popup:**
   - Right-click the popup and select **Inspect**
   - DevTools will open for popup debugging

## Current Status

✅ Phase 1 Complete:
- Project structure
- Manifest V3 configuration
- Empty state UI
- Service modules scaffolded
- Dark/light mode support

⏳ Coming in Phase 2:
- Reminder creation form
- Edit/delete functionality
- Alarm integration
- Full notification system

## Notes

- Icons are placeholder purple squares (replace with custom designs later)
- Service worker supports ES modules
- All storage uses chrome.storage.local
- Styled for both light and dark modes

## Common Issues

- **Extension won't load:** Check for errors on `chrome://extensions/`
- **Service worker inactive:** Check the service worker link for errors
- **Popup blank:** Right-click popup → Inspect to see console errors
