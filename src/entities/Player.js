import Phaser from "phaser";
import initAnimations from "./anims/playerAnims";
import collidable from "../mixins/collidable";

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");

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
    this.playerSpeed = 200;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.jumpCount = 0;
    this.concecutiveJumps = 1;
    //if you want to access to scene from a arcade super class you need to define it like that, otherwise "this" will refer to player
    this.setSize(20, 38);

    this.body.setGravityY(this.gravity);
    this.setCollideWorldBounds(true);
    this.setOrigin(1, 1);

    initAnimations(this.scene.anims);
  }

  initEvents() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    // (eventtofireafter, functiontocall, context)
    //execution above is a trick to get update function from a scene, Arcade Sprite usually don't have such a thing
  }

  update() {
    const { left, right, space, up } = this.cursors;
    const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space); // only returns true pey key press
    const isUpJustDown = Phaser.Input.Keyboard.JustDown(up); // only returns true pey key press
    const onFloor = this.body.onFloor();

    if (left.isDown) {
      this.setVelocityX(-this.playerSpeed);
      this.setFlipX(true);
    } else if (right.isDown) {
      this.setVelocityX(this.playerSpeed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if ((isSpaceJustDown || isUpJustDown) && (onFloor || this.jumpCount < this.concecutiveJumps)) {
      this.setVelocityY(-this.playerSpeed * 1.4);
      this.jumpCount++;
    }
    if (onFloor) {
      this.jumpCount = 0;
    }

    onFloor ? (this.body.velocity.x !== 0 ? this.play("run", true) : this.play("idle", true)) : this.play("jump", true);
    //dont play it again if it's playing
    //second value ignore if playing
  }
}

export default Player;

//Life Cycle
//   preUpdate(time, delta) {
//     super.preUpdate(time, delta); // it's a good practice to call preupdate on the super class, otherwise it may fail during the animations and so on
//     const { left, right } = this.cursors;

//     if (left.isDown) {
//       this.setVelocityX(-this.playerSpeed);
//     } else if (right.isDown) {
//       this.setVelocityX(this.playerSpeed);
//     } else {
//       this.setVelocityX(0);
//     }
//   }
