# Canvas Redraw Fix

## Problem
When stopping the game (Play → Stop), the canvas would disappear or not show objects until you clicked on it.

## Root Cause
1. **Missing Dependency**: `state.isPlaying` wasn't in the useEffect dependency array
2. **No Forced Redraw**: When returning from play mode, canvas wasn't being redrawn
3. **Stale Canvas State**: Canvas element retained state from before play mode

## Solution

### 1. Added `state.isPlaying` to Dependencies
```typescript
useEffect(() => {
  if (!state.isPlaying) {
    drawCanvas();
  }
  // ...
}, [currentProject, selectedObjectId, state.selectedObjects, state.currentProject, state.panOffset, state.isPlaying]);
```

**Why**: Now the effect runs when play mode changes, triggering a redraw.

### 2. Added Separate Effect for Play Mode Changes
```typescript
useEffect(() => {
  if (!state.isPlaying) {
    const timer = setTimeout(() => {
      drawCanvas();
    }, 50);
    return () => clearTimeout(timer);
  }
}, [state.isPlaying]);
```

**Why**: 
- Specifically handles the transition from playing → stopped
- 50ms delay ensures canvas element is ready
- Forces a fresh draw when returning to editor

### 3. Added Key Prop to Force Remount
```typescript
<div key={`canvas-${state.isPlaying ? 'playing' : 'editor'}`}>
  <canvas ref={canvasRef} ... />
</div>
```

**Why**: 
- React remounts the component when key changes
- Clears any stale state from previous render
- Ensures clean slate when switching modes

### 4. Conditional Drawing
```typescript
if (!state.isPlaying) {
  drawCanvas();
}
```

**Why**: Don't waste resources drawing when Phaser is running.

## How It Works Now

### Play → Stop Flow:
1. User clicks Stop button
2. `state.isPlaying` changes from `true` to `false`
3. PhaserRuntime unmounts
4. Canvas component remounts (due to key change)
5. First useEffect runs → draws canvas
6. Second useEffect runs after 50ms → draws canvas again (safety)
7. Canvas is visible with all objects!

### Editor → Play Flow:
1. User clicks Play button
2. `state.isPlaying` changes from `false` to `true`
3. Canvas component unmounts
4. PhaserRuntime mounts
5. Phaser game starts

## Benefits

✅ **Instant Redraw**: Canvas appears immediately when stopping
✅ **No Flicker**: Smooth transition between modes
✅ **No Click Required**: Objects visible without interaction
✅ **Clean State**: Each mode starts fresh
✅ **Performance**: Only draws when needed

## Testing

### Test Case 1: Basic Play/Stop
1. Add objects to canvas
2. Click Play
3. Click Stop
4. **Expected**: Canvas shows all objects immediately

### Test Case 2: Multiple Cycles
1. Play → Stop → Play → Stop (repeat 5 times)
2. **Expected**: Canvas always redraws correctly

### Test Case 3: Window Resize
1. Play game
2. Resize window
3. Stop game
4. **Expected**: Canvas redraws at correct size

### Test Case 4: Pan Offset
1. Pan canvas to different position
2. Play game
3. Stop game
4. **Expected**: Canvas returns to same pan position

## Technical Details

### Timing
- **50ms delay**: Ensures DOM is ready
- **Immediate draw**: First draw happens right away
- **Delayed draw**: Second draw catches any edge cases

### Dependencies
```typescript
// Main draw effect
[currentProject, selectedObjectId, state.selectedObjects, 
 state.currentProject, state.panOffset, state.isPlaying]

// Play mode change effect
[state.isPlaying]
```

### Key Strategy
```typescript
key={`canvas-${state.isPlaying ? 'playing' : 'editor'}`}
```
- Playing: `canvas-playing`
- Editor: `canvas-editor`
- Different keys = React remounts component

## Edge Cases Handled

1. **Rapid Play/Stop**: Timeout cleanup prevents memory leaks
2. **Window Resize During Play**: Resize listener checks play state
3. **No Project**: drawCanvas handles null project gracefully
4. **Empty Scene**: Placeholder text shows correctly

## Performance Impact

- **Minimal**: Only draws when needed
- **Two draws on stop**: Negligible (canvas drawing is fast)
- **No continuous drawing**: Only on state changes
- **Cleanup**: Proper timeout cleanup prevents leaks

## Future Improvements

Potential optimizations (not needed now):
- RequestAnimationFrame for smoother drawing
- Canvas pooling for faster mode switching
- Incremental drawing for large scenes
- WebGL rendering for better performance

## Summary

The fix ensures the canvas always redraws correctly when returning from play mode by:
1. Adding proper dependencies
2. Forcing redraw on mode change
3. Using key prop for clean remount
4. Adding safety delay for DOM readiness

Result: **Smooth, reliable transitions between editor and play modes!** ✅
