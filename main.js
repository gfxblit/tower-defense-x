import Phaser from "/phaser.js";
import GameScene from "/scenes/GameScene.js";
import UIScene from "/scenes/UIScene.js";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      // debug: true
    }
  },
  backgroundColor: 'rgba(46, 204, 113, 1)',
  scene: [GameScene, UIScene],
});
