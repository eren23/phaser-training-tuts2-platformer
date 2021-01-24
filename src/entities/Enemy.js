import Phaser from "phaser";
import collidable from "../mixins/collidable";

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key) {
    super(scene, x, y, key);

    scene.add.existing(this); // our players sprites
    scene.physics.add.existing(this); // physics

    //Mixins
    Object.assign(this, collidable); // what we do here is basically  we copy all the collidable properties to this

    this.init();
    this.initEvents();
  }

  //Customs

  init() {
    this.gravity = 500;
    this.speed = 150;

    //if you want to access to scene from a arcade super class you need to define it like that, otherwise "this" will refer to player

    this.body.setGravityY(this.gravity);
    this.setSize(30, 45);
    this.setOffset(5, 20);
    this.setCollideWorldBounds(true);
    this.setImmovable(true);
    this.setOrigin(1, 1);
  }

  initEvents() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    // (eventtofireafter, functiontocall, context)
    //execution above is a trick to get update function from a scene, Arcade Sprite usually don't have such a thing
  }

  update(time, delta) {
    this.setVelocityX(30);
  }
}

export default Enemy;
