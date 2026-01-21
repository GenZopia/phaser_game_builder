import type { GameProject, GameScene } from '../../types';

class CodeGenerator {
  static generatePhaserCode(project: GameProject): string {
    const scenes = project.scenes.map(scene => this.generateSceneCode(scene)).join('\n\n');
    
    return `
// Generated Phaser Game: ${project.name}
// Description: ${project.description}
// Generated on: ${new Date().toISOString()}

${scenes}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.platforms = null;
    this.collectibles = null;
    this.enemies = null;
    this.score = 0;
    this.scoreText = null;
    this.gameOver = false;
  }

  preload() {
    // Create simple colored rectangles as sprites
    this.add.graphics()
      .fillStyle(0x3498db)
      .fillRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);
    
    this.add.graphics()
      .fillStyle(0x8b4513)
      .fillRect(0, 0, 64, 16)
      .generateTexture('platform', 64, 16);
    
    this.add.graphics()
      .fillStyle(0xffd700)
      .fillCircle(16, 16, 8)
      .generateTexture('collectible', 32, 32);
    
    this.add.graphics()
      .fillStyle(0xe74c3c)
      .fillRect(0, 0, 32, 32)
      .generateTexture('enemy', 32, 32);
  }

  create() {
    ${this.generateSceneCreateCode(project.scenes[0] || null)}
  }

  update() {
    if (this.gameOver) return;

    ${this.generateUpdateCode(project.scenes[0] || null)}
  }

  ${this.generateHelperMethods(project.scenes[0] || null)}
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: ${project.gameConfig.width},
  height: ${project.gameConfig.height},
  backgroundColor: '${project.gameConfig.backgroundColor}',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: ${project.gameConfig.physics.arcade.gravity.y} },
      debug: ${project.gameConfig.physics.arcade.debug}
    }
  },
  scene: GameScene
};

// Start the game
const game = new Phaser.Game(config);
`;
  }

  private static generateSceneCode(scene: GameScene): string {
    return `// Scene: ${scene.name}`;
  }

  private static generateSceneCreateCode(scene: GameScene | null): string {
    if (!scene) return '// No scene data available';

    const objects = scene.objects;
    const playerObjects = objects.filter(obj => obj.type === 'player');
    const platformObjects = objects.filter(obj => obj.type === 'platform');
    const collectibleObjects = objects.filter(obj => obj.type === 'collectible');
    const enemyObjects = objects.filter(obj => obj.type === 'enemy');

    let code = `
    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.collectibles = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // Set background color
    this.cameras.main.setBackgroundColor('${scene.background.value || '#87CEEB'}');
`;

    // Generate platforms
    if (platformObjects.length > 0) {
      code += '\n    // Create platforms\n';
      platformObjects.forEach(platform => {
        code += `    this.platforms.create(${platform.position.x}, ${platform.position.y}, 'platform')
      .setScale(${platform.scale.x}, ${platform.scale.y})
      .refreshBody();\n`;
      });
    }

    // Generate player
    if (playerObjects.length > 0) {
      const player = playerObjects[0];
      code += `
    // Create player
    this.player = this.physics.add.sprite(${player.position.x}, ${player.position.y}, 'player');
    this.player.setBounce(${player.properties.bounce || 0.2});
    this.player.setCollideWorldBounds(true);
    this.player.setScale(${player.scale.x}, ${player.scale.y});

    // Player physics
    this.physics.add.collider(this.player, this.platforms);
`;
    }

    // Generate collectibles
    if (collectibleObjects.length > 0) {
      code += '\n    // Create collectibles\n';
      collectibleObjects.forEach(collectible => {
        code += `    this.collectibles.create(${collectible.position.x}, ${collectible.position.y}, 'collectible')
      .setScale(${collectible.scale.x}, ${collectible.scale.y});\n`;
      });
      
      code += `
    // Collectible physics
    this.physics.add.collider(this.collectibles, this.platforms);
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);
`;
    }

    // Generate enemies
    if (enemyObjects.length > 0) {
      code += '\n    // Create enemies\n';
      enemyObjects.forEach(enemy => {
        code += `    const enemy${enemy.id} = this.enemies.create(${enemy.position.x}, ${enemy.position.y}, 'enemy');
    enemy${enemy.id}.setBounce(1);
    enemy${enemy.id}.setVelocity(Phaser.Math.Between(-${enemy.properties.speed || 100}, ${enemy.properties.speed || 100}), 20);
    enemy${enemy.id}.setScale(${enemy.scale.x}, ${enemy.scale.y});
    enemy${enemy.id}.setCollideWorldBounds(true);\n`;
      });

      code += `
    // Enemy physics
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
`;
    }

    // Add controls
    code += `
    // Create cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      color: '#000' 
    });
`;

    return code;
  }

