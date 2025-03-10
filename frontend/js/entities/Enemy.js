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
        
        // Initialize tentacles as an array of objects
        this.tentacles = Array(type.tentacles || 8).fill().map((_, i) => ({
            angle: (i / (type.tentacles || 8)) * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.01,
            phase: Math.random() * Math.PI * 2
        }));
        
        // Add damage visual effect
        this.damageFeedbackTimer = 0;
        this.damageFeedbackDuration = 10; // 10 frames flash when damaged
        
        // Increase aggression factor for more curious behavior
        this.aggressionFactor = 1.5 + Math.random() * 0.5; // 1.5-2.0 for more aggressive pursuit
        
        // Add curiosity behavior parameters
        this.curiosityRadius = 300; // Distance at which enemy becomes curious
        this.orbitSpeed = 0.02; // Speed of orbiting behavior
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting angle
        this.behaviorState = 'curious'; // Can be 'curious' or 'aggressive'
        this.stateSwitchTimer = 0;
        this.stateSwitchInterval = 120; // Frames before considering state switch
        
        // Add a target position offset to create more varied movement
        this.targetOffsetX = (Math.random() - 0.5) * 80;
        this.targetOffsetY = (Math.random() - 0.5) * 80;
        
        // Reduce scrolling compensation to fix slowdown
        this.scrollCompensation = 0.8; // Reduced from 1.0 to improve performance
        
        // Add a spawn timer to ensure enemies don't move too aggressively at first
        this.spawnTimer = 30; // frames to gradually increase speed
        
        // Add a movement update frequency to reduce calculations
        this.movementUpdateFrequency = 10; // Increased from 5 to 10 to improve performance
        
        console.log("Enhanced enemy created at", x, y, "with health", this.health, "and aggression", this.aggressionFactor);
    }
    
    update(player, frameCount, createParticles, timeScale = 1) {
        // Handle spawn timer
        if (this.spawnTimer > 0) {
            this.spawnTimer--;
            // Gradually increase velocity during spawn period
            this.x -= this.scrollCompensation * (1 - this.spawnTimer/30) * timeScale;
            return null;
        }
        
        // Decrement direction change timer if active
        if (this.directionChangeTimer > 0) {
            this.directionChangeTimer--;
        }
        
        // Only update movement calculations every few frames to improve performance
        if (frameCount % this.movementUpdateFrequency === 0) {
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
            
            // Update behavior state
            if (this.stateSwitchTimer <= 0) {
                if (dist < this.curiosityRadius) {
                    // Close to player - switch between curious and aggressive
                    this.behaviorState = Math.random() < 0.7 ? 'curious' : 'aggressive';
                } else {
                    // Far from player - become curious
                    this.behaviorState = 'curious';
                }
                this.stateSwitchTimer = this.stateSwitchInterval;
            } else {
                this.stateSwitchTimer--;
            }
            
            // Enemy AI - different behaviors based on state
            if (this.directionChangeTimer === 0 || dist > 200) {
                if (this.behaviorState === 'curious') {
                    // Orbit around the player when curious
                    this.orbitAngle += this.orbitSpeed * timeScale;
                    const orbitRadius = Math.min(dist, this.curiosityRadius * 0.7);
                    const orbitX = targetX + Math.cos(this.orbitAngle) * orbitRadius;
                    const orbitY = targetY + Math.sin(this.orbitAngle) * orbitRadius;
                    
                    // Calculate direction to orbit position
                    const orbitDx = orbitX - this.x;
                    const orbitDy = orbitY - this.y;
                    const orbitDist = Math.sqrt(orbitDx*orbitDx + orbitDy*orbitDy);
                    
                    // Set velocity based on orbit position
                    if (orbitDist > 0) {
                        this.velX = (orbitDx / orbitDist) * this.speed * timeScale;
                        this.velY = (orbitDy / orbitDist) * this.speed * timeScale;
                    }
                } else {
                    // Direct pursuit when aggressive
                    if (dist > 0) {
                        this.velX = (dx / dist) * this.speed * this.aggressionFactor * timeScale;
                        this.velY = (dy / dist) * this.speed * this.aggressionFactor * timeScale;
                    }
                }
                
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
                
                // Create visual tentacle animation effect - reduce particle count
                createParticles(
                    this.x + this.width/2, 
                    this.y + this.height/2, 
                    2, // Reduced from 3
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
            
            // Bottom boundary - Improved to prevent enemies from going too far below floor level
            // The canvas.height - this.height - 30 limit ensures enemies stay at least partly visible
            // and accessible above the floor level (which is at canvas.height - 50)
            const floorLevel = this.canvas.height - 50; // Same as the floor level in Player.js
            const accessibilityMargin = 20; // How much of the enemy should remain above floor for accessibility
            
            if (this.y + this.height > floorLevel + accessibilityMargin) {
                this.velY = -Math.abs(this.velY) * bounceStrength;
                this.y = floorLevel + accessibilityMargin - this.height;
            }
            
            // If enemy is far from player, increase speed to catch up
            if (dist > this.canvas.width / 4) {
                const catchUpFactor = 1.2; // Reduced from 1.5
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
        } else {
            // On frames where we don't recalculate, just apply the current velocity
            this.x += this.velX;
            this.y += this.velY;
        }
        
        // Occasionally shoot at player if close enough - reduce shooting frequency
        const dist = Math.sqrt(
            Math.pow(player.x - this.x, 2) + 
            Math.pow(player.y - this.y, 2)
        );
        
        if (dist < 300 && frameCount % 120 === 0 && Math.random() < 0.3) { // Reduced from 90 frames and 0.4 probability
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const normalizedDist = Math.sqrt(dx*dx + dy*dy);
            
            return {
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                width: 5,
                height: 5,
                speed: 5,
                velX: (dx / normalizedDist) * 5,
                velY: (dy / normalizedDist) * 5,
                damage: 5,
                color: this.color,
                isPlayerProjectile: false
            };
        }
        
        // Apply velocity with scroll compensation
        this.x += this.velX - this.scrollCompensation * timeScale;
        this.y += this.velY;
        
        // Apply boundaries to keep enemies on screen
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.canvas.height - 50) this.y = this.canvas.height - 50 - this.height;
        
        // Decrement damage feedback timer if active
        if (this.damageFeedbackTimer > 0) {
            this.damageFeedbackTimer--;
        }
        
        // Animate tentacles
        if (this.tentacles) {
            this.tentacles.forEach(tentacle => {
                tentacle.angle += tentacle.speed * timeScale;
            });
        }
        
        return null;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        // Activate damage visual feedback
        this.damageFeedbackTimer = this.damageFeedbackDuration;
        
        return this.health <= 0;
    }
    
    draw(ctx, frameCount, player) {
        // Apply damage visual effect if active
        const originalColor = this.color;
        if (this.damageFeedbackTimer > 0) {
            this.damageFeedbackTimer--;
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
        
        // Restore original color after drawing
        this.color = originalColor;
        
        ctx.restore();
    }
}

export default Enemy; 