# Top-Down Movement Now Default! 🎮

## What Changed

### New Defaults:
- ✅ **Allow Vertical Movement**: Now **ON** by default
- ✅ **Gravity Scale**: Now **0** by default

### Result:
**Up/Down arrows now work immediately!**

## How It Works Now

### When You Add Controls Behavior:
- ⬆️ Up Arrow / W = Move Up
- ⬇️ Down Arrow / S = Move Down
- ⬅️ Left Arrow / A = Move Left
- ➡️ Right Arrow / D = Move Right

### When You Add Physics Behavior:
- Gravity = 0 (no falling)
- Objects move freely in all directions
- Perfect for top-down games!

## Quick Test

1. **Add a Player** to canvas
2. **Add Physics Behavior** (drag from library)
   - Default gravity = 0 ✅
3. **Add Controls Behavior** (drag from library)
   - Default vertical movement = ON ✅
4. **Click Play** ▶️
5. **Use Arrow Keys** or **WASD**
   - All 4 directions work immediately!

## For Platformer Games

If you want jumping instead of vertical movement:

1. Select object
2. Find Controls behavior
3. ❌ Uncheck "Allow Vertical Movement"
4. Set Gravity Scale to 1 in Physics
5. Now Up = Jump!

## Game Types

### Top-Down Games (Default Now!)
```
✅ Allow Vertical Movement: ON
✅ Gravity Scale: 0

Perfect for:
- RPGs (Zelda, Pokemon)
- Maze games
- Twin-stick shooters
- Racing games (top view)
```

### Platformer Games (Optional)
```
❌ Allow Vertical Movement: OFF
Gravity Scale: 1

Perfect for:
- Platform games (Mario, Sonic)
- Side-scrollers
- Jump-based games
```

## On-Screen Controller

The D-pad now works for top-down by default:
- ▲ = Move Up
- ▼ = Move Down
- ◀ = Move Left
- ▶ = Move Right
- A = Jump (if vertical movement disabled)

## Benefits

### Before:
- Had to enable checkbox
- Had to set gravity to 0
- Extra steps

### Now:
- ✅ Works immediately
- ✅ No configuration needed
- ✅ Perfect for most games

## Summary

**Up/Down arrows now work by default!**

Just add Controls behavior and start playing:
- ⬆️⬇️⬅️➡️ All directions work
- No gravity pulling you down
- Perfect for top-down games

If you want platformer jumping, just uncheck "Allow Vertical Movement" and set gravity to 1!

🚀 Top-down movement is now the default!
