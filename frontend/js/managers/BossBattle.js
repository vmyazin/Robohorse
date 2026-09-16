import { beginBattleEnding } from './BattleEnding.js';
import KrakenBoss from '../entities/KrakenBoss.js';

export function startBossBattle(game) {
    if (game.boss) return;
    game.nest = null;
    game.nestTransition = null;
    game.scrollFactor = 1;
    game.boss = new KrakenBoss(game.canvas);
    game.boss.name = game.levelManager.getCurrentChapter().bossName;
    game.soundManager.playBackgroundMusic('bossMusic');
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
    game.levelDisplay.textContent = game.boss.name;
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
    if (!game.gameOver && !game.battleEnding) boss.updateFlyingReinforcements(game.enemies);
    if (boss.landed) game.soundManager.playSound('explosion', 0.55);
    if (boss.health <= 0 && game.gameStarted && !game.battleEnding) {
        game.score += 2500;
        game.scoreDisplay.textContent = game.score;
        game.createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 40, '#93eafa');
        game.soundManager.playSound('explosion', 0.7);

        game.player.webSlowTicks = 0;
        beginBattleEnding(game, 'victory');
    }
}
