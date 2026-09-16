import { drawHatchling } from '../components/HatchlingRenderer.ts';
import { lightenColor, roundRect } from '../utils/helpers.ts';

/** @typedef {{width:number,height:number,speed:number,health:number,maxHealth?:number,points:number,color:string,tentacles?:number,pattern?:string,attackDelay?:number,hatchling?:boolean}} EnemyType */
/** @typedef {(x:number,y:number,amount:number,color:string)=>void} Particles */
class Enemy {
    /** @param {number} x @param {number} y @param {EnemyType} type @param {HTMLCanvasElement} canvas */
    constructor(x, y, type, canvas) {
        this.canvas = canvas;
        this.hatchling = type.hatchling ?? false;
        this.x = x;
        this.y = y;
        this.width = type.width;
        this.height = type.height;
        this.velX = 0;
        this.velY = 0;
        this.speed = type.speed;
        this.health = type.health;
        this.maxHealth = type.maxHealth ?? type.health;
        this.directionChangeTimer = 0;
        this.maxDirectionChangeTime = 10; // One movement-decision interval at 60 Hz
        this.points = type.points;
        this.color = type.color;
        
        // Initialize tentacles as an array of objects
        this.tentacles = Array(type.tentacles || 8).fill(null).map((_, i) => ({
            angle: (i / (type.tentacles || 8)) * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.01,
            phase: Math.random() * Math.PI * 2
        }));
        
        // Add damage visual effect
        this.damageFeedbackTimer = 0;
        this.damageFeedbackDuration = 10; // 10 frames flash when damaged
        
        this.pattern = type.pattern ?? 'drone';
        this.age = 0;
        this.baseY = Math.max(60, Math.min(y, canvas.height - this.height - 150));
        this.attackState = 'advance';
        this.attackTimer = 90 + (type.attackDelay ?? 0);
        this.cueDuration = this.pattern === 'shield' ? 54 : 42;
        this.aimX = -1;
        this.aimY = 0;
    }

    get shieldActive() {
        return this.pattern === 'shield' && this.attackState === 'advance';
    }

    /** @param {import('../utils/helpers.ts').Bounds} player @param {number} frameCount @param {Particles} createParticles @param {number} timeScale */
    update(player, frameCount, createParticles, timeScale = 1) {
        this.age += timeScale;
        this.damageFeedbackTimer = Math.max(0, this.damageFeedbackTimer - timeScale);
        this.tentacles.forEach(tentacle => { tentacle.angle += tentacle.speed * timeScale; });
        const advancing = this.attackState === 'advance';
        this.velX = advancing ? -this.speed * 1.6 : 0;
        this.x += this.velX * timeScale;
        if (this.pattern === 'drone') {
            // Pause on the arc while aiming so the cue and muzzle stay aligned.
            if (advancing) this.y = this.baseY + Math.sin(this.age / 45) * 65;
            this.y = Math.max(20, Math.min(this.y, this.canvas.height - 50 - this.height));
        } else {
            this.y = this.canvas.height - 50 - this.height;
        }
        this.attackTimer -= timeScale;
        // Never begin a warning or fire outside the visible play area.
        if (this.x < 0 || this.x + this.width > this.canvas.width) return null;
        if (this.attackTimer > 0) return null;
        if (advancing) {
            const dx = player.x + player.width / 2 - (this.x + this.width / 2);
            const dy = player.y + player.height / 2 - (this.y + this.height / 2);
            const distance = Math.hypot(dx, dy);
            this.aimX = distance > 0 ? dx / distance : -1;
            this.aimY = distance > 0 ? dy / distance : 0;
            this.attackState = 'telegraph';
            this.attackTimer = this.cueDuration;
        } else if (this.attackState === 'telegraph') {
            this.attackState = 'recover';
            this.attackTimer = 36;
            return {
                x: this.x + this.width / 2, y: this.y + this.height / 2,
                width: 7, height: 7, speed: 5,
                velX: this.aimX * 5, velY: this.aimY * 5,
                damage: 5, color: '#ffbf69', isPlayerProjectile: false
            };
        } else {
            this.attackState = 'advance';
            this.attackTimer = 120;
        }
        return null;
    }

