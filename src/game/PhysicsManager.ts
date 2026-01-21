import * as Phaser from 'phaser';
import type { PhysicsConfig } from '../types';

interface CollisionGroup {
  name: string;
  group: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup;
  objects: Phaser.Physics.Arcade.Sprite[];
}

class PhysicsManager {
  private scene: Phaser.Scene;
  private collisionGroups: Map<string, CollisionGroup> = new Map();
  private collisionRules: Map<string, string[]> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeDefaultGroups();
    this.setupDefaultCollisions();
  }

  private initializeDefaultGroups() {
    // Create default physics groups
    this.createGroup('players', false);
    this.createGroup('platforms', true);
    this.createGroup('collectibles', false);
    this.createGroup('enemies', false);
    this.createGroup('projectiles', false);
  }

  private setupDefaultCollisions() {
    // Define default collision rules
    this.addCollisionRule('players', ['platforms', 'enemies']);
    this.addCollisionRule('enemies', ['platforms']);
    this.addCollisionRule('collectibles', ['platforms']);
    this.addCollisionRule('projectiles', ['platforms', 'enemies']);
  }

  createGroup(name: string, isStatic: boolean = false): Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup {
    let group: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup;
    
    if (isStatic) {
      group = this.scene.physics.add.staticGroup();
    } else {
      group = this.scene.physics.add.group();
    }

    this.collisionGroups.set(name, {
      name,
      group,
      objects: []
    });

    return group;
  }

  getGroup(name: string): Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup | undefined {
    return this.collisionGroups.get(name)?.group;
  }

  addToGroup(groupName: string, sprite: Phaser.Physics.Arcade.Sprite) {
    const collisionGroup = this.collisionGroups.get(groupName);
    if (!collisionGroup) {
      console.warn(`Physics group "${groupName}" not found`);
      return;
    }

    collisionGroup.group.add(sprite);
    collisionGroup.objects.push(sprite);
  }

  removeFromGroup(groupName: string, sprite: Phaser.Physics.Arcade.Sprite) {
    const collisionGroup = this.collisionGroups.get(groupName);
    if (!collisionGroup) return;

    collisionGroup.group.remove(sprite);
    const index = collisionGroup.objects.indexOf(sprite);
    if (index > -1) {
      collisionGroup.objects.splice(index, 1);
    }
  }

  addCollisionRule(group1: string, group2: string | string[]) {
    const groups = Array.isArray(group2) ? group2 : [group2];
    
    if (!this.collisionRules.has(group1)) {
      this.collisionRules.set(group1, []);
    }
    
    const existingRules = this.collisionRules.get(group1)!;
    groups.forEach(group => {
      if (!existingRules.includes(group)) {
        existingRules.push(group);
      }
    });
  }

  setupCollisions() {
    this.collisionRules.forEach((targetGroups, sourceGroup) => {
      const sourceGroupObj = this.getGroup(sourceGroup);
      if (!sourceGroupObj) return;

      targetGroups.forEach(targetGroup => {
        const targetGroupObj = this.getGroup(targetGroup);
        if (!targetGroupObj) return;

        // Set up collision based on group types
        if (sourceGroup === 'players' && targetGroup === 'collectibles') {
          // Overlap for collectibles (don't stop movement)
          this.scene.physics.add.overlap(
            sourceGroupObj,
            targetGroupObj,
            this.handleCollectiblePickup,
            undefined,
            this
          );
        } else if (sourceGroup === 'players' && targetGroup === 'enemies') {
          // Collision for enemies (damage player)
          this.scene.physics.add.collider(
            sourceGroupObj,
            targetGroupObj,
            this.handlePlayerEnemyCollision,
            undefined,
            this
          );
        } else {
          // Standard collision (stop movement)
          this.scene.physics.add.collider(sourceGroupObj, targetGroupObj);
        }
      });
    });
  }

  configurePhysics(config: PhysicsConfig) {
    if (!this.scene.physics.world) return;

    // Set world gravity
    this.scene.physics.world.gravity.x = config.gravity.x;
    this.scene.physics.world.gravity.y = config.gravity.y;

    // Set world bounds
    this.scene.physics.world.setBounds(
      config.bounds.x,
      config.bounds.y,
      config.bounds.width,
      config.bounds.height
    );

    // Enable debug mode if requested
    this.scene.physics.world.drawDebug = config.debug;
  }

  setObjectPhysics(sprite: Phaser.Physics.Arcade.Sprite, properties: Record<string, any>) {
    if (!sprite.body) return;

    // Set bounce
    if (properties.bounce !== undefined) {
      sprite.setBounce(properties.bounce);
    }

    // Set friction
    if (properties.friction !== undefined) {
      sprite.body.setFriction(properties.friction, properties.friction);
    }

    // Set mass
    if (properties.mass !== undefined) {
      sprite.body.setMass(properties.mass);
    }

    // Set drag
    if (properties.drag !== undefined) {
      sprite.setDrag(properties.drag);
    }

    // Set collision bounds
    if (properties.collisionBounds) {
      const bounds = properties.collisionBounds;
      sprite.body.setSize(bounds.width, bounds.height, bounds.offsetX, bounds.offsetY);
    }

    // Set immovable for static objects
    if (properties.isStatic) {
      sprite.body.setImmovable(true);
    }

    // Set world bounds collision
    if (properties.collideWorldBounds !== false) {
      sprite.setCollideWorldBounds(true);
    }
  }

  applyForce(sprite: Phaser.Physics.Arcade.Sprite, force: { x: number; y: number }) {
    if (!sprite.body) return;

    sprite.body.velocity.x += force.x;
    sprite.body.velocity.y += force.y;
  }

  applyImpulse(sprite: Phaser.Physics.Arcade.Sprite, impulse: { x: number; y: number }) {
    if (!sprite.body) return;

    sprite.setVelocity(sprite.body.velocity.x + impulse.x, sprite.body.velocity.y + impulse.y);
  }

  setVelocity(sprite: Phaser.Physics.Arcade.Sprite, velocity: { x: number; y: number }) {
    sprite.setVelocity(velocity.x, velocity.y);
  }

  getVelocity(sprite: Phaser.Physics.Arcade.Sprite): { x: number; y: number } {
    if (!sprite.body) return { x: 0, y: 0 };
    return { x: sprite.body.velocity.x, y: sprite.body.velocity.y };
  }

  isOnGround(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    return sprite.body?.touching.down || false;
  }

  isMoving(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    if (!sprite.body) return false;
    return Math.abs(sprite.body.velocity.x) > 1 || Math.abs(sprite.body.velocity.y) > 1;
  }

  private handleCollectiblePickup(player: Phaser.Physics.Arcade.Sprite, collectible: Phaser.Physics.Arcade.Sprite) {
    // Disable the collectible
    collectible.disableBody(true, true);

    // Get points value
    const points = collectible.getData('points') || 10;
    
    // Emit custom event
    this.scene.events.emit('collectible-picked-up', {
      player,
      collectible,
      points
    });

    // Play sound if available
    const soundKey = collectible.getData('collectSound');
    if (soundKey && this.scene.sound.get(soundKey)) {
      this.scene.sound.play(soundKey);
    }
  }

  private handlePlayerEnemyCollision(player: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
    // Get damage value
    const damage = enemy.getData('damage') || 10;
    const currentHealth = player.getData('health') || 100;
    const newHealth = Math.max(0, currentHealth - damage);
    
    player.setData('health', newHealth);

    // Apply knockback
    const knockbackForce = 200;
    const direction = player.x < enemy.x ? -1 : 1;
    player.setVelocityX(direction * knockbackForce);

    // Visual feedback
    player.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      player.clearTint();
    });

    // Emit custom event
    this.scene.events.emit('player-hit', {
      player,
      enemy,
      damage,
      newHealth
    });

    // Check for game over
    if (newHealth <= 0) {
      this.scene.events.emit('player-died', { player });
    }
  }

  enableDebugMode(enabled: boolean = true) {
    if (this.scene.physics.world) {
      this.scene.physics.world.drawDebug = enabled;
    }
  }

  pausePhysics() {
    this.scene.physics.pause();
  }

  resumePhysics() {
    this.scene.physics.resume();
  }

  resetPhysics() {
    // Reset all physics bodies
    this.collisionGroups.forEach(group => {
      group.objects.forEach(sprite => {
        if (sprite.body) {
          sprite.setVelocity(0, 0);
          sprite.setAcceleration(0, 0);
        }
      });
    });
  }

  cleanup() {
    this.collisionGroups.clear();
    this.collisionRules.clear();
  }

  // Utility methods for common physics operations
  static createJumpVelocity(jumpPower: number, gravityY: number): number {
    // Calculate jump velocity needed to reach desired height
    return -Math.sqrt(2 * gravityY * jumpPower);
  }

  static calculateTrajectory(
    startPos: { x: number; y: number },
    velocity: { x: number; y: number },
    gravity: number,
    steps: number = 50
  ): { x: number; y: number }[] {
    const trajectory: { x: number; y: number }[] = [];
    const timeStep = 0.1;

    for (let i = 0; i < steps; i++) {
      const t = i * timeStep;
      const x = startPos.x + velocity.x * t;
      const y = startPos.y + velocity.y * t + 0.5 * gravity * t * t;
      
      trajectory.push({ x, y });
      
      // Stop if we hit the ground (assuming ground is at y = 600)
      if (y >= 600) break;
    }

    return trajectory;
  }
}

export default PhysicsManager;