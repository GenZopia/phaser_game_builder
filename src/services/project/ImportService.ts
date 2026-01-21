import type { GameProject } from '../../types';
import ValidationService from '../ai/ValidationService';

interface ImportResult {
  success: boolean;
  project?: GameProject;
  errors: string[];
  warnings: string[];
}

interface ImportOptions {
  validateProject: boolean;
  sanitizeData: boolean;
  generateNewId: boolean;
}

class ImportService {
  static async importFromFile(file: File, options: ImportOptions = {
    validateProject: true,
    sanitizeData: true,
    generateNewId: true
  }): Promise<ImportResult> {
    try {
      const content = await this.readFileContent(file);
      return this.importFromString(content, options);
      
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  static async importFromString(content: string, options: ImportOptions = {
    validateProject: true,
    sanitizeData: true,
    generateNewId: true
  }): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      // Parse JSON content
      let data: any;
      try {
        data = JSON.parse(content);
      } catch {
        result.errors.push('Invalid JSON format');
        return result;
      }

      // Extract project data
      let project: GameProject;
      
      if (this.isExportedProject(data)) {
        // Handle exported project format
        project = data.project;
        result.warnings.push('Imported from exported project format');
      } else if (this.isGameProject(data)) {
        // Handle direct project format
        project = data;
      } else {
        result.errors.push('Unrecognized project format');
        return result;
      }

      // Generate new ID if requested
      if (options.generateNewId) {
        project.id = `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        project.name = `${project.name} (Imported)`;
      }

      // Update timestamps
      project.createdAt = new Date();
      project.updatedAt = new Date();

      // Sanitize data if requested
      if (options.sanitizeData) {
        project = ValidationService.sanitizeGameProject(project);
        result.warnings.push('Project data was sanitized');
      }

      // Validate project if requested
      if (options.validateProject) {
        const validation = ValidationService.validateGameProject(project);
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
        
        if (!validation.isValid) {
          result.errors.push('Project validation failed');
          return result;
        }
      }

      result.success = true;
      result.project = project;
      
    } catch (error) {
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  static async importFromURL(url: string, options?: ImportOptions): Promise<ImportResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      return this.importFromString(content, options);
      
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to fetch from URL: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  static async importMultipleProjects(files: FileList, options?: ImportOptions): Promise<ImportResult[]> {
    const results: ImportResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.importFromFile(file, options);
      results.push(result);
    }
    
    return results;
  }

  static validateImportFile(file: File): string[] {
    const errors: string[] = [];
    
    // Check file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      errors.push('File must be a JSON file');
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`);
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push('File name too long');
    }
    
    return errors;
  }

  static getSupportedFormats(): string[] {
    return [
      'Phaser Game Builder Project (.json)',
      'Exported Project Archive (.json)',
      'Legacy Project Format (.json)'
    ];
  }

  static async previewImport(file: File): Promise<{
    isValid: boolean;
    projectName?: string;
    description?: string;
    sceneCount?: number;
    objectCount?: number;
    errors: string[];
  }> {
    try {
      const content = await this.readFileContent(file);
      const data = JSON.parse(content);
      
      let project: GameProject;
      
      if (this.isExportedProject(data)) {
        project = data.project;
      } else if (this.isGameProject(data)) {
        project = data;
      } else {
        return {
          isValid: false,
          errors: ['Unrecognized project format']
        };
      }
      
      const objectCount = project.scenes?.reduce((total, scene) => 
        total + (scene.objects?.length || 0), 0) || 0;
      
      return {
        isValid: true,
        projectName: project.name,
        description: project.description,
        sceneCount: project.scenes?.length || 0,
        objectCount,
        errors: []
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to preview: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading error'));
      };
      
      reader.readAsText(file);
    });
  }

  private static isGameProject(data: any): data is GameProject {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      data.gameConfig &&
      Array.isArray(data.scenes)
    );
  }

  private static isExportedProject(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.project &&
      this.isGameProject(data.project) &&
      data.exportedAt
    );
  }

  static createSampleProject(): GameProject {
    return {
      id: `sample_${Date.now()}`,
      name: 'Sample Platformer Game',
      description: 'A simple platformer game with a player, platforms, and collectibles',
      createdAt: new Date(),
      updatedAt: new Date(),
      gameConfig: {
        width: 800,
        height: 600,
        backgroundColor: '#87CEEB',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 300 },
            debug: false
          }
        }
      },
      scenes: [{
        id: 'main-scene',
        name: 'Main Scene',
        objects: [
          {
            id: 'player-1',
            type: 'player',
            position: { x: 100, y: 450 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            properties: {
              hasPhysics: true,
              isStatic: false,
              bounce: 0.2,
              friction: 1,
              speed: 200,
              jumpPower: 400
            },
            behaviors: []
          },
          {
            id: 'platform-1',
            type: 'platform',
            position: { x: 400, y: 550 },
            scale: { x: 12, y: 2 },
            rotation: 0,
            properties: {
              hasPhysics: true,
              isStatic: true,
              bounce: 0,
              friction: 1
            },
            behaviors: []
          },
          {
            id: 'platform-2',
            type: 'platform',
            position: { x: 200, y: 400 },
            scale: { x: 3, y: 1 },
            rotation: 0,
            properties: {
              hasPhysics: true,
              isStatic: true,
              bounce: 0,
              friction: 1
            },
            behaviors: []
          },
          {
            id: 'collectible-1',
            type: 'collectible',
            position: { x: 300, y: 350 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            properties: {
              hasPhysics: true,
              isStatic: true,
              points: 10,
              respawns: false
            },
            behaviors: []
          },
          {
            id: 'collectible-2',
            type: 'collectible',
            position: { x: 500, y: 500 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            properties: {
              hasPhysics: true,
              isStatic: true,
              points: 10,
              respawns: false
            },
            behaviors: []
          },
          {
            id: 'enemy-1',
            type: 'enemy',
            position: { x: 600, y: 500 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            properties: {
              hasPhysics: true,
              isStatic: false,
              bounce: 0.1,
              friction: 1,
              speed: 100,
              aiType: 'patrol'
            },
            behaviors: []
          }
        ],
        background: {
          type: 'color',
          value: '#87CEEB'
        },
        physics: {
          gravity: { x: 0, y: 300 },
          bounds: { x: 0, y: 0, width: 800, height: 600 },
          debug: false
        },
        camera: {
          x: 0,
          y: 0,
          width: 800,
          height: 600
        }
      }],
      assets: [],
      metadata: {
        version: '1.0.0',
        tags: ['sample', 'platformer'],
        thumbnail: undefined
      }
    };
  }
}

export default ImportService;