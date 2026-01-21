import type { GameProject, GameObject, GameScene } from '../../types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

class ValidationService {
  static validateGameProject(project: GameProject): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate basic project structure
    this.validateProjectStructure(project, result);
    
    // Validate game configuration
    this.validateGameConfig(project, result);
    
    // Validate scenes
    this.validateScenes(project, result);
    
    // Validate assets
    this.validateAssets(project, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  private static validateProjectStructure(project: GameProject, result: ValidationResult): void {
    if (!project.id) {
      result.errors.push('Project must have an ID');
    }

    if (!project.name || project.name.trim().length === 0) {
      result.errors.push('Project must have a name');
    }

    if (!project.gameConfig) {
      result.errors.push('Project must have game configuration');
    }

    if (!project.scenes || !Array.isArray(project.scenes)) {
      result.errors.push('Project must have scenes array');
    }

    if (!project.assets || !Array.isArray(project.assets)) {
      result.warnings.push('Project should have assets array');
    }
  }

  private static validateGameConfig(project: GameProject, result: ValidationResult): void {
    if (!project.gameConfig) return;

    const config = project.gameConfig;

    // Validate dimensions
    if (!config.width || config.width <= 0) {
      result.errors.push('Game width must be a positive number');
    } else if (config.width < 400) {
      result.warnings.push('Game width is very small (< 400px)');
    } else if (config.width > 1920) {
      result.warnings.push('Game width is very large (> 1920px)');
    }

    if (!config.height || config.height <= 0) {
      result.errors.push('Game height must be a positive number');
    } else if (config.height < 300) {
      result.warnings.push('Game height is very small (< 300px)');
    } else if (config.height > 1080) {
      result.warnings.push('Game height is very large (> 1080px)');
    }

    // Validate background color
    if (config.backgroundColor && !this.isValidColor(config.backgroundColor)) {
      result.errors.push('Invalid background color format');
    }

    // Validate physics configuration
    if (config.physics) {
      if (config.physics.default !== 'arcade') {
        result.warnings.push('Only arcade physics is currently supported');
      }

      if (config.physics.arcade) {
        const gravity = config.physics.arcade.gravity;
        if (gravity && typeof gravity.y === 'number') {
          if (gravity.y < 0) {
            result.warnings.push('Negative gravity will make objects float upward');
          } else if (gravity.y > 1000) {
            result.warnings.push('Very high gravity may make gameplay difficult');
          }
        }
      }
    }
  }

  private static validateScenes(project: GameProject, result: ValidationResult): void {
    if (!project.scenes || project.scenes.length === 0) {
      result.errors.push('Project must have at least one scene');
      return;
    }

    project.scenes.forEach((scene, sceneIndex) => {
      this.validateScene(scene, sceneIndex, result);
    });
  }

  private static validateScene(scene: GameScene, sceneIndex: number, result: ValidationResult): void {
    const scenePrefix = `Scene ${sceneIndex + 1}`;

    if (!scene.id) {
      result.errors.push(`${scenePrefix}: Scene must have an ID`);
    }

    if (!scene.name || scene.name.trim().length === 0) {
      result.warnings.push(`${scenePrefix}: Scene should have a name`);
    }

    if (!scene.objects || !Array.isArray(scene.objects)) {
      result.errors.push(`${scenePrefix}: Scene must have objects array`);
      return;
    }

    if (scene.objects.length === 0) {
      result.warnings.push(`${scenePrefix}: Scene has no objects`);
      return;
    }

    // Check for player object
    const playerObjects = scene.objects.filter(obj => obj.type === 'player');
    if (playerObjects.length === 0) {
      result.warnings.push(`${scenePrefix}: Scene has no player object`);
    } else if (playerObjects.length > 1) {
      result.warnings.push(`${scenePrefix}: Scene has multiple player objects`);
    }

    // Check for platforms
    const platformObjects = scene.objects.filter(obj => obj.type === 'platform');
    if (platformObjects.length === 0) {
      result.suggestions.push(`${scenePrefix}: Consider adding platforms for the player to stand on`);
    }

    // Check for game objectives
    const collectibleObjects = scene.objects.filter(obj => obj.type === 'collectible');
    const enemyObjects = scene.objects.filter(obj => obj.type === 'enemy');
    
    if (collectibleObjects.length === 0 && enemyObjects.length === 0) {
      result.suggestions.push(`${scenePrefix}: Consider adding collectibles or enemies to make the game more engaging`);
    }

    // Validate individual objects
    scene.objects.forEach((obj, objIndex) => {
      this.validateGameObject(obj, sceneIndex, objIndex, result);
    });

    // Check object positioning
    this.validateObjectPositioning(scene, sceneIndex, result);
  }

  private static validateGameObject(obj: GameObject, sceneIndex: number, objIndex: number, result: ValidationResult): void {
    const objPrefix = `Scene ${sceneIndex + 1}, Object ${objIndex + 1}`;

    if (!obj.id) {
      result.errors.push(`${objPrefix}: Object must have an ID`);
    }

    if (!obj.type || !['player', 'platform', 'collectible', 'enemy', 'sprite'].includes(obj.type)) {
      result.errors.push(`${objPrefix}: Invalid object type "${obj.type}"`);
    }

    // Validate position
    if (!obj.position || typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') {
      result.errors.push(`${objPrefix}: Object must have valid position coordinates`);
    }

    // Validate scale
    if (!obj.scale || typeof obj.scale.x !== 'number' || typeof obj.scale.y !== 'number') {
      result.errors.push(`${objPrefix}: Object must have valid scale values`);
    } else {
      if (obj.scale.x <= 0 || obj.scale.y <= 0) {
        result.errors.push(`${objPrefix}: Scale values must be positive`);
      }
      if (obj.scale.x > 10 || obj.scale.y > 10) {
        result.warnings.push(`${objPrefix}: Very large scale values may cause display issues`);
      }
    }

    // Validate rotation
    if (typeof obj.rotation !== 'number') {
      result.errors.push(`${objPrefix}: Object must have a valid rotation value`);
    }

    // Validate properties based on object type
    this.validateObjectProperties(obj, objPrefix, result);
  }

  private static validateObjectProperties(obj: GameObject, objPrefix: string, result: ValidationResult): void {
    if (!obj.properties) {
      result.warnings.push(`${objPrefix}: Object has no properties`);
      return;
    }

    switch (obj.type) {
      case 'player':
        this.validatePlayerProperties(obj, objPrefix, result);
        break;
      case 'enemy':
        this.validateEnemyProperties(obj, objPrefix, result);
        break;
      case 'platform':
        this.validatePlatformProperties(obj, objPrefix, result);
        break;
      case 'collectible':
        this.validateCollectibleProperties(obj, objPrefix, result);
        break;
    }
  }

  private static validatePlayerProperties(obj: GameObject, objPrefix: string, result: ValidationResult): void {
    const props = obj.properties;

    if (props.speed && (typeof props.speed !== 'number' || props.speed < 0)) {
      result.errors.push(`${objPrefix}: Player speed must be a positive number`);
    }

    if (props.jumpPower && (typeof props.jumpPower !== 'number' || props.jumpPower < 0)) {
      result.errors.push(`${objPrefix}: Player jump power must be a positive number`);
    }

    if (props.hasPhysics === false) {
      result.warnings.push(`${objPrefix}: Player without physics may not work correctly`);
    }
  }

  private static validateEnemyProperties(obj: GameObject, objPrefix: string, result: ValidationResult): void {
    const props = obj.properties;

    if (props.speed && (typeof props.speed !== 'number' || props.speed < 0)) {
      result.errors.push(`${objPrefix}: Enemy speed must be a positive number`);
    }

    if (props.aiType && !['basic', 'patrol', 'chase', 'flying'].includes(props.aiType)) {
      result.warnings.push(`${objPrefix}: Unknown AI type "${props.aiType}"`);
    }
  }

  private static validatePlatformProperties(obj: GameObject, objPrefix: string, result: ValidationResult): void {
    const props = obj.properties;

    if (props.isStatic === false) {
      result.warnings.push(`${objPrefix}: Non-static platforms may behave unexpectedly`);
    }
  }

  private static validateCollectibleProperties(obj: GameObject, objPrefix: string, result: ValidationResult): void {
    const props = obj.properties;

    if (props.points && (typeof props.points !== 'number' || props.points < 0)) {
      result.errors.push(`${objPrefix}: Collectible points must be a positive number`);
    }
  }

  private static validateObjectPositioning(scene: GameScene, sceneIndex: number, result: ValidationResult): void {
    const scenePrefix = `Scene ${sceneIndex + 1}`;
    
    // Check for objects outside reasonable bounds
    scene.objects.forEach((obj, index) => {
      if (obj.position.x < -100 || obj.position.x > 2000) {
        result.warnings.push(`${scenePrefix}, Object ${index + 1}: Object may be positioned outside visible area (x: ${obj.position.x})`);
      }
      
      if (obj.position.y < -100 || obj.position.y > 1200) {
        result.warnings.push(`${scenePrefix}, Object ${index + 1}: Object may be positioned outside visible area (y: ${obj.position.y})`);
      }
    });

    // Check for overlapping objects of the same type
    const objectsByType = new Map<string, GameObject[]>();
    scene.objects.forEach(obj => {
      if (!objectsByType.has(obj.type)) {
        objectsByType.set(obj.type, []);
      }
      objectsByType.get(obj.type)!.push(obj);
    });

    objectsByType.forEach((objects, type) => {
      if (type === 'platform' || type === 'collectible') {
        for (let i = 0; i < objects.length; i++) {
          for (let j = i + 1; j < objects.length; j++) {
            const obj1 = objects[i];
            const obj2 = objects[j];
            const distance = Math.sqrt(
              Math.pow(obj1.position.x - obj2.position.x, 2) + 
              Math.pow(obj1.position.y - obj2.position.y, 2)
            );
            
            if (distance < 32) { // Assuming 32px minimum separation
              result.warnings.push(`${scenePrefix}: Two ${type} objects are very close together`);
            }
          }
        }
      }
    });
  }

  private static validateAssets(project: GameProject, result: ValidationResult): void {
    if (!project.assets) return;

    project.assets.forEach((asset, index) => {
      if (!asset.id) {
        result.errors.push(`Asset ${index + 1}: Asset must have an ID`);
      }

      if (!asset.name || asset.name.trim().length === 0) {
        result.warnings.push(`Asset ${index + 1}: Asset should have a name`);
      }

      if (!asset.type || !['image', 'audio', 'json'].includes(asset.type)) {
        result.errors.push(`Asset ${index + 1}: Invalid asset type "${asset.type}"`);
      }

      if (!asset.url) {
        result.errors.push(`Asset ${index + 1}: Asset must have a URL`);
      }
    });
  }

  private static isValidColor(color: string): boolean {
    // Check hex color format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check CSS color names (basic check)
    const cssColors = ['red', 'green', 'blue', 'white', 'black', 'yellow', 'cyan', 'magenta'];
    if (cssColors.includes(color.toLowerCase())) {
      return true;
    }
    
    // Check rgb/rgba format
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
      return true;
    }
    
    return false;
  }

