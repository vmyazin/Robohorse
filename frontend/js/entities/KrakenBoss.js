import { drawTitan, titanPoint, TITAN_EYES } from '../components/BossRenderer.js';
import { isColliding } from '../utils/helpers.ts';

// All timers use simulation ticks, so pause and restart cannot leave delayed attacks behind.
export default class KrakenBoss {
    constructor(canvas, random = Math.random) {
        this.random = random;
        this.canvas = canvas;
        this.width = 340;
        this.height = 340 * 960 / 1225;
        this.x = canvas.width - this.width - 30;
        this.y = canvas.height - 50 - this.height;
        this.health = this.maxHealth = 600;
        this.facing = -1;
        this.groundY = this.y;
        this.jump = null;
        this.jumpCooldown = 0;
        this.shakeTicks = 0;
        this.landed = false;
        this.nextJumpHealth = this.maxHealth * (1 - (0.2 + this.random() * 0.1));
        this.tick = 0;
        this.attackTick = 0;
        this.attackIndex = 0;
        this.attackCycle = ['Web Shot', 'Tentacle Slam', 'Spider Spawn'];
        this.stunTimer = 0;
        this.hitCooldown = 0;
        this.hitFlash = 0;
        this.lastHit = { x: this.x, y: this.y };
        this.webs = [];
        this.waves = [];
        this.spiderlings = [];
        this.eyes = Array.from({ length: 6 }, (_, i) => ({
            x: (TITAN_EYES[i][0] - 14) * this.width / 1225,
            y: (TITAN_EYES[i][1] - 150) * this.height / 960,
            active: true, blinkTicks: 0,
        }));
    }

    get phase() { return this.health > 400 ? 1 : this.health > 200 ? 2 : 3; }
    get currentAttack() { return this.attackCycle[this.attackIndex]; }
    get warning() {
        if (this.jump) return this.jump.tick < 30 ? 'BRACE — CROSS-ARENA JUMP' : 'CLEAR THE LANDING ZONE';
        if (this.stunTimer > 0) return 'STUNNED — FIRE AT THE CORE';
        if (this.attackTick < 60) return `${this.currentAttack.toUpperCase()} INCOMING`;
        return this.currentAttack === 'Tentacle Slam' ? 'JUMP OVER THE SHOCKWAVES' :
            this.currentAttack === 'Spider Spawn' ? 'SHOOT THE SPIDERLINGS' : 'DODGE THE WEBS';
    }

    takeDamage(amount, projectile) {
        if (this.health <= 0) return;
        this.hitFlash = 8;
        this.lastHit = { x: projectile.x, y: projectile.y };
        const eye = this.eyes.find((eye, index) => {
            const point = titanPoint(this, ...TITAN_EYES[index]);
            return eye.active && isColliding(projectile, {
                x: point.x - 13, y: point.y - 13, width: 26, height: 26,
            });
        });
        this.health = Math.max(0, this.health - amount * (eye || this.stunTimer > 0 ? 1 : 0.4));
        this.updateEyeHealth();
        // One randomly selected surviving eye blinks per impact, even on armored hits.
        for (const eye of this.eyes) eye.blinkTicks = 0;
        const active = this.eyes.filter(eye => eye.active);
        if (active.length) active[Math.floor(this.random() * active.length)].blinkTicks = 12;

    }

    updateEyeHealth() {
        const remaining = Math.ceil(this.eyes.length * Math.max(0, this.health) / this.maxHealth);
        const active = this.eyes.filter(eye => eye.active);
        while (active.length > remaining) {
            const [eye] = active.splice(Math.floor(this.random() * active.length), 1);
            eye.active = false;
            eye.blinkTicks = 0;
            this.stunTimer = 90;
        }
    }

    updateJump(player, particles, damagePlayer) {
        this.landed = false;
        this.shakeTicks = Math.max(0, this.shakeTicks - 1);
        this.jumpCooldown = Math.max(0, this.jumpCooldown - 1);
        if (!this.jump && !this.jumpCooldown && this.health <= this.nextJumpHealth) {
            this.jump = { tick: 0, from: this.x, to: this.facing === -1 ? 30 : this.canvas.width - this.width - 30 };
            this.nextJumpHealth -= this.maxHealth * (0.2 + this.random() * 0.1);
            this.webs = []; this.waves = []; this.spiderlings = [];
            this.attackTick = 0;
        }
        if (!this.jump) return false;
        const jump = this.jump;
        jump.tick++;
        if (jump.tick <= 30) return true;
        const t = Math.min(1, (jump.tick - 30) / 80);
        this.x = jump.from + (jump.to - jump.from) * t;
        this.y = this.groundY - Math.sin(Math.PI * t) * 220;
        if (t >= 1) {
            this.x = jump.to;
            this.y = this.groundY;
            this.facing *= -1;
            this.jump = null;
            this.jumpCooldown = 60;
            this.attackTick = 0;
            this.shakeTicks = 36;
            this.landed = true;
            this.hitCooldown = 45;
            // Move an overlapping horse toward the arena interior, never into a wall.
            if (isColliding(player, this)) {
                damagePlayer(40);
                player.velY = -7;
                player.isJumping = true;
                player.standingOnObstacle = null;
                player.x = this.facing === 1 ? this.x + this.width + 12 : this.x - player.width - 12;
            }
            player.direction = player.x + player.width / 2 < this.x + this.width / 2 ? 1 : -1;
            for (let i = 0; i < 6; i++) particles(this.x + this.width * (i + 0.5) / 6,
                this.groundY + this.height, 6, '#afbac7');
        }
        return true;
    }

