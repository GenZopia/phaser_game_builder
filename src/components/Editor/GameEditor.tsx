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
        <aside className="component-library-sidebar">
          <ComponentLibrary />
        </aside>
        
        <section className="canvas-area">
          <Canvas project={state.currentProject} />
        </section>
        
        <aside className="properties-sidebar">
          <PropertiesPanel selectedObjects={state.selectedObjects} />
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