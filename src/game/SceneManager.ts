import * as Phaser from 'phaser';
import type { GameScene, GameObject } from '../types';

class SceneManager {
  private game: Phaser.Game | null = null;
  private currentScene: Phaser.Scene | null = null;
  private gameObjects: Map<string, Phaser.GameObjects.GameObject> = new Map();

  constructor(game: Phaser.Game) {
    this.game = game;
  }

  createScene(sceneData: GameScene): Phaser.Scene {
    const scene = new Phaser.Scene({ key: sceneData.id });
    
    // Override preload method
    scene.preload = function() {
      this.createDefaultTextures();
    }.bind(this);

    // Override create method
    scene.create = function() {
      this.setupScene(sceneData);
    }.bind(this);

    // Override update method
    scene.update = function() {
      this.updateScene();
    }.bind(this);

    return scene;
  }

  private createDefaultTextures() {
    if (!this.currentScene) return;

    // Create simple colored rectangles as placeholder sprites
    this.currentScene.add.graphics()
      .fillStyle(0x3498db)
      .fillRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);
    
    this.currentScene.add.graphics()
      .fillStyle(0x8b4513)
      .fillRect(0, 0, 64, 16)
      .generateTexture('platform', 64, 16);
    
    this.currentScene.add.graphics()
      .fillStyle(0xffd700)
      .fillCircle(16, 16, 8)
      .generateTexture('collectible', 32, 32);
    
