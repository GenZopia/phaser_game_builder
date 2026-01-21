import React, { useState } from 'react';
import type { GameObject } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import './SceneHierarchy.css';

interface SceneHierarchyProps {
  objects: GameObject[];
}

const SceneHierarchy: React.FC<SceneHierarchyProps> = ({ objects }) => {
  const { dispatch, state } = useEditor();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleObjectClick = (obj: GameObject, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      if (selectedIds.includes(obj.id)) {
        setSelectedIds(selectedIds.filter(id => id !== obj.id));
      } else {
        setSelectedIds([...selectedIds, obj.id]);
      }
    } else {
      // Single select
      setSelectedIds([obj.id]);
      dispatch({
        type: EDITOR_ACTIONS.SELECT_OBJECTS,
        payload: [obj],
        timestamp: new Date()
      });
    }
  };

  const handleDragStart = (obj: GameObject, event: React.DragEvent) => {
    setDraggedId(obj.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (obj: GameObject, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverId(obj.id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (targetObj: GameObject, event: React.DragEvent) => {
    event.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetObj.id) {
      setDraggedId(null);
      return;
    }

    // Reorder objects
    const draggedIndex = objects.findIndex(obj => obj.id === draggedId);
    const targetIndex = objects.findIndex(obj => obj.id === targetObj.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newObjects = [...objects];
    const [draggedObject] = newObjects.splice(draggedIndex, 1);
    newObjects.splice(targetIndex, 0, draggedObject);

    // Update the scene with new order
    if (state.currentProject) {
      const updatedProject = {
        ...state.currentProject,
        scenes: state.currentProject.scenes.map(scene => ({
          ...scene,
          objects: newObjects
        }))
      };

      dispatch({
        type: EDITOR_ACTIONS.SET_PROJECT,
        payload: updatedProject,
        timestamp: new Date()
      });
    }

    setDraggedId(null);
  };

  const handleGroupSelected = () => {
    if (selectedIds.length < 2) {
      alert('Please select at least 2 objects to group');
      return;
    }

    const groupName = prompt('Enter group name:', 'Group');
    if (!groupName) return;

    // Create a group object
    const groupId = `group_${Date.now()}`;
    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    
    // Calculate center position of selected objects
    const avgX = selectedObjects.reduce((sum, obj) => sum + obj.position.x, 0) / selectedObjects.length;
    const avgY = selectedObjects.reduce((sum, obj) => sum + obj.position.y, 0) / selectedObjects.length;

    const groupObject: GameObject = {
      id: groupId,
      type: 'sprite',
      position: { x: avgX, y: avgY },
      scale: { x: 1, y: 1 },
      rotation: 0,
      properties: {
        isGroup: true,
        groupName: groupName,
        children: selectedIds
      },
      behaviors: []
    };

    dispatch({
      type: EDITOR_ACTIONS.ADD_OBJECT,
      payload: groupObject,
      timestamp: new Date()
    });

    setSelectedIds([]);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'player': return '🏃';
      case 'platform': return '⬛';
      case 'collectible': return '💎';
      case 'enemy': return '👾';
      case 'controller': return '🕹️';
      case 'boundary': return '🧱';
      case 'gravity': return '🟣';
      case 'background': return '🌄';
      default: return '📦';
    }
  };

  const groups = objects.filter(obj => obj.properties?.isGroup);
  const nonGroupObjects = objects.filter(obj => !obj.properties?.isGroup);

  return (
    <div className="scene-hierarchy">
      <div className="hierarchy-header">
        <h4>Scene Hierarchy</h4>
        <button 
          className="group-button"
          onClick={handleGroupSelected}
          disabled={selectedIds.length < 2}
          title="Group selected objects"
        >
          📁 Group
        </button>
      </div>

      <div className="hierarchy-list">
        {/* Groups */}
        {groups.map(group => {
          const isExpanded = expandedGroups.has(group.id);
          const childIds = group.properties?.children || [];
          const children = objects.filter(obj => childIds.includes(obj.id));

          return (
            <div key={group.id} className="hierarchy-group">
              <div 
                className={`hierarchy-item group-item ${selectedIds.includes(group.id) ? 'selected' : ''}`}
                onClick={(e) => handleObjectClick(group, e)}
              >
                <span 
                  className="expand-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(group.id);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="item-icon">📁</span>
                <span className="item-name">{group.properties?.groupName || 'Group'}</span>
                <span className="item-count">({children.length})</span>
              </div>
              
              {isExpanded && (
                <div className="hierarchy-children">
                  {children.map(child => (
                    <div
                      key={child.id}
                      className={`hierarchy-item child-item ${selectedIds.includes(child.id) ? 'selected' : ''} ${dragOverId === child.id ? 'drag-over' : ''}`}
                      onClick={(e) => handleObjectClick(child, e)}
                      draggable
                      onDragStart={(e) => handleDragStart(child, e)}
                      onDragOver={(e) => handleDragOver(child, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(child, e)}
                    >
                      <span className="drag-handle">⋮⋮</span>
                      <span className="item-icon">{getObjectIcon(child.type)}</span>
                      <span className="item-name">{child.properties?.name || child.type}</span>
                      <span className="item-id">#{child.id.slice(-4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Non-grouped objects */}
        {nonGroupObjects.map(obj => (
          <div
            key={obj.id}
            className={`hierarchy-item ${selectedIds.includes(obj.id) ? 'selected' : ''} ${dragOverId === obj.id ? 'drag-over' : ''}`}
            onClick={(e) => handleObjectClick(obj, e)}
            draggable
            onDragStart={(e) => handleDragStart(obj, e)}
            onDragOver={(e) => handleDragOver(obj, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(obj, e)}
          >
            <span className="drag-handle">⋮⋮</span>
            <span className="item-icon">{getObjectIcon(obj.type)}</span>
            <span className="item-name">{obj.properties?.name || obj.type}</span>
            <span className="item-id">#{obj.id.slice(-4)}</span>
          </div>
        ))}
      </div>

      {objects.length === 0 && (
        <div className="hierarchy-empty">
          <p>No objects in scene</p>
          <p className="hierarchy-hint">Drag components onto the canvas to add objects</p>
        </div>
      )}
    </div>
  );
};

export default SceneHierarchy;
