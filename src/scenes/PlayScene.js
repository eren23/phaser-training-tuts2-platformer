import Phaser from "phaser";
import Player from "../entities/Player";
import Enemies from "../groups/Enemies";
import initAnims from "../anims/index";
import Collectables from "../groups/Collectables";
import Hud from "../hud";
import EventEmitter from "../events/Emitter";

class PlayScene extends Phaser.Scene {
  constructor(config) {
    super("PlayScene");
    this.config = config;
  }

  create({ gameStatus }) {
    this.score = 0;
    this.hud = new Hud(this, 0, 0);

    this.playBGMusic();

    const map = this.createMap();
    initAnims(this.anims);

    const layers = this.createLayers(map);
    const playerZones = this.getPlayerZones(layers.playerZones);
    const player = this.createPlayer(playerZones);
    const enemies = this.createEnemies(layers.enemySpawns, layers.platformsColliders);
    const collectables = this.createCollectables(layers.collectables);

    this.createBG(map);

    this.createPlayerColliders(player, {
      colliders: {
        platformsColliders: layers.platformsColliders,
        projectiles: enemies.getProjectiles(),
        collectables,
        traps: layers.traps,
      },
    });

    this.createEnemyColliders(enemies, {
      colliders: {
        platformsColliders: layers.platformsColliders,
        player,
      },
    });

    this.createBackButton();
    this.setupFollowUpCamera(player);
    this.createEndOfLevel(playerZones.end, player);

    if (gameStatus === "PLAYER_LOSE") {
      return;
    } else {
      this.createGameEvents();
    }

    // this.input.on("pointerup", (pointer) => this.finishDrawing(pointer, layers.platforms), this);
    //since we are passing additioal argument we used a wrapper function around the finishdrawing
  }

  // finishDrawing(pointer, layer) {
  //   this.line.x2 = pointer.worldX;
  //   this.line.y2 = pointer.worldY;
  //   this.graphics.clear();
  //   this.graphics.strokeLineShape(this.line);

  //   this.tileHits = layer.getTilesWithinShape(this.line);
  //   if (this.tileHits.length > 0) {
  //     this.tileHits.forEach((tile) => {
  //       tile.index !== -1 && tile.setCollision(true);
  //     });
  //   }

  //   this.drawDebug(layer);

  //   this.plotting = false;
  // }

  playBGMusic() {
    if (this.sound.get("theme")) {
      return;
    }
    this.sound.add("theme", { loop: true, volume: 0.05 }).play();
  }
  //Customs
  createMap() {
    const map = this.make.tilemap({ key: `level_${this.getCurrentLevel()}` });
    map.addTilesetImage("main_lev_build_1", "tiles-1");
    map.addTilesetImage("bg_spikes_tileset", "bg-spikes-tileset");
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset("main_lev_build_1");
    const tilesetBg = map.getTileset("bg_spikes_tileset");

    map.createStaticLayer("distance", tilesetBg).setDepth(-12);

    const platformsColliders = map.createStaticLayer("platforms_colliders", tileset);
    const environment = map.createStaticLayer("environment", tileset).setDepth(-2);
    const platforms = map.createStaticLayer("platforms", tileset);

    const playerZones = map.getObjectLayer("player_zones");
    const enemySpawns = map.getObjectLayer("enemy_spawns");
    const collectables = map.getObjectLayer("collectables");

    const traps = map.createStaticLayer("traps", tileset);

    platformsColliders.setCollisionByProperty({ collides: true });
    traps.setCollisionByExclusion(-1);
    return { environment, platforms, platformsColliders, playerZones, enemySpawns, collectables, traps };
  }

  createBG(map) {
    const bgObject = map.getObjectLayer("distance_bg").objects[0];

    this.spikesImage = this.add
      .tileSprite(bgObject.x, bgObject.y, this.config.width, bgObject.height, "bg-spikes-dark")
      .setOrigin(0, 1)
      .setDepth(-10)
      .setScrollFactor(0, 1);

    this.skyImage = this.add
      .tileSprite(0, 0, this.config.width, 180, "sky-play")
      .setOrigin(0, 0)
      .setScale(1.1)
      .setDepth(-11)
      .setScrollFactor(0, 1);
  }

