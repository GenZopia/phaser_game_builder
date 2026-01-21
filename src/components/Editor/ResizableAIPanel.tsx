import React, { useState, useRef, useCallback, useEffect } from 'react';
import AIPromptPanel from './AIPromptPanel';
import './ResizableAIPanel.css';

interface ResizableAIPanelProps {
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

const ResizableAIPanel: React.FC<ResizableAIPanelProps> = ({
  initialHeight = 250,
  minHeight = 120,
  maxHeight = 500
}) => {
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ x: 100, y: 100 });
  const [floatingSize, setFloatingSize] = useState({ width: 600, height: 400 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = height;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = startY.current - e.clientY;
    const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + deltaY));
    setHeight(newHeight);
  }, [isResizing, minHeight, maxHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleFloating = () => {
    setIsFloating(!isFloating);
    if (!isFloating) {
      setIsCollapsed(false); // Expand when floating
    }
  };

  // Floating window drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleFloatingMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isFloating) return;
    
    const rect = floatingRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [isFloating]);

  const handleFloatingMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isFloating) return;
    
    setFloatingPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, isFloating, dragOffset]);

  const handleFloatingMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleFloatingMouseMove);
      document.addEventListener('mouseup', handleFloatingMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleFloatingMouseMove);
        document.removeEventListener('mouseup', handleFloatingMouseUp);
      };
    }
  }, [isDragging, handleFloatingMouseMove, handleFloatingMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleFloatingMouseMove);
      document.removeEventListener('mouseup', handleFloatingMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleFloatingMouseMove, handleFloatingMouseUp]);

  if (isFloating) {
    return (
      <div
        ref={floatingRef}
        className="ai-panel-floating"
        style={{
          left: floatingPosition.x,
          top: floatingPosition.y,
          width: floatingSize.width,
          height: floatingSize.height,
          zIndex: 1000
        }}
      >
        <div 
          className="floating-header"
          onMouseDown={handleFloatingMouseDown}
        >
          <div className="floating-title">
            <span className="floating-icon">🤖</span>
            AI Game Generator
          </div>
          <div className="floating-controls">
            <button
              className="floating-control-btn"
              onClick={toggleFloating}
              title="Dock to bottom"
            >
              📌
            </button>
            <button
              className="floating-control-btn close"
              onClick={toggleFloating}
              title="Close floating window"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="floating-content">
          <AIPromptPanel />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className={`resizable-ai-panel ${isCollapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{ height: isCollapsed ? 'auto' : height }}
    >
      <div 
        ref={resizerRef}
        className="panel-resizer"
        onMouseDown={handleMouseDown}
      >
        <div className="resizer-handle">
          <div className="resizer-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🤖</span>
          AI Game Generator
        </div>
        <div className="panel-controls">
          <button
            className="panel-control-btn"
            onClick={toggleFloating}
            title="Open in floating window"
          >
            🗗
          </button>
          <button
            className="panel-control-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? '🔼' : '🔽'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="panel-content">
          <AIPromptPanel />
        </div>
      )}
    </div>
  );
};

export default ResizableAIPanel;