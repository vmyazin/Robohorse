import { drawHatchery } from '../components/NestRenderer.js';
import Enemy from '../entities/Enemy.js';
import { isColliding } from '../utils/helpers.ts';

// Timings use the same fixed 60 Hz simulation clock as movement and combat.
export class CephalopodNest {
    constructor(canvas) {
        this.width = 140;
        this.height = 170;
        this.x = canvas.width - 190;
        this.y = canvas.height - 50 - this.height;
        this.health = this.maxHealth = 240;
        this.phase = 'warning';
        this.timer = 120;
        this.tick = 0;
        this.attack = 0;
        this.flash = 0;
    }

    get core() {
        return { x: this.x + 32, y: this.y + 48, width: 76, height: 92 };
    }

    update(game, step = 1) {
        this.tick += step;
        this.flash = Math.max(0, this.flash - step);
        this.timer -= step;
        if (this.timer > 0) return;
        if (this.phase === 'warning') {
            if (this.attack % 2 === 0) {
                // Cap the population even if the player ignores the hatchlings.
                for (let i = 0; i < 2 && game.enemies.length < 6; i++) {
                    game.enemies.push(new Enemy(this.x - 42 - i * 45, this.y + 70,
                        { width: 28, height: 28, speed: 1, health: 20, points: 25,
                            color: '#b595ff', tentacles: 4, pattern: i ? 'drone' : 'ground' }, game.canvas));
                }
            } else {
                for (const angle of [-0.35, 0, 0.35]) {
                    game.projectiles.push({ x: this.x, y: this.y + 105, width: 12, height: 12,
                        velX: -4.5 * Math.cos(angle), velY: 4.5 * Math.sin(angle),
                        damage: 8, color: '#ffb86b', isPlayerProjectile: false });
                }
            }
            this.phase = 'exposed';
            this.timer = 210;
        } else if (this.phase === 'exposed') {
            this.phase = 'shielded';
            this.timer = 60;
        } else {
            this.attack++;
            this.phase = 'warning';
            this.timer = 90;
        }
    }

    hit(shot) {
        if (!shot.isPlayerProjectile || !isColliding(shot, this)) return false;
        // The open shell must let shots reach the recessed core.
        if (this.phase === 'exposed' && shot.y + shot.height > this.core.y && shot.y < this.core.y + this.core.height && !isColliding(shot, this.core)) return false;
        if (this.phase === 'exposed' && isColliding(shot, this.core)) {
            this.health = Math.max(0, this.health - shot.damage);
            this.flash = 8;
        }
        return true;
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const open = this.phase === 'exposed';
        const color = open ? '#72ffce' : this.phase === 'warning' ? '#ffb86b' : '#a995ed';
        ctx.save();
        if (!drawHatchery(ctx, this)) {
        // Fallback while the production sprite loads.
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const rootX = this.x - 22 + i * 36;
            ctx.strokeStyle = '#57416e'; ctx.lineWidth = 12;
            ctx.beginPath(); ctx.moveTo(cx, this.y + 110);
            ctx.quadraticCurveTo(rootX, this.y + 120 + Math.sin(this.tick / 14 + i) * 9,
                rootX, this.y + this.height); ctx.stroke();
        }
        ctx.fillStyle = '#30213f'; ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, this.y + 88, 65, 79, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.flash ? '#fff' : open ? '#72ffce' : '#695185';
        ctx.beginPath(); ctx.ellipse(cx, this.y + 94, 36 + Math.sin(this.tick / 10) * 2, 44, 0, 0, Math.PI * 2); ctx.fill();
        if (!open) {
            ctx.strokeStyle = '#c6b1f1'; ctx.lineWidth = 5;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath(); ctx.moveTo(cx - 38, this.y + 80 + i * 23);
                ctx.lineTo(cx + 38, this.y + 105 + i * 23); ctx.stroke();
            }
        }
        }
        if (this.phase === 'warning' && this.attack % 2 === 1) {
            ctx.strokeStyle = '#ffb86b'; ctx.lineWidth = 1; ctx.setLineDash([7, 9]);
            for (const angle of [-0.35, 0, 0.35]) {
                ctx.beginPath(); ctx.moveTo(this.x, this.y + 105);
                ctx.lineTo(this.x - 190 * Math.cos(angle), this.y + 105 + 190 * Math.sin(angle)); ctx.stroke();
            }
            ctx.setLineDash([]);
        }
        ctx.fillStyle = '#171221'; ctx.fillRect(this.x, this.y - 15, this.width, 7);
        ctx.fillStyle = color; ctx.fillRect(this.x, this.y - 15, this.width * this.health / this.maxHealth, 7);
        ctx.restore();
    }

    drawHUD(ctx, canvas) {
        const label = this.phase === 'exposed' ? 'CORE OPEN — FIRE!' : this.phase === 'shielded'
            ? 'ARMORED — KEEP MOVING' : this.attack % 2 === 0 ? 'HATCHLINGS INCOMING' : 'VOLLEY INCOMING — DODGE';
        ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#171221e8'; ctx.fillRect(canvas.width / 2 - 170, 100, 340, 52);
        ctx.fillStyle = '#d4c3f5'; ctx.fillText('CEPHALOPOD NEST', canvas.width / 2, 120);
        ctx.fillStyle = this.phase === 'exposed' ? '#72ffce' : '#ffb86b';
        ctx.fillText(label, canvas.width / 2, 141); ctx.restore();
    }
}

