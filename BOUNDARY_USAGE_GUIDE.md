# Boundary System - Usage Guide

## What are Boundaries?

Boundaries are invisible walls that block player and object movement. They're perfect for:
- Creating game area limits
- Blocking paths or doorways
- Making invisible walls
- Defining playable zones

## How to Add a Boundary

### Step 1: Open Component Library
1. Look at the left sidebar in the editor
2. Click on the **World** tab (🌍 icon)

### Step 2: Choose a Boundary Type
You have three options:
- **Wall Boundary** (🧱) - General purpose wall
- **Horizontal Boundary** (➖) - For horizontal barriers
- **Vertical Boundary** (|) - For vertical barriers

### Step 3: Drag and Drop
1. Click and drag the boundary component onto the canvas
2. Position it where you want to block movement
3. Release to place it

### Step 4: Resize (Optional)
1. Select the boundary object
2. In the Properties Panel, adjust the scale:
   - **Scale X**: Make it wider/narrower
   - **Scale Y**: Make it taller/shorter

## Boundary Behavior

### In Editor Mode
- Boundaries appear as **semi-transparent gray rectangles** with diagonal stripes
- You can see and select them
- You can move and resize them

### In Play Mode
- Boundaries are **semi-transparent** (30% opacity) so you can see where they are
- They act as **solid walls** - players and objects cannot pass through
- They are **immovable** - nothing can push them
- They have **no gravity** - they stay in place

## Example Use Cases

### 1. Create Game Boundaries
Place boundaries around the edges of your game area to prevent the player from leaving:
```
Top boundary: Position (1000, 0), Scale (40, 1)
Bottom boundary: Position (1000, 1500), Scale (40, 1)
Left boundary: Position (0, 750), Scale (1, 30)
Right boundary: Position (2000, 750), Scale (1, 30)
```

### 2. Block a Doorway
Place a vertical boundary in front of a door:
```
Position: (500, 400)
Scale: (1, 3)
```

### 3. Create a Maze
Use multiple boundaries to create walls:
```
Wall 1: Position (300, 200), Scale (5, 1)
Wall 2: Position (300, 400), Scale (1, 5)
Wall 3: Position (500, 300), Scale (5, 1)
```

## Tips

1. **Make boundaries visible during testing**: They're already semi-transparent in play mode so you can see where they are
2. **Use appropriate scale**: Scale X for width, Scale Y for height
3. **Combine with platforms**: Boundaries work alongside platform objects
4. **Test in play mode**: Always test your boundaries by trying to walk through them

## Technical Details

- Boundaries automatically have physics enabled
- They are always static and immovable
- They collide with all other physics objects
- They don't respond to gravity
- They work in both top-down and platformer games

## Next Steps

Try adding boundaries to your game:
1. Switch to the World tab
2. Drag a boundary onto the canvas
3. Resize it to fit your needs
4. Click "Play" to test it out
5. Try walking into the boundary - you should be blocked!
