import React, { useRef, useEffect, useState } from 'react';
import type { GameProject, GameObject } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';

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
      
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newObject: GameObject = {
        id: `${componentData.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: componentData.type as any,
        position: { x, y },
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
    if (state.isPlaying || isDraggingObject) return;
    
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
      
      if (x >= obj.position.x - objWidth/2 && 
          x <= obj.position.x + objWidth/2 &&
          y >= obj.position.y - objHeight/2 && 
          y <= obj.position.y + objHeight/2) {
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

    // Find clicked object
    const scene = currentProject.scenes[0];
    if (!scene) return;

    for (let i = scene.objects.length - 1; i >= 0; i--) {
      const obj = scene.objects[i];
      const objWidth = 60 * obj.scale.x;
      const objHeight = 40 * obj.scale.y;
      
      if (x >= obj.position.x - objWidth/2 && 
          x <= obj.position.x + objWidth/2 &&
          y >= obj.position.y - objHeight/2 && 
          y <= obj.position.y + objHeight/2) {
        setIsDraggingObject(true);
        setDraggedObjectId(obj.id);
        setDragOffset({
          x: x - obj.position.x,
          y: y - obj.position.y
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
    if (!isDraggingObject || !draggedObjectId || state.isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update object position
    dispatch({
      type: EDITOR_ACTIONS.UPDATE_OBJECT,
      payload: {
        objectId: draggedObjectId,
        updates: {
          position: {
            x: x - dragOffset.x,
            y: y - dragOffset.y
          }
        }
      },
      timestamp: new Date()
    });
  };

  const handleMouseUp = () => {
    setIsDraggingObject(false);
    setDraggedObjectId(null);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw objects if project exists
    if (currentProject && currentProject.scenes.length > 0) {
      const scene = currentProject.scenes[0];
      scene.objects.forEach(obj => {
        const isSelected = selectedObjectId === obj.id || state.selectedObjects.some(selected => selected.id === obj.id);
        
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
          default:
            ctx.fillStyle = '#95a5a6';
        }
        
        const width = 60 * obj.scale.x;
        const height = 40 * obj.scale.y;
        
        ctx.fillRect(
          obj.position.x - width/2, 
          obj.position.y - height/2, 
          width, 
          height
        );
        
        // Draw selection outline
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            obj.position.x - width/2 - 2, 
            obj.position.y - height/2 - 2, 
            width + 4, 
            height + 4
          );
        }
        
        // Draw object label
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obj.type, obj.position.x, obj.position.y + height/2 + 15);
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
  };

  useEffect(() => {
    drawCanvas();
  }, [currentProject, selectedObjectId, state.selectedObjects, state.currentProject]);

  const togglePlay = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PLAYING,
      payload: !state.isPlaying,
      timestamp: new Date()
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#2c3e50'
    }}>
      <div style={{
        padding: '12px 16px',
        background: '#34495e',
        borderBottom: '1px solid #4a5f7a',
        color: '#ecf0f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ margin: 0 }}>Game Canvas</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={togglePlay}
            style={{
              padding: '8px 16px',
              background: state.isPlaying ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'linear-gradient(135deg, #27ae60, #2ecc71)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {state.isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
          <span style={{ color: '#bdc3c7', fontSize: '12px' }}>
            {state.isPlaying ? '▶️ Playing' : '⏸️ Editor Mode'}
          </span>
        </div>
      </div>
      
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#34495e',
        padding: '20px'
      }}>
        <canvas
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            border: '2px solid #4a5f7a',
            borderRadius: '4px',
            cursor: state.isPlaying ? 'default' : isDraggingObject ? 'grabbing' : 'grab',
            background: '#34495e'
          }}
        />
      </div>
      
      <div style={{
        padding: '8px 16px',
        background: '#2c3e50',
        borderTop: '1px solid #34495e',
        color: '#95a5a6',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        {!state.isPlaying ? (
          '📝 Editor Mode: Drag components from the library or click objects to select them'
        ) : (
          '🎮 Playing: Use WASD or Arrow Keys to move (Phaser integration coming soon)'
        )}
      </div>
    </div>
  );
};

export default Canvas;