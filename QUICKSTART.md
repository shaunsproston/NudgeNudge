# Quick Start Guide

## Load the Extension

1. **Open Chrome Extensions:**
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner

3. **Load NudgeNudge:**
   - Click "Load unpacked"
   - Select the `/Users/shaunsproston/code/NudgeNudge` folder
   - The extension will load and appear in your list

4. **Click the extension icon** to open the popup

## Create Your First Reminder

1. **Enter a title** - e.g., "Check emails"
2. **Select repeat type:**
   - **Once** - fires one time at specific date/time
   - **Hourly** - fires every N hours
   - **Daily** - fires every day at a specific time
   - **Weekly** - fires on selected days each week
   - **Monthly** - fires on a specific day each month
   - **Custom** - fires every N minutes/hours/days

3. **Fill in reminder-specific fields** based on type
4. **Click Save Reminder**
5. **See your reminder appear** in the list below

## Testing Quick Reminders

To test notifications quickly:

1. Create a "Once" reminder for **2 minutes from now**
2. Set time in the datetime picker
3. Save
4. Wait 2 minutes
5. **Desktop notification should appear** with your reminder title
6. Click **OK** or **Snooze 10m**

## Manage Reminders

- **Edit** - Click edit button, modify, click update
- **Pause** - Click pause to pause/resume a reminder
- **Delete** - Click delete to remove completely

## Debug & Troubleshoot

### View Service Worker Logs

1. Go to `chrome://extensions/`
2. Find NudgeNudge
3. Click **Service worker** button
4. DevTools opens with background logs

### View Popup Logs

1. Right-click NudgeNudge icon
2. Select **Inspect**
3. Check Console tab for errors

### View Stored Data

1. Right-click popup → **Inspect**
2. Go to **Application** tab
3. Click **Local Storage** → find `nudgenudge_reminders`
4. See all your reminders stored as JSON

## Common Issues

| Issue | Solution |
|-------|----------|
| Notification doesn't appear | Wait longer or check service worker console for errors |
| Reminder gone after restart | Check Local Storage to verify it was saved |
| Alarm doesn't fire | Check that next trigger time is in future; verify not paused |
| Edit doesn't work | Open DevTools console to see any errors |

## What's Fixed

Read **FIXES.md** for details on all stabilization improvements:
- ✅ Complete CSS styling
- ✅ Reliable reminder persistence
- ✅ Fixed data structure consistency
- ✅ Better error messages
- ✅ Improved form validation
- ✅ Chrome restart recovery

## Full Testing Guide

See **TESTING.md** for comprehensive test cases covering all features.

## Next Steps

- [x] Load extension
- [ ] Create a reminder
- [ ] Test notification
- [ ] Edit a reminder
- [ ] Pause/resume
- [ ] Check Chrome restart recovery

Enjoy! 🚀

