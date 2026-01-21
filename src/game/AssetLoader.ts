import * as Phaser from 'phaser';
import type { AssetReference } from '../types';

interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentFile?: string;
}

interface AssetCache {
  [key: string]: {
    data: any;
    type: string;
    size: number;
    loadedAt: Date;
  };
}

class AssetLoader {
  private scene: Phaser.Scene;
  private cache: AssetCache = {};
  private loadingCallbacks: ((progress: LoadingProgress) => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupLoadingEvents();
  }

  private setupLoadingEvents() {
    this.scene.load.on('progress', (progress: number) => {
      const loadingProgress: LoadingProgress = {
        loaded: this.scene.load.totalComplete,
        total: this.scene.load.totalToLoad,
        percentage: Math.round(progress * 100),
        currentFile: this.scene.load.currentFile?.key
      };
      
      this.loadingCallbacks.forEach(callback => callback(loadingProgress));
    });

    this.scene.load.on('filecomplete', (key: string, type: string, data: any) => {
      this.cache[key] = {
        data,
        type,
        size: this.estimateAssetSize(data, type),
        loadedAt: new Date()
      };
    });

    this.scene.load.on('loaderror', (file: any) => {
      const error = `Failed to load ${file.type}: ${file.key} from ${file.url}`;
      console.error(error);
      this.errorCallbacks.forEach(callback => callback(error));
    });
  }

