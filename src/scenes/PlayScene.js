import Phaser from "phaser";
import Player from "../entities/Player";
import Enemies from "../groups/Enemies";
import initAnims from "../anims/index";
import Collectables from "../groups/Collectables";

class PlayScene extends Phaser.Scene {
  constructor(config) {
    super("PlayScene");
    this.config = config;
  }

  create() {
    const map = this.createMap();
    initAnims(this.anims);

    const layers = this.createLayers(map);
    const playerZones = this.getPlayerZones(layers.playerZones);
    const player = this.createPlayer(playerZones);
    const enemies = this.createEnemies(layers.enemySpawns, layers.platformsColliders);
    const collectables = this.createCollectables(layers.collectables);

    this.createPlayerColliders(player, {
      colliders: {
        platformsColliders: layers.platformsColliders,
        projectiles: enemies.getProjectiles(),
        collectables,
      },
    });

    this.createEnemyColliders(enemies, {
      colliders: {
        platformsColliders: layers.platformsColliders,
        player,
      },
    });

    this.setupFollowUpCamera(player);
    this.createEndOfLevel(playerZones.end, player);

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

  //Customs
  createMap() {
    const map = this.make.tilemap({ key: "map" });
    map.addTilesetImage("main_lev_build_1", "tiles-1");
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset("main_lev_build_1");

    const platformsColliders = map.createStaticLayer("platforms_colliders", tileset);
    const environment = map.createStaticLayer("environment", tileset).setDepth(-2);
    const platforms = map.createStaticLayer("platforms", tileset);

    const playerZones = map.getObjectLayer("player_zones");
    const enemySpawns = map.getObjectLayer("enemy_spawns");
    const collectables = map.getObjectLayer("collectables");

    platformsColliders.setCollisionByProperty({ collides: true });
    return { environment, platforms, platformsColliders, playerZones, enemySpawns, collectables };
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
    console.log("Collected");
  }

  createPlayerColliders(player, { colliders }) {
    player
      .addCollider(colliders.platformsColliders)
      .addCollider(colliders.projectiles, this.onWeaponHit)
      .addOverlap(colliders.collectables, this.onCollect);
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

  onWeaponHit(entity, source) {
    entity.takesHit(source);
  }

  createEnemyColliders(enemies, { colliders }) {
    enemies
      .addCollider(colliders.platformsColliders)
      .addCollider(colliders.player, this.onPlayerCollision)
      .addCollider(colliders.player.projectiles, this.onWeaponHit)
      .addOverlap(colliders.player.MeleeWeapon, this.onWeaponHit);
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

  createEndOfLevel(end, player) {
    const endOfLevel = this.physics.add.sprite(end.x, end.y, "end").setAlpha(0).setSize(10, 100).setOrigin(0.5, 1);
    const endOfOverlay = this.physics.add.overlap(player, endOfLevel, () => {
      endOfOverlay.active = false;
      console.log("you won");
    });
  }
}

export default PlayScene;
