import * as Phaser from 'phaser';
import type { GameObject } from '../types';

interface ObjectTemplate {
  id: string;
  name: string;
  type: string;
  defaultProperties: Record<string, any>;
  textureKey: string;
  size: { width: number; height: number };
}

class ObjectFactory {
  private static templates: Map<string, ObjectTemplate> = new Map();

  static initialize() {
    // Define default object templates
    this.registerTemplate({
      id: 'player-basic',
      name: 'Basic Player',
      type: 'player',
      textureKey: 'player',
      size: { width: 32, height: 32 },
      defaultProperties: {
        hasPhysics: true,
        isStatic: false,
        bounce: 0.2,
        friction: 1,
        speed: 200,
        jumpPower: 400,
        health: 100
      }
    });

    this.registerTemplate({
      id: 'platform-ground',
      name: 'Ground Platform',
      type: 'platform',
      textureKey: 'platform',
      size: { width: 64, height: 16 },
      defaultProperties: {
        hasPhysics: true,
        isStatic: true,
        bounce: 0,
        friction: 1
      }
    });

    this.registerTemplate({
      id: 'collectible-coin',
      name: 'Coin',
      type: 'collectible',
      textureKey: 'collectible',
      size: { width: 32, height: 32 },
      defaultProperties: {
        hasPhysics: true,
        isStatic: true,
        points: 10,
        respawns: false,
        collectSound: 'coin'
      }
    });

    this.registerTemplate({
      id: 'enemy-basic',
      name: 'Basic Enemy',
      type: 'enemy',
      textureKey: 'enemy',
      size: { width: 32, height: 32 },
      defaultProperties: {
        hasPhysics: true,
        isStatic: false,
        bounce: 0.1,
        friction: 1,
        speed: 100,
        aiType: 'basic',
        health: 50,
        damage: 10
      }
    });
  }

  static registerTemplate(template: ObjectTemplate) {
    this.templates.set(template.id, template);
  }

  static getTemplate(templateId: string): ObjectTemplate | undefined {
    return this.templates.get(templateId);
  }

  static getAllTemplates(): ObjectTemplate[] {
    return Array.from(this.templates.values());
  }