  createBackButton() {
    const btn = this.add
      .image(this.config.rightBottomCorner.x, this.config.rightBottomCorner.y, "back")
      .setScrollFactor(0)
      .setScale(2)
      .setOrigin(1, 1)
      .setInteractive();

    btn.on("pointerup", () => {
      this.scene.start("MenuScene");
    });
  }

  createGameEvents() {
    EventEmitter.on("PLAYER_LOSE", () => {
      this.scene.restart({ gameStatus: "PLAYER_LOSE" });
    });
  }

  createCollectables(collectableLayer) {
    const collectables = new Collectables(this).setDepth(-1);
    collectables.addFromLayer(collectableLayer);

    collectables.playAnimation("diamond-shine");

    return collectables;
  }

  createPlayer({ start }) {
    const player = new Player(this, start.x, start.y); // firsts value should be the scene
    return player;
  }

  onCollect(entity, collectable) {
    collectable.disableBody(true, true); //first true disables game object, default false, second one is hide
    this.score += parseInt(collectable.score);
    this.hud.updateScoreboard(this.score);
  }

  createPlayerColliders(player, { colliders }) {
    player
      .addCollider(colliders.platformsColliders)
      .addCollider(colliders.projectiles, this.onHit)
      .addCollider(colliders.traps, this.onHit)
      .addOverlap(colliders.collectables, this.onCollect, this);
  }

  createEnemies(spawnLayer, platformsColliders) {
    const enemies = new Enemies(this);
    const enemyTypes = enemies.getTypes();

    spawnLayer.objects.forEach((spawn) => {
      const enemy = new enemyTypes[spawn.type](this, spawn.x, spawn.y); // firsts value should be the scene
      enemy.setPlatformCollider(platformsColliders);
      enemies.add(enemy);
    });

    return enemies;
  }

  onPlayerCollision(enemy, player) {
    player.takesHit(enemy);
  }

  onHit(entity, source) {
    entity.takesHit(source);
  }

  createEnemyColliders(enemies, { colliders }) {
    enemies
      .addCollider(colliders.platformsColliders)
      .addCollider(colliders.player, this.onPlayerCollision)
      .addCollider(colliders.player.projectiles, this.onHit)
      .addOverlap(colliders.player.MeleeWeapon, this.onHit);
  }

  // when we return this context from our collider we can chain like that

  setupFollowUpCamera(player) {
    const { height, width, mapOffset, zoomFactor } = this.config;
    this.physics.world.setBounds(0, 0, width + mapOffset, height + 200); //expanding world bounds
    this.cameras.main.setBounds(0, 0, width + mapOffset, height).setZoom(zoomFactor); // so camera bouns are set, without the parts here it tries to displays irrevelant parts also
    this.cameras.main.startFollow(player);
  }

  getPlayerZones(playerZonesLayer) {
    const playerZones = playerZonesLayer.objects;
    return {
      start: playerZones.find((zone) => zone.name === "startZone"),
      end: playerZones.find((zone) => zone.name === "endZone"),
    };
  }

  getCurrentLevel() {
    return this.registry.get("level") || 1;
  }

  createEndOfLevel(end, player) {
    const endOfLevel = this.physics.add.sprite(end.x, end.y, "end").setAlpha(0).setSize(10, 100).setOrigin(0.5, 1);
    const endOfOverlay = this.physics.add.overlap(player, endOfLevel, () => {
      endOfOverlay.active = false;

      if (this.registry.get("level") === this.config.lastLevel) {
        this.scene.start("CreditsScene");
        return;
      }

      this.registry.inc("level", 1);
      this.registry.inc("unlocked-levels", 1);
      this.scene.restart({ gameStatus: "LEVEL_COMPLETED" });
      console.log("you won");
    });
  }
  update() {
    this.spikesImage.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.skyImage.tilePositionX = this.cameras.main.scrollX * 0.1;
  }
}

export default PlayScene;
