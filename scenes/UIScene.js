import Phaser from "/phaser.js";
import TowersToolbar from "/TowersToolbar.js"
import { towerTypes } from "/desert.js"
import { pointerModes } from "/pointer.js";
import eventManager from "/EventManager.js";
import Bar from "/gameObjects/Bar.js"
import StatsDialog from "/gameObjects/StatsDialog.js";

// TODO: think of way to share this const with Game scene
const spritesheetKeyName = 'spritesheet'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "uiScene" })
    
    this.pointerMode = pointerModes.select
    this.selectedTowerType = null
  }

  init(data) {
    this.data.health = data.health
    this.data.cash = data.cash
    this.data.wave = data.wave + 1
  }

  create() {
    this.healthBarWidth = 256
    this.healthBar = new Bar(
      this,
      this.data.health,
      this.data.health,
      this.sys.game.canvas.width/2,
      20,
      this.healthBarWidth,
      32)

    this.cashText = this.add.text(600, 725, '$' + this.data.cash, {
      fontSize: '16px',
      fill: '#0f0',
      strokeThickness: 1.5
    })
    this.waveText = this.add.text(475, 45, 'WAVE ' + this.data.wave, {
      fontSize: '20px',
      fill: '#fff',
      strokeThickness: 1,
    })

    this.towersToolbar = new TowersToolbar(
        this,
        spritesheetKeyName,
        [ towerTypes.soldier, towerTypes.demoman, towerTypes.minigunner ])

    // todo: move this back to the Game scene's mapyLayer pointer down, somehow check i
    // the uiScene has selected a tower
    eventManager.on('selectedTowerType', selectedTowerType => {
      const pointer = this.input.activePointer

      this.pointerMode = pointerModes.placingTower
      this.selectedTowerPreviewImage = this.add.image(
          pointer.x,
          pointer.y,
          spritesheetKeyName,
          selectedTowerType.textureId)
      this.selectedTowerPreviewImage.alpha = 0.5
    })

    eventManager.on('placedSelectedTowerType', () => {
      this.pointerMode = pointerModes.select
      this.selectedTowerPreviewImage.destroy()
    })

    this.input.on('pointermove', pointer => {
      if (this.pointerMode == pointerModes.placingTower) {
        this.selectedTowerPreviewImage.x = pointer.x
        this.selectedTowerPreviewImage.y = pointer.y
      } 
    })

    eventManager.on('healthChanged', health => {
      this.data.health = health
      this.healthBar.setValue(health)
      if (health <= 0) {
        this.addGameOverWindow()
      }
    })

    eventManager.on('cashChanged', cash => {
      this.data.cash = cash
      this.cashText.text = '$' + this.data.cash
    })

    eventManager.on('waveChanged', wave => {
      this.data.wave = wave
      this.waveText.text = 'WAVE ' + (this.data.wave + 1)
    })

    eventManager.on('towerSelected', (tower, x, y) => {
      this.statsDialog = new StatsDialog(this, tower, x, y)
    })
  }

  update(timestamp, delta) {
  }

  addGameOverWindow() {
    const width = 500
    const height = 200
    const gameWidth = this.sys.game.canvas.width
    const gameHeight = this.sys.game.canvas.height
    const rect = this.add.graphics()
    rect.fillStyle(0x000000, 0.75)
    rect.fillRect(0, 0, gameWidth, gameHeight)

    rect.fillStyle(0xffffff, 1.0)
    rect.fillRoundedRect(gameWidth/2 - width/2, gameHeight/2 - height/2, width, height, 10)

    const text = this.add.text(gameWidth/2, gameHeight/2, "Game Over!", {
      fontSize: '64px',
      fill: '#000',
      strokeThickness: 2
    }).setOrigin(0.5)
  }
}