  async loadAssets(assets: AssetReference[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (assets.length === 0) {
        resolve();
        return;
      }

      // Add completion handler
      this.scene.load.once('complete', () => {
        resolve();
      });

      // Add error handler
      const errorHandler = (error: string) => {
        reject(new Error(error));
      };
      this.errorCallbacks.push(errorHandler);

      // Load each asset
      assets.forEach(asset => {
        this.loadAsset(asset);
      });

      // Start loading
      this.scene.load.start();
    });
  }

  loadAsset(asset: AssetReference) {
    switch (asset.type) {
      case 'image':
        this.loadImage(asset);
        break;
      case 'audio':
        this.loadAudio(asset);
        break;
      case 'json':
        this.loadJSON(asset);
        break;
      default:
        console.warn(`Unsupported asset type: ${asset.type}`);
    }
  }

  private loadImage(asset: AssetReference) {
    if (this.isAssetLoaded(asset.id)) {
      return;
    }

    // Determine if it's a spritesheet or regular image
    if (asset.metadata.dimensions && asset.metadata.dimensions.width > 64) {
      // Assume it might be a spritesheet if it's wide
      this.scene.load.spritesheet(asset.id, asset.url, {
        frameWidth: 32,
        frameHeight: 32
      });
    } else {
      this.scene.load.image(asset.id, asset.url);
    }
  }

  private loadAudio(asset: AssetReference) {
    if (this.isAssetLoaded(asset.id)) {
      return;
    }

    this.scene.load.audio(asset.id, asset.url);
  }

  private loadJSON(asset: AssetReference) {
    if (this.isAssetLoaded(asset.id)) {
      return;
    }

    this.scene.load.json(asset.id, asset.url);
  }

  async loadFromFile(file: File, assetId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          
          // Determine asset type from file
          const type = this.getAssetTypeFromFile(file);
          
          switch (type) {
            case 'image':
              this.scene.load.image(assetId, dataUrl);
              break;
            case 'audio':
              this.scene.load.audio(assetId, dataUrl);
              break;
            case 'json':
              this.scene.load.json(assetId, dataUrl);
              break;
            default:
              reject(new Error(`Unsupported file type: ${file.type}`));
              return;
          }

          this.scene.load.once('filecomplete-' + type + '-' + assetId, () => {
            resolve(dataUrl);
          });

          this.scene.load.start();
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('File reading error'));
      };

      reader.readAsDataURL(file);
    });
  }

  createDefaultAssets() {
    // Create default textures if they don't exist
    const defaultAssets = [
      { key: 'player', color: 0x3498db, width: 32, height: 32 },
      { key: 'platform', color: 0x8b4513, width: 64, height: 16 },
      { key: 'collectible', color: 0xffd700, width: 32, height: 32, isCircle: true },
      { key: 'enemy', color: 0xe74c3c, width: 32, height: 32 },
      { key: 'background', color: 0x87ceeb, width: 800, height: 600 }
    ];

    defaultAssets.forEach(asset => {
      if (!this.isAssetLoaded(asset.key)) {
        this.createColorTexture(asset.key, asset.color, asset.width, asset.height, asset.isCircle);
      }
    });
  }

  private createColorTexture(key: string, color: number, width: number, height: number, isCircle: boolean = false) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color);
    
    if (isCircle) {
      graphics.fillCircle(width / 2, height / 2, Math.min(width, height) / 4);
    } else {
      graphics.fillRect(0, 0, width, height);
    }
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  isAssetLoaded(key: string): boolean {
    return this.scene.textures.exists(key) || 
           this.scene.sound.get(key) !== null ||
           this.scene.cache.json.exists(key);
  }

  getAsset(key: string): any {
    // Try different cache types
    if (this.scene.textures.exists(key)) {
      return this.scene.textures.get(key);
    }
    
    if (this.scene.sound.get(key)) {
      return this.scene.sound.get(key);
    }
    
    if (this.scene.cache.json.exists(key)) {
      return this.scene.cache.json.get(key);
    }
    
    return null;
  }

  removeAsset(key: string) {
    // Remove from different caches
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
    
    if (this.scene.sound.get(key)) {
      this.scene.sound.remove(key);
    }
    
    if (this.scene.cache.json.exists(key)) {
      this.scene.cache.json.remove(key);
    }

    // Remove from our cache
    delete this.cache[key];
  }

  getLoadedAssets(): string[] {
    return Object.keys(this.cache);
  }

  getCacheSize(): number {
    return Object.values(this.cache).reduce((total, asset) => total + asset.size, 0);
  }

  clearCache() {
    Object.keys(this.cache).forEach(key => {
      this.removeAsset(key);
    });
    this.cache = {};
  }

  onProgress(callback: (progress: LoadingProgress) => void) {
    this.loadingCallbacks.push(callback);
  }

  onError(callback: (error: string) => void) {
    this.errorCallbacks.push(callback);
  }

  private getAssetTypeFromFile(file: File): 'image' | 'audio' | 'json' | 'unknown' {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    
    if (mimeType === 'application/json' || file.name.endsWith('.json')) {
      return 'json';
    }
    
    return 'unknown';
  }

  private estimateAssetSize(data: any, type: string): number {
    if (type === 'image') {
      // Estimate based on texture dimensions
      return 1024; // Default estimate
    }
    
    if (type === 'audio') {
      // Estimate based on duration
      return 5120; // Default estimate
    }
    
    if (type === 'json') {
      return JSON.stringify(data).length;
    }
    
    return 0;
  }

  // Utility methods for asset optimization
  static optimizeImage(imageData: ImageData, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', quality);
    });
  }

  static validateAssetFile(file: File): string[] {
    const errors: string[] = [];
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`);
    }
    
    // Check file type
    const supportedTypes = [
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/json'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      errors.push(`Unsupported file type: ${file.type}`);
    }
    
    return errors;
  }

  static createAssetReference(file: File, id: string, url: string): AssetReference {
    const type = file.type.startsWith('image/') ? 'image' :
                 file.type.startsWith('audio/') ? 'audio' :
                 file.type === 'application/json' ? 'json' : 'image';

    return {
      id,
      name: file.name,
      type: type as 'image' | 'audio' | 'json',
      url,
      metadata: {
        size: file.size,
        format: file.type,
        dimensions: type === 'image' ? { width: 0, height: 0 } : undefined,
        duration: type === 'audio' ? 0 : undefined
      }
    };
  }
}

export default AssetLoader;