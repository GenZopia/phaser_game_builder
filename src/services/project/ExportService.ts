import type { GameProject } from '../../types';
import CodeGenerator from '../ai/CodeGenerator';

interface ExportOptions {
  format: 'html' | 'zip' | 'json';
  includeAssets: boolean;
  minify: boolean;
  template?: string;
}

class ExportService {
  static async exportProject(project: GameProject, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'html':
        return this.exportAsHTML(project, options);
      case 'zip':
        return this.exportAsZip(project, options);
      case 'json':
        return this.exportAsJSON(project, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static async exportAsHTML(project: GameProject, options: ExportOptions): Promise<Blob> {
    try {
      // Generate Phaser code
      const phaserCode = CodeGenerator.generatePhaserCode(project);
      
      // Generate HTML wrapper
      const htmlContent = CodeGenerator.generateHTMLWrapper(phaserCode, project.name);
      
      // Minify if requested
      const finalContent = options.minify ? this.minifyHTML(htmlContent) : htmlContent;
      
      return new Blob([finalContent], { type: 'text/html' });
      
    } catch (error) {
      console.error('Failed to export as HTML:', error);
      throw new Error(`HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async exportAsZip(project: GameProject, options: ExportOptions): Promise<Blob> {
    try {
      // For now, we'll create a simple ZIP-like structure as a JSON file
      // In a real implementation, you'd use a library like JSZip
      
      const files: Record<string, string> = {};
      
      // Add main HTML file
      const phaserCode = CodeGenerator.generatePhaserCode(project);
      const htmlContent = CodeGenerator.generateHTMLWrapper(phaserCode, project.name);
      files['index.html'] = htmlContent;
      
      // Add project JSON
      files['project.json'] = JSON.stringify(project, null, 2);
      
      // Add README
      files['README.md'] = this.generateReadme(project);
      
      // Add assets if requested
      if (options.includeAssets && project.assets.length > 0) {
        files['assets.json'] = JSON.stringify(project.assets, null, 2);
      }
      
      // Create a simple archive format (in a real app, use JSZip)
      const archive = {
        name: project.name,
        files,
        createdAt: new Date().toISOString()
      };
      
      return new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
      
    } catch (error) {
      console.error('Failed to export as ZIP:', error);
      throw new Error(`ZIP export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async exportAsJSON(project: GameProject, options: ExportOptions): Promise<Blob> {
    try {
      const exportData = {
        project,
        exportedAt: new Date().toISOString(),
        exportOptions: options,
        version: '1.0.0'
      };
      
      const jsonContent = JSON.stringify(exportData, null, options.minify ? 0 : 2);
      return new Blob([jsonContent], { type: 'application/json' });
      
    } catch (error) {
      console.error('Failed to export as JSON:', error);
      throw new Error(`JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async downloadProject(project: GameProject, options: ExportOptions): Promise<void> {
    try {
      const blob = await this.exportProject(project, options);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFilename(project, options.format);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to download project:', error);
      throw error;
    }
  }

  static validateProjectForExport(project: GameProject): string[] {
    const errors: string[] = [];
    
    if (!project.name || project.name.trim().length === 0) {
      errors.push('Project must have a name');
    }
    
    if (!project.gameConfig) {
      errors.push('Project must have game configuration');
    }
    
    if (!project.scenes || project.scenes.length === 0) {
      errors.push('Project must have at least one scene');
    }
    
    // Check for player object
    const hasPlayer = project.scenes?.some(scene => 
      scene.objects?.some(obj => obj.type === 'player')
    );
    
    if (!hasPlayer) {
      errors.push('Project must have at least one player object');
    }
    
    return errors;
  }

  static getExportPreview(project: GameProject): string {
    const stats = this.getProjectStats(project);
    
    return `
Project: ${project.name}
Description: ${project.description || 'No description'}
Created: ${project.createdAt.toLocaleDateString()}
Last Modified: ${project.updatedAt.toLocaleDateString()}

Game Configuration:
- Dimensions: ${project.gameConfig.width}x${project.gameConfig.height}
- Background: ${project.gameConfig.backgroundColor}
- Physics: ${project.gameConfig.physics.default}

Statistics:
- Scenes: ${stats.sceneCount}
- Total Objects: ${stats.objectCount}
- Players: ${stats.playerCount}
- Platforms: ${stats.platformCount}
- Collectibles: ${stats.collectibleCount}
- Enemies: ${stats.enemyCount}
- Assets: ${stats.assetCount}

Estimated File Size: ${stats.estimatedSize}
    `.trim();
  }

  private static getProjectStats(project: GameProject) {
    const stats = {
      sceneCount: project.scenes.length,
      objectCount: 0,
      playerCount: 0,
      platformCount: 0,
      collectibleCount: 0,
      enemyCount: 0,
      assetCount: project.assets.length,
      estimatedSize: '0 KB'
    };
    
    project.scenes.forEach(scene => {
      stats.objectCount += scene.objects.length;
      
      scene.objects.forEach(obj => {
        switch (obj.type) {
          case 'player':
            stats.playerCount++;
            break;
          case 'platform':
            stats.platformCount++;
            break;
          case 'collectible':
            stats.collectibleCount++;
            break;
          case 'enemy':
            stats.enemyCount++;
            break;
        }
      });
    });
    
    // Estimate file size
    const projectSize = new Blob([JSON.stringify(project)]).size;
    const phaserCode = CodeGenerator.generatePhaserCode(project);
    const htmlSize = new Blob([CodeGenerator.generateHTMLWrapper(phaserCode, project.name)]).size;
    
    const totalSize = projectSize + htmlSize;
    stats.estimatedSize = totalSize < 1024 
      ? `${totalSize} B`
      : totalSize < 1024 * 1024
      ? `${Math.round(totalSize / 1024)} KB`
      : `${Math.round(totalSize / 1024 / 1024 * 100) / 100} MB`;
    
    return stats;
  }

  private static generateFilename(project: GameProject, format: string): string {
    const safeName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    
    switch (format) {
      case 'html':
        return `${safeName}_${timestamp}.html`;
      case 'zip':
        return `${safeName}_${timestamp}.zip`;
      case 'json':
        return `${safeName}_${timestamp}.json`;
      default:
        return `${safeName}_${timestamp}.txt`;
    }
  }

  private static generateReadme(project: GameProject): string {
    return `# ${project.name}

${project.description || 'A game created with Phaser Game Builder'}

## How to Play

1. Open \`index.html\` in a web browser
2. Use arrow keys to move and jump
3. Collect items and avoid enemies
4. Have fun!

## Game Details

- **Created:** ${project.createdAt.toLocaleDateString()}
- **Last Modified:** ${project.updatedAt.toLocaleDateString()}
- **Game Size:** ${project.gameConfig.width}x${project.gameConfig.height}
- **Scenes:** ${project.scenes.length}

## Controls

- **Arrow Keys:** Move left/right
- **Up Arrow:** Jump
- **Space:** Action (if applicable)

## Technical Details

This game was created using:
- Phaser 3 game engine
- HTML5 Canvas
- JavaScript

## Credits

Created with Phaser Game Builder
`;
  }

  private static minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .trim();
  }
}

export default ExportService;