    /** @param {number} damage */
    takeDamage(damage) {
        this.health -= this.shieldActive ? damage * 0.2 : damage;
        
        // Activate damage visual feedback
        this.damageFeedbackTimer = this.damageFeedbackDuration;
        
        return this.health <= 0;
    }
    
    /** @param {CanvasRenderingContext2D} ctx @param {number} frameCount @param {import('../utils/helpers.ts').Bounds} player */
    draw(ctx, frameCount, player) {
        if (this.hatchling) {
            drawHatchling(ctx, this);
            return;
        }
        // Apply damage visual effect if active
        const originalColor = this.color;
        if (this.damageFeedbackTimer > 0) {
            // Flash white or red to indicate damage
            this.color = this.damageFeedbackTimer % 2 === 0 ? '#ff3333' : '#ffffff';
        }
        
        ctx.save();
        
        // Draw shadow under enemy
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height + 5, 
                  this.width/2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Squid mantle (body) with gradient
        const bodyGradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 0,
            this.x + this.width/2, this.y + this.height/2, this.width/2
        );
        
        // Get base color and create lighter/darker versions
        const baseColor = this.color;
        const lighterColor = lightenColor(baseColor, 30);
        const darkerColor = lightenColor(baseColor, -20);
        
        bodyGradient.addColorStop(0, lighterColor);
        bodyGradient.addColorStop(0.7, baseColor);
        bodyGradient.addColorStop(1, darkerColor);
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2 - 5, 
                  this.width/2, this.height/2 * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some texture/pattern to the body
        ctx.strokeStyle = lightenColor(baseColor, 10);
        ctx.lineWidth = 1;
        
