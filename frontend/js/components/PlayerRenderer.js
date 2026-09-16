// Geometry is authored in the selected A concept's 300 × 260 coordinate space.
// Drawing is pure: only simulation ticks advance animation state.
const CANNON_Y_OFFSET = 7; // Game pixels, independent of power-up scale.

export const PLAYER_SIZE = Object.freeze({ width: 120, height: 80 });

export const HORSE_ART = Object.freeze({
  width: 300,
  height: 260,
  floor: 252,
  muzzleX: 277,
  muzzleY: 123,
});

export function createAppearance(health = 100) {
  return {
    phase: 0,
    stride: 0,
    landing: 0,
    recoil: 0,
    hurt: 0,
    previousHealth: health,
    wasAirborne: false,
  };
}

export function advanceAppearance(player, timeScale = 1, scrollSpeed = 0) {
  const a = player.appearance;
  const dt = Math.max(0, Math.min(3, timeScale));
  const airborne = player.isJumping || Math.abs(player.velY) > 0.6;
  a.phase += dt * (player.isCrouching ? 0.55 : 1) * (player.isMoving ? 0.24 : scrollSpeed > 0 ? 0.15 : 0.035);
  const target = airborne ? 0 : player.isMoving || scrollSpeed > 0 ? 1 : 0;
  a.stride += (target - a.stride) * Math.min(1, 0.2 * dt);
  a.landing = Math.max(0, a.landing - 0.13 * dt);
  if (a.wasAirborne && !airborne) a.landing = 1;
  a.wasAirborne = airborne;
  a.recoil = Math.max(0, a.recoil - 0.18 * dt);
  a.hurt = Math.max(0, a.hurt - 0.12 * dt);
  if (player.health < a.previousHealth) a.hurt = 1;
  a.previousHealth = player.health;
}

export function getHorsePose(player) {
  const a = player.appearance;
  const airborne = player.isJumping || Math.abs(player.velY) > 0.6;
  return {
    phase: a.phase,
    stride: a.stride,
    airborne,
    crouching: Boolean(player.isCrouching),
    bodyDrop: player.isCrouching ? 43 : 0,
    cannonDrop: player.isCrouching ? 12 : 0,
    bob: airborne ? 0 : Math.sin(a.phase * 2) * 2.4 * a.stride + a.landing * 7,
    headTilt:
      Math.sin(a.phase - 0.5) * 0.025 * a.stride +
      (airborne
        ? Math.max(-0.08, Math.min(0.08, player.velY * 0.008))
        : a.landing * 0.06),
    tailSway: Math.sin(a.phase * 0.7) * 5,
    recoil: a.recoil,
    flash: Math.max(0, (a.recoil - 0.4) / 0.6),
    weaponColor: player.currentWeapon?.color || "#68edff",
  };
}

// Two-segment inverse kinematics: planted feet remain on the floor while the torso moves.
export function getLegPose(index, far, pose) {
  const hips = [
    [86, 145],
    [144, 152],
    [195, 140],
  ];
  const hip = [hips[index][0] + (far ? 9 : 0), hips[index][1] - (far ? 3 : 0)];
  // Sweep planted hooves backward, then lift them forward for the next step.
  const phase = -pose.phase + (index * Math.PI * 2) / 3 + (far ? Math.PI : 0);
  const footX =
    [57, 139, 222][index] + (far ? 10 : 0) + Math.cos(phase) * (pose.crouching ? 9 : 17) * pose.stride;
  const lift = pose.airborne
    ? 23 + index * 4
    : Math.max(0, Math.sin(phase)) * (pose.crouching ? 7 : 23) * pose.stride;
  const ankle = [footX, 240 - (pose.bodyDrop || 0) - pose.bob - lift];
  const upper = [54, 51, 55][index],
    lower = [54, 51, 55][index];
  const dx = ankle[0] - hip[0],
    dy = ankle[1] - hip[1];
  const distance = Math.max(
    0.001,
    Math.min(Math.hypot(dx, dy), upper + lower - 0.01),
  );
  const angle =
    Math.atan2(dy, dx) +
    (index === 2 ? -1 : 1) *
      Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (upper * upper + distance * distance - lower * lower) /
              (2 * upper * distance),
          ),
        ),
      );
  return {
    hip,
    knee: [hip[0] + Math.cos(angle) * upper, hip[1] + Math.sin(angle) * upper],
    ankle,
  };
}

