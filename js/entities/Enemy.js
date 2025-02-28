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
        
        console.log("Enemy created at", x, y, "with health", this.health);
    }
    
    update(player, frameCount, createParticles) {
        // Move enemy - but don't let them move off-screen too quickly
        if (this.x > 0 && this.x < this.canvas.width) {
            this.x += this.velX;
            this.y += this.velY;
        } else {
            // If enemy is off-screen, only allow movement back on screen
            if (this.x <= 0 && this.velX > 0) this.x += this.velX;
            if (this.x >= this.canvas.width && this.velX < 0) this.x += this.velX;
            this.y += this.velY;
        }
        
        // Enemy AI - follow player
        if (frameCount % 30 === 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            this.velX = (dx / dist) * this.speed;
            this.velY = (dy / dist) * this.speed;
        }
        
        // Enhanced movement patterns
        if (frameCount % 45 === 0) {
            // Add some randomness to movement for more dynamic behavior
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Add slight randomness to movement direction
            const randomAngle = (Math.random() - 0.5) * Math.PI/4; // +/- 45 degrees
            const angle = Math.atan2(dy, dx) + randomAngle;
            
            this.velX = Math.cos(angle) * this.speed;
            this.velY = Math.sin(angle) * this.speed;
            
            // Create visual tentacle animation effect
            createParticles(
                this.x + this.width/2, 
                this.y + this.height/2, 
                3, 
                this.color
            );
        }
        
        // Screen boundaries for enemies
        if (this.x < 0) this.velX = Math.abs(this.velX) * 0.5; // Bounce back with reduced speed
        if (this.x > this.canvas.width) this.velX = -Math.abs(this.velX) * 0.5; // Bounce back with reduced speed
        if (this.y < 0) this.velY = Math.abs(this.velY) * 0.5; // Bounce back with reduced speed
        if (this.y > this.canvas.height) this.velY = -Math.abs(this.velY) * 0.5; // Bounce back with reduced speed
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