import Phaser from "phaser";
import collidable from "../mixins/collidable";
import anims from "../mixins/anims";

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key) {
    super(scene, x, y, key);
    this.config = scene.config;

    scene.add.existing(this); // our players sprites
    scene.physics.add.existing(this); // physics

    //Mixins
    Object.assign(this, collidable); // what we do here is basically  we copy all the collidable properties to this
    Object.assign(this, anims);

    this.init();
    this.initEvents();
  }

  //Customs

  init() {
    this.gravity = 500;
    this.speed = 75;
    this.timeFromLastTurn = 0;
    this.maxPatrolDistance = 250;
    this.currentPatrolDistance = 0;
    this.rayGraphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xaa00aa } });
    this.damage = 10;
    this.health = 20;
    //if you want to access to scene from a arcade super class you need to define it like that, otherwise "this" will refer to player
    this.platformsCollidersLayer = null;
    this.body.setGravityY(this.gravity);

    this.setCollideWorldBounds(true);
    this.setImmovable(true);
    this.setOrigin(1, 1);
    this.setVelocityX(this.speed);
  }

  initEvents() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    // (eventtofireafter, functiontocall, context)
    //execution above is a trick to get update function from a scene, Arcade Sprite usually don't have such a thing
  }

  update(time, delta) {
    if (this.getBounds().bottom > 600) {
      this.scene.events.removeListener(Phaser.Scenes.Events.UPDATE, this.update, this);
      this.setActive(false);
      this.rayGraphics.clear();
      this.destroy();
      return;
    }
    this.partol(time);
  }

  partol(time) {
    if (!this.body || !this.body.onFloor()) {
      return;
    }
    this.currentPatrolDistance += Math.abs(this.body.deltaX());
    const { ray, hasHit } = this.raycast(this.body, this.platformsCollidersLayer, {
      raylength: 30,
      precision: 0,
      steepnes: 0.3,
    });

    if ((!hasHit || this.currentPatrolDistance >= this.maxPatrolDistance) && this.timeFromLastTurn + 100 < time) {
      this.setFlipX(!this.flipX);
      this.setVelocityX((this.speed = -this.speed));
      this.timeFromLastTurn = time;
      this.currentPatrolDistance = 0;
    }

    if (this.config.debug && ray) {
      this.rayGraphics.clear();
      this.rayGraphics.strokeLineShape(ray);
    }
  }

  setPlatformCollider(platformsCollidersLayer) {
    this.platformsCollidersLayer = platformsCollidersLayer;
  }

  takesHit(source) {
    this.health -= source.damage;
    source.deliversHit(this);
    if (this.health <= 0) {
      this.setTint(0xff0000);
      this.setVelocity(0, -200);
      this.body.checkCollision.none = true;
      this.setCollideWorldBounds(false);
    }
  }
}

export default Enemy;
