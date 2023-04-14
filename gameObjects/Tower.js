import Phaser from "/phaser.js";
import eventManager from "/EventManager.js";

const gunStates = {
  isIdle: 'isIdle',
  isRevingUp: 'isRevingUp',
  isFiring: 'isFiring',
  isCoolingDown: 'isCoolingDown'
}

export default class Tower extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y, texture, towerType) {
    super(scene, x, y, texture, towerType.textureId)

    this.towerType = towerType

    this.level = 0

    this.depth = 10 // so it's above the bullet fire
    this.range = towerType.range
    this.damage = towerType.damage
    this.burstCount = towerType.burstCount
    this.firePeriodMs = towerType.firePeriodMs
    this.revUpPeriodMs = towerType.revUpPeriodMs || 0
    this.cooldownPeriodMs = towerType.cooldownPeriodMs || 0
    this.currentBurst = 0
    this.cooldownTimestamp = 0
    this.lastFiredTimestamp = 0
    this.projectileSpeed = towerType.projectileSpeed
    this.splashRange = towerType.splashRange
    this.canHitTags = towerType.canHitTags || []
    this.gunState = gunStates.isIdle

    // TODO: reuse sound asset
    this.fireSound = towerType.fireSound
    this.fireSfx = scene.sound.add(this.towerType.fireSound.name, { loop: false, volume: 0.1 });
    if (this.fireSound.marker) {
      this.fireSfx.addMarker(this.fireSound.marker)
    } 

    this.revUpSound = towerType.revUpSound
    if (this.revUpSound) {
      this.revUpSfx = scene.sound.add(this.towerType.revUpSound.name, { loop: false, volume: 0.1 });
      if (this.revUpSound.marker) {
        this.revUpSfx.addMarker(this.revUpSound.marker)
      } 
    }

    this.cooldownSound = towerType.cooldownSound
    if (this.cooldownSound) {
      this.cooldownSfx = scene.sound.add(this.towerType.cooldownSound.name, { loop: false, volume: 0.1 });
      if (this.cooldownSound.marker) {
        this.cooldownSfx.addMarker(this.cooldownSound.marker)
      } 
    }

    this.explosionSound = scene.sound.add('explosion', { loop: false, volume: 0.1 })

    this.setInteractive()

    this.on('pointerdown', pointer => {
      eventManager.emit('towerSelected', this, pointer.worldX, pointer.worldY)
    })

    // TODO: show range
    this.on('pointermove', () => {
      if (!this.rangeCircle) {
        this.rangeCircle = scene.add.circle(this.x, this.y, this.range, 0xff0000)
        this.rangeCircle.alpha = 0.1
      }

    })

