import React, { useState, useEffect } from 'react';
import type { GameObject, GameBehavior } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import BehaviorLibrary from './BehaviorLibrary';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  selectedObjects: GameObject[];
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObjects }) => {
  const { dispatch, state } = useEditor();

  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const multipleSelected = selectedObjects.length > 1;

  // Get the fresh object from state to ensure we have latest data
  const freshSelectedObject = selectedObject && state.currentProject 
    ? state.currentProject.scenes[0]?.objects.find(obj => obj.id === selectedObject.id)
    : null;
  
  const objectToUse = freshSelectedObject || selectedObject;

  // Local state for input values
  const [posX, setPosX] = useState(selectedObject?.position.x || 0);
  const [posY, setPosY] = useState(selectedObject?.position.y || 0);
  const [scaleX, setScaleX] = useState(selectedObject?.scale.x || 1);
  const [scaleY, setScaleY] = useState(selectedObject?.scale.y || 1);
  const [rotation, setRotation] = useState(selectedObject?.rotation || 0);
  const [gravityStrength, setGravityStrength] = useState(selectedObject?.properties?.gravityStrength || 500);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      setPosX(selectedObject.position.x);
      setPosY(selectedObject.position.y);
      setScaleX(selectedObject.scale.x);
      setScaleY(selectedObject.scale.y);
      setRotation(selectedObject.rotation);
      setGravityStrength(selectedObject.properties?.gravityStrength || 500);
    }
  }, [selectedObject?.id, objectToUse?.behaviors?.length]);

  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedObject) return;

    dispatch({
      type: EDITOR_ACTIONS.UPDATE_OBJECT,
      payload: {
        objectId: selectedObject.id,
        updates: { [property]: value },
      },
      timestamp: new Date(),
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedObject) return;
    const newPosition = { ...selectedObject.position, [axis]: value };
    handlePropertyChange('position', newPosition);
  };

  const handleScaleChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedObject) return;
    const newScale = { ...selectedObject.scale, [axis]: value };
    handlePropertyChange('scale', newScale);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🎯 Drag over drop zone');
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    console.log('👋 Drag leave drop zone');
    setIsDraggingOver(false);
  };

  const handleBehaviorDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    
    console.log('🎉 Behavior drop event triggered!');
    
    if (!selectedObject) {
      console.log('❌ No selected object');
      return;
    }

    try {
      const dataString = event.dataTransfer.getData('application/json');
      console.log('📦 Dropped data:', dataString);
      
      if (!dataString) {
        console.log('❌ No data in drop event');
        return;
      }
      
      const data = JSON.parse(dataString);
      console.log('✅ Parsed data:', data);
      
      if (!data.isBehavior) {
        console.log('❌ Not a behavior, ignoring');
        return;
      }

      const newBehavior: GameBehavior = {
        id: `${data.type}_${Date.now()}`,
        type: data.type,
        name: data.name,
        parameters: data.defaultParameters,
      };

      console.log('✨ Creating new behavior:', newBehavior);
      console.log('📋 Current behaviors:', objectToUse?.behaviors || []);

      const updatedBehaviors = [...(objectToUse?.behaviors || []), newBehavior];
      console.log('🔄 Updated behaviors:', updatedBehaviors);
      console.log('🔄 Updated behaviors:', updatedBehaviors);
      
      handlePropertyChange('behaviors', updatedBehaviors);
      console.log('✅ Behavior added successfully!');
    } catch (error) {
      console.error('💥 Failed to add behavior:', error);
    }
  };

  const handleBehaviorRemove = (behaviorId: string) => {
    if (!selectedObject) return;
    const updatedBehaviors = (objectToUse?.behaviors || []).filter(b => b.id !== behaviorId);
    handlePropertyChange('behaviors', updatedBehaviors);
  };

  const handleBehaviorParameterChange = (behaviorId: string, paramKey: string, value: any) => {
    if (!selectedObject) return;
    const updatedBehaviors = (objectToUse?.behaviors || []).map(b => {
      if (b.id === behaviorId) {
        return {
          ...b,
          parameters: { ...b.parameters, [paramKey]: value },
        };
      }
      return b;
    });
    handlePropertyChange('behaviors', updatedBehaviors);
  };

  if (selectedObjects.length === 0) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="properties-content">
          <div className="no-selection">
            <p>No objects selected</p>
            <p className="no-selection-hint">Select an object to edit its properties</p>
          </div>
          <div className="property-section">
            <BehaviorLibrary />
          </div>
        </div>
      </div>
    );
  }

  if (multipleSelected) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="properties-content">
          <div className="multiple-selection">
            <p>{selectedObjects.length} objects selected</p>
          </div>
          <div className="property-section">
            <BehaviorLibrary />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        <div className="object-info">
          <span className="object-type">{selectedObject!.type}</span>
          <span className="object-id">#{selectedObject!.id.slice(-6)}</span>
        </div>
      </div>

      <div className="properties-content">
        {/* Sprite Properties */}
        <div className="property-section">
          <h4>Sprite</h4>
          
          <div className="property-group">
            <label>Name</label>
            <input
              type="text"
              value={selectedObject!.properties?.name || ''}
              onChange={(e) => {
                handlePropertyChange('properties', {
                  ...selectedObject!.properties,
                  name: e.target.value
                });
              }}
              placeholder={`Unnamed ${selectedObject!.type}`}
              style={{
                width: '100%',
                padding: '6px',
                background: '#34495e',
                color: '#ecf0f1',
                border: '1px solid #4a5f7a',
                borderRadius: '4px'
              }}
            />
            <div style={{ fontSize: '10px', color: '#95a5a6', marginTop: '4px' }}>
              Custom name for this object
            </div>
          </div>
        </div>

        {/* Transform Properties */}
        <div className="property-section">
          <h4>Transform</h4>
          
          <div className="property-group">
            <label>Position</label>
            <div className="vector-input">
              <div className="input-group">
                <label>X</label>
                <input
                  type="number"
                  value={Math.round(posX)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPosX(val);
                    handlePositionChange('x', val);
                  }}
                  step="1"
                />
              </div>
              <div className="input-group">
                <label>Y</label>
                <input
                  type="number"
                  value={Math.round(posY)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPosY(val);
                    handlePositionChange('y', val);
                  }}
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="property-group">
            <label>Scale</label>
            <div className="vector-input">
              <div className="input-group">
                <label>X</label>
                <input
                  type="number"
                  value={scaleX}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.1;
                    setScaleX(val);
                    handleScaleChange('x', val);
                  }}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div className="input-group">
                <label>Y</label>
                <input
                  type="number"
                  value={scaleY}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.1;
                    setScaleY(val);
                    handleScaleChange('y', val);
                  }}
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>
          </div>

          <div className="property-group">
            <label>Rotation</label>
            <input
              type="number"
              value={rotation}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setRotation(val);
                handlePropertyChange('rotation', val);
              }}
              step="1"
              min="-360"
              max="360"
            />
            <span className="unit">degrees</span>
          </div>

          {/* Visibility Options */}
          <div className="property-group">
            <label>Visibility</label>
            <select
              value={selectedObject!.properties?.visibility || 'visible'}
              onChange={(e) => {
                handlePropertyChange('properties', {
                  ...selectedObject!.properties,
                  visibility: e.target.value
                });
              }}
              style={{
                width: '100%',
                padding: '6px',
                background: '#34495e',
                color: '#ecf0f1',
                border: '1px solid #4a5f7a',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="visible">Visible</option>
              <option value="hiddenInPlay">Hidden in Play Mode</option>
              <option value="alwaysHidden">Always Hidden</option>
            </select>
            <div style={{ fontSize: '10px', color: '#95a5a6', marginTop: '4px' }}>
              {selectedObject!.properties?.visibility === 'visible' && '👁️ Visible everywhere'}
              {selectedObject!.properties?.visibility === 'hiddenInPlay' && '🎮 Hidden during play, visible in editor'}
              {selectedObject!.properties?.visibility === 'alwaysHidden' && '🚫 Always invisible'}
              {!selectedObject!.properties?.visibility && '👁️ Visible everywhere'}
            </div>
          </div>

          {/* Gravity Strength - Only for gravity objects */}
          {selectedObject!.type === 'gravity' && (
            <div className="property-group">
              <label>Gravity</label>
              <input
                type="number"
                value={gravityStrength}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setGravityStrength(val);
                  handlePropertyChange('properties', {
                    ...selectedObject!.properties,
                    gravityStrength: val
                  });
                }}
                step="50"
              />
              <span className="unit" style={{ fontSize: '11px', color: '#95a5a6' }}>
                {gravityStrength >= 0 ? 'attract' : 'repel'}
              </span>
            </div>
          )}
        </div>

        {/* Behaviors Section */}
        <div className="property-section">
          <h4>Behaviors</h4>
          
          {/* Test button */}
          <button 
            onClick={() => {
              if (!selectedObject) return;
              const testBehavior: GameBehavior = {
                id: `physics_test_${Date.now()}`,
                type: 'physics',
                name: 'Physics',
                parameters: {
                  enabled: true,
                  isStatic: false,
                  mass: 1,
                  density: 1,
                  friction: 0.3,
                  bounce: 0.2,
                  gravityScale: 1,
                },
              };
              const updatedBehaviors = [...(objectToUse?.behaviors || []), testBehavior];
              handlePropertyChange('behaviors', updatedBehaviors);
            }}
            style={{
              padding: '8px 12px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '8px',
              width: '100%'
            }}
          >
            🧪 Test Add Physics (Click to test)
          </button>
          
          <div 
            className={`behavior-drop-zone ${isDraggingOver ? 'dragging-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleBehaviorDrop}
          >
            {(objectToUse!.behaviors || []).length === 0 ? (
              <div className="drop-zone-empty">
                <p>Drop behaviors here</p>
              </div>
            ) : (
              <div className="behaviors-list">
                {(objectToUse!.behaviors || []).map((behavior) => (
                  <div key={behavior.id} className="behavior-card">
                    <div className="behavior-card-header">
                      <span className="behavior-card-name">{behavior.name}</span>
                      <button
                        className="behavior-remove-btn"
                        onClick={() => handleBehaviorRemove(behavior.id)}
                        title="Remove behavior"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Physics Behavior Parameters */}
                    {behavior.type === 'physics' && (
                      <div className="behavior-parameters">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.enabled}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'enabled', e.target.checked)}
                          />
                          Enabled
                        </label>

                        <div className="param-row">
                          <label>Mass</label>
                          <input
                            type="number"
                            value={behavior.parameters.mass}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'mass', parseFloat(e.target.value) || 1)}
                            step="0.1"
                            min="0.1"
                          />
                        </div>

                        <div className="param-row">
                          <label>Density</label>
                          <input
                            type="number"
                            value={behavior.parameters.density}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'density', parseFloat(e.target.value) || 1)}
                            step="0.1"
                            min="0.1"
                          />
                        </div>

                        <div className="param-row">
                          <label>Friction</label>
                          <input
                            type="number"
                            value={behavior.parameters.friction}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'friction', parseFloat(e.target.value) || 0)}
                            step="0.1"
                            min="0"
                            max="1"
                          />
                        </div>

                        <div className="param-row">
                          <label>Bounce</label>
                          <input
                            type="number"
                            value={behavior.parameters.bounce}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'bounce', parseFloat(e.target.value) || 0)}
                            step="0.1"
                            min="0"
                            max="1"
                          />
                        </div>

                        <div className="param-row">
                          <label>Gravity Scale</label>
                          <input
                            type="number"
                            value={behavior.parameters.gravityScale}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'gravityScale', parseFloat(e.target.value) || 1)}
                            step="0.1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Controls Behavior Parameters */}
                    {behavior.type === 'controls' && (
                      <div className="behavior-parameters">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.enabled}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'enabled', e.target.checked)}
                          />
                          Enabled
                        </label>

                        <div className="param-row">
                          <label>Move Speed</label>
                          <input
                            type="number"
                            value={behavior.parameters.moveSpeed}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'moveSpeed', parseFloat(e.target.value) || 100)}
                            step="10"
                            min="0"
                          />
                        </div>

                        <div className="param-row">
                          <label>Jump Power</label>
                          <input
                            type="number"
                            value={behavior.parameters.jumpPower}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'jumpPower', parseFloat(e.target.value) || 100)}
                            step="10"
                            min="0"
                          />
                        </div>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.canDoubleJump}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'canDoubleJump', e.target.checked)}
                          />
                          Double Jump
                        </label>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.allowVerticalMovement || false}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'allowVerticalMovement', e.target.checked)}
                          />
                          Allow Vertical Movement (Top-Down)
                        </label>

                        <div className="keys-section">
                          <h5>Key Bindings</h5>
                          {Object.entries(behavior.parameters.keys).map(([action, key]) => (
                            <div key={action} className="param-row">
                              <label>{action.charAt(0).toUpperCase() + action.slice(1)}</label>
                              <input
                                type="text"
                                value={key as string}
                                onChange={(e) => {
                                  const newKeys = { ...behavior.parameters.keys, [action]: e.target.value };
                                  handleBehaviorParameterChange(behavior.id, 'keys', newKeys);
                                }}
                                maxLength={10}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Camera Behavior Parameters */}
                    {behavior.type === 'camera' && (
                      <div className="behavior-parameters">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.enabled}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'enabled', e.target.checked)}
                          />
                          Enabled
                        </label>

                        <div className="param-row">
                          <label>Smoothing</label>
                          <input
                            type="number"
                            value={behavior.parameters.smoothing}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'smoothing', parseFloat(e.target.value) || 0.1)}
                            step="0.05"
                            min="0"
                            max="1"
                          />
                        </div>

                        <div className="param-row">
                          <label>Offset X</label>
                          <input
                            type="number"
                            value={behavior.parameters.offsetX}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'offsetX', parseFloat(e.target.value) || 0)}
                            step="10"
                          />
                        </div>

                        <div className="param-row">
                          <label>Offset Y</label>
                          <input
                            type="number"
                            value={behavior.parameters.offsetY}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'offsetY', parseFloat(e.target.value) || 0)}
                            step="10"
                          />
                        </div>

                        <div className="param-row">
                          <label>Deadzone Width</label>
                          <input
                            type="number"
                            value={behavior.parameters.deadzone?.width || 100}
                            onChange={(e) => {
                              const newDeadzone = { ...behavior.parameters.deadzone, width: parseFloat(e.target.value) || 100 };
                              handleBehaviorParameterChange(behavior.id, 'deadzone', newDeadzone);
                            }}
                            step="10"
                            min="0"
                          />
                        </div>

                        <div className="param-row">
                          <label>Deadzone Height</label>
                          <input
                            type="number"
                            value={behavior.parameters.deadzone?.height || 100}
                            onChange={(e) => {
                              const newDeadzone = { ...behavior.parameters.deadzone, height: parseFloat(e.target.value) || 100 };
                              handleBehaviorParameterChange(behavior.id, 'deadzone', newDeadzone);
                            }}
                            step="10"
                            min="0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Oblique Behavior Parameters */}
                    {behavior.type === 'oblique' && (
                      <div className="behavior-parameters">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.enabled}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'enabled', e.target.checked)}
                          />
                          Enabled
                        </label>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.isStatic || false}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'isStatic', e.target.checked)}
                          />
                          Static Body (Immovable)
                        </label>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.onlyCollideWithOblique}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'onlyCollideWithOblique', e.target.checked)}
                          />
                          Only Collide With Oblique Objects
                        </label>

                        <div className="param-row">
                          <label>Collision Group</label>
                          <input
                            type="text"
                            value={behavior.parameters.collisionGroup}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'collisionGroup', e.target.value)}
                            placeholder="default"
                          />
                        </div>

                        <div className="param-row">
                          <label>Padding (px)</label>
                          <input
                            type="number"
                            value={behavior.parameters.padding}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'padding', parseFloat(e.target.value) || 0)}
                            step="5"
                            min="0"
                            max="100"
                          />
                        </div>

                        <div style={{
                          background: 'rgba(52, 152, 219, 0.1)',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#95a5a6',
                          marginTop: '8px'
                        }}>
                          💡 Objects with Oblique will pass through normal objects unless they also have Oblique behavior
                        </div>
                      </div>
                    )}

                    {/* Fixed Position Behavior Parameters */}
                    {behavior.type === 'fixed' && (
                      <div className="behavior-parameters">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.enabled}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'enabled', e.target.checked)}
                          />
                          Enabled
                        </label>

                        <div className="param-row">
                          <label>Screen X</label>
                          <input
                            type="number"
                            value={behavior.parameters.screenX}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'screenX', parseFloat(e.target.value) || 0)}
                            step="10"
                            min="0"
                          />
                        </div>

                        <div className="param-row">
                          <label>Screen Y</label>
                          <input
                            type="number"
                            value={behavior.parameters.screenY}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'screenY', parseFloat(e.target.value) || 0)}
                            step="10"
                            min="0"
                          />
                        </div>

                        <div style={{
                          background: 'rgba(155, 89, 182, 0.1)',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#95a5a6',
                          marginTop: '8px'
                        }}>
                          📌 Object will stay pinned to this screen position regardless of camera movement
                        </div>
                      </div>
                    )}

                    {/* Gravity Force Behavior Parameters */}
                    {behavior.type === 'gravity' && (
                      <div className="behavior-parameters">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={behavior.parameters.enabled}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'enabled', e.target.checked)}
                          />
                          Enabled
                        </label>

                        <div className="param-row">
                          <label>Gravity Strength</label>
                          <input
                            type="number"
                            value={behavior.parameters.strength}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'strength', parseFloat(e.target.value) || 0)}
                            step="50"
                          />
                        </div>

                        <div className="param-row">
                          <label>Max Distance</label>
                          <input
                            type="number"
                            value={behavior.parameters.maxDistance}
                            onChange={(e) => handleBehaviorParameterChange(behavior.id, 'maxDistance', parseFloat(e.target.value) || 100)}
                            step="50"
                            min="100"
                          />
                        </div>

                        <div style={{
                          background: 'rgba(155, 89, 182, 0.1)',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#95a5a6',
                          marginTop: '8px'
                        }}>
                          🧲 <strong>Positive values</strong> attract objects (pull in)<br/>
                          🚫 <strong>Negative values</strong> repel objects (push away)<br/>
                          💡 Default: 500 (attraction), -500 (repulsion)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Behavior Library */}
        <div className="property-section">
          <BehaviorLibrary />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
