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
        
        // Add aggression factor - higher means more aggressive pursuit
        this.aggressionFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2
        
        // Add persistence timer to prevent rapid direction changes
        this.directionChangeTimer = 0;
        this.maxDirectionChangeTime = 60; // frames
        
        // Add a target position offset to create more varied movement
        this.targetOffsetX = (Math.random() - 0.5) * 100;
        this.targetOffsetY = (Math.random() - 0.5) * 100;
        
        console.log("Enemy created at", x, y, "with health", this.health);
    }
    
    update(player, frameCount, createParticles) {
        // Decrement direction change timer if active
        if (this.directionChangeTimer > 0) {
            this.directionChangeTimer--;
        }
        
        // Update target offset occasionally to create varied movement
        if (frameCount % 120 === 0) {
            this.targetOffsetX = (Math.random() - 0.5) * 100;
            this.targetOffsetY = (Math.random() - 0.5) * 100;
        }
        
        // Calculate distance to player with offset
        const targetX = player.x + this.targetOffsetX;
        const targetY = player.y + this.targetOffsetY;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Enemy AI - follow player with persistence
        if ((frameCount % 30 === 0 && this.directionChangeTimer === 0) || dist > 300) {
            // Only update direction if timer expired or enemy is far from player
            
            // Calculate direction to player
            if (dist > 0) { // Prevent division by zero
                this.velX = (dx / dist) * this.speed * this.aggressionFactor;
                this.velY = (dy / dist) * this.speed * this.aggressionFactor;
            }
            
            // Set direction change timer
            this.directionChangeTimer = this.maxDirectionChangeTime;
        }
        
        // Enhanced movement patterns with less randomness
        if (frameCount % 45 === 0 && Math.random() < 0.3) { // Only 30% chance to add randomness
            // Add slight randomness to movement direction
            const randomAngle = (Math.random() - 0.5) * Math.PI/8; // Reduced randomness: +/- 22.5 degrees
            const angle = Math.atan2(dy, dx) + randomAngle;
            
            if (dist > 0) { // Prevent division by zero
                this.velX = Math.cos(angle) * this.speed * this.aggressionFactor;
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
        
        // Screen boundaries for enemies - stronger boundary enforcement
        const bounceStrength = 0.8; // Higher bounce strength
        const margin = 50; // Keep enemies at least this far from the edge
        
        // Left boundary
        if (this.x < margin) {
            this.velX = Math.abs(this.velX) * bounceStrength;
            this.x = margin; // Force position to be within bounds
        }
        
        // Right boundary
        if (this.x > this.canvas.width - this.width - margin) {
            this.velX = -Math.abs(this.velX) * bounceStrength;
            this.x = this.canvas.width - this.width - margin; // Force position
        }
        
        // Top boundary
        if (this.y < margin) {
            this.velY = Math.abs(this.velY) * bounceStrength;
            this.y = margin; // Force position
        }
        
        // Bottom boundary
        if (this.y > this.canvas.height - this.height - margin) {
            this.velY = -Math.abs(this.velY) * bounceStrength;
            this.y = this.canvas.height - this.height - margin; // Force position
        }
        
        // If enemy is far from player, increase speed to catch up
        if (dist > this.canvas.width / 3) {
            const catchUpFactor = 1.5;
            this.x += this.velX * catchUpFactor;
            this.y += this.velY * catchUpFactor;
        } else {
            // Normal movement
            this.x += this.velX;
            this.y += this.velY;
        }
        
        // Ensure minimum velocity to prevent enemies from getting stuck
        const minVelocity = 0.2;
        if (Math.abs(this.velX) < minVelocity && Math.abs(this.velY) < minVelocity) {
            const angle = Math.random() * Math.PI * 2;
            this.velX = Math.cos(angle) * this.speed * 0.5;
            this.velY = Math.sin(angle) * this.speed * 0.5;
        }
        
        // If enemy is very far off-screen, teleport it back into view
        const farMargin = 200;
        if (this.x < -farMargin || this.x > this.canvas.width + farMargin || 
            this.y < -farMargin || this.y > this.canvas.height + farMargin) {
            // Teleport to a random position near the edge of the screen
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            
            switch(side) {
                case 0: // top
                    this.x = Math.random() * this.canvas.width;
                    this.y = margin;
                    break;
                case 1: // right
                    this.x = this.canvas.width - this.width - margin;
                    this.y = Math.random() * this.canvas.height;
                    break;
                case 2: // bottom
                    this.x = Math.random() * this.canvas.width;
                    this.y = this.canvas.height - this.height - margin;
                    break;
                case 3: // left
                    this.x = margin;
                    this.y = Math.random() * this.canvas.height;
                    break;
            }
            
            // Reset velocity toward player
            if (dist > 0) {
                this.velX = (dx / dist) * this.speed;
                this.velY = (dy / dist) * this.speed;
            }
            
            console.log("Enemy teleported back into view at", this.x, this.y);
        }
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