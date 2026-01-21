import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { GameProject, GameObject } from '../../types';

interface PhaserRuntimeProps {
  project: GameProject;
  onStop: () => void;
}

const PhaserRuntime: React.FC<PhaserRuntimeProps> = ({ project, onStop }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !project.scenes[0]) return;

    const scene = project.scenes[0];
    const objects = scene.objects;

    class GameScene extends Phaser.Scene {
      private objectSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
      private wasdKeys?: any;
      private controlledObjects: Map<string, any> = new Map();

      constructor() {
        super({ key: 'GameScene' });
      }

      preload() {
        // Create placeholder graphics for each object type
        this.createPlaceholderGraphics();
      }

      createPlaceholderGraphics() {
        const graphics = this.add.graphics();
        
        // Player - blue rectangle
        graphics.fillStyle(0x3498db, 1);
        graphics.fillRect(0, 0, 60, 40);
        graphics.generateTexture('player', 60, 40);
        graphics.clear();

        // Platform - brown rectangle
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillRect(0, 0, 60, 40);
        graphics.generateTexture('platform', 60, 40);
        graphics.clear();

        // Collectible - yellow circle
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('collectible', 40, 40);
        graphics.clear();

        // Enemy - red rectangle
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillRect(0, 0, 60, 40);
        graphics.generateTexture('enemy', 60, 40);
        graphics.clear();

        // Controller - purple circle
        graphics.fillStyle(0x9b59b6, 1);
        graphics.fillCircle(30, 30, 30);
        graphics.generateTexture('controller', 60, 60);
        graphics.clear();
      }

      create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 2000, 1500);
        
        // Set camera bounds
        this.cameras.main.setBounds(0, 0, 2000, 1500);
        this.cameras.main.setBackgroundColor('#34495e');

        // Setup input
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.wasdKeys = this.input.keyboard?.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
          space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Create objects from scene data
        objects.forEach(obj => {
          this.createGameObject(obj);
        });

        // Setup camera follow for objects with camera behavior
        this.setupCameraFollow();
      }

      createGameObject(obj: GameObject) {
        const texture = obj.type === 'controller' ? 'controller' : obj.type;
        
        // Controller objects are UI elements, not game objects
        if (obj.type === 'controller') {
          const sprite = this.add.sprite(obj.position.x, obj.position.y, texture);
          sprite.setScale(obj.scale.x, obj.scale.y);
          sprite.setScrollFactor(0); // Fixed to camera
          sprite.setDepth(1000); // Always on top
          this.objectSprites.set(obj.id, sprite);
          return;
        }

        // Create sprite
        const sprite = this.physics.add.sprite(obj.position.x, obj.position.y, texture);
        sprite.setScale(obj.scale.x, obj.scale.y);
        sprite.setData('objectId', obj.id);
        sprite.setData('objectData', obj);
        
        this.objectSprites.set(obj.id, sprite);

        // Apply Physics behavior
        const physicsBehavior = obj.behaviors.find(b => b.type === 'physics');
        if (physicsBehavior && physicsBehavior.parameters.enabled) {
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          
          body.setCollideWorldBounds(true);
          
          if (physicsBehavior.parameters.isStatic) {
            body.setImmovable(true);
            body.setAllowGravity(false);
          } else {
            body.setMass(physicsBehavior.parameters.mass);
            body.setGravityY(physicsBehavior.parameters.gravityScale * 300);
          }
          
          body.setBounce(physicsBehavior.parameters.bounce);
          body.setFriction(physicsBehavior.parameters.friction, physicsBehavior.parameters.friction);
        }

        // Apply Oblique behavior (collision rules)
        const obliqueBehavior = obj.behaviors.find(b => b.type === 'oblique');
        if (obliqueBehavior && obliqueBehavior.parameters.enabled) {
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          
          // Apply padding by adjusting body size
          if (obliqueBehavior.parameters.padding > 0) {
            const padding = obliqueBehavior.parameters.padding;
            body.setSize(
              sprite.width - padding * 2,
              sprite.height - padding * 2
            );
            body.setOffset(padding, padding);
          }
          
          // Store oblique data for collision filtering
          sprite.setData('hasOblique', true);
          sprite.setData('obliqueGroup', obliqueBehavior.parameters.collisionGroup);
          sprite.setData('onlyCollideWithOblique', obliqueBehavior.parameters.onlyCollideWithOblique);
        }

        // Setup Controls behavior
        const controlsBehavior = obj.behaviors.find(b => b.type === 'controls');
        if (controlsBehavior && controlsBehavior.parameters.enabled) {
          this.controlledObjects.set(obj.id, {
            sprite,
            params: controlsBehavior.parameters
          });
        }

        // Setup collisions between objects
        this.setupCollisions();
      }

      setupCollisions() {
        const sprites = Array.from(this.objectSprites.values()).filter(s => s.body);
        
        sprites.forEach((sprite1, i) => {
          sprites.slice(i + 1).forEach(sprite2 => {
            // Check if either sprite has oblique behavior
            const sprite1HasOblique = sprite1.getData('hasOblique');
            const sprite2HasOblique = sprite2.getData('hasOblique');
            
            // Determine if collision should happen
            let shouldCollide = true;
            
            if (sprite1HasOblique || sprite2HasOblique) {
              // If either has oblique and onlyCollideWithOblique is true
              const sprite1OnlyOblique = sprite1.getData('onlyCollideWithOblique');
              const sprite2OnlyOblique = sprite2.getData('onlyCollideWithOblique');
              
              if (sprite1OnlyOblique && !sprite2HasOblique) {
                shouldCollide = false; // sprite1 only collides with oblique, sprite2 doesn't have it
              }
              if (sprite2OnlyOblique && !sprite1HasOblique) {
                shouldCollide = false; // sprite2 only collides with oblique, sprite1 doesn't have it
              }
              
              // Both have oblique - check collision groups
              if (sprite1HasOblique && sprite2HasOblique && shouldCollide) {
                const group1 = sprite1.getData('obliqueGroup');
                const group2 = sprite2.getData('obliqueGroup');
                // Same group = collide, different group = pass through
                if (group1 !== group2) {
                  shouldCollide = false;
                }
              }
            }
            
            if (shouldCollide) {
              this.physics.add.collider(sprite1, sprite2);
            }
          });
        });
      }

      setupCameraFollow() {
        objects.forEach(obj => {
          const cameraBehavior = obj.behaviors.find(b => b.type === 'camera');
          if (cameraBehavior && cameraBehavior.parameters.enabled) {
            const sprite = this.objectSprites.get(obj.id);
            if (sprite) {
              const smoothing = cameraBehavior.parameters.smoothing;
              this.cameras.main.startFollow(sprite, true, smoothing, smoothing);
              
              const deadzone = cameraBehavior.parameters.deadzone;
              if (deadzone) {
                this.cameras.main.setDeadzone(deadzone.width, deadzone.height);
              }
              
              this.cameras.main.setFollowOffset(
                cameraBehavior.parameters.offsetX,
                cameraBehavior.parameters.offsetY
              );
            }
          }
        });
      }

      update() {
        // Handle controls for each controlled object
        this.controlledObjects.forEach((control, objectId) => {
          const { sprite, params } = control;
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          
          if (!body) return;

          // Horizontal movement
          if (this.cursors?.left.isDown || this.wasdKeys?.left.isDown) {
            body.setVelocityX(-params.moveSpeed);
          } else if (this.cursors?.right.isDown || this.wasdKeys?.right.isDown) {
            body.setVelocityX(params.moveSpeed);
          } else {
            body.setVelocityX(0);
          }

          // Jumping
          const isOnGround = body.touching.down || body.blocked.down;
          
          if ((this.cursors?.up.isDown || this.wasdKeys?.up.isDown || this.wasdKeys?.space.isDown) && isOnGround) {
            body.setVelocityY(-params.jumpPower);
          }

          // Double jump
          if (params.canDoubleJump && !isOnGround) {
            const jumpKey = this.cursors?.up || this.wasdKeys?.up || this.wasdKeys?.space;
            if (Phaser.Input.Keyboard.JustDown(jumpKey)) {
              body.setVelocityY(-params.jumpPower * 0.8);
            }
          }
        });
      }
    }

    // Create Phaser game config
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      parent: containerRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scene: GameScene,
      backgroundColor: '#34495e'
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [project]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Stop button overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000
      }}>
        <button
          onClick={onStop}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⏹</span>
          Stop Game
        </button>
      </div>

      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        🎮 Use Arrow Keys or WASD to move • Space to jump
      </div>
    </div>
  );
};

export default PhaserRuntime;
