import Enemy from "./Enemy";
import initAnims from "./anims/snakyAnims";

class Snaky extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "snaky");
    initAnims(scene.anims);
  }

  init() {
    super.init();
    this.setSize(this.width - 20, 45);
    this.setOffset(10, 20);
    this.speed = 50;
  }

  update(time, delta) {
    // connects with the enemy update
    super.update(time, delta);
    if (!this.active) {
      return;
    }
    if (this.isPlayingAnims("snaky-hurt")) {
      return;
    }
    this.play("snaky-walk", true);
  }

  takesHit(source) {
    super.takesHit(source);
    this.play("snaky-hurt", true);
  }
}

export default Snaky;