  private static generateUpdateCode(scene: GameScene | null): string {
    if (!scene) return '// No scene data available';

    const hasPlayer = scene.objects.some(obj => obj.type === 'player');
    
    if (!hasPlayer) return '// No player controls needed';

    return `
    // Player controls
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
`;
  }

  private static generateHelperMethods(scene: GameScene | null): string {
    if (!scene) return '';

    const hasCollectibles = scene.objects.some(obj => obj.type === 'collectible');
    const hasEnemies = scene.objects.some(obj => obj.type === 'enemy');

    let methods = '';

    if (hasCollectibles) {
      methods += `
  collectItem(player, collectible) {
    collectible.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    if (this.collectibles.countActive(true) === 0) {
      // All collectibles collected - you win!
      this.add.text(${scene.camera?.width || 400} / 2, ${scene.camera?.height || 300} / 2, 'You Win!', {
        fontSize: '64px',
        color: '#00ff00'
      }).setOrigin(0.5);
      this.gameOver = true;
    }
  }
`;
    }

    if (hasEnemies) {
      methods += `
  hitEnemy(player, enemy) {
    this.physics.pause();
    player.setTint(0xff0000);
    this.gameOver = true;
    
    this.add.text(${scene.camera?.width || 400} / 2, ${scene.camera?.height || 300} / 2, 'Game Over!', {
      fontSize: '64px',
      color: '#ff0000'
    }).setOrigin(0.5);
  }
`;
    }

    return methods;
  }

  static generateHTMLWrapper(phaserCode: string, projectName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #2c3e50;
            font-family: Arial, sans-serif;
        }
        #game-container {
            text-align: center;
        }
        h1 {
            color: white;
            margin-bottom: 20px;
        }
        canvas {
            border: 2px solid #34495e;
            border-radius: 8px;
        }
        .controls {
            color: white;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <h1>${projectName}</h1>
        <div id="game"></div>
        <div class="controls">
            <p>Use arrow keys to move and jump</p>
        </div>
    </div>

    <script>
${phaserCode}
    </script>
</body>
</html>`;
  }

  static validateGameProject(project: GameProject): string[] {
    const errors: string[] = [];

    if (!project.gameConfig) {
      errors.push('Missing game configuration');
    }

    if (!project.scenes || project.scenes.length === 0) {
      errors.push('No scenes defined');
    }

    if (project.scenes) {
      project.scenes.forEach((scene, index) => {
        if (!scene.objects || scene.objects.length === 0) {
          errors.push(`Scene ${index + 1} has no objects`);
        }

        const hasPlayer = scene.objects.some(obj => obj.type === 'player');
        if (!hasPlayer) {
          errors.push(`Scene ${index + 1} has no player object`);
        }
      });
    }

    return errors;
  }

  static optimizeGameProject(project: GameProject): GameProject {
    // Create a deep copy
    const optimized = JSON.parse(JSON.stringify(project));

    // Remove duplicate objects
    optimized.scenes.forEach((scene: GameScene) => {
      const uniqueObjects = new Map();
      scene.objects.forEach(obj => {
        const key = `${obj.type}-${obj.position.x}-${obj.position.y}`;
        if (!uniqueObjects.has(key)) {
          uniqueObjects.set(key, obj);
        }
      });
      scene.objects = Array.from(uniqueObjects.values());
    });

    // Ensure reasonable object limits
    optimized.scenes.forEach((scene: GameScene) => {
      if (scene.objects.length > 50) {
        console.warn('Scene has too many objects, limiting to 50');
        scene.objects = scene.objects.slice(0, 50);
      }
    });

    return optimized;
  }
}

export default CodeGenerator;