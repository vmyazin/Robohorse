export const VEHICLE_MODELS = [
  { name: "Tokyo taxi", paint: "#34575d", light: "#7caaa8", w: 180, h: 80 },
  { name: "Kei hatchback", paint: "#b5a893", light: "#eadbc0", w: 180, h: 80 },
  { name: "Street coupe", paint: "#884755", light: "#d78a8c", w: 180, h: 80 },
  { name: "Delivery van", paint: "#66798a", light: "#b9c9d3", w: 180, h: 80 },
  { name: "Patrol sedan", paint: "#c1cbd1", light: "#f0ede1", w: 180, h: 80 },
  {
    name: "Armored pickup",
    paint: "#687785",
    light: "#b1c3d0",
    w: 200,
    h: 100,
  },
  {
    name: "Tesla Cybertruck",
    paint: "#8796a3",
    light: "#d5e0e5",
    w: 200,
    h: 100,
  },
];
export function drawVehicleArt(
  ctx,
  kind,
  x,
  y,
  w,
  h,
  damage = 0,
  color = null,
  flip = false,
) {
  const m = VEHICLE_MODELS[kind],
    paint = color || m.paint,
    edge = "#0d1b29";
  ctx.save();
  ctx.translate(x + (flip ? w : 0), y);
  ctx.scale(((flip ? -1 : 1) * w) / 300, h / 140);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const poly = (pts, fill, stroke = edge, lw = 2.5) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  };
  const line = (pts, c, width = 2) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = c;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const circle = (x, y, r, c) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  };
  let shell, glass;
  if (kind === 0 || kind === 4) {
    shell = [
      [13, 89],
      [26, 72],
      [66, 66],
      [97, 30],
      [186, 30],
      [221, 66],
      [271, 73],
      [289, 88],
      [285, 115],
      [15, 115],
    ];
    glass = [
      [
        [77, 65],
        [102, 38],
        [137, 38],
        [137, 65],
      ],
      [
        [146, 38],
        [181, 38],
        [208, 65],
        [146, 65],
      ],
    ];
  }
  if (kind === 1) {
    shell = [
      [24, 111],
      [23, 45],
      [37, 21],
      [180, 21],
      [219, 64],
      [269, 75],
      [280, 96],
      [275, 114],
    ];
    glass = [
      [
        [40, 32],
        [99, 32],
        [99, 63],
        [36, 63],
      ],
      [
        [108, 32],
        [175, 32],
        [200, 63],
        [108, 63],
      ],
    ];
  }
  if (kind === 2) {
    shell = [
      [13, 107],
      [23, 80],
      [75, 72],
      [122, 46],
      [186, 44],
      [225, 73],
      [275, 83],
      [291, 98],
      [281, 114],
      [19, 114],
    ];
    glass = [
      [
        [91, 72],
        [126, 52],
        [147, 52],
        [147, 72],
      ],
      [
        [155, 52],
        [182, 51],
        [211, 73],
        [155, 73],
      ],
    ];
  }
  if (kind === 3) {
    shell = [
      [20, 114],
      [19, 32],
      [30, 18],
      [198, 18],
      [233, 66],
      [273, 74],
      [284, 96],
      [278, 115],
    ];
    glass = [
      [
        [148, 29],
        [192, 29],
        [215, 62],
        [148, 62],
      ],
    ];
  }
  if (kind === 5) {
    shell = [
      [14, 113],
      [15, 61],
      [79, 61],
      [112, 24],
      [184, 24],
      [227, 61],
      [272, 69],
      [290, 90],
      [281, 115],
    ];
    glass = [
      [
        [92, 60],
        [118, 33],
        [143, 33],
        [143, 60],
      ],
      [
        [151, 33],
        [180, 33],
        [213, 61],
        [151, 61],
      ],
    ];
  }
  if (kind === 6) {
    shell = [
      [12, 111],
      [12, 61],
      [145, 20],
      [286, 73],
      [289, 104],
      [273, 117],
      [23, 117],
    ];
    glass = [
      [
        [87, 48],
        [144, 28],
        [166, 36],
        [157, 65],
        [87, 65],
      ],
      [
        [174, 39],
        [240, 65],
        [166, 65],
      ],
    ];
  }
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(151, 132, 139, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, 20, 0, 117);
  grad.addColorStop(0, color ? color : m.light);
  grad.addColorStop(0.37, paint);
  grad.addColorStop(0.75, paint);
  grad.addColorStop(1, "#263848");
  poly(shell, grad);
  poly(
    [
      [17, 99],
      [284, 99],
      [280, 118],
      [17, 118],
    ],
    "#23313e",
  );
  line(shell.slice(1, 5), color ? "#e2e0cd" : m.light, 2);
  for (const pts of glass) {
    const g = ctx.createLinearGradient(0, 30, 0, 74);
    g.addColorStop(0, "#42637a");
    g.addColorStop(1, "#172c3e");
    poly(pts, g);
    line([pts[0], pts[1]], "#90afbf", 1.5);
  }
  if (kind === 0) {
    rect(28, 80, 239, 8, "#c5b581");
    rect(120, 21, 37, 9, "#e4d5aa");
    rect(126, 18, 25, 5, "#efe4c8");
    ctx.font = "7px system-ui";
    ctx.fillStyle = "#283747";
    ctx.fillText("TAXI", 129, 28);
    circle(160, 91, 8, "#bdb084");
    circle(160, 91, 5, paint);
  }
  if (kind === 1) {
    line(
      [
        [32, 76],
        [244, 76],
      ],
      "#e8d8b7",
      3,
    );
    rect(30, 85, 243, 10, "#766f67");
    line(
      [
        [106, 66],
        [106, 107],
      ],
      edge,
      1.5,
    );
  }
  if (kind === 2) {
    rect(14, 69, 56, 5, paint);
    rect(22, 73, 5, 9, edge);
    poly(
      [
        [76, 92],
        [215, 85],
        [196, 95],
        [83, 98],
      ],
      "#4b2e3d",
      null,
    );
    line(
      [
        [149, 76],
        [141, 101],
      ],
      edge,
      1.5,
    );
  }
  if (kind === 3) {
    poly(
      [
        [30, 28],
        [134, 28],
        [134, 93],
        [30, 93],
      ],
      paint,
      edge,
      1.5,
    );
    line(
      [
        [41, 35],
        [121, 35],
      ],
      "#b4c5cb",
      2,
    );
    rect(30, 70, 100, 20, "#b2c6c5");
    ctx.font = "10px system-ui";
    ctx.fillStyle = "#2b454d";
    ctx.fillText("夜便", 59, 84);
    line(
      [
        [142, 65],
        [142, 110],
      ],
      edge,
      2,
    );
    rect(126, 62, 3, 13, "#cbd4d5");
  }
  if (kind === 4) {
    rect(27, 77, 244, 23, "#223141");
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#d5e0de";
    ctx.fillText("POLICE", 133, 93);
    rect(119, 22, 43, 7, "#182735");
    rect(123, 18, 15, 7, "#b75c6b");
    rect(142, 18, 15, 7, "#6995b6");
  }
  if (kind === 5) {
    poly(
      [
        [20, 64],
        [75, 64],
        [75, 98],
        [20, 98],
      ],
      "#344453",
    );
    line(
      [
        [25, 72],
        [68, 72],
      ],
      "#96a9b5",
      2,
    );
    line(
      [
        [25, 81],
        [68, 81],
      ],
      "#96a9b5",
      2,
    );
    poly(
      [
        [88, 76],
        [169, 76],
        [159, 100],
        [82, 100],
      ],
      paint,
    );
    line(
      [
        [174, 66],
        [165, 110],
      ],
      edge,
      2,
    );
    for (let a of [96, 159, 221]) circle(a, 84, 2, "#afc0c8");
  }
  if (kind === 6) {
    poly(
      [
        [17, 69],
        [159, 69],
        [280, 76],
        [277, 95],
        [166, 102],
        [20, 98],
      ],
      paint,
    );
    poly(
      [
        [20, 99],
        [165, 104],
        [276, 97],
        [273, 112],
        [23, 113],
      ],
      "#455565",
    );
    line(
      [
        [18, 62],
        [145, 21],
        [284, 73],
      ],
      "#e0e8e7",
      2,
    );
    line(
      [
        [163, 72],
        [166, 100],
      ],
      edge,
      1.5,
    );
    line(
      [
        [82, 72],
        [76, 99],
      ],
      edge,
      1.5,
    );
    line(
      [
        [23, 61],
        [78, 44],
      ],
      "#465767",
      4,
    );
    rect(107, 76, 15, 2, "#d5dfe3");
    rect(186, 77, 14, 2, "#d5dfe3");
    line(
      [
        [264, 76],
        [287, 81],
      ],
      "#e9f4ef",
      4,
    );
    line(
      [
        [15, 70],
        [23, 70],
      ],
      "#dd7478",
      3,
    );
  }
  if (kind === 0 || kind === 4) {
    line(
      [
        [141, 69],
        [141, 107],
      ],
      edge,
      1.5,
    );
    line(
      [
        [83, 69],
        [75, 105],
      ],
      edge,
      1.5,
    );
    line(
      [
        [213, 71],
        [216, 105],
      ],
      edge,
      1.5,
    );
  }
  rect(kind === 3 ? 151 : 154, 74, 13, 3, "#b5c6ca");
  if (kind !== 2 && kind !== 5) rect(91, 74, 12, 3, "#b5c6ca");
  poly(
    [
      [216, 62],
      [229, 63],
      [233, 70],
      [218, 70],
    ],
    paint,
  );
  rect(272, 84, 12, 8, "#f0d9ad");
  rect(19, 85, 9, 9, "#bb6670");
  line(
    [
      [24, 103],
      [43, 103],
    ],
    "#8296a4",
    3,
  );
  line(
    [
      [258, 103],
      [280, 103],
    ],
    "#b4c3ca",
    3,
  );
  rect(255, 108, 17, 5, "#c8c9b2");
  for (const wx of [65, 235]) {
    circle(wx, 115, 22, edge);
    circle(wx, 115, 17, "#202d39");
    circle(wx, 115, 12, "#8ca3b4");
    circle(wx, 115, 9, "#354d60");
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      line(
        [
          [wx, 115],
          [wx + Math.cos(a) * 8, 115 + Math.sin(a) * 8],
        ],
        "#b0c4ce",
        2,
      );
    }
    circle(wx, 115, 3, "#b1c3ce");
    if (kind === 6) {
      poly(
        [
          [wx - 10, 108],
          [wx, 103],
          [wx + 10, 108],
          [wx + 10, 120],
          [wx, 126],
          [wx - 10, 120],
        ],
        "#354859",
        "#899ca9",
        1.5,
      );
      circle(wx, 115, 3, "#bacad1");
    }
    line(
      [
        [wx - 21, 107],
        [wx - 15, 96],
        [wx + 12, 94],
        [wx + 23, 107],
      ],
      "#182936",
      4,
    );
  }
  if (damage > 0) {
    line(
      [
        [182, 43],
        [170, 54],
        [183, 61],
        [167, 67],
      ],
      "#adc9d4",
      1,
    );
    line(
      [
        [173, 53],
        [160, 49],
      ],
      "#adc9d4",
      1,
    );
    line(
      [
        [195, 89],
        [184, 91],
        [177, 86],
        [162, 91],
      ],
      "#142333",
      3,
    );
    line(
      [
        [112, 96],
        [96, 98],
      ],
      "#c5c2b1",
      1.5,
    );
  }
  if (damage > 1) {
    poly(
      [
        [248, 80],
        [264, 85],
        [253, 91],
        [265, 99],
        [232, 97],
      ],
      "#192b3a",
      null,
    );
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.25 - i * 0.04;
      circle(254 - i * 7, 64 - i * 15, 7 + i * 3, "#98a2a7");
    }
    ctx.globalAlpha = 1;
    rect(258, 81, 5, 3, "#c58957");
  }
  ctx.restore();
}

