import React from 'react';
import './BehaviorLibrary.css';

interface BehaviorItem {
  id: string;
  name: string;
  type: 'physics' | 'controls' | 'camera';
  icon: string;
  description: string;
  defaultParameters: Record<string, any>;
}

const behaviors: BehaviorItem[] = [
  {
    id: 'physics',
    name: 'Physics',
    type: 'physics',
    icon: '⚛️',
    description: 'Add physics simulation with gravity, mass, and collisions',
    defaultParameters: {
      enabled: true,
      isStatic: false,
      mass: 1,
      density: 1,
      friction: 0.3,
      bounce: 0.2,
      gravityScale: 1,
    },
  },
  {
    id: 'controls',
    name: 'Keyboard Controls',
    type: 'controls',
    icon: '⌨️',
    description: 'Control object with keyboard input',
    defaultParameters: {
      enabled: true,
      moveSpeed: 200,
      jumpPower: 400,
      canDoubleJump: false,
      keys: {
        up: 'W',
        down: 'S',
        left: 'A',
        right: 'D',
        jump: 'Space',
      },
    },
  },
  {
    id: 'camera',
    name: 'Camera Follow',
    type: 'camera',
    icon: '📷',
    description: 'Make camera follow this object',
    defaultParameters: {
      enabled: true,
      smoothing: 0.1,
      offsetX: 0,
      offsetY: 0,
      deadzone: {
        width: 100,
        height: 100,
      },
    },
  },
];

const BehaviorLibrary: React.FC = () => {
  const handleDragStart = (event: React.DragEvent, behavior: BehaviorItem) => {
    console.log('🚀 Drag started for behavior:', behavior.name);
    event.dataTransfer.effectAllowed = 'copy';
    const data = {
      ...behavior,
      isBehavior: true,
    };
    console.log('📤 Setting drag data:', data);
    event.dataTransfer.setData('application/json', JSON.stringify(data));
  };

  return (
    <div className="behavior-library">
      <div className="behavior-header">
        <h4>Behaviors</h4>
        <p className="behavior-hint">Drag behaviors onto objects</p>
      </div>
      
      <div className="behavior-list">
        {behaviors.map((behavior) => (
          <div
            key={behavior.id}
            className="behavior-item"
            draggable
            onDragStart={(e) => handleDragStart(e, behavior)}
            title={behavior.description}
          >
            <div className="behavior-icon">{behavior.icon}</div>
            <div className="behavior-info">
              <div className="behavior-name">{behavior.name}</div>
              <div className="behavior-description">{behavior.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BehaviorLibrary;