    this.currentScene.add.graphics()
      .fillStyle(0xe74c3c)
      .fillRect(0, 0, 32, 32)
      .generateTexture('enemy', 32, 32);
  }

  private setupScene(sceneData: GameScene) {
    if (!this.currentScene) return;

    // Set background
    if (sceneData.background.type === 'color') {
      this.currentScene.cameras.main.setBackgroundColor(sceneData.background.value);
    }

    // Create physics groups
    const platforms = this.currentScene.physics.add.staticGroup();
    const collectibles = this.currentScene.physics.add.group();
    const enemies = this.currentScene.physics.add.group();
    let player: Phaser.Physics.Arcade.Sprite | null = null;

    // Create game objects
    sceneData.objects.forEach(objData => {
      const gameObject = this.createGameObject(objData);
      if (gameObject) {
        this.gameObjects.set(objData.id, gameObject);

        // Add to appropriate groups
        switch (objData.type) {
          case 'player':
            player = gameObject as Phaser.Physics.Arcade.Sprite;
            break;
          case 'platform':
            platforms.add(gameObject);
            break;
          case 'collectible':
            collectibles.add(gameObject);
            break;
          case 'enemy':
            enemies.add(gameObject);
            break;
        }
      }
    });

    // Set up physics collisions
    if (player) {
      this.currentScene.physics.add.collider(player, platforms);
      this.currentScene.physics.add.collider(collectibles, platforms);
      this.currentScene.physics.add.collider(enemies, platforms);
      
      this.currentScene.physics.add.overlap(player, collectibles, this.collectItem, null, this.currentScene);
      this.currentScene.physics.add.collider(player, enemies, this.hitEnemy, null, this.currentScene);
    }

    // Set up controls
    const cursors = this.currentScene.input.keyboard?.createCursorKeys();
    (this.currentScene as any).cursors = cursors;
    (this.currentScene as any).player = player;

    // Add score text
    (this.currentScene as any).score = 0;
    (this.currentScene as any).scoreText = this.currentScene.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#000'
    });
  }

  private createGameObject(objData: GameObject): Phaser.GameObjects.GameObject | null {
    if (!this.currentScene) return null;

    let gameObject: Phaser.GameObjects.GameObject | null = null;

    switch (objData.type) {
      case 'player':
        gameObject = this.currentScene.physics.add.sprite(
          objData.position.x,
          objData.position.y,
          'player'
        );
        this.setupPlayerObject(gameObject as Phaser.Physics.Arcade.Sprite, objData);
        break;

      case 'platform':
        gameObject = this.currentScene.physics.add.staticSprite(
          objData.position.x,
          objData.position.y,
          'platform'
        );
        this.setupPlatformObject(gameObject as Phaser.Physics.Arcade.Sprite, objData);
        break;

      case 'collectible':
        gameObject = this.currentScene.physics.add.sprite(
          objData.position.x,
          objData.position.y,
          'collectible'
        );
        this.setupCollectibleObject(gameObject as Phaser.Physics.Arcade.Sprite, objData);
        break;

      case 'enemy':
        gameObject = this.currentScene.physics.add.sprite(
          objData.position.x,
          objData.position.y,
          'enemy'
        );
        this.setupEnemyObject(gameObject as Phaser.Physics.Arcade.Sprite, objData);
        break;
    }

    if (gameObject) {
      // Apply common transformations
      gameObject.setScale(objData.scale.x, objData.scale.y);
      gameObject.setRotation(objData.rotation * Math.PI / 180); // Convert degrees to radians
    }

    return gameObject;
  }

  private setupPlayerObject(sprite: Phaser.Physics.Arcade.Sprite, objData: GameObject) {
    const props = objData.properties;
    
    sprite.setBounce(props.bounce || 0.2);
    sprite.setCollideWorldBounds(true);
    
    if (props.hasPhysics && !props.isStatic) {
      sprite.body?.setGravityY(0); // Use world gravity
    }
  }

  private setupPlatformObject(sprite: Phaser.Physics.Arcade.Sprite, objData: GameObject) {
    const props = objData.properties;
    
    if (props.isStatic) {
      sprite.body?.setImmovable(true);
    }
    
    sprite.refreshBody();
  }

  private setupCollectibleObject(sprite: Phaser.Physics.Arcade.Sprite, objData: GameObject) {
    const props = objData.properties;
    
    if (props.isStatic) {
      sprite.body?.setImmovable(true);
    }
    
    // Add a subtle floating animation
    this.currentScene?.tweens.add({
      targets: sprite,
      y: sprite.y - 10,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  private setupEnemyObject(sprite: Phaser.Physics.Arcade.Sprite, objData: GameObject) {
    const props = objData.properties;
    
    sprite.setBounce(1);
    sprite.setCollideWorldBounds(true);
    
    const speed = props.speed || 100;
    sprite.setVelocity(Phaser.Math.Between(-speed, speed), 20);
  }

  private collectItem(player: Phaser.Physics.Arcade.Sprite, collectible: Phaser.Physics.Arcade.Sprite) {
    if (!this.currentScene) return;

    collectible.disableBody(true, true);
    
    const scene = this.currentScene as any;
    scene.score += 10;
    scene.scoreText.setText('Score: ' + scene.score);

    // Check if all collectibles are collected
    const collectiblesGroup = collectible.body?.world.bodies.filter(body => 
      body.gameObject && (body.gameObject as any).texture?.key === 'collectible'
    );
    
    if (collectiblesGroup && collectiblesGroup.length === 0) {
      this.currentScene.add.text(400, 300, 'You Win!', {
        fontSize: '64px',
        color: '#00ff00'
      }).setOrigin(0.5);
    }
  }

  private hitEnemy(player: Phaser.Physics.Arcade.Sprite) {
    if (!this.currentScene) return;

    this.currentScene.physics.pause();
    player.setTint(0xff0000);
    
    this.currentScene.add.text(400, 300, 'Game Over!', {
      fontSize: '64px',
      color: '#ff0000'
    }).setOrigin(0.5);
  }

  private updateScene() {
    if (!this.currentScene) return;

    const scene = this.currentScene as any;
    const player = scene.player as Phaser.Physics.Arcade.Sprite;
    const cursors = scene.cursors;

    if (!player || !cursors) return;

    // Player controls
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
    } else {
      player.setVelocityX(0);
    }

    if (cursors.up.isDown && player.body?.touching.down) {
      player.setVelocityY(-330);
    }
  }

  loadScene(sceneData: GameScene) {
    if (!this.game) return;

    // Remove current scene if exists
    if (this.currentScene) {
      this.game.scene.remove(this.currentScene.scene.key);
    }

    // Create and add new scene
    const scene = this.createScene(sceneData);
    this.currentScene = scene;
    this.game.scene.add(sceneData.id, scene, true);
  }

  getGameObject(id: string): Phaser.GameObjects.GameObject | undefined {
    return this.gameObjects.get(id);
  }

  updateGameObject(id: string, updates: Partial<GameObject>) {
    const gameObject = this.gameObjects.get(id);
    if (!gameObject) return;

    // Apply position updates
    if (updates.position) {
      gameObject.setPosition(updates.position.x, updates.position.y);
    }

    // Apply scale updates
    if (updates.scale) {
      gameObject.setScale(updates.scale.x, updates.scale.y);
    }

    // Apply rotation updates
    if (updates.rotation !== undefined) {
      gameObject.setRotation(updates.rotation * Math.PI / 180);
    }
  }

  removeGameObject(id: string) {
    const gameObject = this.gameObjects.get(id);
    if (gameObject) {
      gameObject.destroy();
      this.gameObjects.delete(id);
    }
  }

  cleanup() {
    this.gameObjects.clear();
    this.currentScene = null;
  }
}

export default SceneManager;