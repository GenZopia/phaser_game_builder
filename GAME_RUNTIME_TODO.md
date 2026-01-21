# Making the Game Actually Playable

## Current Status

### ✅ What's Working
- Drag and drop objects to canvas
- Add behaviors to objects (Physics, Controls, Camera)
- Configure behavior parameters
- Save behavior data with objects
- Visual editor with pan and zoom

### ❌ What's NOT Working
- **Game Runtime** - Behaviors are just data, not executed
- **Physics Simulation** - No gravity, collisions, or forces
- **Keyboard Controls** - Input not captured or processed
- **Camera Following** - Camera doesn't actually follow objects

## Why Play Mode Doesn't Work

When you click Play, it just toggles a flag (`isPlaying: true`). The behaviors you configured are stored as JSON data but nothing reads or executes them.

## What You Need to Implement

### 1. Integrate Phaser.js (Recommended)

Phaser is a popular 2D game framework that handles:
- Physics simulation
- Input handling
- Camera management
- Sprite rendering
- Collision detection

**Installation:**
```bash
npm install phaser
```

### 2. Create Game Runtime Component

Create a new component that:
- Reads the scene data
- Creates Phaser game instance
- Converts objects to Phaser sprites
- Applies behaviors to sprites

**Example structure:**
```typescript
// src/components/Editor/GameRuntime.tsx
import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  create() {
    // Read objects from state
    // Create sprites for each object
    // Apply physics based on Physics behavior
    // Setup controls based on Controls behavior
    // Configure camera based on Camera behavior
  }
  
  update() {
    // Handle keyboard input
    // Update physics
    // Update camera
  }
}
```

### 3. Behavior Execution

For each behavior type, implement the logic:

#### Physics Behavior
```typescript
if (object.behaviors.find(b => b.type === 'physics')) {
  const physics = object.behaviors.find(b => b.type === 'physics');
  sprite.body.setMass(physics.parameters.mass);
  sprite.body.setDensity(physics.parameters.density);
  sprite.body.setFriction(physics.parameters.friction);
  sprite.body.setBounce(physics.parameters.bounce);
  sprite.body.setGravityY(physics.parameters.gravityScale * 300);
}
```

#### Controls Behavior
```typescript
if (object.behaviors.find(b => b.type === 'controls')) {
  const controls = object.behaviors.find(b => b.type === 'controls');
  const keys = controls.parameters.keys;
  
  // In update loop:
  if (cursors.left.isDown) {
    sprite.setVelocityX(-controls.parameters.moveSpeed);
  }
  if (cursors.right.isDown) {
    sprite.setVelocityX(controls.parameters.moveSpeed);
  }
  if (cursors.up.isDown && sprite.body.touching.down) {
    sprite.setVelocityY(-controls.parameters.jumpPower);
  }
}
```

#### Camera Behavior
```typescript
if (object.behaviors.find(b => b.type === 'camera')) {
  const camera = object.behaviors.find(b => b.type === 'camera');
  this.cameras.main.startFollow(sprite, true, 
    camera.parameters.smoothing, 
    camera.parameters.smoothing
  );
  this.cameras.main.setDeadzone(
    camera.parameters.deadzone.width,
    camera.parameters.deadzone.height
  );
}
```

### 4. Update Canvas Component

Replace the static canvas with Phaser when in Play mode:

```typescript
{state.isPlaying ? (
  <GameRuntime project={currentProject} />
) : (
  <canvas ref={canvasRef} ... />
)}
```

## Simpler Alternative: Basic Preview

If Phaser is too complex, create a simple preview:

1. **Animate objects** with Physics behavior (simple gravity)
2. **Show keyboard hints** for objects with Controls
3. **Highlight camera target** for objects with Camera behavior

This won't be a real game but shows the behaviors visually.

## Current Behavior System Value

Even without runtime, the behavior system is valuable for:
- **Game Design** - Plan and configure game mechanics
- **Data Export** - Export game configuration as JSON
- **Documentation** - Visual representation of game logic
- **Prototyping** - Quick iteration on game parameters

## Next Steps

1. **Decide**: Full Phaser integration or simple preview?
2. **Create GameRuntime component** (if Phaser)
3. **Implement behavior execution** for each type
4. **Test with simple scene** (player + platform + collectible)
5. **Add more features** (sound, animations, etc.)

## Resources

- Phaser Documentation: https://photonstorm.github.io/phaser3-docs/
- Phaser Examples: https://phaser.io/examples
- Phaser Tutorial: https://phaser.io/tutorials/making-your-first-phaser-3-game
