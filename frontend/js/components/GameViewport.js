// Scale the complete 1000 × 600 stage, including its HTML overlays.
// Canvas/world coordinates remain fixed so resizing cannot change gameplay.
export function fitGameViewport(container, canvas) {
    const fit = () => {
        const width = document.documentElement.clientWidth;
        const height = window.innerHeight;
        const padding = Math.max(12, Math.min(24, Math.min(width, height) * 0.02));
        const outline = 8; // Four logical pixels on each side of the stage.
        const scale = Math.max(0.01, Math.min(
            (width - 2 * padding) / (canvas.width + outline),
            (height - 2 * padding) / (canvas.height + outline),
        ));
        container.style.setProperty('--game-scale', String(scale));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
}
