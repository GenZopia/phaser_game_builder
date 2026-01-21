import { useCallback, useMemo } from 'react';
import { useEditor, EDITOR_ACTIONS } from '../context/EditorContext';
import type { GameObject } from '../types';
import ProjectStore from '../services/project/ProjectStore';
import ImportService from '../services/project/ImportService';

interface GameEditorHook {
  // Project operations
  createNewProject: (name?: string) => Promise<void>;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string, newName?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Object operations
  addObject: (object: GameObject, sceneId?: string) => void;
  updateObject: (objectId: string, updates: Partial<GameObject>) => void;
  deleteObject: (objectId: string) => void;
  selectObject: (objectId: string) => void;
  selectMultipleObjects: (objectIds: string[]) => void;
  clearSelection: () => void;
  
  // Clipboard operations
  copySelectedObjects: () => void;
  pasteObjects: (sceneId?: string) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  
  // View operations
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetView: () => void;
  
  // Game operations
  playGame: () => void;
  stopGame: () => void;
  
  // State
  isPlaying: boolean;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const useGameEditor = (): GameEditorHook => {
  const { state, dispatch } = useEditor();

  // Track unsaved changes - simple boolean based on history length
  const hasUnsavedChanges = useMemo(() => {
    return Boolean(state.currentProject && state.history.length > 0);
  }, [state.history, state.currentProject]);

  const createNewProject = useCallback(async (name?: string) => {
    const project = ImportService.createSampleProject();
    if (name) {
      project.name = name;
    }
    
    dispatch({
      type: EDITOR_ACTIONS.SET_PROJECT,
      payload: project,
      timestamp: new Date()
    });
  }, [dispatch]);

  const saveProject = useCallback(async () => {
    if (!state.currentProject) {
      throw new Error('No project to save');
    }

    await ProjectStore.saveProject(state.currentProject);
  }, [state.currentProject]);

  const loadProject = useCallback(async (projectId: string) => {
    const project = await ProjectStore.loadProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    dispatch({
      type: EDITOR_ACTIONS.SET_PROJECT,
      payload: project,
      timestamp: new Date()
    });
  }, [dispatch]);

  const duplicateProject = useCallback(async (projectId: string, newName?: string) => {
    const duplicatedProject = await ProjectStore.duplicateProject(projectId, newName);
    
    dispatch({
      type: EDITOR_ACTIONS.SET_PROJECT,
      payload: duplicatedProject,
      timestamp: new Date()
    });
  }, [dispatch]);

  const deleteProject = useCallback(async (projectId: string) => {
    await ProjectStore.deleteProject(projectId);
    
    // If the deleted project is currently loaded, clear it
    if (state.currentProject?.id === projectId) {
      dispatch({
        type: EDITOR_ACTIONS.SET_PROJECT,
        payload: null,
        timestamp: new Date()
      });
    }
  }, [dispatch, state.currentProject]);

  const addObject = useCallback((object: GameObject, sceneId?: string) => {
    if (!state.currentProject) return;
    
    const targetSceneId = sceneId || state.currentProject.scenes[0]?.id;
    if (!targetSceneId) return;

    dispatch({
      type: EDITOR_ACTIONS.ADD_OBJECT,
      payload: { ...object, sceneId: targetSceneId },
      timestamp: new Date()
    });
  }, [dispatch, state.currentProject]);

  const updateObject = useCallback((objectId: string, updates: Partial<GameObject>) => {
    dispatch({
      type: EDITOR_ACTIONS.UPDATE_OBJECT,
      payload: { objectId, updates },
      timestamp: new Date()
    });
  }, [dispatch]);

  const deleteObject = useCallback((objectId: string) => {
    dispatch({
      type: EDITOR_ACTIONS.DELETE_OBJECTS,
      payload: [objectId],
      timestamp: new Date()
    });
  }, [dispatch]);

  const selectObject = useCallback((objectId: string) => {
    if (!state.currentProject) return;
    
    // Find the object in all scenes
    let foundObject: GameObject | null = null;
    for (const scene of state.currentProject.scenes) {
      const obj = scene.objects.find(o => o.id === objectId);
      if (obj) {
        foundObject = obj;
        break;
      }
    }
    
    if (foundObject) {
      dispatch({
        type: EDITOR_ACTIONS.SELECT_OBJECTS,
        payload: [foundObject],
        timestamp: new Date()
      });
    }
  }, [dispatch, state.currentProject]);

  const selectMultipleObjects = useCallback((objectIds: string[]) => {
    if (!state.currentProject) return;
    
    const objects: GameObject[] = [];
    for (const scene of state.currentProject.scenes) {
      for (const obj of scene.objects) {
        if (objectIds.includes(obj.id)) {
          objects.push(obj);
        }
      }
    }
    
    dispatch({
      type: EDITOR_ACTIONS.SELECT_OBJECTS,
      payload: objects,
      timestamp: new Date()
    });
  }, [dispatch, state.currentProject]);

  const clearSelection = useCallback(() => {
    dispatch({
      type: EDITOR_ACTIONS.SELECT_OBJECTS,
      payload: [],
      timestamp: new Date()
    });
  }, [dispatch]);

  const copySelectedObjects = useCallback(() => {
    if (state.selectedObjects.length === 0) return;
    
    dispatch({
      type: EDITOR_ACTIONS.COPY_OBJECTS,
      payload: state.selectedObjects,
      timestamp: new Date()
    });
  }, [dispatch, state.selectedObjects]);

  const pasteObjects = useCallback((sceneId?: string) => {
    if (!state.currentProject || state.clipboard.length === 0) return;
    
    const targetSceneId = sceneId || state.currentProject.scenes[0]?.id;
    if (!targetSceneId) return;

    dispatch({
      type: EDITOR_ACTIONS.PASTE_OBJECTS,
      payload: { sceneId: targetSceneId },
      timestamp: new Date()
    });
  }, [dispatch, state.currentProject, state.clipboard]);

  const undo = useCallback(() => {
    dispatch({
      type: EDITOR_ACTIONS.UNDO,
      payload: null,
      timestamp: new Date()
    });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({
      type: EDITOR_ACTIONS.REDO,
      payload: null,
      timestamp: new Date()
    });
  }, [dispatch]);

  const setZoom = useCallback((zoom: number) => {
    dispatch({
      type: EDITOR_ACTIONS.SET_ZOOM,
      payload: zoom,
      timestamp: new Date()
    });
  }, [dispatch]);

  const setPanOffset = useCallback((offset: { x: number; y: number }) => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PAN_OFFSET,
      payload: offset,
      timestamp: new Date()
    });
  }, [dispatch]);

  const resetView = useCallback(() => {
    dispatch({
      type: EDITOR_ACTIONS.SET_ZOOM,
      payload: 1,
      timestamp: new Date()
    });
    dispatch({
      type: EDITOR_ACTIONS.SET_PAN_OFFSET,
      payload: { x: 0, y: 0 },
      timestamp: new Date()
    });
  }, [dispatch]);

  const playGame = useCallback(() => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PLAYING,
      payload: true,
      timestamp: new Date()
    });
  }, [dispatch]);

  const stopGame = useCallback(() => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PLAYING,
      payload: false,
      timestamp: new Date()
    });
  }, [dispatch]);

  return {
    // Project operations
    createNewProject,
    saveProject,
    loadProject,
    duplicateProject,
    deleteProject,
    
    // Object operations
    addObject,
    updateObject,
    deleteObject,
    selectObject,
    selectMultipleObjects,
    clearSelection,
    
    // Clipboard operations
    copySelectedObjects,
    pasteObjects,
    
    // History operations
    undo,
    redo,
    
    // View operations
    setZoom,
    setPanOffset,
    resetView,
    
    // Game operations
    playGame,
    stopGame,
    
    // State
    isPlaying: state.isPlaying,
    hasUnsavedChanges,
    canUndo: state.history.length > 0,
    canRedo: false // TODO: Implement proper redo stack
  };
};

export default useGameEditor;