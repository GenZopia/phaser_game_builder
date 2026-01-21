import React, { useState, useRef, useEffect } from 'react';
import ComponentLibrary from './ComponentLibrary';
import SceneHierarchy from './SceneHierarchy';
import type { GameObject } from '../../types';
import './ResizableLeftPanel.css';

interface ResizableLeftPanelProps {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  objects: GameObject[];
}

const ResizableLeftPanel: React.FC<ResizableLeftPanelProps> = ({
  initialWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  objects
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'components' | 'hierarchy'>('components');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div 
      ref={panelRef}
      className="resizable-left-panel"
      style={{ width: `${width}px` }}
    >
      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          <span className="tab-icon">📦</span>
          <span className="tab-label">Components</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'hierarchy' ? 'active' : ''}`}
          onClick={() => setActiveTab('hierarchy')}
        >
          <span className="tab-icon">🌳</span>
          <span className="tab-label">Hierarchy</span>
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'components' && <ComponentLibrary />}
        {activeTab === 'hierarchy' && <SceneHierarchy objects={objects} />}
      </div>

      <div
        className="resize-handle"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="resize-indicator"></div>
      </div>
    </div>
  );
};

export default ResizableLeftPanel;
