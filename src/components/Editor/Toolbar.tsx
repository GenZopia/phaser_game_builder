import React, { useState } from 'react';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import useGameEditor from '../../hooks/useGameEditor';
import ExportService from '../../services/project/ExportService';
import ImportService from '../../services/project/ImportService';
import './Toolbar.css';

const Toolbar: React.FC = () => {
  const { state, dispatch } = useEditor();
  const gameEditor = useGameEditor();
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const handleNewProject = async () => {
    try {
      await gameEditor.createNewProject();
      setShowProjectMenu(false);
    } catch (error) {
      console.error('Failed to create new project:', error);
    }
  };

  const handleSaveProject = async () => {
    try {
      await gameEditor.saveProject();
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await ImportService.importFromFile(file);
        if (result.success && result.project) {
          dispatch({
            type: EDITOR_ACTIONS.SET_PROJECT,
            payload: result.project,
            timestamp: new Date()
          });
          console.log('Project loaded successfully');
        } else {
          console.error('Failed to load project:', result.errors.join(', '));
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    };
    input.click();
  };

  const handleExportProject = async () => {
    if (!state.currentProject) {
      console.warn('No project to export');
      return;
    }

    try {
      await ExportService.downloadProject(state.currentProject, {
        format: 'html',
        includeAssets: true,
        minify: false
      });
      console.log('Project exported successfully');
    } catch (error) {
      console.error('Failed to export project:', error);
    }
  };

  const handlePlayToggle = () => {
    if (state.isPlaying) {
      gameEditor.stopGame();
    } else {
      gameEditor.playGame();
    }
  };

  const handleUndo = () => {
    gameEditor.undo();
  };

  const handleRedo = () => {
    gameEditor.redo();
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(state.zoom * 1.2, 5); // Max zoom 5x
    dispatch({
      type: EDITOR_ACTIONS.SET_ZOOM,
      payload: newZoom,
      timestamp: new Date()
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(state.zoom / 1.2, 0.1); // Min zoom 0.1x
    dispatch({
      type: EDITOR_ACTIONS.SET_ZOOM,
      payload: newZoom,
      timestamp: new Date()
    });
  };

  const handleZoomReset = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_ZOOM,
      payload: 1,
      timestamp: new Date()
    });
  };

  const handleSetMoveMode = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_EDITOR_MODE,
      payload: 'move',
      timestamp: new Date()
    });
  };

  const handleSetPanMode = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_EDITOR_MODE,
      payload: 'pan',
      timestamp: new Date()
    });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="dropdown">
          <button 
            className="toolbar-button dropdown-toggle" 
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            title="Project Menu"
          >
            <span className="icon">📄</span>
            Project
            <span className="dropdown-arrow">▼</span>
          </button>
          {showProjectMenu && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleNewProject}>
                <span className="icon">📄</span>
                New Project
              </button>
              <button className="dropdown-item" onClick={handleSaveProject} disabled={!state.currentProject}>
                <span className="icon">💾</span>
                Save Project
              </button>
              <button className="dropdown-item" onClick={handleLoadProject}>
                <span className="icon">📁</span>
                Load Project
              </button>
              <div className="dropdown-separator"></div>
              <button className="dropdown-item" onClick={handleExportProject} disabled={!state.currentProject}>
                <span className="icon">📤</span>
                Export as HTML
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-section">
        <button 
          className="toolbar-button" 
          onClick={handleUndo} 
          disabled={!gameEditor.canUndo}
          title="Undo"
        >
          <span className="icon">↶</span>
          Undo
        </button>
        <button 
          className="toolbar-button" 
          onClick={handleRedo} 
          disabled={!gameEditor.canRedo}
          title="Redo"
        >
          <span className="icon">↷</span>
          Redo
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-section">
        <button 
          className={`toolbar-button ${state.isPlaying ? 'active' : ''}`}
          onClick={handlePlayToggle}
          title={state.isPlaying ? 'Stop Game' : 'Play Game'}
          disabled={!state.currentProject}
        >
          <span className="icon">{state.isPlaying ? '⏹️' : '▶️'}</span>
          {state.isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-section">
        <button 
          className={`toolbar-button ${state.editorMode === 'move' ? 'active' : ''}`}
          onClick={handleSetMoveMode}
          title="Move Object Mode - Click and drag objects"
        >
          <span className="icon">✋</span>
          Move
        </button>
        <button 
          className={`toolbar-button ${state.editorMode === 'pan' ? 'active' : ''}`}
          onClick={handleSetPanMode}
          title="Pan Canvas Mode - Navigate around the canvas"
        >
          <span className="icon">🖐️</span>
          Pan
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-section">
        <button className="toolbar-button" onClick={handleZoomOut} title="Zoom Out">
          <span className="icon">🔍-</span>
        </button>
        <span className="zoom-display">{Math.round(state.zoom * 100)}%</span>
        <button className="toolbar-button" onClick={handleZoomIn} title="Zoom In">
          <span className="icon">🔍+</span>
        </button>
        <button className="toolbar-button" onClick={handleZoomReset} title="Reset Zoom">
          <span className="icon">🎯</span>
        </button>
      </div>

      <div className="toolbar-spacer"></div>

      <div className="toolbar-section">
        <span className="project-name">
          {state.currentProject?.name || 'Untitled Project'}
          {gameEditor.hasUnsavedChanges && <span className="unsaved-indicator">*</span>}
        </span>
      </div>

      {/* Click outside to close dropdown */}
      {showProjectMenu && (
        <div 
          className="dropdown-backdrop" 
          onClick={() => setShowProjectMenu(false)}
        />
      )}
    </div>
  );
};

export default Toolbar;