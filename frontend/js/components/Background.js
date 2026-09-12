import { paintTokyoDistrict } from "./TokyoCity.js";

const DISTRICT_SECONDS = 16;
const HOLD_SECONDS = 12;
const DISTRICT_COUNT = 4;

export function districtAtFrame(frameCount = 0) {
  const time = Math.max(0, frameCount) / 60;
  const current = Math.floor(time / DISTRICT_SECONDS) % DISTRICT_COUNT;
  const progress = Math.max(
    0,
    ((time % DISTRICT_SECONDS) - HOLD_SECONDS) /
      (DISTRICT_SECONDS - HOLD_SECONDS),
  );
  return {
    time,
    current,
    next: (current + 1) % DISTRICT_COUNT,
    blend: progress * progress * (3 - 2 * progress),
  };
}

export default class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.startFrame = 0;
    // Reuse two scene surfaces. Only render the next district during a dissolve.
    this.scenes = Array.from({ length: 2 }, () => {
      const surface = canvas.ownerDocument.createElement("canvas");
      surface.width = 1000;
      surface.height = 600;
      return { surface, ctx: surface.getContext("2d") };
    });
  }

  reset(random = Math.random) {
    this.startFrame = Math.floor(random() * DISTRICT_COUNT * DISTRICT_SECONDS * 60);
  }

  draw(ctx, frameCount = 0) {
    const { time, current, next, blend } = districtAtFrame(frameCount + this.startFrame);
    const [first, second] = this.scenes;
    paintTokyoDistrict(first.ctx, current, time);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(first.surface, 0, 0, this.canvas.width, this.canvas.height);
    if (blend > 0) {
      paintTokyoDistrict(second.ctx, next, time);
      ctx.globalAlpha = blend;
      ctx.drawImage(
        second.surface,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    }
    ctx.restore();
  }
}