    update(player, projectiles, damagePlayer, particles) {
        if (this.health <= 0) return;
        this.updateEyeHealth();
        for (const eye of this.eyes) eye.blinkTicks = Math.max(0, eye.blinkTicks - 1);
        this.tick++;
        this.hitFlash = Math.max(0, this.hitFlash - 1);
        this.hitCooldown = Math.max(0, this.hitCooldown - 1);
        const hit = (damage, web = false) => {
            if (this.hitCooldown) return;
            this.hitCooldown = 45;
            damagePlayer(damage);
            if (web) player.webSlowTicks = 90;
        };
        const jumping = this.updateJump(player, particles, damagePlayer);
        if (jumping) {
            // Jump movement takes priority over eye stun and ordinary attacks.
        } else if (this.stunTimer > 0) {
            this.stunTimer--;
        } else {
            this.attackTick++;
            if (this.attackTick === 60 || (this.phase >= 2 && this.attackTick === 100)) {
                if (this.currentAttack === 'Web Shot') {
                    const { x, y } = titanPoint(this, 330, 500);
                    const dx = player.x + player.width / 2 - x;
                    const dy = player.y + player.height / 2 - y;
                    const angle = Math.atan2(dy, dx);
                    for (let i = -1; i <= 1; i++) {
                        this.webs.push({ x, y, width: 22, height: 22,
                            velX: Math.cos(angle + i * 0.2) * 4.5,
                            velY: Math.sin(angle + i * 0.2) * 4.5, life: 240 });
                    }
                } else if (this.currentAttack === 'Tentacle Slam') {
                    this.waves.push({ x: this.facing === -1 ? this.x : this.x + this.width - 42, y: this.canvas.height - 82,
                        width: 42, height: 32, velX: (5 + this.phase) * this.facing, life: 240 });
                } else {
                    for (let i = 0; i < this.phase + 1; i++) {
                        this.spiderlings.push({ x: this.facing === -1 ? this.x + i * 35 : this.x + this.width - 30 - i * 35, y: this.canvas.height - 78,
                            width: 30, height: 28, velX: (2.3 + this.phase * 0.3) * this.facing, life: 420 });
                    }
                }
            }
            if (this.attackTick >= 240 - this.phase * 20) {
                this.attackTick = 0;
                this.attackIndex = (this.attackIndex + 1) % this.attackCycle.length;
            }
        }
        for (const [group, damage] of [[this.webs, 8], [this.waves, 15], [this.spiderlings, 10]]) {
            for (let i = group.length - 1; i >= 0; i--) {
                const hazard = group[i];
                hazard.x += hazard.velX;
                hazard.y += hazard.velY || 0;
                hazard.life--;
                const shot = group === this.waves ? -1 : projectiles.findIndex(p => p.isPlayerProjectile && isColliding(p, hazard));
                if (shot >= 0) {
                    projectiles.splice(shot, 1);
                    particles(hazard.x, hazard.y, 5, '#7ce8ee');
                    group.splice(i, 1);
                } else if (isColliding(player, hazard)) {
                    hit(damage, group === this.webs);
                    group.splice(i, 1);
                } else if (hazard.life <= 0 || hazard.x < -50 || hazard.x > this.canvas.width + 50 || hazard.y > this.canvas.height || hazard.y < -50) {
                    group.splice(i, 1);
                }
            }
        }
        if (!jumping && isColliding(player, this)) hit(12);
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const shot = projectiles[i];
            if (shot.isPlayerProjectile && isColliding(shot, this)) {
                this.takeDamage(shot.damage, shot);
                particles(shot.x, shot.y, 4, '#a6efff');
                projectiles.splice(i, 1);
            }
        }
    }

    draw(ctx, showHUD = true) {
        ctx.save();
        drawTitan(ctx, this);
        for (const web of this.webs) {
            ctx.strokeStyle = '#b6f4ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(web.x + 11, web.y + 11, 11, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(web.x, web.y); ctx.lineTo(web.x + 22, web.y + 22);
            ctx.moveTo(web.x + 22, web.y); ctx.lineTo(web.x, web.y + 22); ctx.stroke();
        }
        for (const wave of this.waves) {
            ctx.fillStyle = '#ffae64'; ctx.beginPath();
            ctx.moveTo(wave.x, wave.y + wave.height); ctx.lineTo(wave.x + 21, wave.y);
            ctx.lineTo(wave.x + 42, wave.y + wave.height); ctx.fill();
        }
        for (const spider of this.spiderlings) {
            ctx.strokeStyle = '#b08cd6'; ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath(); ctx.moveTo(spider.x + 15, spider.y + 14);
                ctx.lineTo(spider.x - 4 + i * 12, spider.y + 28); ctx.stroke();
            }
            ctx.fillStyle = '#8968af'; ctx.beginPath(); ctx.ellipse(spider.x + 15, spider.y + 12, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff8d9e'; ctx.fillRect(spider.x + 3, spider.y + 8, 5, 5);
        }
        ctx.restore();
        if (showHUD) this.drawHUD(ctx);
    }

    drawHUD(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(9,17,29,.92)'; ctx.fillRect(230, 100, 540, 76);
        ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace'; ctx.fillStyle = '#e1efff';
        ctx.fillText(`${(this.name || 'Krakenarachnid').toUpperCase()} · PHASE ${this.phase}`, 500, 121);
        ctx.fillStyle = '#35445b'; ctx.fillRect(250, 131, 500, 9);
        ctx.fillStyle = '#ff657c'; ctx.fillRect(250, 131, 500 * this.health / this.maxHealth, 9);
        ctx.font = '12px monospace'; ctx.fillStyle = '#ffcc91'; ctx.fillText(this.warning, 500, 160);
        ctx.restore();
    }
}
