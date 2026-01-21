# Vertical Movement Feature 🎮

## Overview
Added support for both platformer (jumping) and top-down (free vertical movement) control schemes.

## Two Control Modes

### 1. Platformer Mode (Default)
**Allow Vertical Movement**: ❌ OFF

**Behavior:**
- ⬆️ Up/W = Jump (only when on ground)
- ⬇️ Down/S = Not used
- ⬅️ Left/A = Move left
- ➡️ Right/D = Move right
- Space = Jump

**Use For:**
- Platform games
- Side-scrollers
- Jump-based games

### 2. Top-Down Mode
**Allow Vertical Movement**: ✅ ON

**Behavior:**
- ⬆️ Up/W = Move up
- ⬇️ Down/S = Move down
- ⬅️ Left/A = Move left
- ➡️ Right/D = Move right
- Space = Not used (no jumping)

**Use For:**
- Top-down games
- RPGs
- Maze games
- Twin-stick shooters

## How to Enable

### In Editor:
1. Select object with Controls behavior
2. Scroll to Controls parameters
3. Find "Allow Vertical Movement (Top-Down)"
4. ✅ Check the box
5. Click Play

### Result:
- Up/Down arrows now move vertically
- No jumping
- Free 4-directional movement
- Gravity still applies (disable with Physics behavior)

## Configuration

### For Top-Down Game:
```typescript
Controls Behavior:
- Allow Vertical Movement: ✅ ON
- Move Speed: 200

Physics Behavior:
- Gravity Scale: 0 (no gravity!)
- Static: false
```

### For Platformer Game:
```typescript
Controls Behavior:
- Allow Vertical Movement: ❌ OFF
- Move Speed: 200
- Jump Power: 400

Physics Behavior:
- Gravity Scale: 1 (normal gravity)
- Static: false
```

## Examples

### Example 1: Platformer
```
Player:
- Physics: Gravity = 1
- Controls: allowVerticalMovement = false, jumpPower = 400

Result: Player jumps with Up/Space, falls with gravity
```

### Example 2: Top-Down RPG
```
Player:
- Physics: Gravity = 0
- Controls: allowVerticalMovement = true, moveSpeed = 150

Result: Player moves freely in all 4 directions
```

### Example 3: Space Shooter
```
Player:
- Physics: Gravity = 0, isStatic = false
- Controls: allowVerticalMovement = true, moveSpeed = 300

Result: Fast 4-directional movement, no gravity
```

## On-Screen Controller

The D-pad works with both modes:

**Platformer Mode:**
- ▲ = Jump
- ▼ = Not used
- ◀ = Left
- ▶ = Right
- A = Jump

**Top-Down Mode:**
- ▲ = Move up
- ▼ = Move down
- ◀ = Left
- ▶ = Right
- A = Not used

## Technical Details

### Code Logic
```typescript
if (params.allowVerticalMovement) {
  // Top-down mode
  if (upPressed) body.setVelocityY(-moveSpeed);
  else if (downPressed) body.setVelocityY(moveSpeed);
  else body.setVelocityY(0);
} else {
  // Platformer mode
  if (upPressed && isOnGround) {
    body.setVelocityY(-jumpPower);
  }
}
```

### Input Sources
All three work:
- Keyboard (Arrow keys)
- Keyboard (WASD)
- On-screen controller

## Tips

### For Platformers:
1. Keep "Allow Vertical Movement" OFF
2. Set gravity to 1 or higher
3. Adjust jump power (300-500)
4. Enable double jump if desired

### For Top-Down:
1. Turn "Allow Vertical Movement" ON
2. Set gravity to 0
3. Adjust move speed (100-300)
4. Consider adding diagonal movement smoothing

### For Flying Games:
1. Turn "Allow Vertical Movement" ON
2. Set gravity to 0 or low (0.1-0.3)
3. Higher move speed (300-500)
4. Add physics for momentum

## Common Issues

### Issue: Up arrow doesn't work
**Solution**: Check "Allow Vertical Movement" checkbox

### Issue: Player falls when moving up
**Solution**: Set Gravity Scale to 0 in Physics behavior

### Issue: Can't jump in platformer
**Solution**: Uncheck "Allow Vertical Movement"

### Issue: Player moves too fast vertically
**Solution**: Reduce Move Speed parameter

## Summary

The vertical movement toggle gives you:
- ✅ **Platformer mode** - Jumping with gravity
- ✅ **Top-Down mode** - Free 4-directional movement
- ✅ **Easy toggle** - Single checkbox
- ✅ **Works with all inputs** - Keyboard + controller

Perfect for any game genre! 🚀
