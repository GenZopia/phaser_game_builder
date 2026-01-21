# Behavior System Implementation

## Overview
Implemented a drag-and-drop behavior system that allows you to add Physics, Controls, and Controller behaviors to game objects with customizable parameters.

## Features

### 1. Behavior Library
Located at the bottom of the Properties Panel with three behaviors:

#### ⚛️ Physics Behavior
- **Enabled**: Toggle physics on/off
- **Static Body**: Make object immovable
- **Mass**: Object weight (affects momentum)
- **Density**: How compact the object is
- **Friction**: Surface resistance (0-1)
- **Bounce**: Elasticity when colliding (0-1)
- **Gravity Scale**: How much gravity affects it

#### ⌨️ Keyboard Controls Behavior
- **Enabled**: Toggle controls on/off
- **Move Speed**: Horizontal movement speed
- **Jump Power**: Jump force
- **Double Jump**: Allow double jumping
- **Key Bindings**: Customize keys for:
  - Up
  - Down
  - Left
  - Right
  - Jump

#### 🎮 On-Screen Controller Behavior
- **Enabled**: Toggle controller on/off
- **Controller Type**: Joystick, D-Pad, or Buttons
- **Position**: Bottom-left, Bottom-right, or Custom
- **Opacity**: Controller transparency (0-1)
- **Size**: Controller size (50-200px)

### 2. How to Use

1. **Select an Object** on the canvas
2. **Scroll down** in Properties Panel to see Behavior Library
3. **Drag a Behavior** from the library
4. **Drop it** in the "Behaviors" section (dashed box)
5. **Configure Parameters** for each behavior
6. **Remove Behaviors** by clicking the ✕ button

### 3. Controller Object
New object type available in Component Library under "UI" category:
- 🕹️ **On-Screen Controller**
- Renders as a purple circle with joystick icon
- Can be placed anywhere on canvas
- Attach to player objects via Controller behavior

## Technical Implementation

### Files Created
- `src/components/Editor/BehaviorLibrary.tsx` - Behavior library component
- `src/components/Editor/BehaviorLibrary.css` - Behavior library styles

### Files Modified
- `src/types/index.ts` - Added behavior types and controller object type
- `src/components/Editor/PropertiesPanel.tsx` - Complete rewrite with behavior support
- `src/components/Editor/PropertiesPanel.css` - Added behavior UI styles
- `src/components/Editor/ComponentLibrary.tsx` - Added UI category and controller object
- `src/components/Editor/Canvas.tsx` - Added controller rendering

### Type Definitions
```typescript
interface GameBehavior {
  id: string;
  type: 'physics' | 'controls' | 'controller';
  name: string;
  parameters: Record<string, any>;
}

interface PhysicsBehavior extends GameBehavior {
  type: 'physics';
  parameters: {
    enabled, isStatic, mass, density, 
    friction, bounce, gravityScale
  };
}

interface ControlsBehavior extends GameBehavior {
  type: 'controls';
  parameters: {
    enabled, moveSpeed, jumpPower, 
    canDoubleJump, keys: {...}
  };
}

interface ControllerBehavior extends GameBehavior {
  type: 'controller';
  parameters: {
    enabled, targetObjectId, controllerType,
    position, opacity, size
  };
}
```

## Usage Example

1. Add a Player object to canvas
2. Drag "Physics" behavior onto it
3. Configure: mass=1, bounce=0.2, gravityScale=1
4. Drag "Keyboard Controls" behavior
5. Configure: moveSpeed=200, jumpPower=400
6. Set keys: W/A/S/D and Space for jump
7. Add Controller object from UI category
8. Drag "On-Screen Controller" behavior to player
9. Configure: joystick type, bottom-left position

Now your player has:
- Physics simulation with gravity
- Keyboard controls
- Touch controller for mobile

## Next Steps
The behaviors are now stored in the object data. To make them functional:
1. Implement physics engine integration
2. Add keyboard input handling
3. Create touch controller rendering
4. Connect controller to target objects