export function getArtBounds(player) {
  // Uniform art scaling preserves the selected silhouette during the taller growth hitbox.
  const scale = player.isShrinking
    ? player.shrinkScale
    : player.width / PLAYER_SIZE.width;
  const width = PLAYER_SIZE.width * scale,
    height = PLAYER_SIZE.height * scale;
  return {
    x: player.x + (player.width - width) / 2,
    y: player.y + player.height - (height * HORSE_ART.floor) / HORSE_ART.height,
    width,
    height,
  };
}

export function getMuzzlePosition(player) {
  const b = getArtBounds(player),
    pose = getHorsePose(player);
  const u = (HORSE_ART.muzzleX - pose.recoil * 7) / HORSE_ART.width;
  return {
    x: b.x + b.width * (player.direction < 0 ? 1 - u : u),
    y: b.y + (b.height * (HORSE_ART.muzzleY + pose.bob + pose.bodyDrop + pose.cannonDrop)) / HORSE_ART.height + CANNON_Y_OFFSET,
  };
}

export function drawPlayer(ctx, player) {
  const b = getArtBounds(player),
    pose = getHorsePose(player);
  ctx.save();
  if (!pose.airborne) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(
      player.x + player.width / 2,
      player.y + player.height,
      b.width * 0.46,
      Math.max(2, b.height * 0.07),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  if (player.specialAbilityActive) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = pose.weaponColor;
    ctx.beginPath();
    ctx.ellipse(
      b.x + b.width / 2,
      b.y + b.height / 2,
      b.width * 0.6,
      b.height * 0.65,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }
  drawPlatedHorse(ctx, b.x, b.y, b.width, b.height, player.direction < 0, pose);
  if (player.appearance.hurt > 0) {
    ctx.save();
    ctx.globalAlpha = player.appearance.hurt * 0.7;
    ctx.strokeStyle = "#ff9baf";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      b.x + b.width * 0.46,
      b.y + b.height * 0.52,
      b.width * 0.25,
      b.height * 0.24,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawPlatedHorse(ctx, x, y, w, h, flip = false, pose = null) {
  const p = {
    dark: "#20364f",
    mid: "#547b9f",
    light: "#b9d2e3",
    edge: "#08131f",
  };
  ctx.save();
  ctx.translate(x + (flip ? w : 0), y);
  ctx.scale(((flip ? -1 : 1) * w) / 300, h / 260);
  if (pose) ctx.translate(0, pose.bob + pose.bodyDrop);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  function poly(points, fill, stroke = p.edge, lw = 3) {
    ctx.beginPath();
    points.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }
  function line(points, color, width = 3) {
    ctx.beginPath();
    points.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function circle(x, y, r, color, stroke = p.edge, lw = 3) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }
  function plate(points) {
    let g = ctx.createLinearGradient(60, 50, 160, 210);
    g.addColorStop(0, p.light);
    g.addColorStop(0.42, p.mid);
    g.addColorStop(1, p.dark);
    poly(points, g);
    line(points.slice(0, 3), p.light, 1.7);
  }
  function joint(x, y, r, far) {
    circle(x, y, r, far ? p.dark : p.mid);
    circle(x, y, r * 0.6, far ? "#35516b" : p.light, p.edge, 1.6);
    circle(x, y, r * 0.35, far ? p.dark : p.mid, null);
  }
  function segment(a, b, width, far) {
    let dx = b[0] - a[0],
      dy = b[1] - a[1],
      d = Math.hypot(dx, dy),
      nx = (-dy / d) * width,
      ny = (dx / d) * width;
    let pts = [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx * 0.62, b[1] + ny * 0.62],
      [b[0] - nx * 0.62, b[1] - ny * 0.62],
      [a[0] - nx, a[1] - ny],
    ];
    if (far) poly(pts, p.dark);
    else {
      plate(pts);
      line(
        [
          [a[0] + nx * 0.4, a[1] + ny * 0.4],
          [b[0] + nx * 0.3, b[1] + ny * 0.3],
        ],
        p.light,
        2,
      );
    }
  }
  const hips = [
    [86, 145],
    [144, 152],
    [195, 140],
  ];
  function leg(i, far) {
    let a = hips[i],
      offset = far ? 9 : 0;
    a = [a[0] + offset, a[1] - (far ? 3 : 0)];
    let b, c;
    if (far) {
      b = [
        [74, 194],
        [157, 190],
        [225, 183],
      ][i];
      c = [
        [94, 239],
        [165, 239],
        [218, 239],
      ][i];
    } else {
      b = [
        [57, 193],
        [123, 199],
        [233, 181],
      ][i];
      c = [
        [47, 240],
        [137, 240],
        [222, 224],
      ][i];
    }
    if (pose) {
      const gait = getLegPose(i, far, pose);
      a = gait.hip;
      b = gait.knee;
      c = gait.ankle;
    }
    const width = 10;
    segment(a, b, width + 2, far);
    segment(b, c, width, far);
    joint(...a, 13, far);
    joint(...b, 9, far);
    joint(...c, 7, far);
    poly(
      [
        [c[0] - 9, c[1] - 2],
        [c[0] + 9, c[1] - 2],
        [c[0] + 16, c[1] + 12],
        [c[0] - 10, c[1] + 12],
      ],
      far ? p.dark : p.mid,
    );
    if (!far)
      line(
        [
          [c[0] - 5, c[1]],
          [c[0] + 5, c[1]],
          [c[0] + 11, c[1] + 9],
        ],
        p.light,
        3,
      );
  }
  for (let i = 0; i < 3; i++) leg(i, true);
  ctx.save();
  if (pose?.crouching) {
    ctx.translate(70, 126);
    ctx.rotate(0.45);
    ctx.translate(-70, -126);
  }
  ctx.shadowColor = "#36e4ff";
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.moveTo(70, 126);
  const sway = pose ? pose.tailSway : 0;
  ctx.bezierCurveTo(18, 105 + sway, 45 + sway, 201, 9 + sway, 214);
  ctx.bezierCurveTo(51 + sway, 207, 23, 146 + sway, 71, 137);
  ctx.strokeStyle = "#1b82ab";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = "#66eaff";
  ctx.lineWidth = 3;
  ctx.stroke();
  line(
    [
      [16 + (pose ? pose.tailSway : 0), 208],
      [9 + (pose ? pose.tailSway : 0), 216],
    ],
    "#b3faff",
    2,
  );
  circle(5 + (pose ? pose.tailSway : 0), 221, 1.5, "#b3faff", null);
  ctx.restore();

  plate([
    [62, 107],
    [85, 77],
    [129, 69],
    [167, 79],
    [195, 110],
    [207, 159],
    [184, 189],
    [128, 200],
    [81, 179],
    [62, 142],
  ]);
  poly(
    [
      [65, 141],
      [83, 176],
      [128, 195],
      [181, 185],
      [199, 161],
      [153, 176],
      [101, 165],
    ],
    p.dark,
  );
  line(
    [
      [85, 78],
      [94, 111],
      [70, 130],
    ],
    p.edge,
    3,
  );
  line(
    [
      [130, 72],
      [128, 197],
    ],
    p.edge,
    3,
  );
  line(
    [
      [165, 81],
      [159, 114],
      [195, 111],
    ],
    p.edge,
    3,
  );
  line(
    [
      [65, 140],
      [201, 144],
    ],
    p.edge,
    3,
  );
  ctx.save();
  if (pose?.crouching) {
    ctx.translate(183, 123);
    ctx.rotate(0.95);
    ctx.translate(-183, -123);
  }
  plate([
    [162, 98],
    [192, 47],
    [220, 34],
    [238, 56],
    [215, 107],
    [198, 124],
  ]);
  poly(
    [
      [181, 90],
      [204, 57],
      [223, 59],
      [210, 94],
      [199, 110],
    ],
    p.dark,
  );
  line(
    [
      [180, 92],
      [191, 78],
      [200, 85],
      [213, 68],
    ],
    "#55e5fc",
    4,
  );
  ctx.restore();
  {
    line(
      [
        [140, 99],
        [153, 99],
        [166, 116],
        [180, 116],
      ],
      "#68edff",
      3,
    );
    line(
      [
        [142, 113],
        [151, 113],
        [157, 131],
        [178, 131],
      ],
      "#68edff",
      3,
    );
    circle(139, 99, 3, "#b3faff", null);
    circle(142, 113, 3, "#b3faff", null);
  }
  let core = [126, 151];
  circle(...core, 20, p.mid);
  circle(...core, 14, p.light);
  circle(...core, 9, p.dark);
  circle(...core, 4, "#5be8f3", null);
  for (let i = 0; i < 3; i++) leg(i, false);
  ctx.save();
  if (pose?.crouching) {
    // Follow the neck hinge while keeping the head facing forward.
    ctx.translate(183 + 30 * Math.cos(0.95) + 58 * Math.sin(0.95) - 213,
      123 + 30 * Math.sin(0.95) - 58 * Math.cos(0.95) - 65);
  }
  if (pose) {
    ctx.translate(213, 65);
    ctx.rotate(pose.headTilt);
    ctx.translate(-213, -65);
  }
  plate([
    [212, 30],
    [239, 35],
    [261, 49],
    [272, 77],
    [267, 100],
    [249, 102],
    [236, 77],
    [211, 69],
    [201, 48],
  ]);
  poly(
    [
      [236, 77],
      [252, 70],
      [272, 77],
      [267, 100],
      [249, 102],
    ],
    p.mid,
  );
  line(
    [
      [213, 32],
      [222, 49],
      [248, 45],
    ],
    p.edge,
    3,
  );
  line(
    [
      [222, 49],
      [218, 70],
    ],
    p.edge,
    3,
  );
  plate([
    [210, 37],
    [205, 11],
    [215, 17],
    [224, 34],
  ]);
  plate([
    [233, 35],
    [235, 18],
    [242, 23],
    [242, 38],
  ]);
  joint(213, 65, 10, false);
  poly(
    [
      [239, 52],
      [262, 54],
      [267, 64],
      [241, 65],
      [233, 60],
    ],
    "#19172b",
  );
  ctx.save();
  ctx.shadowColor = "#ff456e";
  ctx.shadowBlur = 4;
  line(
    [
      [243, 58],
      [261, 59],
    ],
    "#ff5473",
    4,
  );
  ctx.restore();
  line(
    [
      [243, 57],
      [259, 58],
    ],
    "#ffb4c4",
    1,
  );
  ctx.restore();
  ctx.save();
  if (pose) ctx.translate(-pose.recoil * 7, CANNON_Y_OFFSET * HORSE_ART.height / h + pose.cannonDrop);
  plate([
    [178, 111],
    [206, 109],
    [218, 121],
    [213, 133],
    [178, 135],
  ]);
  plate([
    [203, 114],
    [268, 116],
    [275, 122],
    [267, 132],
    [203, 132],
  ]);
  poly(
    [
      [262, 115],
      [273, 117],
      [277, 128],
      [266, 132],
    ],
    p.dark,
  );
  line(
    [
      [211, 119],
      [260, 120],
    ],
    p.light,
    2,
  );
  joint(183, 123, 15, false);
  if (pose) {
    line(
      [
        [250, 123],
        [270, 123],
      ],
      pose.weaponColor,
      2,
    );
    if (pose.flash > 0) {
      ctx.save();
      ctx.globalAlpha = pose.flash;
      ctx.shadowColor = pose.weaponColor;
      ctx.shadowBlur = 5;
      poly(
        [
          [277, 118],
          [290, 115],
          [285, 123],
          [293, 129],
          [277, 129],
        ],
        pose.weaponColor,
        null,
      );
      ctx.restore();
    }
  }

  ctx.restore();
  {
    for (let [a, b] of [
      [79, 108],
      [116, 82],
      [175, 151],
      [105, 180],

    ])
      circle(a, b, 2, p.dark, null);
  }
  ctx.restore();
}
