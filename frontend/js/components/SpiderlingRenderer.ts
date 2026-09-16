interface Spiderling { x: number; y: number; width: number; height: number; velX: number; life: number }

/** Armored offspring of the six-eyed titan, facing their direction of travel. */
export function drawSpiderling(ctx: CanvasRenderingContext2D, spider: Spiderling) {
    const w = spider.width, h = spider.height;
    const age = 420 - spider.life;
    ctx.save();
    ctx.translate(spider.x + w / 2, spider.y + h / 2);
    if (spider.velX > 0) ctx.scale(-1, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#08121c55';
    ctx.beginPath(); ctx.ellipse(0, h / 2 - 1, w * .5, 2, 0, 0, Math.PI * 2); ctx.fill();
    // Alternating leg pairs scuttle while the compact armored body stays readable.
    for (let i = 0; i < 3; i++) {
        for (const side of [-1, 1]) {
            const root = -7 + i * 7;
            const stride = Math.sin(age * .32 + i * 2.1 + (side === 1 ? Math.PI : 0));
            const kneeX = root + side * 5;
            const kneeY = 4 + stride * 2;
            const footX = root + side * 7 + stride * 2;
            const limb = () => {
                ctx.beginPath(); ctx.moveTo(root, 0); ctx.lineTo(kneeX, kneeY);
                ctx.lineTo(footX, h / 2 - 1 - Math.max(0, stride) * 3); ctx.stroke();
            };
            ctx.strokeStyle = '#0d1826'; ctx.lineWidth = 4; limb();
            ctx.strokeStyle = side === 1 ? '#8caabd' : '#4a647e'; ctx.lineWidth = 1.7; limb();
            ctx.fillStyle = '#b2cad6'; ctx.beginPath(); ctx.arc(kneeX, kneeY, 1.3, 0, Math.PI * 2); ctx.fill();
        }
    }
    const armor = ctx.createLinearGradient(0, -12, 0, 7);
    armor.addColorStop(0, '#b1c6d4'); armor.addColorStop(.35, '#526c85'); armor.addColorStop(1, '#1a2a3e');
    ctx.fillStyle = armor; ctx.strokeStyle = '#9bb7c9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-w * .45, 1); ctx.lineTo(-w * .3, -8);
    ctx.quadraticCurveTo(3, -h * .52, w * .4, -5);
    ctx.lineTo(w * .43, 3); ctx.quadraticCurveTo(0, 10, -w * .45, 1); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#162536'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(i * 5 - 1, -9 + i); ctx.lineTo(i * 5 + 1, 4); ctx.stroke();
    }
    // Six coral eyes echo the boss's vulnerable eye cluster.
    ctx.fillStyle = '#111a29'; ctx.beginPath(); ctx.ellipse(-7, -2, 6, 7, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = '#ff6c88'; ctx.shadowBlur = 3;
    ctx.fillStyle = '#ff98a8';
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
        ctx.beginPath(); ctx.arc(-10 + col * 3, -5 + row * 4, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#bed7de'; ctx.lineWidth = 1.5;
    for (const offset of [-3, 2]) {
        ctx.beginPath(); ctx.moveTo(-11, offset); ctx.lineTo(-14, offset + 2); ctx.lineTo(-11, offset + 4); ctx.stroke();
    }
    ctx.restore();
}
