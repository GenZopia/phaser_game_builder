# Behavior System - Corrected Implementation

## What Changed

### 1. Behaviors (Drag to Properties Panel)
- ⚛️ **Physics** - Add gravity, mass, density, friction, bounce
- ⌨️ **Keyboard Controls** - Movement, jump, key bindings
- 📷 **Camera Follow** - Make camera follow this object (NEW!)

### 2. Objects (Drag to Canvas)
- 🕹️ **On-Screen Controller** - Fixed position UI element for mobile controls
  - Does NOT move with camera pan
  - Always stays in same screen position
  - Can be placed anywhere on canvas

### 3. Camera Follow Behavior
New behavior with parameters:
- **Enabled**: Toggle camera following
- **Smoothing**: How smooth the camera follows (0-1)
- **Offset X/Y**: Camera offset from target
- **Deadzone Width/Height**: Area where object can move without camera following

## How It Works

### Behaviors (Properties Panel)
1. Select an object on canvas
2. Scroll to "Behaviors" section in Properties Panel
3. Drag behavior from Behavior Library (bottom)
4. Drop in dashed box
5. Configure parameters

### Controller Object (Canvas)
1. Go to Component Library → UI category
2. Drag "On-Screen Controller" 🕹️
3. Drop on canvas
4. It stays fixed - doesn't move when you pan camera
5. Position it where you want (bottom-left, bottom-right, etc.)

## Technical Details

### Fixed vs World Coordinates
- **World Objects** (player, platform, enemy, collectible):
  - Position stored in world coordinates
  - Move with camera pan
  - `screenX = worldX + panOffset.x`

- **Fixed Objects** (controller):
  - Position stored in screen coordinates
  - Don't move with camera pan
  - `screenX = worldX` (no offset)

### Rendering Logic
```typescript
const isFixed = obj.type === 'controller';
const screenX = isFixed ? obj.position.x : obj.position.x + state.panOffset.x;
const screenY = isFixed ? obj.position.y : obj.position.y + state.panOffset.y;
```

### Dragging Logic
- Fixed objects: Update position directly (screen coords)
- World objects: Subtract pan offset (world coords)

## Usage Example

### Setup Player with Controls
1. Add Player object to canvas
2. Select it
3. Drag "Physics" behavior → configure mass, gravity
4. Drag "Keyboard Controls" → set keys (WASD)
5. Drag "Camera Follow" → enable smooth following

### Add Mobile Controller
1. Go to UI category in Component Library
2. Drag "On-Screen Controller" to canvas
3. Position it in bottom-left corner
4. It stays there even when camera pans

Now you have:
- Player with physics and keyboard controls
- Camera following the player
- Fixed on-screen controller for mobile
