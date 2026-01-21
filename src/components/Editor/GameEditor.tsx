import React, { useEffect } from 'react';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import ImportService from '../../services/project/ImportService';
import Toolbar from './Toolbar';
import ComponentLibrary from './ComponentLibrary';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import ResizableAIPanel from './ResizableAIPanel';
import './GameEditor.css';

const GameEditor: React.FC = () => {
  const { state, dispatch } = useEditor();
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = React.useState(true);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = React.useState(true);

  // Load sample project if no project is loaded
  useEffect(() => {
    console.log('GameEditor useEffect - current project:', state.currentProject);
    if (!state.currentProject) {
      try {
        const sampleProject = ImportService.createSampleProject();
        console.log('Created sample project:', sampleProject);
        dispatch({
          type: EDITOR_ACTIONS.SET_PROJECT,
          payload: sampleProject,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to create sample project:', error);
      }
    }
  }, [state.currentProject, dispatch]);

  console.log('GameEditor rendering with state:', state);

  return (
    <div className="game-editor">
      <header className="editor-header">
        <Toolbar />
      </header>
      
      <main className="editor-content">
        <aside className={`component-library-sidebar ${isLeftSidebarCollapsed ? 'collapsed' : ''}`}>
          {!isLeftSidebarCollapsed && <ComponentLibrary />}
        </aside>
        
        <section className="canvas-area">
          {/* Left sidebar toggle button - always visible */}
          <button 
            className="sidebar-toggle left-toggle"
            onClick={() => {
              console.log('Left toggle clicked, current state:', isLeftSidebarCollapsed);
              setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
            }}
            title={isLeftSidebarCollapsed ? 'Open Components Panel' : 'Close Components Panel'}
            style={{ pointerEvents: 'auto' }}
          >
            {isLeftSidebarCollapsed ? '▶' : '◀'}
          </button>
          
          <Canvas project={state.currentProject} />
          
          {/* Right sidebar toggle button - always visible */}
          <button 
            className="sidebar-toggle right-toggle"
            onClick={() => {
              console.log('Right toggle clicked, current state:', isRightSidebarCollapsed);
              setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
            }}
            title={isRightSidebarCollapsed ? 'Open Properties Panel' : 'Close Properties Panel'}
            style={{ pointerEvents: 'auto' }}
          >
            {isRightSidebarCollapsed ? '◀' : '▶'}
          </button>
        </section>
        
        <aside className={`properties-sidebar ${isRightSidebarCollapsed ? 'collapsed' : ''}`}>
          {!isRightSidebarCollapsed && <PropertiesPanel selectedObjects={state.selectedObjects} />}
        </aside>
      </main>
      
      <footer className="ai-prompt-section">
        <ResizableAIPanel 
          initialHeight={250}
          minHeight={120}
          maxHeight={500}
        />
      </footer>
    </div>
  );
};

export default GameEditor;