import React, { useRef, useEffect, useState } from 'react';
import type { GameProject, GameObject } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import PhaserRuntime from './PhaserRuntime';

interface CanvasProps {
  project: GameProject | null;
}

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  category: string;
  icon: string;
  description: string;
}

const Canvas: React.FC<CanvasProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, dispatch } = useEditor();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Use state.currentProject instead of prop to ensure updates
  const currentProject = state.currentProject || project;

  console.log('Canvas rendering with project:', currentProject);

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'player':
        return {
          hasPhysics: true,
          isStatic: false,
          bounce: 0.2,
          friction: 1,
          speed: 200,
          jumpPower: 400,
        };
      case 'platform':
        return {
          hasPhysics: true,
          isStatic: true,
          bounce: 0,
          friction: 1,
        };
      case 'collectible':
        return {
          hasPhysics: true,
          isStatic: true,
          points: 10,
          respawns: false,
        };
      case 'enemy':
        return {
          hasPhysics: true,
          isStatic: false,
          bounce: 0.1,
          friction: 1,
          speed: 100,
          aiType: 'basic',
        };
      case 'boundary':
        return {
          hasPhysics: true,
          isStatic: true,
          bounce: 0,
          friction: 1,
          invisible: false,
        };
      default:
        return {};
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (state.isPlaying) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    if (state.isPlaying) return;
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const componentData = JSON.parse(event.dataTransfer.getData('application/json')) as ComponentItem;
      const rect = canvas.getBoundingClientRect();
      
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      
      // Controller objects use screen coordinates (fixed), others use world coordinates
      const isFixed = componentData.type === 'controller';
      const posX = isFixed ? screenX : screenX - state.panOffset.x;
      const posY = isFixed ? screenY : screenY - state.panOffset.y;

      const newObject: GameObject = {
        id: `${componentData.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: componentData.type as any,
        position: { x: posX, y: posY },
        scale: { x: 1, y: 1 },
        rotation: 0,
        properties: getDefaultProperties(componentData.type),
        behaviors: [],
      };

      if (state.currentProject && state.currentProject.scenes.length > 0) {
        dispatch({
          type: EDITOR_ACTIONS.ADD_OBJECT,
          payload: {
            ...newObject,
            sceneId: state.currentProject.scenes[0].id,
          },
          timestamp: new Date(),
        });

        dispatch({
          type: EDITOR_ACTIONS.SELECT_OBJECTS,
          payload: [newObject],
          timestamp: new Date(),
        });
        
        setSelectedObjectId(newObject.id);
      }
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (state.isPlaying || isDraggingObject || isPanning) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked object
    const scene = currentProject.scenes[0];
    if (!scene) return;

    let clickedObject: GameObject | null = null;
    
    // Check objects in reverse order (top to bottom)
    for (let i = scene.objects.length - 1; i >= 0; i--) {
      const obj = scene.objects[i];
      const objWidth = 60 * obj.scale.x;
      const objHeight = 40 * obj.scale.y;
      
      // Controller objects are fixed, others move with camera
      const isFixed = obj.type === 'controller';
      const screenX = isFixed ? obj.position.x : obj.position.x + state.panOffset.x;
      const screenY = isFixed ? obj.position.y : obj.position.y + state.panOffset.y;
      
      if (x >= screenX - objWidth/2 && 
          x <= screenX + objWidth/2 &&
          y >= screenY - objHeight/2 && 
          y <= screenY + objHeight/2) {
        clickedObject = obj;
        break;
      }
    }

    if (clickedObject) {
      dispatch({
        type: EDITOR_ACTIONS.SELECT_OBJECTS,
        payload: [clickedObject],
        timestamp: new Date(),
      });
      setSelectedObjectId(clickedObject.id);
    } else {
      dispatch({
        type: EDITOR_ACTIONS.SELECT_OBJECTS,
        payload: [],
        timestamp: new Date(),
      });
      setSelectedObjectId(null);
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (state.isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Pan mode - start panning
    if (state.editorMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }

    // Move mode - find clicked object
    const scene = currentProject.scenes[0];
    if (!scene) return;

    for (let i = scene.objects.length - 1; i >= 0; i--) {
      const obj = scene.objects[i];
      const objWidth = 60 * obj.scale.x;
      const objHeight = 40 * obj.scale.y;
      
      // Controller objects are fixed, others move with camera
      const isFixed = obj.type === 'controller';
      const screenX = isFixed ? obj.position.x : obj.position.x + state.panOffset.x;
      const screenY = isFixed ? obj.position.y : obj.position.y + state.panOffset.y;
      
      if (x >= screenX - objWidth/2 && 
          x <= screenX + objWidth/2 &&
          y >= screenY - objHeight/2 && 
          y <= screenY + objHeight/2) {
        setIsDraggingObject(true);
        setDraggedObjectId(obj.id);
        setDragOffset({
          x: x - screenX,
          y: y - screenY
        });
        
        // Select the object
        dispatch({
          type: EDITOR_ACTIONS.SELECT_OBJECTS,
          payload: [obj],
          timestamp: new Date(),
        });
        setSelectedObjectId(obj.id);
        break;
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (state.isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Handle panning
    if (isPanning && state.editorMode === 'pan') {
      const deltaX = event.clientX - panStart.x;
      const deltaY = event.clientY - panStart.y;
      
      dispatch({
        type: EDITOR_ACTIONS.SET_PAN_OFFSET,
        payload: {
          x: state.panOffset.x + deltaX,
          y: state.panOffset.y + deltaY
        },
        timestamp: new Date()
      });
      
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }

    // Handle object dragging
    if (isDraggingObject && draggedObjectId && state.editorMode === 'move') {
      // Find the object being dragged to check if it's fixed
      const scene = currentProject?.scenes[0];
      const draggedObj = scene?.objects.find(obj => obj.id === draggedObjectId);
      const isFixed = draggedObj?.type === 'controller';
      
      // Fixed objects (controllers) use screen coordinates, others use world coordinates
      dispatch({
        type: EDITOR_ACTIONS.UPDATE_OBJECT,
        payload: {
          objectId: draggedObjectId,
          updates: {
            position: isFixed ? {
              x: x - dragOffset.x,
              y: y - dragOffset.y
            } : {
              x: x - dragOffset.x - state.panOffset.x,
              y: y - dragOffset.y - state.panOffset.y
            }
          }
        },
        timestamp: new Date()
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingObject(false);
    setDraggedObjectId(null);
    setIsPanning(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (state.isPlaying) return;
    
    event.preventDefault();
    
    // Zoom in/out based on wheel direction
    const delta = event.deltaY > 0 ? 0.9 : 1.1; // Zoom out or in
    const newZoom = Math.max(0.1, Math.min(5, state.zoom * delta));
    
    dispatch({
      type: EDITOR_ACTIONS.SET_ZOOM,
      payload: newZoom,
      timestamp: new Date()
    });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas fill its container
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply zoom transformation from center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(-centerX, -centerY);

    // Draw infinite grid with pan offset and zoom
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1 / state.zoom; // Adjust line width for zoom
    
    const gridSize = 20;
    const offsetX = state.panOffset.x % gridSize;
    const offsetY = state.panOffset.y % gridSize;
    
    for (let x = offsetX; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = offsetY; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw origin indicator (0,0 in world space)
    const originX = state.panOffset.x;
    const originY = state.panOffset.y;
    
    if (originX >= 0 && originX <= canvas.width && originY >= 0 && originY <= canvas.height) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX - 10, originY);
      ctx.lineTo(originX + 10, originY);
      ctx.moveTo(originX, originY - 10);
      ctx.lineTo(originX, originY + 10);
      ctx.stroke();
    }

    // Draw objects if project exists
    if (currentProject && currentProject.scenes.length > 0) {
      const scene = currentProject.scenes[0];
      scene.objects.forEach(obj => {
        const isSelected = selectedObjectId === obj.id || state.selectedObjects.some(selected => selected.id === obj.id);
        
        // Controller objects are fixed to screen, others move with camera
        const isFixed = obj.type === 'controller';
        const screenX = isFixed ? obj.position.x : obj.position.x + state.panOffset.x;
        const screenY = isFixed ? obj.position.y : obj.position.y + state.panOffset.y;
        
        // Draw object based on type
        switch (obj.type) {
          case 'player':
            ctx.fillStyle = '#3498db';
            break;
          case 'platform':
            ctx.fillStyle = '#8b4513';
            break;
          case 'collectible':
            ctx.fillStyle = '#ffd700';
            break;
          case 'enemy':
            ctx.fillStyle = '#e74c3c';
            break;
          case 'controller':
            ctx.fillStyle = '#9b59b6';
            break;
          case 'boundary':
            ctx.fillStyle = '#7f8c8d';
            break;
          case 'gravity':
            ctx.fillStyle = '#9b59b6';
            break;
          default:
            ctx.fillStyle = '#95a5a6';
        }
        
        const width = 60 * obj.scale.x;
        const height = 40 * obj.scale.y;
        
        // Special rendering for boundary (semi-transparent with pattern)
        if (obj.type === 'boundary') {
          ctx.fillStyle = 'rgba(127, 140, 141, 0.3)';
          ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
          
          // Draw diagonal stripes pattern
          ctx.strokeStyle = '#95a5a6';
          ctx.lineWidth = 2;
          for (let i = -width; i < width + height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(screenX - width/2 + i, screenY - height/2);
            ctx.lineTo(screenX - width/2 + i + height, screenY + height/2);
            ctx.stroke();
          }
        } else if (obj.type === 'gravity') {
          // Get gravity strength for visualization
          const gravityStrength = obj.properties?.gravityStrength || 500;
          const isRepulsion = gravityStrength < 0;
          const intensity = Math.abs(gravityStrength);
          
          // Draw gravity zone as a simple circle with intensity-based color
          const alpha = Math.min(0.3 + (intensity / 2000) * 0.3, 0.6);
          ctx.fillStyle = isRepulsion 
            ? `rgba(231, 76, 60, ${alpha})` // Red for repulsion
            : `rgba(155, 89, 182, ${alpha})`; // Purple for attraction
          
          ctx.beginPath();
          const radius = Math.min(width, height) / 2;
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw border with intensity-based thickness
          const borderWidth = Math.min(3 + (intensity / 500), 8);
          ctx.strokeStyle = isRepulsion ? '#e74c3c' : '#9b59b6';
          ctx.lineWidth = borderWidth;
          ctx.stroke();
          
          // Draw intensity value in the center
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = '#ecf0f1';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(intensity.toString(), screenX, screenY);
        } else if (obj.type === 'controller') {
          // Draw controller circle
          ctx.beginPath();
          ctx.arc(screenX, screenY, width/2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw joystick icon
          ctx.fillStyle = '#ecf0f1';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🕹️', screenX, screenY);
        } else {
          // Regular rectangle rendering
          ctx.fillRect(
            screenX - width/2, 
            screenY - height/2, 
            width, 
            height
          );
        }
        
        // Draw selection outline
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          if (obj.type === 'controller') {
            ctx.beginPath();
            ctx.arc(screenX, screenY, width/2 + 2, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(
              screenX - width/2 - 2, 
              screenY - height/2 - 2, 
              width + 4, 
              height + 4
            );
          }
        }
        
        // Draw object label
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(obj.type, screenX, screenY + height/2 + 15);
      });
    } else {
      // Draw placeholder text
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Canvas', canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = '16px Arial';
      ctx.fillText('Drag components from the library to start building', canvas.width / 2, canvas.height / 2 + 10);
    }

    // Restore context state
    ctx.restore();
  };

  useEffect(() => {
    // Only draw when not playing
    if (!state.isPlaying) {
      drawCanvas();
    }
    
    // Redraw on window resize
    const handleResize = () => {
      if (!state.isPlaying) {
        drawCanvas();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentProject, selectedObjectId, state.selectedObjects, state.currentProject, state.panOffset, state.isPlaying, state.zoom]);

  // Force redraw when returning from play mode
  useEffect(() => {
    if (!state.isPlaying) {
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => {
        drawCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [state.isPlaying]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle delete when not playing and an object is selected
      if (state.isPlaying || !selectedObjectId) return;
      
      // Only respond to Delete key (not Backspace)
      if (event.key === 'Delete') {
        event.preventDefault();
        
        // Find the object to get its type for the confirmation message
        const scene = currentProject?.scenes[0];
        const objectToDelete = scene?.objects.find(obj => obj.id === selectedObjectId);
        
        if (!objectToDelete) return;
        
        // Show confirmation dialog
        const confirmDelete = window.confirm(
          `Are you sure you want to delete this ${objectToDelete.type} object?\n\nThis action cannot be undone.`
        );
        
        if (confirmDelete) {
          console.log('Deleting object:', selectedObjectId);
          
          // Delete the selected object
          dispatch({
            type: EDITOR_ACTIONS.DELETE_OBJECTS,
            payload: [selectedObjectId],
            timestamp: new Date()
          });
          
          // Clear selection
          setSelectedObjectId(null);
          dispatch({
            type: EDITOR_ACTIONS.SELECT_OBJECTS,
            payload: [],
            timestamp: new Date()
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, selectedObjectId, dispatch, currentProject]);

  // Handle stop game
  const handleStopGame = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PLAYING,
      payload: false,
      timestamp: new Date()
    });
  };

  // Show Phaser runtime when playing
  if (state.isPlaying && currentProject) {
    return <PhaserRuntime 
      project={currentProject} 
      onStop={handleStopGame}
      initialCameraPosition={{
        x: -state.panOffset.x,
        y: -state.panOffset.y
      }}
      zoom={state.zoom}
    />;
  }

  return (
    <div 
      key={`canvas-${state.isPlaying ? 'playing' : 'editor'}`}
      style={{
        width: '100%',
        height: '100%',
        background: '#34495e',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: state.editorMode === 'pan' 
            ? (isPanning ? 'grabbing' : 'grab')
            : (isDraggingObject ? 'grabbing' : 'move'),
          background: '#34495e'
        }}
      />
      
      {/* Status overlay */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '6px 12px',
        background: 'rgba(44, 62, 80, 0.9)',
        borderRadius: '4px',
        color: '#95a5a6',
        fontSize: '11px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span>
          {state.editorMode === 'move' 
            ? '✋ Move Mode: Click and drag objects'
            : '🖐️ Pan Mode: Click and drag to navigate'}
        </span>
        <span style={{ 
          borderLeft: '1px solid #4a5f7a', 
          paddingLeft: '12px',
          color: '#bdc3c7'
        }}>
          🔍 {Math.round(state.zoom * 100)}%
        </span>
      </div>
    </div>
  );
};

export default Canvas;