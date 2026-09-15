// A compact, shaded silhouette authored in the pickup's 25 × 25 bounds.
export function drawMushroomPickup(ctx, pickup, frame) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.scale(pickup.width / 25, pickup.height / 25);

    const halo = ctx.createRadialGradient(12.5, 13, 4, 12.5, 13, 18);
    halo.addColorStop(0, 'rgba(255, 143, 111, 0.28)');
    halo.addColorStop(1, 'rgba(255, 110, 100, 0)');
    ctx.globalAlpha = 0.8 + Math.sin(frame * 0.045) * 0.15;
    ctx.fillStyle = halo;
    ctx.fillRect(-6, -6, 37, 37);
    ctx.globalAlpha = 1;

    const stem = ctx.createLinearGradient(8, 14, 16, 24);
    stem.addColorStop(0, '#fff4d8');
    stem.addColorStop(1, '#cba77f');
    ctx.fillStyle = stem;
    ctx.strokeStyle = '#493044';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(9, 12);
    ctx.lineTo(16, 12);
    ctx.bezierCurveTo(16, 17, 19, 23.5, 14, 24);
    ctx.lineTo(11, 24);
    ctx.bezierCurveTo(6, 23.5, 9, 17, 9, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const cap = ctx.createLinearGradient(7, 2, 16, 17);
    cap.addColorStop(0, '#ff9c87');
    cap.addColorStop(0.38, '#f95665');
    cap.addColorStop(1, '#a52253');
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.moveTo(1.5, 13);
    ctx.bezierCurveTo(2, -2, 23, -2, 23.5, 13);
    ctx.bezierCurveTo(24, 18, 1, 18, 1.5, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff0d9';
    for (const [x, y, rx, ry, tilt] of [[6, 10, 2.4, 3, 0.35], [13, 5, 3, 2.3, 0], [20, 11, 2.4, 2.7, -0.3]]) {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 236, 215, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 6.5);
    ctx.quadraticCurveTo(7, 2, 11, 2);
    ctx.stroke();
    ctx.restore();

    // A shaded lip separates the cap from the warm ivory stalk.
    ctx.strokeStyle = '#762345';
    ctx.beginPath();
    ctx.moveTo(4, 15);
    ctx.quadraticCurveTo(12.5, 18, 21, 15);
    ctx.stroke();
    ctx.restore();
}
