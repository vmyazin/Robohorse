// Approved D artwork. Coordinates below refer to the transparent 1254px source.
export const TITAN_CROP = { x: 14, y: 150, width: 1225, height: 960 };
export const TITAN_EYES = [[369, 405], [521, 405], [684, 405], [369, 596], [521, 596], [684, 596]];
export const titanSprite = typeof Image === 'undefined' ? null : new Image();
// Normalize the bottom of each opaque foot column to the common support plane.
// Only the lower legs are stretched; the shell and target coordinates stay unchanged.
const LEG_JOIN_Y = 850;
let groundedSprite = null;
if (titanSprite) {
    titanSprite.onload = () => {
        const surface = document.createElement('canvas');
        surface.width = titanSprite.naturalWidth;
        surface.height = titanSprite.naturalHeight;
        const ctx = surface.getContext('2d');
        ctx.drawImage(titanSprite, 0, 0);
        const pixels = ctx.getImageData(0, 0, surface.width, surface.height).data;
        ctx.clearRect(0, LEG_JOIN_Y, surface.width, surface.height - LEG_JOIN_Y);
        const baseline = TITAN_CROP.y + TITAN_CROP.height;
        for (let x = 0; x < surface.width; x++) {
            let bottom = baseline - 1;
            while (bottom >= LEG_JOIN_Y && pixels[(bottom * surface.width + x) * 4 + 3] < 128) bottom--;
            if (bottom < LEG_JOIN_Y) continue;
            ctx.drawImage(titanSprite, x, LEG_JOIN_Y, 1, bottom - LEG_JOIN_Y + 1,
                x, LEG_JOIN_Y, 1, baseline - LEG_JOIN_Y);
        }
        groundedSprite = surface;
    };
    titanSprite.src = new URL('../../images/kraken-titan-grounded.png', import.meta.url).href;
}

export function titanPose(boss) {
    const windup = !boss.stunTimer && boss.currentAttack === 'Tentacle Slam' && boss.attackTick < 60
        ? Math.sin(boss.attackTick / 60 * Math.PI / 2) * 5 : 0;
    const impact = !boss.stunTimer && boss.currentAttack === 'Tentacle Slam' && boss.attackTick >= 60 && boss.attackTick < 78
        ? -Math.sin((boss.attackTick - 60) / 18 * Math.PI) * 7 : 0;
    if (boss.jump) return { lift: boss.jump.tick <= 30 ? -Math.sin(boss.jump.tick / 30 * Math.PI) * 9 : 0, recoil: 0 };
    const breathing = Math.sin(boss.tick * 0.035) * 1.4;
    return { lift: breathing + windup + impact, recoil: boss.hitFlash > 0 ? Math.sin(boss.hitFlash * 0.8) * 1.5 : 0 };
}

export function titanPoint(boss, sx, sy) {
    const pose = titanPose(boss);
    const u = (sx - TITAN_CROP.x) / TITAN_CROP.width;
    const v = (sy - TITAN_CROP.y) / TITAN_CROP.height;
    return { x: boss.x + (boss.facing === 1 ? 1 - u : u) * boss.width + pose.recoil * (1 - v) * (boss.facing === 1 ? -1 : 1),
        y: boss.y + v * boss.height - pose.lift * (1 - v) };
}

export function drawTitan(ctx, boss) {
    ctx.save();
    ctx.fillStyle = 'rgba(5,12,23,.32)';
    ctx.beginPath(); ctx.ellipse(boss.x + boss.width / 2, (boss.groundY ?? boss.y) + boss.height - 4, boss.width * 0.46, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    if (boss.facing === 1) { ctx.translate(2 * boss.x + boss.width, 0); ctx.scale(-1, 1); }
    if (titanSprite?.complete && titanSprite.naturalWidth) {
        // Strips flex the connected armor/legs while leaving feet planted. No art is redrawn.
        const pose = titanPose(boss);
        const strips = 48;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        for (let i = 0; i < strips; i++) {
            const v = i / strips;
            const h = TITAN_CROP.height / strips;
            ctx.drawImage(groundedSprite || titanSprite, TITAN_CROP.x, TITAN_CROP.y + i * h, TITAN_CROP.width, h,
                boss.x + pose.recoil * (1 - v), boss.y + v * boss.height - pose.lift * (1 - v),
                boss.width, (boss.height + pose.lift) / strips + 0.3);
        }
    } else {
        // Intentional loading/failure state, still exposes every target.
        ctx.fillStyle = '#35516f'; ctx.strokeStyle = '#95b8d5'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(boss.x + boss.width * 0.48, boss.y + boss.height * 0.35,
            boss.width * 0.3, boss.height * 0.34, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    boss.eyes.forEach((eye, index) => {
        const p = titanPoint(boss, ...TITAN_EYES[index]);
        const rx = boss.width * 39 / TITAN_CROP.width, ry = boss.height * 42 / TITAN_CROP.height;
        if (!eye.active || eye.blinkTicks > 0 || !titanSprite?.naturalWidth) {
            ctx.fillStyle = eye.active && !eye.blinkTicks ? '#ff6484' : '#101b2d';
            ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
            if (!eye.active) {
                ctx.strokeStyle = '#6d88a5'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(p.x - rx * 0.7, p.y - ry * 0.6);
                ctx.lineTo(p.x + 2, p.y); ctx.lineTo(p.x - 3, p.y + ry * 0.8); ctx.stroke();
            }
        } else if (boss.stunTimer || boss.attackTick < 60) {
            ctx.strokeStyle = boss.stunTimer ? '#98f5ff' : '#ffb486';
            ctx.globalAlpha = 0.4 + Math.sin(boss.tick * 0.12) * 0.2;
            ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, rx + 2, ry + 2, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
        }
    });
    if (boss.shieldCharge || boss.shieldActive) {
        // Angular panels around the shell, distinct from the removed landing oval.
        const cx = boss.x + boss.width / 2, cy = boss.y + boss.height * 0.43;
        const rx = boss.width * 0.42, ry = boss.height * 0.46;
        ctx.strokeStyle = '#88e4ff'; ctx.fillStyle = '#58c9fa';
        ctx.lineWidth = boss.shieldActive ? 3 : 1.5;
        ctx.globalAlpha = boss.shieldActive ? 0.75 : 0.25 + Math.sin(boss.tick * 0.35) * 0.15;
        ctx.setLineDash(boss.shieldActive ? [] : [6, 8]);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            const x = cx + Math.cos(angle) * rx, y = cy + Math.sin(angle) * ry;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
        if (boss.shieldActive) { ctx.globalAlpha = 0.08; ctx.fill(); }
        ctx.globalAlpha = 1; ctx.setLineDash([]);
    }
    // The recessed vent charges before web shots and exposes a cyan core during stun.
    const vent = titanPoint(boss, 560, 500);
    if (boss.stunTimer || (boss.currentAttack === 'Web Shot' && boss.attackTick < 60)) {
        ctx.fillStyle = boss.stunTimer ? '#91e7f2' : '#ffad83';
        ctx.globalAlpha = boss.stunTimer ? 0.7 : boss.attackTick / 85;
        for (let i = 0; i < 3; i++) ctx.fillRect(vent.x - 49, vent.y - 5 + i * 4, 98, 1.5);
        ctx.globalAlpha = 1;
    }
    if (boss.hitFlash > 0) {
        ctx.strokeStyle = '#e0f7ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(boss.lastHit.x, boss.lastHit.y, 5 + (8 - boss.hitFlash) * 1.6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}
