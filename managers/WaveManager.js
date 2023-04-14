import eventManager from "/EventManager.js";
import { getWaves, getEnemyTypes, speeds } from "/desert.js"

class WaveManager {
  constructor() {
    this.wave = 0
    this.waves = getWaves()
    this.enemyIndex = 0
    this.enemyTypes = getEnemyTypes()

    eventManager.on('enemySpawned', timestamp => {
      if (this.enemyIndex < this.waves[this.wave].length - 1) {
          this.enemyIndex++
          return
      }

      if (this.wave < this.waves.length -1) {
          this.wave++
          eventManager.emit('waveChanged', this.wave)
          this.enemyIndex = 0
      }
    })
  }

  getEnemyType() {
    if (this.wave >= this.waves.length) {
        return null
    }

    if (this.enemyIndex >= this.waves[this.wave].length) {
        return null
    }
    const enemyType = this.waves[this.wave][this.enemyIndex]
    return this.enemyTypes[enemyType]
  }
}

const waveManager = new WaveManager()

export default waveManager