export function clearNest(game) {
    game.nest = null;
    game.nestTransition = null;
    game.scrollFactor = 1;
}

const TRANSITION_TICKS = 240;
const smooth = t => t * t * (3 - 2 * t);

export function updateNestScroll(game, step = 1) {
    const transition = game.nestTransition;
    if (transition) {
        transition.tick = Math.min(TRANSITION_TICKS, transition.tick + step);
        const progress = smooth(transition.tick / TRANSITION_TICKS);
        game.scrollFactor = transition.entering ? 1 - progress : progress;
        if (transition.tick === TRANSITION_TICKS) game.nestTransition = null;
    }
    const factor = game.scrollFactor ?? 1;
    game.scrollFrame = (game.scrollFrame ?? game.frameCount - 1) + factor * step;
    if (game.nest) game.nest.x -= game.levelManager.scrollSpeed * game.gameSpeed * factor;
}

export function maybeStartNest(game) {
    const level = game.levelManager;
    if (game.boss || game.nest || level.nestCompleted || level.levelPosition < 2200 || level.levelPosition > 2300) return;
    level.nestCompleted = true;
    game.nest = new CephalopodNest(game.canvas);
    // Enter from the right edge with the same travel as the existing scenery.
    game.nest.x = game.canvas.width - 30;
    game.nestTransition = { entering: true, tick: 0 };
    game.scrollFactor = 1;
    if (game.levelAnnouncement) game.levelAnnouncement.hidden = true;
}

export function updateNest(game, step = 1) {
    const nest = game.nest;
    if (!nest) return;
    if (!game.nestTransition?.entering) nest.update(game, step);
    for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const shot = game.projectiles[i];
        if (nest.hit(shot)) {
            game.projectiles.splice(i, 1);
            game.createParticles(shot.x, shot.y, 4, nest.phase === 'exposed' ? '#72ffce' : '#a995ed');
        }
    }
    // The rooted nest is solid; the safe side stays reachable with ordinary horizontal shots.
    if (isColliding(game.player, nest)) {
        game.player.x = game.player.x + game.player.width / 2 < nest.x + nest.width / 2
            ? nest.x - game.player.width : nest.x + nest.width;
    }
    if (nest.health > 0) return;
    game.createParticles(nest.x + 70, nest.y + 90, 40, '#72ffce');
    game.soundManager.playSound('explosion', 0.6);
    game.score += 750;
    game.scoreDisplay.textContent = game.score;
    game.player.specialAbilityTokens = Math.min(game.player.maxSpecialAbilityTokens, game.player.specialAbilityTokens + 1);
    game.specialTokensDisplay.textContent = game.player.specialAbilityTokens;
    game.lastSpawnTime = game.frameCount;
    game.nest = null;
    game.nestTransition = { entering: false, tick: 0 };
    game.scrollFactor = 0;
    game.showLevelAnnouncement('Nest destroyed! +750 · +1 token');
}
