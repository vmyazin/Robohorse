const DURATION = 108;
const WEAPON_EFFECTS = {
    'GLOWING CANNON': 'Glowing Shots',
    'NEURAL BEAM': 'Faster Shots',
    'TENTACLE SCRAMBLER': 'Stronger Shots',
    'ROBOHORSE CANNON': 'Wave Shots',
    'LEG LAUNCHERS': 'Rapid Fire',
};

export function showPickupNotice(game, type, color) {
    const text = type === 'weapon' ? WEAPON_EFFECTS[game.player.currentWeapon.name]
        : { health: 'Health Restored', mushroom: 'Grow Bigger', special: 'Special Active' }[type];
    if (!text) return;
    const notices = game.pickupNotices ??= [];
    // Keep the current message readable, with at most two recent pickups waiting.
    if (notices.length >= 3) notices.splice(1, 1);
    notices.push({ text, color, age: 0 });
}

export function updatePickupNotice(game, timeScale) {
    const notice = game.pickupNotices?.[0];
    if (notice && (notice.age += timeScale) >= DURATION) game.pickupNotices.shift();
}

export function drawPickupNotice(game) {
    const notice = game.pickupNotices?.[0];
    if (!notice || !game.gameStarted || game.gameOver || game.battleEnding) return;
    const ctx = game.ctx;
    const enter = Math.min(1, notice.age / 12);
    const exit = Math.min(1, (DURATION - notice.age) / 24);
    const top = game.boss || game.nest ? 205 : Math.max(88, game.canvas.height * 0.18);
    const y = top + 7 * (1 - enter) ** 2;
    ctx.save();
    ctx.globalAlpha = Math.min(enter, exit) * 0.95;
    ctx.font = '600 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const width = ctx.measureText(notice.text).width + 32;
    const x = game.canvas.width / 2;
    ctx.fillStyle = 'rgba(7, 16, 30, 0.78)';
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - 19, width, 38, 10);
    ctx.fill();
    ctx.fillStyle = notice.color;
    ctx.fillRect(x - 15, y + 16, 30, 2);
    ctx.fillStyle = '#edf6ff';
    ctx.fillText(notice.text, x, y);
    ctx.restore();
}
