// Approved concept B. Two aligned states in the original transparent ImageGen sheet.
export const hatcherySprite = typeof Image === 'undefined' ? null : new Image();
if (hatcherySprite) hatcherySprite.src = new URL('../../images/cybernetic-hatchery.png', import.meta.url).href;
const FRAMES = [
    { x: 24, y: 20, width: 853, height: 820 },
    { x: 895, y: 20, width: 853, height: 820 },
];

export function drawHatchery(ctx, nest) {
    if (!hatcherySprite?.complete || !hatcherySprite.naturalWidth) return false;
    const open = nest.phase === 'exposed';
    // Crossfade only on phase changes; simulation time also freezes these effects in pause.
    const iris = open ? Math.min(1, (211 - nest.timer) / 10)
        : nest.phase === 'shielded' ? Math.max(0, 1 - (61 - nest.timer) / 10) : 0;
    const breath = Math.sin(nest.tick / 23) * 0.8;
    const left = nest.x - 24, top = nest.y - 8 - breath;
    const width = nest.width + 48, height = nest.height + 8 + breath;
    ctx.save();
    ctx.fillStyle = '#09121c66';
    ctx.beginPath(); ctx.ellipse(nest.x + 70, nest.y + nest.height - 1, 88, 6, 0, 0, Math.PI * 2); ctx.fill();
    const paint = (frame, opacity) => {
        ctx.globalAlpha = opacity;
        ctx.drawImage(hatcherySprite, frame.x, frame.y, frame.width, frame.height, left, top, width, height);
    };
    paint(FRAMES[0], 1);
    if (iris > 0) paint(FRAMES[1], iris);
    ctx.globalAlpha = 1;
    // Small glow overlays leave the painted iris blades and surface details legible.
    const cx = nest.x + 78, cy = nest.y + 96 - breath;
    if (open) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.10 + Math.sin(nest.tick / 9) * 0.035;
        ctx.fillStyle = '#8affd5'; ctx.shadowColor = '#50ffb7'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.ellipse(cx, cy, 16, 19, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    } else if (nest.phase === 'warning') {
        ctx.globalAlpha = 0.25 + (1 + Math.sin(nest.tick / 5)) * 0.2;
        ctx.fillStyle = '#ffb34f'; ctx.shadowColor = '#ff8400'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }
    if (nest.flash > 0) {
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = nest.flash / 12;
        ctx.fillStyle = '#effff9';
        ctx.beginPath(); ctx.ellipse(cx, cy, 15, 18, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return true;
}
