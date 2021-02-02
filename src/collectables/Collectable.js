import Phaser from "phaser";

class Collectable extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key) {
    super(scene, x, y);
    scene.add.existing(this);
    this.score = 1;
    scene.tweens.add({
      targets: this,
      y: this.y - Phaser.Math.Between(2.5, 3.25),
      duration: Phaser.Math.Between(1500, 2500),
      repeat: -1,
      easy: "linear",
      yoyo: true,
    });
  }
}

export default Collectable;
