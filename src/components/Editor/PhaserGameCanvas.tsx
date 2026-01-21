import React, { useRef, useEffect, useState } from 'react';
import Phaser from 'phaser';
import type { GameProject, GameObject } from '../../types';
import { useEditor, EDITOR_ACTIONS } from '../../context/EditorContext';
import './PhaserGameCanvas.css';

interface PhaserGameCanvasProps {
  project: GameProject | null;
}

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  category: string;
  icon: string;
  description: string;
}

class GameScene extends Phaser.Scene {
  private gameObjects: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private project: GameProject | null = null;
  private onObjectSelect?: (objectId: string) => void;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { project: GameProject | null; onObjectSelect?: (objectId: string) => void }) {
    this.project = data.project;
    this.onObjectSelect = data.onObjectSelect;
  }

  preload() {
    // Create simple colored rectangles as textures
    this.add.graphics()
      .fillStyle(0x3498db)
      .fillRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);
      
    this.add.graphics()
      .fillStyle(0x8b4513)
      .fillRect(0, 0, 64, 32)
      .generateTexture('platform', 64, 32);
      
    this.add.graphics()
      .fillStyle(0xffd700)
      .fillRect(0, 0, 24, 24)
      .generateTexture('collectible', 24, 24);
      
    this.add.graphics()
      .fillStyle(0xe74c3c)
      .fillRect(0, 0, 28, 28)
      .generateTexture('enemy', 28, 28);
  }

  create() {
    console.log('GameScene created with project:', this.project);
    
    // Set background color
    this.cameras.main.setBackgroundColor('#34495e');
    
    // Enable physics
    this.physics.world.setBounds(0, 0, 800, 600);
    this.physics.world.gravity.y = 300;

    // Create cursors for input
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Create WASD keys
    const wasd = this.input.keyboard?.addKeys('W,S,A,D');

    // Create game objects from project data
    this.createGameObjects();
    
    // Add input handling
    this.input.on('pointerdown', this.handleClick, this);
    
    // Add keyboard controls
    if (this.cursors || wasd) {
      this.setupControls();
    }
  }

  update() {
    // Handle continuous input
    this.handleMovement();
  }

  createGameObjects() {
    console.log('Creating game objects...');
    
    if (!this.project || !this.project.scenes.length) {
      console.log('No project or scenes available');
      return;
    }

    const scene = this.project.scenes[0];
    console.log('Scene objects:', scene.objects);
    
    // Clear existing objects
    this.gameObjects.forEach(obj => {
      if (obj && obj.destroy) {
        obj.destroy();
      }
    });
    this.gameObjects.clear();
    
    scene.objects.forEach(obj => {
      console.log('Creating object:', obj);
      let gameObject: Phaser.GameObjects.GameObject;
      
      try {
        switch (obj.type) {
          case 'player':
            gameObject = this.physics.add.sprite(obj.position.x, obj.position.y, 'player');
            (gameObject as Phaser.Physics.Arcade.Sprite).setScale(obj.scale.x, obj.scale.y);
            (gameObject as Phaser.Physics.Arcade.Sprite).setBounce(0.2);
            (gameObject as Phaser.Physics.Arcade.Sprite).setCollideWorldBounds(true);
            break;
            
          case 'platform':
            gameObject = this.physics.add.staticSprite(obj.position.x, obj.position.y, 'platform');
            (gameObject as Phaser.Physics.Arcade.Sprite).setScale(obj.scale.x, obj.scale.y);
            break;
            
          case 'collectible':
            gameObject = this.physics.add.sprite(obj.position.x, obj.position.y, 'collectible');
            (gameObject as Phaser.Physics.Arcade.Sprite).setScale(obj.scale.x, obj.scale.y);
            break;
            
          case 'enemy':
            gameObject = this.physics.add.sprite(obj.position.x, obj.position.y, 'enemy');
            (gameObject as Phaser.Physics.Arcade.Sprite).setScale(obj.scale.x, obj.scale.y);
            break;
            
          default:
            gameObject = this.add.rectangle(obj.position.x, obj.position.y, 30 * obj.scale.x, 30 * obj.scale.y, 0x95a5a6);
        }
        
        gameObject.setRotation(obj.rotation);
        gameObject.setData('objectId', obj.id);
        gameObject.setData('objectType', obj.type);
        gameObject.setInteractive();
        
        this.gameObjects.set(obj.id, gameObject);
        console.log('Created object:', obj.type, 'at', obj.position);
        
      } catch (error) {
        console.error('Error creating object:', obj, error);
      }
    });

    // Add physics interactions
    this.setupPhysics();
  }

  setupPhysics() {
    const players = Array.from(this.gameObjects.values()).filter(obj => 
      obj.getData('objectType') === 'player'
    ) as Phaser.Physics.Arcade.Sprite[];
    
    const platforms = Array.from(this.gameObjects.values()).filter(obj => 
      obj.getData('objectType') === 'platform'
    ) as Phaser.Physics.Arcade.Sprite[];
    
    const collectibles = Array.from(this.gameObjects.values()).filter(obj => 
      obj.getData('objectType') === 'collectible'
    ) as Phaser.Physics.Arcade.Sprite[];

    console.log('Setting up physics - Players:', players.length, 'Platforms:', platforms.length, 'Collectibles:', collectibles.length);

    // Player-platform collisions
    players.forEach(player => {
      platforms.forEach(platform => {
        this.physics.add.collider(player, platform);
      });
      
      // Player-collectible overlaps
      collectibles.forEach(collectible => {
        this.physics.add.overlap(player, collectible, () => {
          collectible.destroy();
          this.gameObjects.delete(collectible.getData('objectId'));
          console.log('Collected item!');
        });
      });
    });
  }

  setupControls() {
    // Controls are handled in handleMovement
  }

  handleMovement() {
    const players = Array.from(this.gameObjects.values()).filter(obj => 
      obj.getData('objectType') === 'player'
    ) as Phaser.Physics.Arcade.Sprite[];

    if (players.length === 0) return;

    const player = players[0];
    const cursors = this.cursors;
    const wasd = this.input.keyboard?.addKeys('W,S,A,D');

    if (!cursors && !wasd) return;

    // Reset velocity
    player.setVelocityX(0);

    // Left and right movement
    if ((cursors?.left.isDown || wasd?.A.isDown)) {
      player.setVelocityX(-160);
    } else if ((cursors?.right.isDown || wasd?.D.isDown)) {
      player.setVelocityX(160);
    }

    // Jumping
    if ((cursors?.up.isDown || wasd?.W.isDown) && player.body && (player.body as Phaser.Physics.Arcade.Body).touching.down) {
      player.setVelocityY(-330);
    }
  }

  handleClick(pointer: Phaser.Input.Pointer) {
    // Find clicked object
    const clickedObjects = this.children.list.filter(child => {
      if (!child.getBounds) return false;
      const bounds = child.getBounds();
      return pointer.x >= bounds.x && pointer.x <= bounds.x + bounds.width &&
             pointer.y >= bounds.y && pointer.y <= bounds.y + bounds.height;
    });

    if (clickedObjects.length > 0) {
      const obj = clickedObjects[clickedObjects.length - 1]; // Get top object
      const objectId = obj.getData('objectId');
      if (objectId && this.onObjectSelect) {
        this.onObjectSelect(objectId);
      }
    }
  }

  updateGameObjects(project: GameProject | null) {
    console.log('Updating game objects with new project:', project);
    this.project = project;
    this.createGameObjects();
  }
}

