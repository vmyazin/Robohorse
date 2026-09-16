import type { Bounds } from '../utils/helpers.ts';

type Particles = (x: number, y: number, amount: number, color: string) => void;
export interface CombatObstacle extends Bounds {
    type: string;
    getSurfaceY?(left: number, right: number): number | null;
    containsMushroom?: boolean;
    containsWeapon?: boolean;
    points: number;
    color: string;
}
export interface StompEnemy extends Bounds {
    takeDamage(damage: number): boolean;
}

export interface CombatPlayer extends Bounds {
    velY: number;
    isJumping: boolean;
    standingOnObstacle: CombatObstacle | null;
    health: number;
    mushroomPowerActive: boolean;
    checkBoxSmash(obstacles: CombatObstacle[], particles: Particles): boolean;
    deactivateMushroomPower(particles: Particles): void;
}
export interface CombatHost {
    player: CombatPlayer;
    obstacles: CombatObstacle[];
    score: number;
    createParticles: Particles;
    spawnMushroomPowerUp(x: number, y: number): void;
    spawnPowerUp(x: number, y: number, type: string): void;
    updateHealthDisplay(): void;
    effectsManager: { triggerDamageFlash(): void };
    endGame(): void;
}

export default class CombatSystem {
    private host: CombatHost;
    constructor(host: CombatHost) { this.host = host; }

    collide(obstacle: CombatObstacle, previousPlayer?: Bounds, previousSupport?: CombatObstacle | null) {
        const host = this.host;
        const player = host.player;
        const particles = host.createParticles.bind(host);
        if ((obstacle.type === 'car' || obstacle.type === 'cybertruck') && obstacle.getSurfaceY) {
            // Use the hoof span, excluding the nose/tail overhang of the horse sprite.
            const inset = player.width * 0.2;
            const surface = obstacle.getSurfaceY(player.x + inset, player.x + player.width - inset);
            if (surface === null) return;
            const bottom = player.y + player.height;
            const previousBottom = previousPlayer ? previousPlayer.y + previousPlayer.height : bottom - player.velY;
            const previousSurface = previousPlayer
                ? obstacle.getSurfaceY(previousPlayer.x + inset, previousPlayer.x + previousPlayer.width - inset)
                : surface;
            const supported = previousSupport === obstacle && player.velY >= 0;
            const landing = player.velY >= 0 && bottom >= surface && previousBottom <= (previousSurface ?? surface) + 1;
            if (supported || landing) {
                player.y = surface - player.height;
                player.velY = 0;
                player.isJumping = false;
                player.standingOnObstacle = obstacle;
            } else if (bottom > surface && player.y < obstacle.y + obstacle.height) {
                if (player.x + player.width / 2 < obstacle.x + obstacle.width / 2) {
                    player.x = obstacle.x - player.width;
                    if (player.x <= 0) this.crush();
                } else {
                    player.x = obstacle.x + obstacle.width;
                }
            }
            return;
        }

        if (player.y + player.height < obstacle.y + obstacle.height / 2 && player.velY > 0) {
            player.y = obstacle.y - player.height;
            player.velY = 0;
            player.isJumping = false;
            player.standingOnObstacle = obstacle;
            if (obstacle.type === 'box' && player.checkBoxSmash([obstacle], particles)) {
                const index = host.obstacles.indexOf(obstacle);
                if (index !== -1) {
                    if (obstacle.containsWeapon) host.spawnPowerUp(obstacle.x, obstacle.y - 20, 'weapon');
                    if (obstacle.containsMushroom) host.spawnMushroomPowerUp(obstacle.x, obstacle.y - 20);
                    host.obstacles.splice(index, 1);
                    player.standingOnObstacle = null;
                    host.score += obstacle.points;
                    particles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 15, obstacle.color);
                }
            }
        } else if (player.x + player.width > obstacle.x && player.x < obstacle.x + obstacle.width) {
            if (player.x < obstacle.x) {
                player.x = obstacle.x - player.width;
                if (player.x <= 0) this.crush();
            } else {
                player.x = obstacle.x + obstacle.width;
            }
        }
    }

    stompEnemy(enemy: StompEnemy, previousPlayer: Bounds, previousEnemy: Bounds) {
        const player = this.host.player;
        if (player.velY <= 0) return null;
        const before = previousPlayer.y + previousPlayer.height - previousEnemy.y;
        const after = player.y + player.height - enemy.y;
        // Cross the top from above, including fast falls that pass through a thin enemy.
        if (before > 0 || after < 0 || after <= before) return null;
        const crossing = -before / (after - before);
        const playerX = previousPlayer.x + (player.x - previousPlayer.x) * crossing;
        const enemyX = previousEnemy.x + (enemy.x - previousEnemy.x) * crossing;
        const playerWidth = previousPlayer.width + (player.width - previousPlayer.width) * crossing;
        const enemyWidth = previousEnemy.width + (enemy.width - previousEnemy.width) * crossing;
        if (playerX + playerWidth <= enemyX || playerX >= enemyX + enemyWidth) return null;

        const dead = enemy.takeDamage(player.mushroomPowerActive ? 60 : 30);
        player.y = enemy.y - player.height;
        player.velY = -8;
        player.isJumping = true;
        player.standingOnObstacle = null;
        this.host.createParticles(player.x + player.width / 2, enemy.y, 12, '#68edff');
        return { dead };
    }

    crush() {
        const host = this.host;
        const player = host.player;
        player.health = Math.max(0, player.health - 2);
        host.updateHealthDisplay();
        host.createParticles(player.x + player.width, player.y + player.height / 2, 3, '#ff0000');
        host.effectsManager.triggerDamageFlash();
        if (player.mushroomPowerActive) player.deactivateMushroomPower(host.createParticles.bind(host));
        if (player.health <= 0) host.endGame();
    }
}