    this.on('pointerout', () => {
      if (this.rangeCircle) {
        this.rangeCircle.destroy()
        this.rangeCircle = null
      }
    })
  }


  update(timestamp, delta) {
    const enemiesInRange = []
    
    for (let enemy of this.scene.enemyGroup.getChildren()) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist < this.range) {
        enemiesInRange.push(enemy)
      }
    }

    this.fireAtEnemiesInRange(enemiesInRange)
  }

  startCoolingDown() {
    this.gunState = gunStates.isCoolingDown

    if (!this.alreadyCoolingDown) {
      this.playCooldownSfx()
      this.alreadyCoolingDown = this.scene.time.addEvent({
        delay: this.cooldownPeriodMs,
        callback: () => {
          this.alreadyCoolingDown = null
          this.gunState = gunStates.isIdle
          this.currentBurst = 0
        },
        loop: false
      })
    } 
  }

  startRevingUp() {
    this.gunState = gunStates.isRevingUp

    if (!this.alreadyRevingUp) {
      this.playRevUpSfx()      
      this.alreadyRevingUp = this.scene.time.addEvent({
      delay: this.revUpPeriodMs,
      callback: () => {
        this.alreadyRevingUp = null
        this.gunState = gunStates.isFiring
      },
      loop: false
      })
    } 
  }

  fireAtEnemiesInRange(enemiesInRange) {
    // filter enemiesInRange to only those that the tower can "see"
    enemiesInRange = enemiesInRange.filter(enemy => {
      for (let toHitTag of enemy.toHitTags) {
        if (!this.canHitTags.includes(toHitTag)) {
          // tower doesn't have the hit tags to "see" this enemy
          return false
        } 
      }
      return true
    })

    if (enemiesInRange.length == 0) {
      if (this.gunState === gunStates.isFiring) {
        this.startCoolingDown()
      }
      return
    }

    // sort by how far along the path they are
    enemiesInRange.sort((a, b) => (a.pathTween.totalProgress < b.pathTween.totalProgress) ? 1 : -1)

    const enemy = enemiesInRange[0]

    const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y)
    this.angle = angle * 180.0 / Math.PI 
 
    // fire on enemy
    const now = Date.now()

    if (this.gunState === gunStates.isFiring) {
      if (this.currentBurst < this.burstCount) {
        if (now - this.lastFiredTimestamp > this.firePeriodMs) {
          this.currentBurst += 1
          this.lastFiredTimestamp = now

          // the fire from the nozzle of the gun
          this.createGunBlaze()
          this.playFireSfx()

          if (this.projectileSpeed) {
            // use index 0 for now since that's the front of the line
            this.launchProjectile(enemiesInRange, 0)
          } else {
            this.burstFire(enemy)
          }
        }
      } else {
        this.startCoolingDown()
      }
    } else if (this.gunState === gunStates.isIdle) {
      this.startRevingUp()
    }
  }

  playFireSfx() {
    if (this.fireSound.marker) {
      this.fireSfx.play(this.fireSound.marker.name)
    } else {
      this.fireSfx.play()
    }
  }

  playRevUpSfx() {
    if (!this.revUpSound) {
      return
    }

    if (this.revUpSound.marker) {
      this.revUpSfx.play(this.revUpSound.marker.name)
    } else {
      this.revUpSfx.play()
    }
  }

  playCooldownSfx() {
    if (!this.cooldownSound) {
      return
    }

    if (this.cooldownSound.marker) {
      this.cooldownSfx.play(this.cooldownSound.marker.name)
    } else {
      this.cooldownSfx.play()
    }
  }

  launchProjectile(enemiesInRange, targetEnemyIndex) {
    const projectile = this.scene.add.sprite(this.x, this.y, 'td_tiles', 274)    
    projectile.depth = 200
    this.scene.physics.add.existing(projectile)

    projectile.body.setSize(32, 32)

    const direction = Phaser.Math.Rotate({x: 1, y: 0}, this.angle * Math.PI / 180)
    projectile.body.velocity.x = direction.x * this.projectileSpeed
    projectile.body.velocity.y = direction.y * this.projectileSpeed


    // logic for when the projectile hits an enemy
    this.scene.physics.add.overlap(projectile, this.scene.enemyGroup, (projectile, enemy) => {

      // projectile may have already been destroyed by a collision with another enemy
      if (!projectile || !projectile.body) {
        return
      }

      projectile.body.enable = false
      projectile.destroy()

      const blastImage = this.scene.add.image(enemy.x, enemy.y, 'td_tiles', 21)
      blastImage.displayWidth = this.splashRange
      blastImage.displayHeight = this.splashRange
      this.explosionSound.play()

      this.scene.time.addEvent({
        delay: 500,
        callback: () => blastImage.destroy(),
        loop: false
      })

      // this is an optimization to only search for enemies in range. However, the splashRange could make
      // the splash damage hit enemies outside of range.
      for (let enemyInRange of enemiesInRange) {
        const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, enemyInRange.x, enemyInRange.y)

        if (dist <= this.splashRange) {
          enemyInRange.reduceHealthBy(this.damage)
          this.scene.addCash(this.damage)
        } 
      }
    })
  }

  createGunBlaze() {
    const bullet = this.scene.add.sprite(this.x, this.y, 'td_tiles', 295)
    bullet.setScale(0.75)
    bullet.setOrigin(0.65, -.15)
    bullet.angle = this.angle - 90

    // TODO: reuse bullet sprites
    this.scene.time.addEvent({
      delay: 100,
      callback: () => bullet.destroy(),
      loop: false
    })
  }

  burstFire(enemy) {
    enemy.reduceHealthBy(this.damage)
    this.scene.addCash(this.damage)
  }

}