const PhaserGameCanvas: React.FC<PhaserGameCanvasProps> = ({ project }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const { state, dispatch } = useEditor();
  const [isInitialized, setIsInitialized] = useState(false);

  const handleObjectSelect = (objectId: string) => {
    if (!project) return;
    
    // Find the object in all scenes
    let foundObject = null;
    for (const scene of project.scenes) {
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
  };

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'player':
        return {
          hasPhysics: true,
          isStatic: false,
          bounce: 0.2,
          friction: 1,
          speed: 200,
          jumpPower: 400,
        };
      case 'platform':
        return {
          hasPhysics: true,
          isStatic: true,
          bounce: 0,
          friction: 1,
        };
      case 'collectible':
        return {
          hasPhysics: true,
          isStatic: true,
          points: 10,
          respawns: false,
        };
      case 'enemy':
        return {
          hasPhysics: true,
          isStatic: false,
          bounce: 0.1,
          friction: 1,
          speed: 100,
          aiType: 'basic',
        };
      default:
        return {};
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (state.isPlaying) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    if (state.isPlaying) return;
    event.preventDefault();
    
    const gameDiv = gameRef.current;
    if (!gameDiv) return;
    
    try {
      const componentData = JSON.parse(event.dataTransfer.getData('application/json')) as ComponentItem;
      const rect = gameDiv.getBoundingClientRect();
      
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newObject: GameObject = {
        id: `${componentData.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: componentData.type as any,
        position: { x, y },
        scale: { x: 1, y: 1 },
        rotation: 0,
        properties: getDefaultProperties(componentData.type),
        behaviors: [],
      };

      if (state.currentProject && state.currentProject.scenes.length > 0) {
        dispatch({
          type: EDITOR_ACTIONS.ADD_OBJECT,
          payload: {
            ...newObject,
            sceneId: state.currentProject.scenes[0].id,
          },
          timestamp: new Date(),
        });

        dispatch({
          type: EDITOR_ACTIONS.SELECT_OBJECTS,
          payload: [newObject],
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  };

  // Initialize Phaser game
  useEffect(() => {
    if (!gameRef.current || isInitialized) return;

    console.log('Initializing Phaser game...');

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      backgroundColor: '#34495e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: GameScene
    };

    try {
      phaserGameRef.current = new Phaser.Game(config);
      sceneRef.current = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      setIsInitialized(true);
      console.log('Phaser game initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Phaser game:', error);
    }

    return () => {
      if (phaserGameRef.current) {
        console.log('Destroying Phaser game...');
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [isInitialized]);

  // Update game when project changes
  useEffect(() => {
    if (sceneRef.current && isInitialized) {
      console.log('Project changed, updating scene...');
      sceneRef.current.scene.restart({ project, onObjectSelect: handleObjectSelect });
    }
  }, [project, isInitialized]);

  // Handle play/pause
  useEffect(() => {
    if (sceneRef.current && isInitialized) {
      if (state.isPlaying) {
        console.log('Resuming physics...');
        sceneRef.current.physics.resume();
      } else {
        console.log('Pausing physics...');
        sceneRef.current.physics.pause();
      }
    }
  }, [state.isPlaying, isInitialized]);

  const togglePlay = () => {
    dispatch({
      type: EDITOR_ACTIONS.SET_PLAYING,
      payload: !state.isPlaying,
      timestamp: new Date()
    });
  };

  return (
    <div className="phaser-game-canvas">
      <div className="canvas-header">
        <h3>Game Canvas</h3>
        <div className="canvas-controls">
          <button 
            onClick={togglePlay}
            className={`play-button ${state.isPlaying ? 'playing' : ''}`}
          >
            {state.isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
          <span className="status-info">
            {state.isPlaying ? '▶️ Playing' : '⏸️ Editor Mode'}
          </span>
        </div>
      </div>
      
      <div 
        ref={gameRef}
        className="game-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      
      <div className="canvas-info">
        {!state.isPlaying ? (
          <p>📝 Editor Mode: Drag components from the library to add them to your game</p>
        ) : (
          <p>🎮 Playing: Use WASD or Arrow Keys to move, Space/W/Up to jump</p>
        )}
      </div>
    </div>
  );
};

export default PhaserGameCanvas;