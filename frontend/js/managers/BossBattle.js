import KrakenBoss from '../entities/KrakenBoss.js';

export function startBossBattle(game) {
    if (game.boss) return;
    game.boss = new KrakenBoss(game.canvas);
    game.enemies = [];
    game.obstacles = [];
    game.projectiles = [];
    game.powerUps = [];
    game.specialTokens = [];
    game.platforms = [{ type: 'ground', x: 0, y: game.canvas.height - 50, width: game.canvas.width, height: 50 }];
    game.player.x = 100;
    game.player.y = game.canvas.height - 50 - game.player.height;
    game.player.velY = 0;
    game.player.direction = 1;
    game.player.standingOnObstacle = null;
    game.player.webSlowTicks = 0;
    game.levelDisplay.textContent = 'Krakenarachnid';
    game.levelAnnouncement.hidden = true;
}

export function updateBossBattle(game) {
    if (!game.boss || !game.gameStarted) return;
    const boss = game.boss;
    boss.update(game.player, game.projectiles, damage => {
        game.player.health = Math.max(0, game.player.health - damage);
        game.updateHealthDisplay();
        game.effectsManager.triggerDamageFlash();
        if (game.player.mushroomPowerActive) game.player.deactivateMushroomPower(game.createParticles.bind(game));
        if (!game.player.health) game.endGame();
    }, game.createParticles.bind(game));
    if (boss.landed) game.soundManager.playSound('explosion', 0.55);
    if (boss.health <= 0 && game.gameStarted) {
        game.score += 2500;
        game.scoreDisplay.textContent = game.score;
        game.createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 40, '#93eafa');
        game.soundManager.playSound('explosion', 0.7);
        game.boss = null;
        game.player.webSlowTicks = 0;
        game.showMissionComplete();
    }
}
