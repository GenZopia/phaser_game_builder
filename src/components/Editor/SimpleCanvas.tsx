import React, { useRef, useEffect, useState } from 'react';
import type { GameProject, GameObject } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import './SimpleCanvas.css';

interface SimpleCanvasProps {
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

const SimpleCanvas: React.FC<SimpleCanvasProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, dispatch } = useEditor();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  console.log('SimpleCanvas rendering with project:', project);
  console.log('SimpleCanvas state:', state);

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
    if (state.isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked object
    const scene = project.scenes[0];
    if (!scene) return;

    let clickedObject: GameObject | null = null;
    
    // Check objects in reverse order (top to bottom)
    for (let i = scene.objects.length - 1; i >= 0; i--) {
      const obj = scene.objects[i];
      const objWidth = 30 * obj.scale.x;
      const objHeight = 30 * obj.scale.y;
      
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
    if (project && project.scenes.length > 0) {
      const scene = project.scenes[0];
      scene.objects.forEach(obj => {
        const isSelected = selectedObjectId === obj.id;
        
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
        
        const width = 30 * obj.scale.x;
        const height = 30 * obj.scale.y;
        
        ctx.fillRect(
          obj.position.x - width/2, 
          obj.position.y - height/2, 
          width, 
          height
        );
        
        // Draw selection outline
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
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
  }, [project, selectedObjectId, state.selectedObjects]);

  const togglePlay = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PLAYING,
      payload: !state.isPlaying,
      timestamp: new Date()
    });
  };

  return (
    <div className="simple-canvas">
      <div className="canvas-header">
        <h3>Game Canvas</h3>
        <div className="canvas-controls">
          <button 
            onClick={togglePlay}
            className={`play-button ${state.isPlaying ? 'playing' : ''}`}
          >
            {state.isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
          <span className="status-info">
            {state.isPlaying ? '▶️ Playing' : '⏸️ Editor Mode'}
          </span>
        </div>
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
          className="game-canvas"
        />
      </div>
      
      <div className="canvas-info">
        {!state.isPlaying ? (
          <p>📝 Editor Mode: Drag components from the library or click objects to select them</p>
        ) : (
          <p>🎮 Playing: Use WASD or Arrow Keys to move (Phaser integration coming soon)</p>
        )}
      </div>
    </div>
  );
};

export default SimpleCanvas;