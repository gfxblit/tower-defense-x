import Phaser from "/phaser.js";

export default class Bar {
  constructor (
      scene,
      value,
      maxValue,
      x,
      y,
      width,
      height,
      style = {
        fontSize: '24px',
        fill: '#fff',
        strokeThickness: 2
      }
    ) {
    this.maxValue = maxValue
    this.value = value
    this.width = width
    this.height = height
    this.x = x - this.width / 2
    this.y = y - this.height / 2

    this.bar = scene.add.graphics()
    this.text = scene.add.text(x, y, this.value + '/' + this.maxValue, style)
      .setOrigin(0.5)
    this.draw()
  }

  setValue (value) {
    this.value = Phaser.Math.Clamp(value, 0, this.maxValue)
    this.draw()
  }

  setPosition(x, y) {
    this.x = x - this.width/2
    this.y = y - this.height/2
    this.text.x = x
    this.text.y = y
  }

  draw() {
    this.bar.clear()
    this.bar.fillStyle(0x000000, 0.50)
    this.bar.fillRoundedRect(this.x, this.y, this.width, this.height, 5)

    const frac = this.value / this.maxValue
    if (frac > .66) {
      this.bar.fillStyle(0x00ff00, 1.0)
    } else if (frac > .33) {
      this.bar.fillStyle(0xf0f000, 1.0)
    } else {
      this.bar.fillStyle(0xff0000, 1.0)
    }

    this.bar.fillRoundedRect(
        this.x+2,
        this.y+2,
        frac * this.width-4,
        this.height-4,
        5)
    
    this.text.text = this.value + '/' + this.maxValue
  }

  destroy() {
    this.bar.destroy()
    this.text.destroy()
  }
}
