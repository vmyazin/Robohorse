import type Enemy from '../entities/Enemy.js';

/** Small, high-contrast offspring of the cybernetic hatchery. */
export function drawHatchling(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const ground = enemy.pattern === 'ground';
    const charging = enemy.attackState === 'telegraph';
    const charge = charging ? Math.max(0, Math.min(1, 1 - enemy.attackTimer / enemy.cueDuration)) : 0;
    const glow = charging ? '#ffbe69' : '#7bffcf';
    const hurt = enemy.damageFeedbackTimer > 0;
    const w = enemy.width, h = enemy.height;
    const t = enemy.age;
    ctx.save();
    ctx.translate(enemy.x + w / 2, enemy.y + h / 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#07121b66';
    ctx.beginPath(); ctx.ellipse(0, h / 2 + 2, w * .5, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Limbs stay close to the collision body; motion uses simulation time so pause freezes it.
    for (let i = 0; i < 4; i++) {
        const root = -w * .3 + i * w * .2;
        const wave = Math.sin(t / 7 + i * 1.8) * 3;
        ctx.strokeStyle = '#1e1832'; ctx.lineWidth = 5;
        const limb = () => {
            ctx.beginPath(); ctx.moveTo(root, 2);
            if (ground) {
                const side = i < 2 ? -1 : 1;
                ctx.lineTo(root + side * 5, h * .22 + wave);
                ctx.lineTo(root + side * 7 + wave, h * .46);
            } else {
                ctx.bezierCurveTo(root + 9, 7, root - 7 + wave, 13, root + wave, h * .53);
            }
            ctx.stroke();
        };
        limb(); ctx.strokeStyle = '#ad91d5'; ctx.lineWidth = 2; limb();
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(root, 3, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    if (!ground) {
        // Side fins give the airborne hatchling a diamond silhouette.
        ctx.fillStyle = '#80649e'; ctx.strokeStyle = '#ccadeb'; ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(side * 6, -9);
            ctx.lineTo(side * (w * .51), 2 + Math.sin(t / 9) * 2);
            ctx.lineTo(side * 7, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
    }
    const shell = ctx.createLinearGradient(0, -h / 2, 0, 8);
    shell.addColorStop(0, hurt ? '#ffffff' : '#c2a6de');
    shell.addColorStop(.4, hurt ? '#ffffff' : '#655080');
    shell.addColorStop(1, '#28243e');
    ctx.fillStyle = shell; ctx.strokeStyle = '#e0c6f0'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-w * .44, 3);
    ctx.quadraticCurveTo(-w * .5, -h * .27, ground ? -3 : 0, -h * (ground ? .30 : .48));
    ctx.quadraticCurveTo(w * .45, -h * (ground ? .25 : .35), w * .44, 3);
    ctx.quadraticCurveTo(0, h * .25, -w * .44, 3);
    ctx.fill(); ctx.stroke();
    // Segmented shell plates surrounding one luminous recessed core.
    ctx.strokeStyle = '#30253f'; ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 3, -h * .36);
        ctx.lineTo(side * 7, -4); ctx.lineTo(side * 10, 4); ctx.stroke();
    }
    ctx.fillStyle = '#101a29'; ctx.beginPath(); ctx.ellipse(-2, -2, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = glow; ctx.shadowBlur = charging ? 9 : 4;
    ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(-3, -2, 3 + charge, 4 + charge, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f0fff5'; ctx.fillRect(-5, -4, 2, 2);
    if (charging) {
        ctx.strokeStyle = glow; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(enemy.aimX * 180, enemy.aimY * 180); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(0, 0, w * .6 + (1 - charge) * 8, 0, Math.PI * 2); ctx.stroke();
    }
    if (enemy.health < enemy.maxHealth) {
        ctx.fillStyle = '#161326'; ctx.fillRect(-w / 2, -h / 2 - 7, w, 3);
        ctx.fillStyle = glow; ctx.fillRect(-w / 2, -h / 2 - 7, w * Math.max(0, enemy.health / enemy.maxHealth), 3);
    }
    ctx.restore();
}
