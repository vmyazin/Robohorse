// Six seconds at the game's fixed 60 Hz. Combat remains frozen throughout.
export const ENDING_TICKS = 360;

export function beginBattleEnding(game, outcome) {
    if (game.battleEnding) return;
    const target = outcome === 'victory' ? game.boss : game.player;
    game.battleEnding = { outcome, tick: 0, x: target.x + target.width / 2,
        y: target.y + target.height / 2 };
    game.inputManager.keys = {};
    game.projectiles = [];
    game.player.webSlowTicks = 0;
    game.boss.webs = [];
    game.boss.shakeTicks = 0;
    const overlay = document.getElementById('battle-ending');
    overlay.dataset.outcome = outcome;
    overlay.hidden = false;
    overlay.querySelector('h1').textContent = outcome === 'victory'
        ? 'YOU DEFEATED THE BOSS' : 'YOU WERE DEFEATED';
    document.getElementById('game-container').classList.add('battle-ending-active');
    game.soundManager.startEndingMusic(outcome === 'victory' ? 'bossVictory' : 'playerDefeat');
}

export function clearBattleEnding(game) {
    game.battleEnding = null;
    document.getElementById('battle-ending').hidden = true;
    document.getElementById('game-container').classList.remove('battle-ending-active');
    game.soundManager.stopEndingMusic();
}

export function updateBattleEnding(game) {
    const ending = game.battleEnding;
    if (++ending.tick < ENDING_TICKS) return;
    const { outcome } = ending;
    clearBattleEnding(game);
    game.boss = null;
    if (outcome === 'victory') game.showMissionComplete(true);
    else game.endGame(true);
}

export function drawBattleEnding(game) {
    const ending = game.battleEnding;
    if (!ending) return;
    const { ctx } = game;
    const { tick: t, outcome, x, y } = ending;
    const win = outcome === 'victory';
    const reduced = game.reducedMotion;
    ctx.save();
    // An impact hold gives way to the arcade results tableau.
    ctx.fillStyle = `rgba(9,2,25,${Math.min(.88, .18 + t / 100)})`;
    ctx.fillRect(0, 0, 1000, 600);
    if (!reduced) {
        ctx.save();
        ctx.translate(500, 290);
        ctx.rotate(t * (win ? .003 : -.001));
        for (let i = 0; i < 24; i++) {
            ctx.rotate(Math.PI / 12);
            ctx.fillStyle = i % 2 ? (win ? '#48104855' : '#33102466') : '#170c3766';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1100, -70); ctx.lineTo(1100, 70); ctx.fill();
        }
        ctx.restore();
        // Chained pixel explosions centered on the defeated combatant.
        for (let i = 0; i < (win ? 12 : 6); i++) {
            const age = t - i * 7;
            if (age < 0 || age > 60) continue;
            const cx = x + Math.sin(i * 7.3) * (win ? 115 : 35);
            const cy = y + Math.cos(i * 4.7) * (win ? 95 : 25);
            ctx.strokeStyle = age < 16 ? '#fff0bf' : '#fa397d';
            ctx.lineWidth = Math.max(1, 10 - age / 6);
            ctx.strokeRect(cx - age, cy - age, age * 2, age * 2);
            for (let j = 0; j < 12; j++) {
                const a = j * Math.PI / 6;
                ctx.fillStyle = j % 2 ? '#ff577f' : '#cc84ff';
                ctx.fillRect(cx + Math.cos(a) * age * 3, cy + Math.sin(a) * age * 3, 6, 6);
            }
        }
        for (let i = 0; i < 100; i++) {
            const speed = 1 + i % 5;
            const px = (i * 137.7 + Math.sin(t / 30 + i) * 22) % 1000;
            const py = win ? (i * 71 + t * speed) % 600 : 600 - (i * 71 + t * speed * .45) % 600;
            ctx.fillStyle = ['#ff387f', '#b360ff', '#ffcd8c', '#87e9ff'][i % 4];
            ctx.globalAlpha = win ? .7 : .3;
            ctx.fillRect(px, py, i % 3 === 0 ? 6 : 3, win ? 8 : 2);
        }
        ctx.globalAlpha = 1;
    }
    // Perspective grid and letterbox framing recall an arcade attract screen.
    ctx.strokeStyle = win ? '#953b974d' : '#77233e4d';
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(500 + i * 35, 440); ctx.lineTo(500 + i * 140, 600); ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
        const gy = 440 + i * i * 4;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(1000, gy); ctx.stroke();
    }
    ctx.fillStyle = '#080311'; ctx.fillRect(0, 0, 1000, 44); ctx.fillRect(0, 556, 1000, 44);
    ctx.fillStyle = '#e8459955'; ctx.fillRect(28, 43, 944, 2); ctx.fillRect(28, 555, 944, 2);
    ctx.textAlign = 'center';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#e4badb';
    ctx.fillText(win ? 'FINAL ENCOUNTER  /  CLEAR' : 'FINAL ENCOUNTER  /  SIGNAL LOST', 500, 28);
    ctx.fillText(win ? 'THE CEPHALOPOD ARMADA HAS FALLEN' : 'THE ARMADA PREVAILS. RIDE AGAIN.', 500, 582);
    if (t > 65) {
        ctx.fillStyle = win ? '#ffd39c' : '#be8bad';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText(win ? '★  +2,500 BOSS BONUS  ★' : 'ROBOHORSE OFFLINE', 500, 425);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#a998c0';
        ctx.fillText(win ? 'SIX LEGS. ONE LEGEND.' : 'REBOOT. RELOAD. REVENGE.', 500, 460);
    }
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    for (let sy = 0; sy < 600; sy += 4) ctx.fillRect(0, sy, 1000, 1);
    const overlay = document.getElementById('battle-ending');
    overlay.style.opacity = String(Math.min(1, t / 24));
    overlay.style.setProperty('--ending-scale', String(reduced ? 1 : 1 + Math.max(0, 1 - t / 45) * .65));
    overlay.dataset.blink = !reduced && Math.floor(t / 20) % 2 ? 'purple' : 'red';
    // Fade to the score entry screen, keeping the six-second cue intact.
    if (t > 335) {
        ctx.fillStyle = `rgba(6,2,16,${(t - 335) / 25})`;
        ctx.fillRect(0, 0, 1000, 600);
        overlay.style.opacity = String((360 - t) / 25);
    }
    ctx.restore();
}
