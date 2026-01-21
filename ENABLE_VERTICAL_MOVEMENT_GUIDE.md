# How to Enable Up/Down Arrow Movement

## Quick Guide

The up/down arrows ARE functional, but they work in two different modes:

### Current Mode: Platformer (Default)
- ⬆️ Up Arrow = **Jump** (only when on ground)
- ⬇️ Down Arrow = Not used
- This is for platform games like Mario

### To Enable Free Vertical Movement:

Follow these steps:

## Step-by-Step Instructions

### 1. Select Your Player Object
- Click on the player object in the canvas

### 2. Find Controls Behavior
- Scroll down in Properties Panel (right side)
- Look for the "Keyboard Controls" behavior card

### 3. Enable Vertical Movement
- Find the checkbox: **"Allow Vertical Movement (Top-Down)"**
- ✅ **Check this box**

### 4. Disable Gravity (Important!)
- Find the "Physics" behavior card
- Change **Gravity Scale** to **0**
- (Otherwise gravity will pull you down while moving up)

### 5. Test It!
- Click Play ▶️
- Press Up Arrow → Should move up
- Press Down Arrow → Should move down
- Press Left/Right → Should move left/right

## Visual Checklist

```
Properties Panel:
├── Transform
├── Behaviors
│   ├── Physics
│   │   ├── ✅ Enabled
│   │   ├── ❌ Static Body
│   │   ├── Mass: 1
│   │   ├── Gravity Scale: 0  ← SET THIS TO 0!
│   │   └── ...
│   │
│   └── Keyboard Controls
│       ├── ✅ Enabled
│       ├── Move Speed: 200
│       ├── Jump Power: 400
│       ├── ❌ Double Jump
│       ├── ✅ Allow Vertical Movement  ← CHECK THIS!
│       └── Key Bindings...
```

## What Each Mode Does

### Platformer Mode (Default)
```
allowVerticalMovement = false
gravityScale = 1

Result:
- Up = Jump
- Down = Nothing
- Gravity pulls you down
- Like Mario, Sonic, etc.
```

### Top-Down Mode
```
allowVerticalMovement = true
gravityScale = 0

Result:
- Up = Move up
- Down = Move down
- No gravity
- Like Zelda, Pokemon, etc.
```

## Still Not Working?

### Check These:

1. **Is Controls behavior added?**
   - Look for "Keyboard Controls" card in Properties Panel
   - If not, drag it from Behavior Library at bottom

2. **Is it enabled?**
   - Check the "Enabled" checkbox in Controls behavior

3. **Is gravity set to 0?**
   - In Physics behavior, set Gravity Scale to 0
   - Otherwise you'll fall while trying to move up

4. **Are you in Play mode?**
   - Click the Play ▶️ button in toolbar
   - Controls only work during gameplay

5. **Is the object selected?**
   - Make sure you're configuring the right object
   - Check the object type badge at top of Properties Panel

## Quick Test

### Create a Top-Down Test:

1. **Add Player** to canvas (center)
2. **Select Player**
3. **Add Physics Behavior**:
   - Enabled: ✅
   - Static: ❌
   - Gravity Scale: **0**
4. **Add Controls Behavior**:
   - Enabled: ✅
   - Move Speed: 200
   - Allow Vertical Movement: **✅**
5. **Click Play** ▶️
6. **Test**: Arrow keys should move in all 4 directions!

## Common Mistakes

### Mistake 1: Gravity Still On
```
❌ Gravity Scale: 1
✅ Gravity Scale: 0
```
**Fix**: Set gravity to 0 in Physics behavior

### Mistake 2: Checkbox Not Checked
```
❌ Allow Vertical Movement: unchecked
✅ Allow Vertical Movement: checked
```
**Fix**: Check the "Allow Vertical Movement" box

### Mistake 3: Testing in Editor Mode
```
❌ Testing while in editor (not playing)
✅ Click Play button first
```
**Fix**: Click Play ▶️ button in toolbar

## Summary

The up/down arrows ARE working! You just need to:
1. ✅ Check "Allow Vertical Movement" in Controls
2. ✅ Set "Gravity Scale" to 0 in Physics
3. ✅ Click Play to test

That's it! 🚀
