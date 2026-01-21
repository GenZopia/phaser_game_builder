import React, { useState, useEffect } from 'react';
import type { GameObject } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  selectedObjects: GameObject[];
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObjects }) => {
  const { dispatch } = useEditor();

  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const multipleSelected = selectedObjects.length > 1;

  // Local state for input values to prevent lag
  const [posX, setPosX] = useState(selectedObject?.position.x || 0);
  const [posY, setPosY] = useState(selectedObject?.position.y || 0);
  const [scaleX, setScaleX] = useState(selectedObject?.scale.x || 1);
  const [scaleY, setScaleY] = useState(selectedObject?.scale.y || 1);
  const [rotation, setRotation] = useState(selectedObject?.rotation || 0);

  // Update local state when selected object changes
  useEffect(() => {
    if (selectedObject) {
      setPosX(selectedObject.position.x);
      setPosY(selectedObject.position.y);
      setScaleX(selectedObject.scale.x);
      setScaleY(selectedObject.scale.y);
      setRotation(selectedObject.rotation);
    }
  }, [selectedObject?.id]);

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

    const newPosition = { 
      ...selectedObject.position, 
      [axis]: value 
    };
    handlePropertyChange('position', newPosition);
  };

  const handleScaleChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedObject) return;

    const newScale = { 
      ...selectedObject.scale, 
      [axis]: value 
    };
    handlePropertyChange('scale', newScale);
  };

  const handleRotationChange = (value: number) => {
    handlePropertyChange('rotation', value);
  };

  const handleCustomPropertyChange = (key: string, value: any) => {
    if (!selectedObject) return;

    const newProperties = { ...selectedObject.properties, [key]: value };
    handlePropertyChange('properties', newProperties);
  };

  if (selectedObjects.length === 0) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="no-selection">
          <p>No objects selected</p>
          <p className="no-selection-hint">Select an object to edit its properties</p>
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
        <div className="multiple-selection">
          <p>{selectedObjects.length} objects selected</p>
          <p className="multiple-selection-hint">Multi-object editing coming soon</p>
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
                  value={posX}
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
                  value={posY}
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
                handleRotationChange(val);
              }}
              step="1"
              min="-360"
              max="360"
            />
            <span className="unit">degrees</span>
          </div>
        </div>

        {/* Physics Properties */}
        {(selectedObject!.type === 'player' || selectedObject!.type === 'enemy' || selectedObject!.type === 'platform') && (
          <div className="property-section">
            <h4>Physics</h4>
            
            <div className="property-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedObject!.properties.hasPhysics || false}
                  onChange={(e) => handleCustomPropertyChange('hasPhysics', e.target.checked)}
                />
                Enable Physics
              </label>
            </div>

            {selectedObject!.properties.hasPhysics && (
              <>
                <div className="property-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedObject!.properties.isStatic || false}
                      onChange={(e) => handleCustomPropertyChange('isStatic', e.target.checked)}
                    />
                    Static Body
                  </label>
                </div>

                <div className="property-group">
                  <label>Bounce</label>
                  <input
                    type="number"
                    value={selectedObject!.properties.bounce || 0}
                    onChange={(e) => handleCustomPropertyChange('bounce', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>

                <div className="property-group">
                  <label>Friction</label>
                  <input
                    type="number"
                    value={selectedObject!.properties.friction || 1}
                    onChange={(e) => handleCustomPropertyChange('friction', parseFloat(e.target.value) || 1)}
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Behavior Properties */}
        {selectedObject!.type === 'enemy' && (
          <div className="property-section">
            <h4>Behavior</h4>
            
            <div className="property-group">
              <label>AI Type</label>
              <select
                value={selectedObject!.properties.aiType || 'basic'}
                onChange={(e) => handleCustomPropertyChange('aiType', e.target.value)}
              >
                <option value="basic">Basic</option>
                <option value="patrol">Patrol</option>
                <option value="chase">Chase Player</option>
                <option value="flying">Flying</option>
              </select>
            </div>

            <div className="property-group">
              <label>Speed</label>
              <input
                type="number"
                value={selectedObject!.properties.speed || 100}
                onChange={(e) => handleCustomPropertyChange('speed', parseFloat(e.target.value) || 100)}
                step="10"
                min="0"
              />
            </div>
          </div>
        )}

        {/* Collectible Properties */}
        {selectedObject!.type === 'collectible' && (
          <div className="property-section">
            <h4>Collectible</h4>
            
            <div className="property-group">
              <label>Points Value</label>
              <input
                type="number"
                value={selectedObject!.properties.points || 10}
                onChange={(e) => handleCustomPropertyChange('points', parseFloat(e.target.value) || 10)}
                step="10"
                min="0"
              />
            </div>

            <div className="property-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedObject!.properties.respawns || false}
                  onChange={(e) => handleCustomPropertyChange('respawns', e.target.checked)}
                />
                Respawns
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;