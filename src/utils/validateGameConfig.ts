import type { GameProject, PhaserGameConfig, GameScene, GameObject } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a complete game project
 */
const validateGameConfig = (project: GameProject): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate basic project structure
  validateProjectStructure(project, result);
  
  // Validate game configuration
  validatePhaserConfig(project.gameConfig, result);
  
  // Validate scenes
  validateScenes(project.scenes, result);
  
  // Validate assets
  validateAssets(project.assets, result);

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Validate project structure
 */
const validateProjectStructure = (project: GameProject, result: ValidationResult): void => {
  if (!project.id || typeof project.id !== 'string') {
    result.errors.push('Project must have a valid ID');
  }

  if (!project.name || typeof project.name !== 'string' || project.name.trim().length === 0) {
    result.errors.push('Project must have a valid name');
  }

  if (!project.gameConfig) {
    result.errors.push('Project must have game configuration');
  }

  if (!Array.isArray(project.scenes)) {
    result.errors.push('Project must have scenes array');
  }

  if (!Array.isArray(project.assets)) {
    result.warnings.push('Project should have assets array');
  }

  if (!project.createdAt || !(project.createdAt instanceof Date)) {
    result.warnings.push('Project should have valid creation date');
  }

  if (!project.updatedAt || !(project.updatedAt instanceof Date)) {
    result.warnings.push('Project should have valid update date');
  }
};

/**
 * Validate Phaser game configuration
 */
const validatePhaserConfig = (config: PhaserGameConfig, result: ValidationResult): void => {
  if (!config) {
    result.errors.push('Game configuration is required');
    return;
  }

  // Validate dimensions
  if (!config.width || typeof config.width !== 'number' || config.width <= 0) {
    result.errors.push('Game width must be a positive number');
  } else {
    if (config.width < 320) {
      result.warnings.push('Game width is very small (< 320px)');
    }
    if (config.width > 1920) {
      result.warnings.push('Game width is very large (> 1920px)');
    }
  }

  if (!config.height || typeof config.height !== 'number' || config.height <= 0) {
    result.errors.push('Game height must be a positive number');
  } else {
    if (config.height < 240) {
      result.warnings.push('Game height is very small (< 240px)');
    }
    if (config.height > 1080) {
      result.warnings.push('Game height is very large (> 1080px)');
    }
  }

  // Validate background color
  if (config.backgroundColor && !isValidColor(config.backgroundColor)) {
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
        }
        if (gravity.y > 2000) {
          result.warnings.push('Very high gravity may make gameplay difficult');
        }
      }
    }
  }
};

/**
 * Validate game scenes
 */
const validateScenes = (scenes: GameScene[], result: ValidationResult): void => {
  if (!scenes || scenes.length === 0) {
    result.errors.push('Project must have at least one scene');
    return;
  }

  scenes.forEach((scene, index) => {
    validateScene(scene, index, result);
  });
};

/**
 * Validate a single scene
 */
const validateScene = (scene: GameScene, index: number, result: ValidationResult): void => {
  const scenePrefix = `Scene ${index + 1}`;

  if (!scene.id || typeof scene.id !== 'string') {
    result.errors.push(`${scenePrefix}: Scene must have a valid ID`);
  }

  if (!scene.name || typeof scene.name !== 'string') {
    result.warnings.push(`${scenePrefix}: Scene should have a name`);
  }

  if (!Array.isArray(scene.objects)) {
    result.errors.push(`${scenePrefix}: Scene must have objects array`);
    return;
  }

  if (scene.objects.length === 0) {
    result.warnings.push(`${scenePrefix}: Scene has no objects`);
  }

  // Validate scene objects
  scene.objects.forEach((obj, objIndex) => {
    validateGameObject(obj, index, objIndex, result);
  });

  // Check for required object types
  const playerObjects = scene.objects.filter(obj => obj.type === 'player');
  if (playerObjects.length === 0) {
    result.warnings.push(`${scenePrefix}: Scene has no player object`);
  } else if (playerObjects.length > 1) {
    result.warnings.push(`${scenePrefix}: Scene has multiple player objects`);
  }

  // Validate background configuration
  if (scene.background) {
    if (!scene.background.type || !['color', 'image', 'parallax'].includes(scene.background.type)) {
      result.errors.push(`${scenePrefix}: Invalid background type`);
    }
    
    if (!scene.background.value) {
      result.errors.push(`${scenePrefix}: Background must have a value`);
    }
  }

  // Validate physics configuration
  if (scene.physics) {
    if (typeof scene.physics.gravity?.x !== 'number' || typeof scene.physics.gravity?.y !== 'number') {
      result.errors.push(`${scenePrefix}: Physics gravity must have valid x and y values`);
    }
  }

  // Validate camera configuration
  if (scene.camera) {
    if (typeof scene.camera.width !== 'number' || typeof scene.camera.height !== 'number') {
      result.errors.push(`${scenePrefix}: Camera must have valid width and height`);
    }
  }
};

