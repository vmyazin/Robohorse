// ImageGen artwork; crop transparent padding without modifying its original alpha.
const sprite = typeof Image === 'undefined' ? null : new Image();
let crop = null;
if (sprite) {
    sprite.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = sprite.naturalWidth; canvas.height = sprite.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprite, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
            if (pixels[(y * canvas.width + x) * 4 + 3] < 32) continue;
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        if (right >= left) crop = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
    };
    sprite.src = new URL('../../images/titan-plague-wave-pixel.png', import.meta.url).href;
}

export function drawPlagueWave(ctx, wave) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(wave.x + wave.width / 2, wave.y + wave.height);
    if (wave.velX > 0) ctx.scale(-1, 1);
    if (crop && sprite?.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, crop.x, crop.y, crop.width, crop.height,
            -wave.width / 2, -wave.height, wave.width, wave.height);
    } else {
        // Recognizable hooked silhouette while the sprite loads or if it fails.
        ctx.fillStyle = '#886079'; ctx.strokeStyle = '#d5ed91'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-wave.width / 2, 0);
        ctx.quadraticCurveTo(2, -wave.height / 2, -wave.width / 2, -wave.height);
        ctx.quadraticCurveTo(wave.width / 3, -wave.height, wave.width / 2, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
}
