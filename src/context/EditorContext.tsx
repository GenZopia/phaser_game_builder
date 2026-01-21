import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer } from 'react';
import type { EditorState, EditorAction } from '../types';

// Initial state
const initialState: EditorState = {
  currentProject: null,
  selectedObjects: [],
  clipboard: [],
  history: [],
  isPlaying: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
};

// Action types
export const EDITOR_ACTIONS = {
  SET_PROJECT: 'SET_PROJECT',
  SELECT_OBJECTS: 'SELECT_OBJECTS',
  ADD_OBJECT: 'ADD_OBJECT',
  UPDATE_OBJECT: 'UPDATE_OBJECT',
  DELETE_OBJECTS: 'DELETE_OBJECTS',
  COPY_OBJECTS: 'COPY_OBJECTS',
  PASTE_OBJECTS: 'PASTE_OBJECTS',
  SET_PLAYING: 'SET_PLAYING',
  SET_ZOOM: 'SET_ZOOM',
  SET_PAN_OFFSET: 'SET_PAN_OFFSET',
  UNDO: 'UNDO',
  REDO: 'REDO',
} as const;

// Reducer function
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case EDITOR_ACTIONS.SET_PROJECT:
      return {
        ...state,
        currentProject: action.payload,
        selectedObjects: [],
        history: [...state.history, action],
      };

    case EDITOR_ACTIONS.SELECT_OBJECTS:
      return {
        ...state,
        selectedObjects: action.payload,
      };

    case EDITOR_ACTIONS.ADD_OBJECT: {
      if (!state.currentProject) return state;
      
      const newObject = action.payload;
      const updatedProject = {
        ...state.currentProject,
        scenes: state.currentProject.scenes.map(scene => 
          scene.id === action.payload.sceneId 
            ? { ...scene, objects: [...scene.objects, newObject] }
            : scene
        ),
        updatedAt: new Date(),
      };

      return {
        ...state,
        currentProject: updatedProject,
        history: [...state.history, action],
      };
    }

    case EDITOR_ACTIONS.UPDATE_OBJECT: {
      if (!state.currentProject) return state;
      
      const { objectId, updates } = action.payload;
      const updatedProjectForUpdate = {
        ...state.currentProject,
        scenes: state.currentProject.scenes.map(scene => ({
          ...scene,
          objects: scene.objects.map(obj => 
            obj.id === objectId ? { ...obj, ...updates } : obj
          ),
        })),
        updatedAt: new Date(),
      };

      return {
        ...state,
        currentProject: updatedProjectForUpdate,
        history: [...state.history, action],
      };
    }

    case EDITOR_ACTIONS.DELETE_OBJECTS: {
      if (!state.currentProject) return state;
      
      const objectIdsToDelete = action.payload;
      const updatedProjectForDelete = {
        ...state.currentProject,
        scenes: state.currentProject.scenes.map(scene => ({
          ...scene,
          objects: scene.objects.filter(obj => !objectIdsToDelete.includes(obj.id)),
        })),
        updatedAt: new Date(),
      };

      return {
        ...state,
        currentProject: updatedProjectForDelete,
        selectedObjects: state.selectedObjects.filter(obj => !objectIdsToDelete.includes(obj.id)),
        history: [...state.history, action],
      };
    }

    case EDITOR_ACTIONS.COPY_OBJECTS:
      return {
        ...state,
        clipboard: action.payload,
      };

    case EDITOR_ACTIONS.PASTE_OBJECTS: {
      if (!state.currentProject || state.clipboard.length === 0) return state;
      
      const pastedObjects = state.clipboard.map(obj => ({
        ...obj,
        id: `${obj.id}_copy_${Date.now()}`,
        position: {
          x: obj.position.x + 20,
          y: obj.position.y + 20,
        },
      }));

      const updatedProjectForPaste = {
        ...state.currentProject,
        scenes: state.currentProject.scenes.map(scene => 
          scene.id === action.payload.sceneId 
            ? { ...scene, objects: [...scene.objects, ...pastedObjects] }
            : scene
        ),
        updatedAt: new Date(),
      };

      return {
        ...state,
        currentProject: updatedProjectForPaste,
        selectedObjects: pastedObjects,
        history: [...state.history, action],
      };
    }

    case EDITOR_ACTIONS.SET_PLAYING:
      return {
        ...state,
        isPlaying: action.payload,
      };

    case EDITOR_ACTIONS.SET_ZOOM:
      return {
        ...state,
        zoom: Math.max(0.1, Math.min(5, action.payload)),
      };

    case EDITOR_ACTIONS.SET_PAN_OFFSET:
      return {
        ...state,
        panOffset: action.payload,
      };

    case EDITOR_ACTIONS.UNDO:
      // Simple undo implementation - in a real app, this would be more sophisticated
      if (state.history.length > 0) {
        const newHistory = state.history.slice(0, -1);
        return {
          ...state,
          history: newHistory,
        };
      }
      return state;

    case EDITOR_ACTIONS.REDO:
      // Redo implementation would require a separate redo stack
      return state;

    default:
      return state;
  }
}

// Context creation
interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Provider component
interface EditorProviderProps {
  children: ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook to use the editor context
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

export default EditorContext;