/**
 * Validate a game object
 */
const validateGameObject = (obj: GameObject, sceneIndex: number, objIndex: number, result: ValidationResult): void => {
  const objPrefix = `Scene ${sceneIndex + 1}, Object ${objIndex + 1}`;

  if (!obj.id || typeof obj.id !== 'string') {
    result.errors.push(`${objPrefix}: Object must have a valid ID`);
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
    if (obj.scale.x > 20 || obj.scale.y > 20) {
      result.warnings.push(`${objPrefix}: Very large scale values may cause display issues`);
    }
  }

  // Validate rotation
  if (typeof obj.rotation !== 'number') {
    result.errors.push(`${objPrefix}: Object must have a valid rotation value`);
  }

  // Validate properties
  if (!obj.properties || typeof obj.properties !== 'object') {
    result.warnings.push(`${objPrefix}: Object should have properties`);
  }

  // Validate behaviors
  if (!Array.isArray(obj.behaviors)) {
    result.errors.push(`${objPrefix}: Object must have behaviors array`);
  }
};

/**
 * Validate project assets
 */
const validateAssets = (assets: any[], result: ValidationResult): void => {
  if (!Array.isArray(assets)) {
    result.warnings.push('Assets should be an array');
    return;
  }

  assets.forEach((asset, index) => {
    const assetPrefix = `Asset ${index + 1}`;

    if (!asset.id || typeof asset.id !== 'string') {
      result.errors.push(`${assetPrefix}: Asset must have a valid ID`);
    }

    if (!asset.name || typeof asset.name !== 'string') {
      result.warnings.push(`${assetPrefix}: Asset should have a name`);
    }

    if (!asset.type || !['image', 'audio', 'json'].includes(asset.type)) {
      result.errors.push(`${assetPrefix}: Invalid asset type "${asset.type}"`);
    }

    if (!asset.url || typeof asset.url !== 'string') {
      result.errors.push(`${assetPrefix}: Asset must have a valid URL`);
    }

    if (!asset.metadata || typeof asset.metadata !== 'object') {
      result.warnings.push(`${assetPrefix}: Asset should have metadata`);
    }
  });
};

/**
 * Check if a color string is valid
 */
const isValidColor = (color: string): boolean => {
  // Check hex color format
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // Check CSS color names (basic check)
  const cssColors = [
    'red', 'green', 'blue', 'white', 'black', 'yellow', 'cyan', 'magenta',
    'orange', 'purple', 'pink', 'brown', 'gray', 'grey'
  ];
  if (cssColors.includes(color.toLowerCase())) {
    return true;
  }
  
  // Check rgb/rgba format
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }
  
  return false;
};

/**
 * Validate specific object types
 */
export const validatePlayerObject = (obj: GameObject): string[] => {
  const errors: string[] = [];
  
  if (obj.type !== 'player') {
    errors.push('Object is not a player type');
    return errors;
  }

  const props = obj.properties;
  
  if (props.speed && (typeof props.speed !== 'number' || props.speed < 0)) {
    errors.push('Player speed must be a positive number');
  }

  if (props.jumpPower && (typeof props.jumpPower !== 'number' || props.jumpPower < 0)) {
    errors.push('Player jump power must be a positive number');
  }

  if (props.health && (typeof props.health !== 'number' || props.health <= 0)) {
    errors.push('Player health must be a positive number');
  }

  return errors;
};

export const validateEnemyObject = (obj: GameObject): string[] => {
  const errors: string[] = [];
  
  if (obj.type !== 'enemy') {
    errors.push('Object is not an enemy type');
    return errors;
  }

  const props = obj.properties;
  
  if (props.speed && (typeof props.speed !== 'number' || props.speed < 0)) {
    errors.push('Enemy speed must be a positive number');
  }

  if (props.damage && (typeof props.damage !== 'number' || props.damage < 0)) {
    errors.push('Enemy damage must be a positive number');
  }

  if (props.aiType && !['basic', 'patrol', 'chase', 'flying'].includes(props.aiType)) {
    errors.push('Invalid AI type');
  }

  return errors;
};

export const validateCollectibleObject = (obj: GameObject): string[] => {
  const errors: string[] = [];
  
  if (obj.type !== 'collectible') {
    errors.push('Object is not a collectible type');
    return errors;
  }

  const props = obj.properties;
  
  if (props.points && (typeof props.points !== 'number' || props.points < 0)) {
    errors.push('Collectible points must be a positive number');
  }

  return errors;
};

export default validateGameConfig;