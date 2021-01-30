export default (anims) => {
  anims.create({
    key: "snaky-idle",
    frames: anims.generateFrameNumbers("snaky", { start: 0, end: 8 }),
    frameRate: 8,
    repeat: -1,
  });
  anims.create({
    key: "snaky-hurt",
    frames: anims.generateFrameNumbers("snaky", { start: 21, end: 22 }),
    frameRate: 8,
    repeat: 0,
  });
};