  static getTemplatesByType(type: string): ObjectTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.type === type);
  }

  static createGameObject(templateId: string, position: { x: number; y: number }, customProperties?: Record<string, any>): GameObject {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const gameObject: GameObject = {
      id: this.generateId(template.type),
      type: template.type as GameObject['type'],
      position,
      scale: { x: 1, y: 1 },
      rotation: 0,
      properties: {
        ...template.defaultProperties,
        ...customProperties
      },
      behaviors: []
    };

    return gameObject;
  }

  static createPhaserSprite(scene: Phaser.Scene, gameObject: GameObject): Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite {
    const textureKey = this.getTextureKeyForType(gameObject.type);
    
    let sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite;

    if (gameObject.properties.hasPhysics) {
      if (gameObject.properties.isStatic) {
        sprite = scene.physics.add.staticSprite(gameObject.position.x, gameObject.position.y, textureKey);
      } else {
        sprite = scene.physics.add.sprite(gameObject.position.x, gameObject.position.y, textureKey);
      }
    } else {
      sprite = scene.add.sprite(gameObject.position.x, gameObject.position.y, textureKey);
    }

    // Apply transformations
    sprite.setScale(gameObject.scale.x, gameObject.scale.y);
    sprite.setRotation(gameObject.rotation * Math.PI / 180);

    // Apply type-specific properties
    this.applyTypeSpecificProperties(sprite, gameObject);

    return sprite;
  }

  private static applyTypeSpecificProperties(sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite, gameObject: GameObject) {
    const props = gameObject.properties;

    switch (gameObject.type) {
      case 'player':
        this.applyPlayerProperties(sprite as Phaser.Physics.Arcade.Sprite, props);
        break;
      case 'platform':
        this.applyPlatformProperties(sprite as Phaser.Physics.Arcade.Sprite, props);
        break;
      case 'collectible':
        this.applyCollectibleProperties(sprite, props);
        break;
      case 'enemy':
        this.applyEnemyProperties(sprite as Phaser.Physics.Arcade.Sprite, props);
        break;
    }
  }

  private static applyPlayerProperties(sprite: Phaser.Physics.Arcade.Sprite, props: Record<string, any>) {
    if (sprite.body) {
      sprite.setBounce(props.bounce || 0.2);
      sprite.setCollideWorldBounds(true);
      
      if (props.friction !== undefined) {
        sprite.body.setFriction(props.friction, props.friction);
      }
    }

    // Add player-specific data
    sprite.setData('speed', props.speed || 200);
    sprite.setData('jumpPower', props.jumpPower || 400);
    sprite.setData('health', props.health || 100);
  }

  private static applyPlatformProperties(sprite: Phaser.Physics.Arcade.Sprite, props: Record<string, any>) {
    if (sprite.body && props.isStatic) {
      sprite.body.setImmovable(true);
      sprite.refreshBody();
    }

    if (props.bounce !== undefined && sprite.body) {
      sprite.setBounce(props.bounce);
    }
  }

  private static applyCollectibleProperties(sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite, props: Record<string, any>) {
    // Add collectible-specific data
    sprite.setData('points', props.points || 10);
    sprite.setData('respawns', props.respawns || false);
    sprite.setData('collectSound', props.collectSound);

    // Add floating animation for collectibles
    if (sprite.scene) {
      sprite.scene.tweens.add({
        targets: sprite,
        y: sprite.y - 10,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private static applyEnemyProperties(sprite: Phaser.Physics.Arcade.Sprite, props: Record<string, any>) {
    if (sprite.body) {
      sprite.setBounce(props.bounce || 0.1);
      sprite.setCollideWorldBounds(true);
      
      // Set initial velocity based on AI type
      const speed = props.speed || 100;
      switch (props.aiType) {
        case 'patrol':
          sprite.setVelocityX(Phaser.Math.Between(-speed, speed));
          break;
        case 'flying':
          sprite.setVelocity(
            Phaser.Math.Between(-speed, speed),
            Phaser.Math.Between(-speed/2, speed/2)
          );
          break;
        default:
          sprite.setVelocityX(Phaser.Math.Between(-speed, speed));
      }
    }

    // Add enemy-specific data
    sprite.setData('aiType', props.aiType || 'basic');
    sprite.setData('speed', props.speed || 100);
    sprite.setData('health', props.health || 50);
    sprite.setData('damage', props.damage || 10);
  }

  static updateGameObjectFromSprite(sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite): Partial<GameObject> {
    return {
      position: { x: sprite.x, y: sprite.y },
      scale: { x: sprite.scaleX, y: sprite.scaleY },
      rotation: sprite.rotation * 180 / Math.PI // Convert radians to degrees
    };
  }

  static cloneGameObject(original: GameObject, newPosition?: { x: number; y: number }): GameObject {
    const cloned: GameObject = {
      id: this.generateId(original.type),
      type: original.type,
      position: newPosition || { ...original.position },
      scale: { ...original.scale },
      rotation: original.rotation,
      properties: { ...original.properties },
      behaviors: [...original.behaviors]
    };

    return cloned;
  }

  static validateGameObject(gameObject: GameObject): string[] {
    const errors: string[] = [];

    if (!gameObject.id) {
      errors.push('Game object must have an ID');
    }

    if (!gameObject.type || !['player', 'platform', 'collectible', 'enemy', 'sprite'].includes(gameObject.type)) {
      errors.push('Invalid game object type');
    }

    if (!gameObject.position || typeof gameObject.position.x !== 'number' || typeof gameObject.position.y !== 'number') {
      errors.push('Game object must have valid position coordinates');
    }

    if (!gameObject.scale || typeof gameObject.scale.x !== 'number' || typeof gameObject.scale.y !== 'number') {
      errors.push('Game object must have valid scale values');
    }

    if (typeof gameObject.rotation !== 'number') {
      errors.push('Game object must have a valid rotation value');
    }

    return errors;
  }

  private static getTextureKeyForType(type: string): string {
    switch (type) {
      case 'player':
        return 'player';
      case 'platform':
        return 'platform';
      case 'collectible':
        return 'collectible';
      case 'enemy':
        return 'enemy';
      default:
        return 'default';
    }
  }

  private static generateId(type: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${timestamp}_${random}`;
  }

  static createDefaultTextures(scene: Phaser.Scene) {
    // Create simple colored rectangles as placeholder sprites
    const graphics = scene.add.graphics();

    // Player texture (blue)
    graphics.fillStyle(0x3498db);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player', 32, 32);
    graphics.clear();

    // Platform texture (brown)
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 0, 64, 16);
    graphics.generateTexture('platform', 64, 16);
    graphics.clear();

    // Collectible texture (gold circle)
    graphics.fillStyle(0xffd700);
    graphics.fillCircle(16, 16, 8);
    graphics.generateTexture('collectible', 32, 32);
    graphics.clear();

    // Enemy texture (red)
    graphics.fillStyle(0xe74c3c);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('enemy', 32, 32);
    graphics.clear();

    // Default texture (gray)
    graphics.fillStyle(0x95a5a6);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('default', 32, 32);

    graphics.destroy();
  }
}

// Initialize templates when the class is loaded
ObjectFactory.initialize();

export default ObjectFactory;