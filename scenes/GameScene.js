import Phaser from "/phaser.js";

import { getWaves, getEnemyTypes, speeds, towerTypes } from "/desert.js"
import Tower from "/gameObjects/Tower.js"
import Enemy from "/gameObjects/Enemy.js";
import eventManager from "/EventManager.js";
import waveManager from "/managers/WaveManager.js"

const OFFLINE_MODE = false
const spritesheetKeyName = 'spritesheet'
const enemyTypes = getEnemyTypes()

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "gameScene", active: true })
    this.health = 100
    this.cash = 1000

    this.nextEnemySpawnIndex = 0
    this.lastSpawnTimeMs = 0
    this.spawnPeriodMs = 1000
    this.waveStartTimeMs = Date.now()
    this.waves = getWaves()
    this.alreadySpawnedFirstEnemyOfWave = false
  }

  preloadOffline() {
    this.load.spritesheet(
      'td_tiles',
      '/data/offline/towerDefense_tilesheet.png',
      {frameWidth: 64, frameHeight: 64}
    )

    this.load.atlasXML(
      spritesheetKeyName,
      '/data/offline/spritesheet_characters.png',
      '/data/spritesheet_characters.xml'
    )
  }

  preloadOnline() {
    this.load.spritesheet(
      'td_tiles',
      'https://cdn.glitch.me/0a8f797e-3429-459d-bdce-298abeaa3eea%2FtowerDefense_tilesheet.png?v=1635114570321',
      {frameWidth: 64, frameHeight: 64}
    )

    this.load.atlasXML(
      spritesheetKeyName,
      'https://cdn.glitch.me/0a8f797e-3429-459d-bdce-298abeaa3eea%2Fspritesheet_characters.png?v=1635214825753',
      '/data/spritesheet_characters.xml'
    )

    this.load.audio("m4a1", ['https://cdn.glitch.me/0a8f797e-3429-459d-bdce-298abeaa3eea%2Fm4a1-1.wav?v=1635309860308'])
    this.load.audio('m79', ['https://cdn.glitch.me/0a8f797e-3429-459d-bdce-298abeaa3eea%2Fric_metal-1.wav?v=1635538194159'])
    this.load.audio('explosion', ['https://cdn.glitch.me/0a8f797e-3429-459d-bdce-298abeaa3eea%2Fsg_explode.wav?v=1635610724804'])
    this.load.audio('minigun', ['https://cdn.glitch.me/0a8f797e-3429-459d-bdce-298abeaa3eea%2FMinigun-Jim.wav?v=1635693408119'])
  }

  preload() {
    if (OFFLINE_MODE) {
      this.preloadOffline()
    } else {
      this.preloadOnline()
    }

    this.load.tilemapTiledJSON(
      'td_tilemap',
      '/data/td-map.json'
    )

    this.load.on('complete', () => this.scene.launch(
      'uiScene',
      { health: this.health,
        cash: this.cash,
        wave: waveManager.wave }
    ))
  }

  create() {
    const map = this.make.tilemap({key: 'td_tilemap'})
    const tileset = map.addTilesetImage('td', 'td_tiles')
    const mapLayer = map.createLayer('world', tileset, 0, 0)

    const pathObj = map.findObject("path", obj => true);
    
    this.path = new Phaser.Curves.Path()
    for (let i = 0; i < pathObj.polyline.length - 1; ++i) {
      const line = new Phaser.Curves.Line(
        [pathObj.polyline[i].x + pathObj.x, pathObj.polyline[i].y + pathObj.y,
         pathObj.polyline[i+1].x + pathObj.x, pathObj.polyline[i+1].y + pathObj.y])
      this.path.add(line)
    }

    // cache the path length
    this.pathLength = this.path.getLength()

    this.enemyGroup = this.physics.add.group()

    eventManager.on('enemyFinishedPath', (enemy) => {
      this.health -= enemy.health
      eventManager.emit('healthChanged', this.health)
      enemy.body.enable = false
      enemy.destroy()
    })

    this.towerGroup = this.physics.add.group()

    mapLayer.setInteractive()

    mapLayer.on('pointerdown', pointer => {
      if (this.selectedTowerType) {
        const camera = this.cameras.main
        this.spawnTower(
          pointer.worldX,
          pointer.worldY,
          this.selectedTowerType)

        this.selectedTowerType = null
        eventManager.emit('placedSelectedTowerType')
      }
    })

    this.input.on('pointerdown', pointer => {
      pointer.worldDownX = pointer.worldX 
      pointer.worldDownY = pointer.worldY
    })

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        const camera = this.cameras.main

        camera.setScroll(
          pointer.worldDownX - pointer.x,
          pointer.worldDownY - pointer.y)
      }
    })

    eventManager.on('selectedTowerType', (selectedTowerType) => {
      this.selectedTowerType = selectedTowerType
    })

    eventManager.on('healthChanged', health => {
      if (health <= 0) {
        this.game.scene.pause(this.scene.key)
      }
    })
  }

  update(timestamp, delta) {
    for (let tower of this.towerGroup.getChildren()) {
      tower.update(timestamp, delta)
    }

    this.spawnEnemy(timestamp, this.path)

    for (let enemy of this.enemyGroup.getChildren()) {
      enemy.update()

      // destroy any enemies with 0 health
      if (enemy.health <= 0) {
        enemy.destroy()
      }
    }
  }

  addCash(amount) {
    this.cash += amount
    eventManager.emit('cashChanged', this.cash)
  }

  spawnTower(x, y, towerType) {
    // not enough money
    if (this.cash < towerType.cost) {
      return
    }

    this.cash -= towerType.cost
    eventManager.emit('cashChanged', this.cash)

    const tower = new Tower(this, x, y, spritesheetKeyName, towerType)
    this.add.existing(tower)
    this.towerGroup.add(tower)
  }

  spawnEnemy(timestamp, path) {
    if (path.getPoints().length == 0) {
      console.warn('Attempting to add enemy to empty path')
      return
    }

    const now = Date.now()

    // abort if we recently spawned an enemy
    if (now - this.lastSpawnTimeMs < this.spawnPeriodMs) {
      return
    }

    const enemyType = waveManager.getEnemyType()
    if (!enemyType) {
      return
    }

    this.lastSpawnTimeMs = now

    // const firstPoint = path.getPoints()[0]
    const firstPoint = [0, 0]
    const enemy = new Enemy(
      this,
      firstPoint.x,
      firstPoint.y,
      path,
      spritesheetKeyName,
      enemyType)
    this.add.existing(enemy)
    this.enemyGroup.add(enemy)

    eventManager.emit('enemySpawned', now)
  }
}

