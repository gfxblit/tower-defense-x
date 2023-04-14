import eventManager from "/EventManager.js"

export default class TowersToolbar {
  constructor(scene, spritesheetKeyName, towerTypes) {
    // dimensions of the preview/thumbnail
    const previewWidth = 64
    const previewHeight = 64
    const width = scene.sys.game.canvas.width
    const margin = 10
    const height = scene.sys.game.canvas.height - margin - previewHeight/2
    const spacing = 5

    const offset = (width - towerTypes.length * (previewWidth + spacing)) / 2
    let x = offset
    for (let towerType of towerTypes) {
      const roundedRect = scene.add.graphics()
      roundedRect.fillStyle(0x0f0f0f, 0.5)
      roundedRect.fillRoundedRect(x-32, height-30, 64, 64, 15)
      this.clickableTowerType = scene.add.sprite(x, height, spritesheetKeyName, towerType.textureId)

      this.costText = scene.add.text(x, height + previewHeight/2 - 5, '$' + towerType.cost, {
        fontSize: '14px',
        fill: '#0f0',
      }).setOrigin(0.5)

      this.clickableTowerType.setInteractive()
      this.clickableTowerType.on('pointerdown', (pointer) => {
        eventManager.emit('selectedTowerType', towerType)
      })

      x += previewWidth + spacing
    }
  }
}