const STANDARD_MODELS = [0, 0, 1, 1, 3, 3, 2, 4, 5];
export function chooseCarModel(random = Math.random) {
  return STANDARD_MODELS[Math.floor(random() * STANDARD_MODELS.length)];
}

export function drawVehicle(ctx, obstacle) {
  const model = obstacle.type === "cybertruck" ? 6 : obstacle.carModel;
  const artHeight = VEHICLE_MODELS[model].h;
  const damage =
    obstacle.explosionTriggerCount === 0
      ? 0
      : obstacle.explosionTriggerCount >= obstacle.explosionTriggerThreshold - 2
        ? 2
        : 1;
  // Align the tire soles (137 in the 140-unit drawing) with the collision floor.
  const y = obstacle.y + obstacle.height - (artHeight * 137) / 140;
  drawVehicleArt(ctx, model, obstacle.x, y, obstacle.width, artHeight, damage);
  if (obstacle.explosionTriggerCount > 0) {
    ctx.save();
    ctx.fillStyle = "#efb19c";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    const remaining =
      obstacle.explosionTriggerThreshold - obstacle.explosionTriggerCount;
    ctx.fillText(
      `${remaining} more hit${remaining === 1 ? "" : "s"} to explode!`,
      obstacle.x + obstacle.width / 2,
      obstacle.y - 10,
    );
    ctx.restore();
  }
}

