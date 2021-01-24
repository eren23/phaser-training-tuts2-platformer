import Phaser from "phaser";
import Player from "../entities/Player";
import Enemies from "../groups/Enemies";

class PlayScene extends Phaser.Scene {
  constructor(config) {
    super("PlayScene");
    this.config = config;
  }

  create() {
    const map = this.createMap();
    const layers = this.createLayers(map);
    const playerZones = this.getPlayerZones(layers.playerZones);
    const player = this.createPlayer(playerZones);
    const enemies = this.createEnemies(layers.enemySpawns);

    this.createPlayerColliders(player, {
      colliders: {
        platformsColliders: layers.platformsColliders,
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
  }

  update() {}

  //Customs
  createMap() {
    const map = this.make.tilemap({ key: "map" });
    map.addTilesetImage("main_lev_build_1", "tiles-1");
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset("main_lev_build_1");

    const platformsColliders = map.createStaticLayer("platforms_colliders", tileset);
    const environment = map.createStaticLayer("environment", tileset);
    const platforms = map.createStaticLayer("platforms", tileset);

    const playerZones = map.getObjectLayer("player_zones");
    const enemySpawns = map.getObjectLayer("enemy_spawns");

    platformsColliders.setCollisionByProperty({ collides: true });
    return { environment, platforms, platformsColliders, playerZones, enemySpawns };
  }

  createPlayer({ start }) {
    const player = new Player(this, start.x, start.y); // firsts value should be the scene
    return player;
  }

  createPlayerColliders(player, { colliders }) {
    player.addCollider(colliders.platformsColliders);
  }

  createEnemies(spawnLayer) {
    const enemies = new Enemies(this);
    const enemyTypes = enemies.getTypes();

    spawnLayer.objects.forEach((spawn) => {
      const enemy = new enemyTypes[spawn.type](this, spawn.x, spawn.y); // firsts value should be the scene
      enemies.add(enemy);
    });

    return enemies;
  }

  createEnemyColliders(enemies, { colliders }) {
    enemies.addCollider(colliders.platformsColliders).addCollider(colliders.player);
    // when we return this context from our collider we can chain like that
  }

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
