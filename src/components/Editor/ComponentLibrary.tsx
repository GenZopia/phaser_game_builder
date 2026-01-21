import React, { useState } from 'react';
import './ComponentLibrary.css';

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  category: string;
  icon: string;
  description: string;
}

const COMPONENT_CATEGORIES = [
  { id: 'player', name: 'Player', icon: '🎮' },
  { id: 'platforms', name: 'Platforms', icon: '🧱' },
  { id: 'collectibles', name: 'Collectibles', icon: '💎' },
  { id: 'enemies', name: 'Enemies', icon: '👾' },
  { id: 'ui', name: 'UI', icon: '📱' },
  { id: 'backgrounds', name: 'Backgrounds', icon: '🌄' },
];

const COMPONENT_ITEMS: ComponentItem[] = [
  // Player components
  { id: 'player-basic', name: 'Basic Player', type: 'player', category: 'player', icon: '🏃', description: 'Basic player character with movement' },
  { id: 'player-platformer', name: 'Platformer Hero', type: 'player', category: 'player', icon: '🦸', description: 'Player with jumping and physics' },
  
  // Platform components
  { id: 'platform-ground', name: 'Ground Platform', type: 'platform', category: 'platforms', icon: '⬛', description: 'Solid ground platform' },
  { id: 'platform-floating', name: 'Floating Platform', type: 'platform', category: 'platforms', icon: '🟫', description: 'Floating platform' },
  { id: 'platform-moving', name: 'Moving Platform', type: 'platform', category: 'platforms', icon: '🔄', description: 'Platform that moves back and forth' },
  
  // Collectible components
  { id: 'collectible-coin', name: 'Coin', type: 'collectible', category: 'collectibles', icon: '🪙', description: 'Collectible coin' },
  { id: 'collectible-gem', name: 'Gem', type: 'collectible', category: 'collectibles', icon: '💎', description: 'Valuable gem' },
  { id: 'collectible-powerup', name: 'Power-up', type: 'collectible', category: 'collectibles', icon: '⭐', description: 'Special power-up item' },
  
  // Enemy components
  { id: 'enemy-basic', name: 'Basic Enemy', type: 'enemy', category: 'enemies', icon: '👾', description: 'Simple enemy with basic AI' },
  { id: 'enemy-patrol', name: 'Patrol Enemy', type: 'enemy', category: 'enemies', icon: '🤖', description: 'Enemy that patrols back and forth' },
  { id: 'enemy-flying', name: 'Flying Enemy', type: 'enemy', category: 'enemies', icon: '🦇', description: 'Flying enemy with aerial movement' },
  
  // UI components
  { id: 'ui-controller', name: 'On-Screen Controller', type: 'controller', category: 'ui', icon: '🕹️', description: 'Touch controller for mobile devices' },
  
  // Background components
  { id: 'bg-sky', name: 'Sky Background', type: 'background', category: 'backgrounds', icon: '☁️', description: 'Blue sky with clouds' },
  { id: 'bg-forest', name: 'Forest Background', type: 'background', category: 'backgrounds', icon: '🌲', description: 'Forest scene background' },
  { id: 'bg-space', name: 'Space Background', type: 'background', category: 'backgrounds', icon: '🌌', description: 'Starry space background' },
];

const ComponentLibrary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('player');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleDragStart = (component: ComponentItem, event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const filteredComponents = COMPONENT_ITEMS.filter(component => {
    const matchesCategory = component.category === selectedCategory;
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="component-library">
      <div className="library-header">
        <h3>Components</h3>
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="category-tabs">
        {COMPONENT_CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
            title={category.name}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      <div className="component-list">
        {filteredComponents.map(component => (
          <div
            key={component.id}
            className="component-item"
            draggable
            onDragStart={(e) => handleDragStart(component, e)}
            title={component.description}
          >
            <div className="component-icon">{component.icon}</div>
            <div className="component-info">
              <div className="component-name">{component.name}</div>
              <div className="component-description">{component.description}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <div className="no-components">
          <p>No components found</p>
          <p className="no-components-hint">Try adjusting your search or selecting a different category</p>
        </div>
      )}
    </div>
  );
};

export default ComponentLibrary;