// Upper body contours in the same 300 × 140 coordinates as the artwork.
const VEHICLE_TOPS = [
  [[13,89],[26,72],[66,66],[97,30],[186,30],[221,66],[271,73],[289,88]],
  [[23,45],[37,21],[180,21],[219,64],[269,75],[280,96]],
  [[13,107],[23,80],[75,72],[122,46],[186,44],[225,73],[275,83],[291,98]],
  [[19,32],[30,18],[198,18],[233,66],[273,74],[284,96]],
  [[13,89],[26,72],[66,66],[97,30],[186,30],[221,66],[271,73],[289,88]],
  [[15,61],[79,61],[112,24],[184,24],[227,61],[272,69],[290,90]],
  [[12,61],[145,20],[286,73],[289,104]],
];

export function vehicleSurface(obstacle, left, right) {
  const model = obstacle.type === 'cybertruck' ? 6 : obstacle.carModel;
  const points = VEHICLE_TOPS[model];
  const lo = (left - obstacle.x) * 300 / obstacle.width;
  const hi = (right - obstacle.x) * 300 / obstacle.width;
  let top = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    const start = Math.max(lo, ax), end = Math.min(hi, bx);
    if (start >= end) continue;
    const at = x => ay + (by - ay) * (x - ax) / (bx - ax);
    top = Math.min(top, at(start), at(end));
  }
  return Number.isFinite(top)
    ? obstacle.y + obstacle.height + (top - 137) * VEHICLE_MODELS[model].h / 140
    : null;
}
