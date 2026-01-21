import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { GameProject, GameObject } from '../../types';

interface PhaserRuntimeProps {
  project: GameProject;
  onStop: () => void;
  initialCameraPosition?: { x: number; y: number };
  zoom?: number;
}

const PhaserRuntime: React.FC<PhaserRuntimeProps> = ({ 
  project, 
  onStop,
  initialCameraPosition = { x: 0, y: 0 },
  zoom = 1
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !project.scenes[0]) return;

    const scene = project.scenes[0];
    const objects = scene.objects;

    class GameScene extends Phaser.Scene {
      private objectSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
      private gravityZones: Array<{ sprite: Phaser.GameObjects.Sprite; data: GameObject; text?: Phaser.GameObjects.Text }> = [];
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
      private wasdKeys?: any;
      private controlledObjects: Map<string, any> = new Map();
      private virtualController: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        jump: boolean;
      } = { up: false, down: false, left: false, right: false, jump: false };

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

        // Boundary - semi-transparent red rectangle (visible in editor, can be made invisible in play)
        graphics.fillStyle(0xff0000, 0.3);
        graphics.lineStyle(2, 0xff0000, 1);
        graphics.fillRect(0, 0, 60, 40);
        graphics.strokeRect(0, 0, 60, 40);
        graphics.generateTexture('boundary', 60, 40);
        graphics.clear();

        // Gravity - simple purple circle
        graphics.fillStyle(0x9b59b6, 0.3);
        graphics.lineStyle(3, 0x9b59b6, 1);
        graphics.fillCircle(30, 30, 30);
        graphics.strokeCircle(30, 30, 30);
        graphics.generateTexture('gravity', 60, 60);
        graphics.clear();
      }

      create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 2000, 1500);
        
        // Set camera bounds
        this.cameras.main.setBounds(0, 0, 2000, 1500);
        this.cameras.main.setBackgroundColor('#34495e');
        
        // Set initial camera position from editor view
        this.cameras.main.scrollX = initialCameraPosition.x;
        this.cameras.main.scrollY = initialCameraPosition.y;
        
        // Set camera zoom to match editor zoom
        this.cameras.main.setZoom(zoom);

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
        
        // Controller objects are UI elements with interactive buttons
        if (obj.type === 'controller') {
          this.createDPadController(obj);
          return;
        }

        // Create sprite
        const sprite = this.physics.add.sprite(obj.position.x, obj.position.y, texture);
        sprite.setScale(obj.scale.x, obj.scale.y);
        sprite.setData('objectId', obj.id);
        sprite.setData('objectData', obj);
        
        // Boundaries are invisible walls in play mode
        if (obj.type === 'boundary') {
          sprite.setAlpha(0.3); // Semi-transparent so you can see them
        }
        
        // Gravity zones are semi-transparent and don't collide
        if (obj.type === 'gravity') {
          sprite.setAlpha(0.4);
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setImmovable(true);
          
          // Get gravity strength value
          const gravityStrength = obj.properties?.gravityStrength || 500;
          const isRepulsion = gravityStrength < 0;
          
          // Create text to show gravity strength
          const text = this.add.text(sprite.x, sprite.y, Math.abs(gravityStrength).toString(), {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: isRepulsion ? '#e74c3c' : '#9b59b6',
            strokeThickness: 4
          });
          text.setOrigin(0.5);
          text.setDepth(1000);
          
          // Store gravity zone with text for later processing
          this.gravityZones.push({ sprite, data: obj, text });
        }
        
        this.objectSprites.set(obj.id, sprite);

        // Boundaries are always static and immovable
        if (obj.type === 'boundary') {
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          body.setImmovable(true);
          body.setAllowGravity(false);
          body.setCollideWorldBounds(false);
        } else {
          // Apply Physics behavior for non-boundary objects
          const physicsBehavior = obj.behaviors.find(b => b.type === 'physics');
          if (physicsBehavior && physicsBehavior.parameters.enabled) {
            const body = sprite.body as Phaser.Physics.Arcade.Body;
            
            body.setCollideWorldBounds(true);
            body.setMass(physicsBehavior.parameters.mass);
            
            // Check if controls have vertical movement enabled
            const controlsBehavior = obj.behaviors.find(b => b.type === 'controls');
            const hasVerticalMovement = controlsBehavior?.parameters?.allowVerticalMovement !== false;
            
            // If vertical movement is enabled, use gravity scale, otherwise default to 0
            const gravityScale = hasVerticalMovement ? 0 : (physicsBehavior.parameters.gravityScale || 0);
            body.setGravityY(gravityScale * 300);
            
            body.setBounce(physicsBehavior.parameters.bounce);
            body.setFriction(physicsBehavior.parameters.friction, physicsBehavior.parameters.friction);
          }
        }

        // Apply Oblique behavior (collision rules and static body)
        const obliqueBehavior = obj.behaviors.find(b => b.type === 'oblique');
        if (obliqueBehavior && obliqueBehavior.parameters.enabled) {
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          
          // Apply static body setting
          if (obliqueBehavior.parameters.isStatic) {
            body.setImmovable(true);
            body.setAllowGravity(false);
          }
          
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

        // Apply Fixed Position behavior (pin to screen)
        const fixedBehavior = obj.behaviors.find(b => b.type === 'fixed');
        if (fixedBehavior && fixedBehavior.parameters.enabled) {
          sprite.setScrollFactor(0); // Don't move with camera
          sprite.setPosition(fixedBehavior.parameters.screenX, fixedBehavior.parameters.screenY);
          sprite.setDepth(1000); // Render on top
          
          // Store fixed position data
          sprite.setData('isFixed', true);
          sprite.setData('fixedX', fixedBehavior.parameters.screenX);
          sprite.setData('fixedY', fixedBehavior.parameters.screenY);
        }

        // Setup collisions between objects
        this.setupCollisions();
      }

      createDPadController(obj: GameObject) {
        const x = obj.position.x;
        const y = obj.position.y;
        const size = 60;
        const buttonSize = 50;
        const opacity = 0.7;

        // Create container for all buttons
        const container = this.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(1000);

        // Helper to create a button
        const createButton = (offsetX: number, offsetY: number, text: string, direction: string) => {
          // Button background
          const bg = this.add.rectangle(offsetX, offsetY, buttonSize, buttonSize, 0x34495e, opacity);
          bg.setStrokeStyle(2, 0x3498db);
          
          // Arrow text
          const arrow = this.add.text(offsetX, offsetY, text, {
            fontSize: '24px',
            color: '#ecf0f1',
            fontStyle: 'bold'
          });
          arrow.setOrigin(0.5);

          // Make interactive
          bg.setInteractive({ useHandCursor: true });
          
          // Touch/click events
          bg.on('pointerdown', () => {
            bg.setFillStyle(0x3498db, 1);
            this.virtualController[direction] = true;
          });
          
          bg.on('pointerup', () => {
            bg.setFillStyle(0x34495e, opacity);
            this.virtualController[direction] = false;
          });
          
          bg.on('pointerout', () => {
            bg.setFillStyle(0x34495e, opacity);
            this.virtualController[direction] = false;
          });

          container.add([bg, arrow]);
        };

        // Create D-pad buttons
        createButton(0, -size, '▲', 'up');           // Up
        createButton(0, size, '▼', 'down');          // Down
        createButton(-size, 0, '◀', 'left');         // Left
        createButton(size, 0, '▶', 'right');         // Right
        
        // Center circle (optional, for aesthetics)
        const center = this.add.circle(0, 0, 15, 0x2c3e50, 0.5);
        container.add(center);

        // Jump button (separate, to the right)
        const jumpX = size * 2.5;
        const jumpBg = this.add.circle(jumpX, 0, buttonSize / 2, 0x34495e, opacity);
        jumpBg.setStrokeStyle(2, 0xe74c3c);
        jumpBg.setInteractive({ useHandCursor: true });
        
        const jumpText = this.add.text(jumpX, 0, 'A', {
          fontSize: '20px',
          color: '#ecf0f1',
          fontStyle: 'bold'
        });
        jumpText.setOrigin(0.5);

        jumpBg.on('pointerdown', () => {
          jumpBg.setFillStyle(0xe74c3c, 1);
          this.virtualController.jump = true;
        });
        
        jumpBg.on('pointerup', () => {
          jumpBg.setFillStyle(0x34495e, opacity);
          this.virtualController.jump = false;
        });
        
        jumpBg.on('pointerout', () => {
          jumpBg.setFillStyle(0x34495e, opacity);
          this.virtualController.jump = false;
        });

        container.add([jumpBg, jumpText]);
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
        // Update gravity zone text positions
        this.gravityZones.forEach(({ sprite, text }) => {
          if (text) {
            text.setPosition(sprite.x, sprite.y);
          }
        });

        // Apply magnetic gravity pull to objects with physics
        this.gravityZones.forEach(({ sprite: gravitySprite, data: gravityData }) => {
          const gravityCenterX = gravitySprite.x;
          const gravityCenterY = gravitySprite.y;
          
          // Get gravity strength from object properties (Transform section)
          const gravityStrength = gravityData.properties?.gravityStrength !== undefined
            ? gravityData.properties.gravityStrength
            : 500; // Default strength
          
          // Get gravity settings from behavior (if exists) - behavior takes precedence
          const gravityBehavior = gravityData.behaviors?.find(b => b.type === 'gravity');
          const finalGravityStrength = gravityBehavior?.parameters?.enabled 
            ? (gravityBehavior.parameters.strength || gravityStrength)
            : gravityStrength;
          
          const maxPullDistance = gravityBehavior?.parameters?.enabled
            ? (gravityBehavior.parameters.maxDistance || 800)
            : 800; // Default max distance
          
          // Apply magnetic pull to objects with physics enabled
          this.objectSprites.forEach((sprite) => {
            // Skip gravity zones, boundaries, controllers, and fixed/stuck objects
            const objData = sprite.getData('objectData') as GameObject;
            if (!objData || objData.type === 'gravity' || objData.type === 'boundary' || 
                objData.type === 'controller' || sprite.getData('isFixed')) {
              return;
            }
            
            // Check if object has Fixed Position behavior (stuck objects)
            const hasFixedBehavior = objData.behaviors?.some(b => b.type === 'fixed' && b.parameters.enabled);
            if (hasFixedBehavior) {
              return;
            }
            
            // Check if object has Static Body enabled in Oblique behavior
            const obliqueBehavior = objData.behaviors?.find(b => b.type === 'oblique');
            if (obliqueBehavior && obliqueBehavior.parameters.enabled && obliqueBehavior.parameters.isStatic) {
              return; // Skip static objects - they cannot be moved by gravity
            }
            
            // ONLY affect objects with Physics behavior enabled
            const physicsBehavior = objData.behaviors?.find(b => b.type === 'physics');
            if (!physicsBehavior || !physicsBehavior.parameters.enabled) {
              return; // Skip objects without physics
            }
            
            const body = sprite.body as Phaser.Physics.Arcade.Body;
            if (!body || !body.enable) return;
            
            // Calculate distance from object to gravity center
            const dx = gravityCenterX - sprite.x;
            const dy = gravityCenterY - sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only apply gravity if within max distance
            if (distance > 0 && distance < maxPullDistance) {
              // Calculate pull strength (stronger when closer, using inverse square law)
              const pullStrength = finalGravityStrength / (distance * distance) * 10000;
              
              // Normalize direction and apply force
              const forceX = (dx / distance) * pullStrength;
              const forceY = (dy / distance) * pullStrength;
              
              // Apply the magnetic pull (or repulsion if negative)
              body.setAccelerationX(forceX);
              body.setAccelerationY(forceY);
            } else if (distance >= maxPullDistance) {
              // Reset acceleration if too far from any gravity zone
              let inRangeOfAnyZone = false;
              this.gravityZones.forEach(({ sprite: otherGravitySprite }) => {
                const otherDx = otherGravitySprite.x - sprite.x;
                const otherDy = otherGravitySprite.y - sprite.y;
                const otherDistance = Math.sqrt(otherDx * otherDx + otherDy * otherDy);
                if (otherDistance < maxPullDistance) {
                  inRangeOfAnyZone = true;
                }
              });
              
              if (!inRangeOfAnyZone) {
                body.setAccelerationX(0);
                body.setAccelerationY(0);
              }
            }
          });
        });

        // Update fixed position objects to maintain their screen position
        this.objectSprites.forEach((sprite) => {
          if (sprite.getData('isFixed')) {
            const fixedX = sprite.getData('fixedX');
            const fixedY = sprite.getData('fixedY');
            sprite.setPosition(fixedX, fixedY);
          }
        });

        // Handle controls for each controlled object
        this.controlledObjects.forEach((control, objectId) => {
          const { sprite, params } = control;
          const body = sprite.body as Phaser.Physics.Arcade.Body;
          
          if (!body) return;

          // Check keyboard OR virtual controller
          const leftPressed = this.cursors?.left.isDown || this.wasdKeys?.left.isDown || this.virtualController.left;
          const rightPressed = this.cursors?.right.isDown || this.wasdKeys?.right.isDown || this.virtualController.right;
          const upPressed = this.cursors?.up.isDown || this.wasdKeys?.up.isDown || this.virtualController.up;
          const downPressed = this.cursors?.down.isDown || this.wasdKeys?.down.isDown || this.virtualController.down;
          const jumpPressed = this.wasdKeys?.space.isDown || this.virtualController.jump;

          // Horizontal movement
          if (leftPressed) {
            body.setVelocityX(-params.moveSpeed);
          } else if (rightPressed) {
            body.setVelocityX(params.moveSpeed);
          } else {
            body.setVelocityX(0);
          }

          // Vertical movement (for top-down games)
          // Default to true if not specified (for backward compatibility)
          const allowVertical = params.allowVerticalMovement !== false;
          
          if (allowVertical) {
            if (upPressed) {
              body.setVelocityY(-params.moveSpeed);
            } else if (downPressed) {
              body.setVelocityY(params.moveSpeed);
            } else {
              body.setVelocityY(0);
            }
          } else {
            // Platformer mode: Jumping
            const isOnGround = body.touching.down || body.blocked.down;
            
            if ((upPressed || jumpPressed) && isOnGround) {
              body.setVelocityY(-params.jumpPower);
            }

            // Double jump (keyboard only for now, to prevent accidental double jumps on touch)
            if (params.canDoubleJump && !isOnGround) {
              const jumpKey = this.cursors?.up || this.wasdKeys?.up || this.wasdKeys?.space;
              if (jumpKey && Phaser.Input.Keyboard.JustDown(jumpKey)) {
                body.setVelocityY(-params.jumpPower * 0.8);
              }
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
