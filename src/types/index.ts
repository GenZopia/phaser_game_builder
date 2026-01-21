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
  type: 'sprite' | 'platform' | 'collectible' | 'enemy' | 'player';
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
  type: string;
  parameters: Record<string, any>;
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