  static sanitizeGameProject(project: GameProject): GameProject {
    // Create a deep copy
    const sanitized = JSON.parse(JSON.stringify(project));

    // Sanitize basic properties
    sanitized.name = sanitized.name?.toString().trim() || 'Untitled Game';
    sanitized.description = sanitized.description?.toString().trim() || '';

    // Sanitize game config
    if (sanitized.gameConfig) {
      sanitized.gameConfig.width = Math.max(400, Math.min(1920, sanitized.gameConfig.width || 800));
      sanitized.gameConfig.height = Math.max(300, Math.min(1080, sanitized.gameConfig.height || 600));
      
      if (!this.isValidColor(sanitized.gameConfig.backgroundColor)) {
        sanitized.gameConfig.backgroundColor = '#2c3e50';
      }
    }

    // Sanitize scenes
    if (sanitized.scenes) {
      sanitized.scenes = sanitized.scenes.filter((scene: any) => scene && typeof scene === 'object');
      
      sanitized.scenes.forEach((scene: GameScene) => {
        scene.name = scene.name?.toString().trim() || 'Untitled Scene';
        
        if (scene.objects) {
          scene.objects = scene.objects.filter(obj => obj && typeof obj === 'object');
          
          scene.objects.forEach(obj => {
            // Ensure valid position
            obj.position = obj.position || { x: 0, y: 0 };
            obj.position.x = typeof obj.position.x === 'number' ? obj.position.x : 0;
            obj.position.y = typeof obj.position.y === 'number' ? obj.position.y : 0;
            
            // Ensure valid scale
            obj.scale = obj.scale || { x: 1, y: 1 };
            obj.scale.x = Math.max(0.1, Math.min(10, obj.scale.x || 1));
            obj.scale.y = Math.max(0.1, Math.min(10, obj.scale.y || 1));
            
            // Ensure valid rotation
            obj.rotation = typeof obj.rotation === 'number' ? obj.rotation : 0;
            
            // Ensure properties object exists
            obj.properties = obj.properties || {};
            
            // Ensure behaviors array exists
            obj.behaviors = obj.behaviors || [];
          });
        }
      });
    }

    return sanitized;
  }
}

export default ValidationService;