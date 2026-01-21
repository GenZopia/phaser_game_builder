# Oblique Collision Behavior 🔷

## Overview
The Oblique behavior gives you precise control over which objects can collide with each other. Objects with this behavior can pass through normal objects and only collide with other oblique objects in the same collision group.

## Features

### ✅ Selective Collision
- **Only Collide With Oblique**: When enabled, object passes through all normal objects
- **Collision Groups**: Objects only collide with others in the same group
- **Padding**: Adjust collision area (smaller hitbox)

## Parameters

### 1. Enabled
- **Type**: Boolean
- **Default**: true
- **Description**: Toggle oblique collision on/off

### 2. Only Collide With Oblique
- **Type**: Boolean
- **Default**: true
- **Description**: 
  - `true`: Object passes through normal objects, only collides with other oblique objects
  - `false`: Object collides with everything (normal + oblique)

### 3. Collision Group
- **Type**: String
- **Default**: "default"
- **Description**: Objects only collide with others in the same group
- **Examples**: "player", "enemy", "platform", "projectile"

### 4. Padding
- **Type**: Number (0-100)
- **Default**: 0
- **Description**: Shrinks collision area by this many pixels
- **Use Case**: Make hitbox smaller than visual sprite

## How It Works

### Collision Rules

#### Case 1: Normal Object vs Normal Object
```
Object A: No Oblique
Object B: No Oblique
Result: ✅ COLLIDE (default behavior)
```

#### Case 2: Oblique vs Normal
```
Object A: Oblique (onlyCollideWithOblique = true)
Object B: No Oblique
Result: ❌ PASS THROUGH
```

#### Case 3: Oblique vs Oblique (Same Group)
```
Object A: Oblique (group = "player")
Object B: Oblique (group = "player")
Result: ✅ COLLIDE
```

#### Case 4: Oblique vs Oblique (Different Group)
```
Object A: Oblique (group = "player")
Object B: Oblique (group = "enemy")
Result: ❌ PASS THROUGH
```

## Use Cases

### 1. Player Passing Through Platforms
**Scenario**: Player should pass through certain platforms but not others

**Setup**:
- **Player**: Oblique (group = "player", onlyCollideWithOblique = false)
- **Solid Platform**: No Oblique → Player collides ✅
- **Pass-Through Platform**: Oblique (group = "passthrough") → Player passes through ❌

### 2. Projectiles
**Scenario**: Bullets should pass through enemies but hit walls

**Setup**:
- **Bullet**: Oblique (group = "projectile", onlyCollideWithOblique = true)
- **Enemy**: No Oblique → Bullet passes through ❌
- **Wall**: Oblique (group = "projectile") → Bullet collides ✅

### 3. Ghost Mode
**Scenario**: Player can temporarily pass through everything

**Setup**:
- **Player**: Oblique (group = "ghost", onlyCollideWithOblique = true)
- **All Objects**: No Oblique → Player passes through everything ❌

### 4. Smaller Hitbox
**Scenario**: Visual sprite is 60x40 but hitbox should be 50x30

**Setup**:
- **Object**: Oblique (padding = 5)
- **Result**: Collision area is 50x30 (10px smaller)

## Examples

### Example 1: One-Way Platform
```typescript
// Platform you can jump through from below
Platform: {
  behaviors: [
    { type: 'physics', parameters: { isStatic: true } },
    { 
      type: 'oblique', 
      parameters: { 
        enabled: true,
        onlyCollideWithOblique: false,
        collisionGroup: 'oneway',
        padding: 0
      }
    }
  ]
}

// Player can jump through it
Player: {
  behaviors: [
    { type: 'physics', parameters: { isStatic: false } },
    { type: 'controls', parameters: { ... } },
    // No oblique = passes through oblique platforms
  ]
}
```

### Example 2: Enemy Projectiles
```typescript
// Enemy bullet
Bullet: {
  behaviors: [
    { type: 'physics', parameters: { isStatic: false } },
    { 
      type: 'oblique', 
      parameters: { 
        enabled: true,
        onlyCollideWithOblique: true,
        collisionGroup: 'bullet',
        padding: 2
      }
    }
  ]
}

// Player can be hit
Player: {
  behaviors: [
    { type: 'physics', parameters: { ... } },
    { 
      type: 'oblique', 
      parameters: { 
        enabled: true,
        onlyCollideWithOblique: false,
        collisionGroup: 'bullet',
        padding: 0
      }
    }
  ]
}
```

### Example 3: Layered Platforms
```typescript
// Background platform (decorative)
BackgroundPlatform: {
  behaviors: [
    { type: 'physics', parameters: { isStatic: true } },
    { 
      type: 'oblique', 
      parameters: { 
        enabled: true,
        onlyCollideWithOblique: true,
        collisionGroup: 'background',
        padding: 0
      }
    }
  ]
}

// Foreground platform (solid)
ForegroundPlatform: {
  behaviors: [
    { type: 'physics', parameters: { isStatic: true } },
    // No oblique = player collides with it
  ]
}

// Player
Player: {
  behaviors: [
    { type: 'physics', parameters: { ... } },
    // No oblique = collides with foreground, passes through background
  ]
}
```

## Technical Details

### Collision Detection
1. Check if either sprite has oblique behavior
2. If yes, check `onlyCollideWithOblique` flag
3. If both have oblique, compare collision groups
4. Only create collider if rules allow collision

### Padding Implementation
```typescript
// Shrink body by padding amount
body.setSize(
  sprite.width - padding * 2,
  sprite.height - padding * 2
);
body.setOffset(padding, padding);
```

### Performance
- Collision checks happen once during setup
- No runtime overhead
- Efficient for many objects

## Tips

1. **Start Simple**: Use oblique for special cases, not everything
2. **Group Names**: Use descriptive names ("player", "enemy", "projectile")
3. **Test Combinations**: Try different group combinations
4. **Padding**: Use small values (2-10px) for subtle adjustments
5. **Debug**: Temporarily disable oblique to see default collisions

## Common Patterns

### Pattern 1: Solid + Pass-Through Platforms
- Solid platforms: No oblique
- Pass-through platforms: Oblique (group = "passthrough")
- Player: No oblique (collides with solid, passes through passthrough)

### Pattern 2: Damage Zones
- Damage zone: Oblique (group = "damage", onlyCollideWithOblique = true)
- Player: Oblique (group = "damage", onlyCollideWithOblique = false)
- Result: Player enters damage zone, other objects pass through

### Pattern 3: Collectibles
- Collectible: Oblique (group = "collect", onlyCollideWithOblique = true)
- Player: Oblique (group = "collect", onlyCollideWithOblique = false)
- Enemies: No oblique
- Result: Only player can collect, enemies pass through

## Troubleshooting

### Objects Not Colliding
- Check both objects have oblique behavior
- Verify collision groups match
- Ensure `onlyCollideWithOblique` is set correctly

### Objects Colliding When They Shouldn't
- Check if one object is missing oblique behavior
- Verify collision groups are different
- Check `onlyCollideWithOblique` flag

### Padding Not Working
- Ensure padding value is reasonable (0-20px)
- Check object size is larger than padding * 2
- Verify physics behavior is enabled

## Summary

The Oblique behavior gives you fine-grained control over collisions:
- ✅ Selective collision (pass through some objects)
- ✅ Collision groups (organize by type)
- ✅ Padding (adjust hitbox size)
- ✅ Flexible rules (combine with normal collisions)

Perfect for platformers, shooters, and any game needing complex collision logic!
