import { lightenColor, roundRect } from '../utils/helpers.js';

class Enemy {
    constructor(x, y, type, canvas) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.width = type.width;
        this.height = type.height;
        this.velX = 0;
        this.velY = 0;
        this.speed = type.speed;
        this.health = type.health;
        this.maxHealth = type.maxHealth;
        this.points = type.points;
        this.color = type.color;
        this.tentacles = type.tentacles;
        
        // Increase aggression factor for more aggressive pursuit
        this.aggressionFactor = 1.2 + Math.random() * 0.5; // 1.2-1.7
        
        // Add persistence timer to prevent rapid direction changes
        this.directionChangeTimer = 0;
        this.maxDirectionChangeTime = 40; // frames
        
        // Add a target position offset to create more varied movement
        this.targetOffsetX = (Math.random() - 0.5) * 80;
        this.targetOffsetY = (Math.random() - 0.5) * 80;
        
        // Add level scrolling compensation - reduced to prevent enemies from moving too far right
        this.scrollCompensation = 1.5; // Reduced from 2.5
        
        // Add a spawn timer to ensure enemies don't move too aggressively at first
        this.spawnTimer = 30; // frames to gradually increase speed
        
        console.log("Enhanced enemy created at", x, y, "with health", this.health, "and aggression", this.aggressionFactor);
    }
    
    update(player, frameCount, createParticles) {
        // Handle spawn timer
        if (this.spawnTimer > 0) {
            this.spawnTimer--;
            // Gradually increase velocity during spawn period
            this.x -= this.scrollCompensation * (1 - this.spawnTimer/30);
            return null;
        }
        
        // Decrement direction change timer if active
        if (this.directionChangeTimer > 0) {
            this.directionChangeTimer--;
        }
        
        // Update target offset occasionally to create varied movement
        if (frameCount % 90 === 0) {
            this.targetOffsetX = (Math.random() - 0.5) * 80;
            this.targetOffsetY = (Math.random() - 0.5) * 80;
        }
        
        // Calculate distance to player with offset
        const targetX = player.x + this.targetOffsetX;
        const targetY = player.y + this.targetOffsetY;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Enemy AI - follow player with persistence and compensate for scrolling
        if ((frameCount % 20 === 0 && this.directionChangeTimer === 0) || dist > 200) {
            // Only update direction if timer expired or enemy is far from player
            
            // Calculate direction to player with scrolling compensation
            if (dist > 0) { // Prevent division by zero
                // Add extra velocity to the right to compensate for level scrolling
                this.velX = (dx / dist) * this.speed * this.aggressionFactor + this.scrollCompensation;
                this.velY = (dy / dist) * this.speed * this.aggressionFactor;
            }
            
            // Set direction change timer
            this.directionChangeTimer = this.maxDirectionChangeTime;
        }
        
        // Enhanced movement patterns with less randomness
        if (frameCount % 30 === 0 && Math.random() < 0.3) {
            // Add slight randomness to movement direction
            const randomAngle = (Math.random() - 0.5) * Math.PI/10;
            const angle = Math.atan2(dy, dx) + randomAngle;
            
            if (dist > 0) { // Prevent division by zero
                // Add scrolling compensation
                this.velX = Math.cos(angle) * this.speed * this.aggressionFactor + this.scrollCompensation;
                this.velY = Math.sin(angle) * this.speed * this.aggressionFactor;
            }
            
            // Create visual tentacle animation effect
            createParticles(
                this.x + this.width/2, 
                this.y + this.height/2, 
                3, 
                this.color
            );
        }
        
        // Improved screen boundaries for enemies
        const bounceStrength = 0.9;
        
        // Left boundary - stricter to prevent enemies from going too far left
        if (this.x < -50) {
            this.velX = Math.abs(this.velX) * bounceStrength;
            this.x = -50;
        }
        
        // Right boundary - stricter to prevent enemies from going too far right
        if (this.x > this.canvas.width + 50) {
            this.velX = -Math.abs(this.velX) * bounceStrength;
            this.x = this.canvas.width + 50;
        }
        
        // Top boundary
        if (this.y < 0) {
            this.velY = Math.abs(this.velY) * bounceStrength;
            this.y = 0;
        }
        
        // Bottom boundary
        if (this.y > this.canvas.height - this.height) {
            this.velY = -Math.abs(this.velY) * bounceStrength;
            this.y = this.canvas.height - this.height;
        }
        
        // If enemy is far from player, increase speed to catch up
        if (dist > this.canvas.width / 4) {
            const catchUpFactor = 1.5; // Reduced from 2.0
            this.x += this.velX * catchUpFactor;
            this.y += this.velY * catchUpFactor;
        } else {
            // Normal movement
            this.x += this.velX;
            this.y += this.velY;
        }
        
        // Ensure minimum velocity to prevent enemies from getting stuck
        const minVelocity = 0.5;
        if (Math.abs(this.velX) < minVelocity && Math.abs(this.velY) < minVelocity) {
            const angle = Math.random() * Math.PI * 2;
            this.velX = Math.cos(angle) * this.speed * 0.8 + this.scrollCompensation;
            this.velY = Math.sin(angle) * this.speed * 0.8;
        }
        
        // Occasionally shoot at player if close enough
        if (dist < 300 && frameCount % 90 === 0 && Math.random() < 0.4) {
            return {
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                width: 5,
                height: 5,
                speed: 5,
                velX: (dx / dist) * 5,
                velY: (dy / dist) * 5,
                damage: 5,
                color: this.color,
                isPlayerProjectile: false
            };
        }
        
        return null;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
    
    draw(ctx, frameCount, player) {
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
        
        for (let i = 0; i < this.tentacles; i++) {
            const angle = (i / this.tentacles) * Math.PI * 2;
            const tentaclePhase = frameCount * 0.1 + i;
            
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
        }
        
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
        
        roundRect(ctx, 
            this.x, this.y - 15, 
            this.width * healthPercent, 7, 
            3, true, false
        );
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

export default Enemy; 