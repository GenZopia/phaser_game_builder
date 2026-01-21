# Drag & Drop Behavior Testing Guide

## What I Added

### 1. Test Button
A blue button at the top of Behaviors section that says "🧪 Test Add Physics (Click to test)"
- Click it to manually add a Physics behavior
- If this works, the state update system is working
- If this doesn't work, there's an issue with the state management

### 2. Enhanced Logging
Console messages with emojis to track the flow:
- 🚀 Drag started
- 📤 Setting drag data
- 🎯 Drag over drop zone
- 👋 Drag leave drop zone
- 🎉 Drop event triggered
- ✅ Success messages
- ❌ Error messages

### 3. Visual Drop Zone
- Bigger drop zone (100px min height)
- Shows "⬇️ Drop behaviors here" text
- Turns blue with "✅ Drop here!" when dragging over
- Thicker border when dragging

## Testing Steps

### Step 1: Test State Management
1. Open browser (should be at http://localhost:3001)
2. Open Console (F12)
3. Add a Player object to canvas
4. Select it (click on it)
5. Scroll down in Properties Panel
6. Click the blue "🧪 Test Add Physics" button
7. **Expected**: Physics behavior card appears below
8. **If it works**: State management is OK
9. **If it doesn't work**: Check console for errors

### Step 2: Test Drag & Drop
1. Scroll to bottom of Properties Panel
2. Find "Behaviors" section with three items:
   - ⚛️ Physics
   - ⌨️ Keyboard Controls
   - 📷 Camera Follow
3. Click and hold on "Physics"
4. **Watch console** - should see: 🚀 Drag started
5. Drag up to the drop zone (dashed box)
6. **Watch console** - should see: 🎯 Drag over
7. **Watch drop zone** - should turn blue
8. Release mouse
9. **Watch console** - should see: 🎉 Drop event triggered
10. **Expected**: Physics behavior card appears

## What to Check in Console

### If drag doesn't start:
- No 🚀 message → Check if behavior items are draggable
- Check if onDragStart is being called

### If drag starts but drop doesn't work:
- 🚀 appears but no 🎯 → Drop zone not receiving dragOver
- 🎯 appears but no 🎉 → Drop event not firing
- 🎉 appears but ❌ follows → Check error message

### If drop works but UI doesn't update:
- All ✅ messages appear
- But no behavior card shows
- → State update issue, check Redux/Context

## Common Issues

1. **Scrolling Problem**: If Properties Panel is scrollable, make sure you can scroll to see both the drop zone AND the behavior library
2. **Z-index Issue**: Make sure nothing is covering the drop zone
3. **Event Bubbling**: Check if events are being stopped by parent elements

## Quick Fix Test

If nothing works, try this in browser console:
```javascript
// This should add a behavior directly
const event = new CustomEvent('test');
document.querySelector('.behavior-drop-zone')?.dispatchEvent(event);
```
