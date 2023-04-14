import Bar from "/gameObjects/Bar.js";
import eventManager from "/EventManager.js";
import Phaser from "/phaser.js";

export default class Enemy extends Phaser.GameObjects.PathFollower {

  constructor(scene, x, y, path, textureName, enemyType) {
    super(scene, path, x, y, textureName, enemyType.textureId)

    this.speed = enemyType.speed
    this.health = enemyType.health
    this.maxHealth = enemyType.health
    this.tint = enemyType.tint || 0xffffff
    this.toHitTags = enemyType.toHitTags || []

    if (enemyType.scale) {
      this.setScale(enemyType.scale)
    }

    const duration = scene.pathLength / this.speed * 10000 // in ms

    this.startFollow({
      duration: duration,
      yoyo: false,
      repeat: 0,
      rotateToPath: true,
      verticalAdjust: true
    });

    this.setInteractive()

    this.pathTween.on('complete', () => eventManager.emit('enemyFinishedPath', this))
  }

  reduceHealthBy(amount) {
    this.health -= amount
  }

  update() {
    const pointer = this.scene.input.activePointer
    const pointerOver = this.getBounds().contains(
      pointer.worldX,
      pointer.worldY)

    if (pointerOver) {
      if (!this.enemyHealthBar) {
        this.enemyHealthBar = new Bar(
          this.scene,
          this.health,
          this.maxHealth,
          pointer.worldX,
          pointer.worldY-10,
          100,
          20,
          {
            fontSize: '14px',
            fill: '#fff',
            strokeThickness: 2
          }
        )
      } else {
        this.enemyHealthBar.setPosition(pointer.worldX, pointer.worldY-10)
        this.enemyHealthBar.setValue(this.health)

      }
    } else {
      if (this.enemyHealthBar) {
        this.enemyHealthBar.destroy()
        this.enemyHealthBar = null
      }
    }
  }

  destroy() {
    this.pathTween.off('complete')
    if (this.enemyHealthBar) {
      this.enemyHealthBar.destroy()
      this.enemyHealthBar = null
    }

    super.destroy()
  }
}