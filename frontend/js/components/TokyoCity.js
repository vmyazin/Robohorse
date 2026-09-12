// Approved Tokyo night artwork. Deterministic geometry: the same time renders the same windows.
const nightPalette = {
  sky: ["#101c2d", "#29374e", "#5c576d"],
  far: "#2c3b52",
  mid: "#253145",
  front: "#192333",
  warm: "#ebcda6",
  road: "#192331",
};
const themes = [
  "Neighborhood after dark",
  "Riverside at night",
  "Railway street",
  "Quiet Shinjuku",
].map((name) => ({ ...nightPalette, name }));
const hash = (n) => {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export function paintTokyoDistrict(ctx, kind, time = 0) {
  const t = themes[kind],
    W = 1000,
    H = 600;
  ctx.clearRect(0, 0, W, H);
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  function path(points, c, stroke, width = 1) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (c) {
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  function ellipse(x, y, rx, ry, c) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  }
  function text(s, x, y, size, c) {
    ctx.fillStyle = c;
    ctx.font = `${size}px 'Hiragino Kaku Gothic ProN', 'Yu Gothic', system-ui, sans-serif`;
    ctx.fillText(s, x, y);
  }
  function windowGrid(x, y, w, h, seed, color = t.warm, opacity = 0.5) {
    ctx.save();
    ctx.globalAlpha = opacity;
    for (let a = 10; a < w - 8; a += 16)
      for (let b = 14; b < h - 12; b += 24) {
        if (hash(seed + a * 3 + b) > 0.5) rect(x + a, y + b, 6, 10, color);
      }
    ctx.restore();
  }
  function tree(x, y, scale = 1) {
    rect(x - 3, y - 38 * scale, 6, 42 * scale, "#414b49");
    ellipse(x, y - 62 * scale, 30 * scale, 35 * scale, "#30484e");
    ellipse(x - 22 * scale, y - 48 * scale, 24 * scale, 22 * scale, "#3d5455");
  }
  function shop(x, y, w, h, seed) {
    rect(x, y, w, h, t.front);
    rect(x + 4, y + 5, w - 8, h - 8, "#2b3547");
    rect(x + 9, y + h - 59, w - 18, 49, "#1d292d");
    rect(x + 13, y + h - 53, w - 26, 35, t.warm);
    for (let i = 0; i < 3; i++)
      rect(x + 15 + (i * (w - 30)) / 3, y + h - 55, 3, 48, "#4b4c46");
    rect(x + 3, y + h - 72, w - 6, 15, seed % 2 ? "#806675" : "#526f76");
    rect(x + 6, y + h - 96, w - 12, 20, "#a99688");
    text(seed % 2 ? "喫茶" : "書店", x + 16, y + h - 80, 13, "#4b504d");
    windowGrid(x, y + 3, w, h - 105, seed, t.warm, 0.42);
    path(
      [
        [x - 5, y],
        [x + w / 2, y - 20],
        [x + w + 5, y],
      ],
      "#1b2638",
    );
    rect(x - 7, y - 1, w + 14, 5, "#172436");
  }
  const sky = ctx.createLinearGradient(0, 0, 0, 550);
  t.sky.forEach((c, i) => sky.addColorStop(i / 2, c));
  rect(0, 0, W, H, sky);
  ctx.save();
  ctx.globalAlpha = 0.12;
  ellipse(270, 133, 220, 9, "#ede0cf");
  ellipse(720, 180, 190, 7, "#ede0cf");
  ellipse(500, 230, 270, 5, "#ede0cf");
  ctx.restore();
  ellipse(802, 95, 13, 13, "#d9d5c9");
  const farShift = (time * 3) % 1400;
  for (let i = -1; i < 14; i++) {
    let x = i * 94 - farShift,
      y = 320 - hash(i + 40) * 110;
    if (x < -100) x += 1400;
    let h = 510 - y;
    rect(x, y, 76, h, t.far);
    rect(x + 10, y - 8, 35, 8, t.far);
    windowGrid(x, y, 76, h, i + 9, t.warm, 0.2);
  }
  if (kind === 1) {
    rect(0, 385, 1000, 139, "#203246");
    for (let i = 0; i < 42; i++) {
      let x = hash(i + 80) * 1000,
        y = 397 + hash(i + 100) * 117;
      rect(
        x + ((time * 2) % 20),
        y,
        12 + hash(i) * 35,
        1,
        i % 3 ? "#3d5265" : "#817d7e",
      );
    }
    path(
      [
        [560, 390],
        [660, 258],
        [762, 390],
      ],
      null,
      "#6e7c86",
      4,
    );
    path(
      [
        [660, 258],
        [660, 390],
      ],
      null,
      "#6e7c86",
      7,
    );
    for (let i = 0; i < 8; i++) {
      let x = 574 + i * 25;
      path(
        [
          [660, 265],
          [x, 390],
        ],
        null,
        "#77848b",
        1,
      );
    }
    rect(0, 388, 1000, 9, "#727d83");
    rect(0, 397, 1000, 8, "#354e60");
    for (let x = 10; x < 1000; x += 155) {
      rect(x, 404, 13, 61, "#3c5565");
    }
    const x = 875;
    path(
      [
        [x - 9, 332],
        [x, 158],
        [x + 9, 332],
      ],
      "#617487",
    );
    rect(x - 12, 235, 24, 4, "#8c959b");
    rect(x - 7, 181, 14, 4, "#8c959b");
    path(
      [
        [x, 159],
        [x, 126],
      ],
      null,
      "#91a0a8",
      2,
    );
    rect(0, 506, 1000, 24, "#3c4b51");
    for (let x = 0; x < 1000; x += 42) rect(x, 470, 3, 45, "#7d8784");
    rect(0, 473, 1000, 3, "#8d9791");
    rect(0, 497, 1000, 2, "#717f7c");
    tree(690, 530, 1.1);
    tree(930, 530, 0.9);
  } else if (kind === 2) {
    for (let i = -1; i < 9; i++) {
      let x = i * 145 - ((time * 8) % 1450);
      if (x < -145) x += 1450;
      shop(x, 345 - hash(i) * 25, 110, 185 + hash(i) * 25, i + 30);
    }
    rect(0, 273, 1000, 17, "#595c56");
    rect(0, 290, 1000, 9, "#343f42");
    for (let x = 30; x < 1000; x += 220) {
      rect(x, 299, 16, 231, "#575b55");
      rect(x - 13, 300, 42, 15, "#68685e");
    }
    const trainX = 1100 - ((time * 75 + 440) % 1800);
    rect(trainX, 224, 540, 45, "#89979f");
    rect(trainX, 257, 540, 5, "#759388");
    for (let i = 0; i < 16; i++) {
      rect(trainX + 12 + i * 33, 234, 24, 16, "#52666b");
      rect(trainX + 15 + i * 33, 237, 18, 9, "#c4b89c");
    }
    rect(trainX, 268, 540, 5, "#333f43");
    for (let i = 0; i < 6; i++) {
      ellipse(trainX + 22 + i * 90, 271, 5, 3, "#192b39");
      ellipse(trainX + 68 + i * 90, 271, 5, 3, "#192b39");
    }
    rect(trainX + 535, 245, 4, 3, "#d9c9a3");
    for (let x = 0; x < 1000; x += 140) {
      rect(x, 169, 3, 105, "#59666b");
      path(
        [
          [x, 177],
          [x + 100, 196],
          [x + 140, 177],
        ],
        null,
        "#617078",
        1,
      );
    }
    rect(826, 338, 9, 192, "#555c58");
    rect(808, 357, 47, 62, "#d4c8a9");
    text("駅", 816, 384, 24, "#495e59");
    text("STATION", 810, 405, 8, "#495e59");
    tree(961, 530, 0.85);
  } else if (kind === 3) {
    for (let i = -1; i < 12; i++) {
      let x = i * 112 - ((time * 6) % 1456);
      if (x < -112) x += 1456;
      let h = 180 + hash(i + 5) * 160,
        y = 525 - h;
      rect(x, y, 94, h, t.mid);
      rect(x + 4, y + 5, 84, h - 8, i % 2 ? "#2b3547" : "#333b4f");
      windowGrid(x, y, 94, h, i + 50, t.warm, 0.45);
      for (let j = 0; j < 5; j++) rect(x + 5 + j * 18, y, 1, h, "#50566a");
      if (i % 3 === 0) {
        rect(x + 70, y + 40, 19, 74, "#a99688");
        text("ホテル", x + 72, y + 55, 10, "#313d4d");
        text("HOTEL", x + 72, y + 89, 5, "#313d4d");
      }
    }
    rect(620, 172, 90, 246, "#2c3c52");
    rect(735, 165, 90, 253, "#2c3c52");
    path(
      [
        [620, 172],
        [665, 140],
        [710, 172],
      ],
      "#2c3c52",
    );
    path(
      [
        [735, 165],
        [780, 134],
        [825, 165],
      ],
      "#2c3c52",
    );
    windowGrid(620, 178, 90, 240, 333, t.warm, 0.25);
    windowGrid(735, 172, 90, 245, 335, t.warm, 0.25);
    for (let i = 0; i < 7; i++) {
      let x = i * 193 - ((time * 11) % 1351);
      if (x < -193) x += 1351;
      rect(x, 446, 153, 78, "#3a424c");
      rect(x + 11, 469, 130, 42, "#253540");
      rect(x + 15, 473, 122, 22, "#ae9e87");
      rect(x + 4, 443, 145, 19, i % 2 ? "#817884" : "#526f76");
      text(i % 2 ? "喫茶  COFFEE" : "書店  BOOKS", x + 16, 456, 10, "#dfd2bc");
    }
    tree(850, 530, 0.8);
  } else {
    for (let i = -1; i < 9; i++) {
      let x = i * 145 - ((time * 9) % 1450);
      if (x < -145) x += 1450;
      shop(x, 346 - hash(i + 30) * 28, 114, 184 + hash(i + 30) * 28, i);
      if (i % 3 === 0) {
        rect(x + 100, 409, 20, 45, "#a99688");
        text("茶", x + 103, 430, 13, "#595347");
      }
    }
    for (let x = 70; x < 1100; x += 330) {
      rect(x, 296, 5, 234, "#515b5c");
      path(
        [
          [x, 305],
          [x + 160, 328],
          [x + 330, 305],
        ],
        null,
        "#616567",
        1,
      );
      path(
        [
          [x, 313],
          [x + 160, 341],
          [x + 330, 313],
        ],
        null,
        "#616567",
        1,
      );
      rect(x - 12, 316, 31, 3, "#515b5c");
    }
    tree(795, 531, 1);
    tree(990, 530, 0.9);
  }
  rect(0, 529, 1000, 8, "#89908a");
  rect(0, 537, 1000, 63, t.road);
  rect(0, 537, 1000, 2, "#adb09e");
  for (let x = 0; x < 1100; x += 100) {
    let xx = x - ((time * 22) % 100);
    rect(xx, 554, 24, 2, "#576263");
    rect(xx + 25, 582, 43, 1, "#465456");
  }
  if (kind !== 1) {
    for (let x = 425; x < 1100; x += 340) {
      rect(x, 392, 4, 140, "#4d5a5c");
      path(
        [
          [x, 395],
          [x + 17, 385],
          [x + 39, 385],
        ],
        null,
        "#4d5a5c",
        3,
      );
      rect(x + 26, 383, 23, 5, "#d6c8a7");
    }
  }
}
