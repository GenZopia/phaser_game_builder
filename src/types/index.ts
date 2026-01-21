// Type definitions for the application

export interface GameProject {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  gameConfig: PhaserGameConfig;
  scenes: GameScene[];
  assets: AssetReference[];
  metadata: ProjectMetadata;
}

export interface GameScene {
  id: string;
  name: string;
  objects: GameObject[];
  background: BackgroundConfig;
  physics: PhysicsConfig;
  camera: CameraConfig;
}

export interface GameObject {
  id: string;
  type: 'sprite' | 'platform' | 'collectible' | 'enemy' | 'player' | 'controller';
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  properties: Record<string, any>;
  behaviors: GameBehavior[];
}

export interface PhaserGameConfig {
  width: number;
  height: number;
  backgroundColor: string;
  physics: {
    default: string;
    arcade: {
      gravity: { y: number };
      debug: boolean;
    };
  };
}

export interface BackgroundConfig {
  type: 'color' | 'image' | 'parallax';
  value: string;
  parallaxLayers?: ParallaxLayer[];
}

export interface PhysicsConfig {
  gravity: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  debug: boolean;
}

export interface CameraConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  followTarget?: string;
}

export interface GameBehavior {
  id: string;
  type: 'physics' | 'controls' | 'camera' | 'oblique' | string;
  name: string;
  parameters: Record<string, any>;
}

export interface PhysicsBehavior extends GameBehavior {
  type: 'physics';
  parameters: {
    enabled: boolean;
    isStatic: boolean;
    mass: number;
    density: number;
    friction: number;
    bounce: number;
    gravityScale: number;
  };
}

export interface ControlsBehavior extends GameBehavior {
  type: 'controls';
  parameters: {
    enabled: boolean;
    moveSpeed: number;
    jumpPower: number;
    canDoubleJump: boolean;
    keys: {
      up: string;
      down: string;
      left: string;
      right: string;
      jump: string;
    };
  };
}

export interface CameraBehavior extends GameBehavior {
  type: 'camera';
  parameters: {
    enabled: boolean;
    smoothing: number;
    offsetX: number;
    offsetY: number;
    deadzone: {
      width: number;
      height: number;
    };
  };
}

export interface ObliqueBehavior extends GameBehavior {
  type: 'oblique';
  parameters: {
    enabled: boolean;
    collisionGroup: string;
    padding: number;
    onlyCollideWithOblique: boolean;
  };
}

export interface AssetReference {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'json';
  url: string;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  format: string;
}

export interface ProjectMetadata {
  version: string;
  tags: string[];
  thumbnail?: string;
}

export interface ParallaxLayer {
  asset: string;
  speed: number;
  depth: number;
}

// AI Integration Types
export interface AIGameRequest {
  prompt: string;
  gameType?: 'platformer' | 'shooter' | 'puzzle' | 'arcade';
  constraints?: GameConstraints;
  existingAssets?: string[];
}

export interface AIGameResponse {
  success: boolean;
  gameConfig?: GameProject;
  explanation?: string;
  limitations?: string[];
  error?: string;
}

export interface GameConstraints {
  maxObjects?: number;
  availableAssets?: string[];
  gameSize?: { width: number; height: number };
}

// Editor State Types
export interface EditorState {
  currentProject: GameProject | null;
  selectedObjects: GameObject[];
  clipboard: GameObject[];
  history: EditorAction[];
  isPlaying: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  editorMode: 'move' | 'pan';
}

export interface EditorAction {
  type: string;
  payload: any;
  timestamp: Date;
}

// Asset Management Types
export interface Asset {
  id: string;
  blob: Blob;
  metadata: AssetMetadata;
}