        // Concentric rings on body
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.width/2, 
                this.y + this.height/2 - 5,
                this.width/2 * (i/3), 
                this.height/2 * 0.8 * (i/3), 
                0, 0, Math.PI * 2
            );
            ctx.stroke();
        }
        
        // Draw glowing eyes
        const eyeOffset = this.width/5;
        const eyeSize = this.width/10 + 2;
        const eyeY = this.y + this.height/2 - this.height/6;
        
        // Eye glow
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 10;
        
        // Left eye
        const leftEyeGradient = ctx.createRadialGradient(
            this.x + this.width/2 - eyeOffset, eyeY, 0,
            this.x + this.width/2 - eyeOffset, eyeY, eyeSize
        );
        leftEyeGradient.addColorStop(0, '#fff');
        leftEyeGradient.addColorStop(0.6, '#f88');
        leftEyeGradient.addColorStop(1, '#f00');
        
        ctx.fillStyle = leftEyeGradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        const rightEyeGradient = ctx.createRadialGradient(
            this.x + this.width/2 + eyeOffset, eyeY, 0,
            this.x + this.width/2 + eyeOffset, eyeY, eyeSize
        );
        rightEyeGradient.addColorStop(0, '#fff');
        rightEyeGradient.addColorStop(0.6, '#f88');
        rightEyeGradient.addColorStop(1, '#f00');
        
        ctx.fillStyle = rightEyeGradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils - follow player
        const playerDir = Math.atan2(player.y - this.y, player.x - this.x);
        const pupilOffset = eyeSize * 0.4; // How far pupils move from center
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        
        // Left pupil
        const leftPupilX = this.x + this.width/2 - eyeOffset + Math.cos(playerDir) * pupilOffset;
        const leftPupilY = eyeY + Math.sin(playerDir) * pupilOffset;
        ctx.beginPath();
        ctx.arc(leftPupilX, leftPupilY, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Right pupil
        const rightPupilX = this.x + this.width/2 + eyeOffset + Math.cos(playerDir) * pupilOffset;
        const rightPupilY = eyeY + Math.sin(playerDir) * pupilOffset;
        ctx.beginPath();
        ctx.arc(rightPupilX, rightPupilY, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tentacles with curvy tentacle effect
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        this.tentacles.forEach((tentacle, i) => {
            const angle = tentacle.angle + Math.sin(frameCount * tentacle.speed) * 0.3;
            const tentaclePhase = frameCount * 0.1 + tentacle.phase;
            
            // Create a gradient for each tentacle
            const tentacleGradient = ctx.createLinearGradient(
                this.x + this.width/2,
                this.y + this.height/2,
                this.x + this.width/2 + Math.cos(angle) * this.width,
                this.y + this.height/2 + Math.sin(angle) * this.height
            );
            
            tentacleGradient.addColorStop(0, baseColor);
            tentacleGradient.addColorStop(1, lightenColor(baseColor, -10));
            ctx.strokeStyle = tentacleGradient;
            
            // Draw the tentacle using bezier curves for more natural movement
            ctx.beginPath();
            ctx.moveTo(
                this.x + this.width/2, 
                this.y + this.height/2
            );
            
            // Control points for the bezier curve
            const cp1x = this.x + this.width/2 + Math.cos(angle) * this.width/2;
            const cp1y = this.y + this.height/2 + Math.sin(angle) * this.height/2;
            
            const cp2x = this.x + this.width/2 + Math.cos(angle + Math.sin(tentaclePhase) * 0.3) * this.width * 0.8;
            const cp2y = this.y + this.height/2 + Math.sin(angle + Math.sin(tentaclePhase) * 0.3) * this.height * 0.8;
            
            const endX = this.x + this.width/2 + Math.cos(angle + Math.sin(tentaclePhase) * 0.5) * this.width;
            const endY = this.y + this.height/2 + Math.sin(angle + Math.sin(tentaclePhase) * 0.5) * this.height;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            ctx.stroke();
            
            // Add suction cups to the tentacles (small circles)
            if (i % 2 === 0) { // Only do this for some tentacles to save on performance
                ctx.fillStyle = lightenColor(baseColor, 20);
                for (let j = 0.3; j <= 0.9; j += 0.2) {
                    // Calculate position along the bezier curve
                    const t = j;
                    const suctionX = Math.pow(1-t, 3) * (this.x + this.width/2) + 
                                    3 * Math.pow(1-t, 2) * t * cp1x + 
                                    3 * (1-t) * Math.pow(t, 2) * cp2x + 
                                    Math.pow(t, 3) * endX;
                    
                    const suctionY = Math.pow(1-t, 3) * (this.y + this.height/2) + 
                                    3 * Math.pow(1-t, 2) * t * cp1y + 
                                    3 * (1-t) * Math.pow(t, 2) * cp2y + 
                                    Math.pow(t, 3) * endY;
                    
                    ctx.beginPath();
                    ctx.arc(suctionX, suctionY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        // Draw health bar with glow effect for low health
        const healthPercent = this.health / this.maxHealth;
        
        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        roundRect(ctx, this.x, this.y - 15, this.width, 7, 3, true, false);
        
        // Health bar fill
        let healthColor = '#0f0';
        if (healthPercent <= 0.5 && healthPercent > 0.25) {
            healthColor = '#ff0';
        } else if (healthPercent <= 0.25) {
            healthColor = '#f00';
            // Add glow for low health
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 8;
        }
        
        ctx.fillStyle = healthColor;
        roundRect(ctx, 
            this.x, this.y - 15, 
            this.width * healthPercent, 7, 
            3, true, false
        );
        
        ctx.shadowBlur = 0;
        
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        if (this.pattern !== 'drone') {
            ctx.fillStyle = '#233747';
            roundRect(ctx, this.x - 4, this.y + this.height - 10, this.width + 8, 10, 4, true, false);
        }
        if (this.pattern === 'shield') {
            ctx.strokeStyle = this.shieldActive ? '#72e5ff' : '#ffbf69';
            ctx.lineWidth = this.shieldActive ? 4 : 2;
            ctx.beginPath();
            const opening = this.shieldActive ? 0 : 0.7;
            ctx.arc(cx, cy, this.width * 0.7, Math.PI / 2 + opening, Math.PI * 1.5 - opening);
            ctx.stroke();
        }
        if (this.attackState === 'telegraph') {
            const charge = 1 - this.attackTimer / this.cueDuration;
            ctx.strokeStyle = '#ffbf69';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + this.aimX * 180, cy + this.aimY * 180);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(cx, cy, this.width * 0.65 + 12 * (1 - charge), 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff3c4';
            ctx.beginPath();
            ctx.arc(cx, cy, 3 + charge * 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Restore original color after drawing
        this.color = originalColor;
        
        ctx.restore();
    }
}

export default Enemy; 