import Phaser from "/phaser.js";

export default class StatsDialog {
  constructor (scene, tower, x, y) {
    const towerType = tower.towerType

    // TODO: add a container and put rect and text into it
    let text = '[Max level]'
    if (tower.level < towerType.upgrades.length) {
      text = '[Upgrade cost: $' + towerType.upgrades[tower.level].cost + ']'
    }

    text += `\nRange: ${tower.range} -> ${this.getUpgradedStat(tower, 'range')}`
    text += `\nDamage: ${tower.damage} -> ${this.getUpgradedStat(tower, 'damage')}`
    const upgradedFirePeriodMs = this.getUpgradedStat(tower, 'firePeriodMs')
    text += `\nFirerate: ${tower.firePeriodMs / 1000.0} -> ${upgradedFirePeriodMs / 1000.0}`
    text += `\nCan hit: ${tower.canHitTags} -> ${this.getUpgradedStat(tower, 'canHitTags')}`

    const dialogWidth = 225
    const dialogHeight = 125
    this.textBackground = scene.add.graphics()
    this.textBackground.fillStyle(0x0f0f0f, 0.5)
    this.textBackground.fillRoundedRect(
        x - dialogWidth/2,
        y - dialogHeight/2,
        dialogWidth,
        dialogHeight,
        10)

    this.upgradeText = scene.add.text(x, y, text, {
      fontSize: '16px',
      fill: '#fff',
    }).setOrigin(0.5)

    this.upgradeText.setPadding(10, 10);

    this.upgradeText.depth = 100
    this.upgradeText.setInteractive()
    this.upgradeText.on('pointerdown', () => {
        // upgrade
        this.upgradeText.destroy()
        this.textBackground.destroy()

        // if max level
        if (tower.level == tower.towerType.upgrades.length) {
          return
        }

        // not enough cash
        if (tower.scene.cash < tower.towerType.upgrades[tower.level].cost) {
          return
        }

        tower.scene.addCash(-tower.towerType.upgrades[tower.level].cost)
        
        const upgrades = tower.towerType.upgrades[tower.level].upgrade
        for (let prop in upgrades) {
          tower[prop] = upgrades[prop]
          console.log('upgrading: ', prop, upgrades[prop])
        }

        tower.level++
    })
    this.upgradeText.on('pointerout', () => {
      this.upgradeText.destroy()
      this.textBackground.destroy()
    })
  }

  getUpgradedStat(tower, statName) {
    if (tower.level >= tower.towerType.upgrades.length) {
        return tower[statName]
    }
    return tower.towerType.upgrades[tower.level].upgrade[statName] || tower[statName]
  }

}
