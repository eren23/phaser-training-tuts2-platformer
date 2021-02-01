import Phaser from "phaser";
import HealthBar from "../hud/HealthBar";
import initAnimations from "./anims/playerAnims";
import collidable from "../mixins/collidable";
import anims from "../mixins/anims";
import Projectiles from "../attacks/Projectiles";
import MeleeWeapon from "../attacks/MeleeWeapon";
import { getTimestamp } from "../utils/functions";

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");

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
    this.playerSpeed = 200;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.jumpCount = 0;
    this.concecutiveJumps = 1;
    this.hasBeenHit = false;
    const bounceRange = [90, 250];
    this.bounceVelocity = Phaser.Math.Between(...bounceRange);

    this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
    this.projectiles = new Projectiles(this.scene, "iceball-1");
    this.MeleeWeapon = new MeleeWeapon(this.scene, 0, 0, "sword-default");
    this.timeFromLastSwing = null;
    this.health = 100;
    this.hp = new HealthBar(
      this.scene,
      this.scene.config.leftTopCorner.x + 5,
      this.scene.config.leftTopCorner.y + 5,
      2,
      this.health
    );
    //if you want to access to scene from a arcade super class you need to define it like that, otherwise "this" will refer to player
    this.setSize(20, 38);
    this.body.setGravityY(this.gravity);
    this.setCollideWorldBounds(true);
    this.setOrigin(1, 1);

    initAnimations(this.scene.anims);

    this.handleAttacks();
  }

  initEvents() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    // (eventtofireafter, functiontocall, context)
    //execution above is a trick to get update function from a scene, Arcade Sprite usually don't have such a thing
  }

  update() {
    if (this.hasBeenHit) {
      return;
    }
    const { left, right, space, up, down } = this.cursors;
    const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space); // only returns true pey key press
    const isUpJustDown = Phaser.Input.Keyboard.JustDown(up); // only returns true pey key press
    const onFloor = this.body.onFloor();

    this.handleMovements();

    if (left.isDown) {
      this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT;
      this.setVelocityX(-this.playerSpeed);
      this.setFlipX(true);
    } else if (right.isDown) {
      this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
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

    if (this.isPlayingAnims("throw")) {
      return;
    }

    onFloor ? (this.body.velocity.x !== 0 ? this.play("run", true) : this.play("idle", true)) : this.play("jump", true);
    //dont play it again if it's playing
    //second value ignore if playing
  }

  handleAttacks() {
    this.scene.input.keyboard.on("keydown-Q", () => {
      this.play("throw", true);
      this.projectiles.fireProjectile(this, "iceball");
    });

    this.scene.input.keyboard.on("keydown-E", () => {
      if (this.timeFromLastSwing && this.timeFromLastSwing + this.MeleeWeapon.attackSpeed > getTimestamp()) {
        return;
      }
      this.play("throw", true);
      this.MeleeWeapon.swing(this);
      this.timeFromLastSwing = getTimestamp();
    });
  }

  handleMovements() {
    this.scene.input.keyboard.on("keydown-DOWN", () => {
      this.body.setSize(this.width, this.height / 2);
      this.setOffset(0, this.height / 2);
      this.setVelocityX(0);
      this.play("slide", true);
    });
    this.scene.input.keyboard.on("keydown-UP", () => {
      this.body.setSize(this.width, 38);
      this.setOffset(0, 0);
    });
  }

  playDamageTween() {
    return this.scene.tweens.add({ targets: this, duration: 100, repeat: -1, tint: 0xffffff });
  }

  bounceOff() {
    this.body.touching.right ? this.setVelocityX(-this.bounceVelocity) : this.setVelocityX(this.bounceVelocity);

    setTimeout(() => {
      this.setVelocityY(-this.bounceVelocity);
    }, 0);
  }
  takesHit(source) {
    if (this.hasBeenHit) {
      return;
    }
    this.hasBeenHit = true;
    this.bounceOff();
    const hitAnim = this.playDamageTween();
    this.health -= source.damage;
    this.hp.decrease(this.health);
    source.deliversHit(this);
    this.scene.time.delayedCall(1000, () => {
      (this.hasBeenHit = false), hitAnim.stop(), this.clearTint();
    });
    // this.scene.time.addEvent({
    //   delay: 1000,
    //   callback: () => {
    //     this.hasBeenHit = false;
    //   },
    //   loop: false,
    // });
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
