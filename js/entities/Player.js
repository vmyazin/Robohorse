import { roundRect, lightenColor } from '../utils/helpers.js';

class Player {
    constructor(canvas, weapons) {
        this.canvas = canvas;
        this.weapons = weapons;
        this.currentWeaponIndex = 0;
        
        // Initialize player properties
        this.x = 100;
        this.y = canvas.height / 2;
        this.width = 60;
        this.height = 40;
        this.speed = 5;
        this.jumpPower = 12;
        this.velY = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.isJumping = false;
        this.isShooting = false;
        this.direction = 1; // 1 = right, -1 = left
        this.lastShot = 0;
        
        // Track which obstacle the player is standing on (if any)
        this.standingOnObstacle = null;
        
        // Special ability tokens
        this.specialAbilityTokens = 0;
        this.maxSpecialAbilityTokens = 5;
        
        // Special ability duration tracking
        this.specialAbilityActive = false;
        this.specialAbilityDuration = 0;
        this.specialAbilityMaxDuration = 300; // 5 seconds at 60fps
        this.specialAbilityConsumptionRate = 100; // Consume token every 100 frames
        this.specialAbilityLastConsumption = 0;
        
        // Box smashing properties
        this.isLanding = false;
        this.lastVelY = 0;
        this.smashDamage = 30; // Damage dealt when smashing a box
        this.landingThreshold = 3; // Minimum velocity to consider as landing
        
        // Initialize legs
        this.legs = Array(6).fill().map((_, i) => ({
            angle: i * 60,
            length: 15,
            phase: i * 0.5
        }));
        
        // Mushroom power-up properties
        this.mushroomPowerActive = false;
        this.originalWidth = this.width;
        this.originalHeight = this.height;
        this.weaponDamageMultiplier = 1;
        
        // Growth animation properties
        this.isGrowing = false;
        this.growthStage = 0;
        this.growthVisible = true;
        this.growthAnimationFrame = 0;
        
        // Shrinking animation properties
        this.isShrinking = false;
        this.shrinkStage = 0;
        this.shrinkVisible = true;
        this.shrinkAnimationFrame = 0;
    }
    
    update(keys, frameCount, createParticles, playSound) {
        // Store previous velocity for landing detection
        this.lastVelY = this.velY;
        
        // Update growth animation if active
        if (this.isGrowing) {
            this.updateGrowthAnimation(createParticles);
        }
        
        // Update shrinking animation if active
        if (this.isShrinking) {
            this.updateShrinkAnimation(createParticles);
        }
        
        // Handle movement
        if (keys['ArrowLeft']) {
            this.x -= this.speed;
            this.direction = -1;
        }
        if (keys['ArrowRight']) {
            this.x += this.speed;
            this.direction = 1;
        }
        
        // Handle jumping - allow both 'z' key and 'ArrowUp' key
        if ((keys['z'] || keys['ArrowUp']) && !this.isJumping) {
            this.velY = -this.jumpPower;
            this.isJumping = true;
            this.standingOnObstacle = null; // Clear obstacle reference when jumping
            createParticles(this.x + this.width / 2, this.y + this.height, 10, '#777');
        }
        
        // Apply gravity
        this.velY += 0.5;
        this.y += this.velY;
        
        // Floor collision
        if (this.y + this.height > this.canvas.height - 50) {
            this.y = this.canvas.height - 50 - this.height;
            this.velY = 0;
            this.isJumping = false;
        }
        
        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.canvas.width) this.x = this.canvas.width - this.width;
        
        // Note: We don't handle shooting and special ability here anymore,
        // as they are handled by the Game class directly to avoid projectiles reference issues
        
        // Update mushroom power-up if active
        if (this.mushroomPowerActive) {
            this.updateGrowthAnimation(createParticles);
        }
        
        // Animate horse legs
        this.legs.forEach((leg, i) => {
            leg.angle = (i * 60) + Math.sin(frameCount * 0.1 + leg.phase) * 20;
        });
    }
    
    // Check if player is landing on a box and smash it
    checkBoxSmash(obstacles, createParticles) {
        // Check if we have an obstacle to smash
        if (!this.standingOnObstacle) return false;
        
        // Only smash boxes, not other obstacle types
        if (this.standingOnObstacle.type === 'box') {
            // We need to be landing with sufficient velocity OR jumping and landing on the box
            if (this.isLanding || this.lastVelY >= this.landingThreshold) {
                // Apply smash damage - if mushroom power is active, destroy in one stomp
                // Otherwise, still require 2 stomps
                const damageAmount = this.mushroomPowerActive ? 2 : 1;
                const isDestroyed = this.standingOnObstacle.takeDamage(damageAmount);
                
                // Create particles for visual effect - more particles on second jump or when powered up
                const particleCount = this.mushroomPowerActive || this.standingOnObstacle.jumpCount === 2 ? 25 : 15;
                createParticles(
                    this.standingOnObstacle.x + this.standingOnObstacle.width/2, 
                    this.standingOnObstacle.y, 
                    particleCount, 
                    '#a67c52'
                );
                
                // Add a stronger upward bounce on the second jump or when powered up
                if (this.mushroomPowerActive || this.standingOnObstacle.jumpCount === 2) {
                    this.velY = -4; // Stronger bounce on final smash
                    
                    // Add extra wood splinter particles
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            createParticles(
                                this.standingOnObstacle.x + Math.random() * this.standingOnObstacle.width, 
                                this.standingOnObstacle.y, 
                                10, 
                                '#a67c52'
                            );
                        }, i * 100);
                    }
                } else {
                    this.velY = -2; // Normal bounce on first hit
                }
                
                return isDestroyed;
            }
        }
        
        return false;
    }
    
    shoot(frameCount, projectiles, createParticles, playSound) {
        const weapon = this.weapons[this.currentWeaponIndex];
        if (frameCount - this.lastShot > weapon.fireRate) {
            const projX = this.x + (this.direction > 0 ? this.width : 0);
            const projY = this.y + this.height / 2 - weapon.height / 2;
            
            // Apply mushroom power-up damage multiplier if active (increased to 2x)
            const damageMultiplier = this.mushroomPowerActive ? 2 : 1;
            
            // Check if we're using the Robohorse Cannon
            const isRobohorseCannonShot = weapon.name === "ROBOHORSE CANNON";
            
            projectiles.push({
                x: projX,
                y: projY,
                width: weapon.width,
                height: weapon.height,
                speed: weapon.projectileSpeed,
                velX: weapon.projectileSpeed * this.direction,
                velY: 0,
                damage: weapon.damage * damageMultiplier,
                color: weapon.color,
                isPlayerProjectile: true,
                isGlowing: weapon.isGlowing || false,
                // Add sine wave properties for Robohorse Cannon
                isSineWave: isRobohorseCannonShot,
                sineAmplitude: isRobohorseCannonShot ? 4 : 0, // Amplitude of the sine wave
                sineFrequency: isRobohorseCannonShot ? 0.05 : 0, // Frequency of the sine wave
                sinePhase: frameCount * 0.1, // Initial phase based on frame count for variation
                initialY: projY // Store initial Y position for sine wave calculation
            });
            
            // Add muzzle flash effect
            createParticles(projX, projY, 5, weapon.color);

            // Play weapon sound if callback is provided
            if (playSound) {
                playSound(weapon.name);
            }
            
            this.lastShot = frameCount;
            return true;
        }
        return false;
    }
    
    specialAbility(frameCount, projectiles, createParticles, playSound) {
        // Check if player has tokens to use special ability
        if (this.specialAbilityTokens <= 0 && !this.specialAbilityActive) {
            return false;
        }
        
        // Activate special ability if not already active
        if (!this.specialAbilityActive && this.specialAbilityTokens > 0) {
            this.specialAbilityActive = true;
            this.specialAbilityDuration = 0;
            this.specialAbilityLastConsumption = frameCount;
            
            // Consume one token to start
            this.specialAbilityTokens--;
            
            // Create initial particle burst
            createParticles(this.x + this.width/2, this.y + this.height/2, 30, this.weapons[this.currentWeaponIndex].color);
        }
        
        // If special ability is active
        if (this.specialAbilityActive) {
            // Increment duration counter
            this.specialAbilityDuration++;
            
            // Check if we need to consume another token
            if (frameCount - this.specialAbilityLastConsumption >= this.specialAbilityConsumptionRate) {
                if (this.specialAbilityTokens > 0) {
                    this.specialAbilityTokens--;
                    this.specialAbilityLastConsumption = frameCount;
                    // Reset duration when consuming a new token to extend the ability
                    this.specialAbilityDuration = 0;
                }
            }
            
            // Check if special ability should end
            if (this.specialAbilityDuration >= this.specialAbilityMaxDuration && this.specialAbilityTokens <= 0) {
                this.specialAbilityActive = false;
                return false;
            }
            
            // Fire special ability projectiles
            if (frameCount % 10 === 0) {
                const weapon = this.weapons[this.currentWeaponIndex];
                for (let i = 0; i < 5; i++) {
                    const angle = -Math.PI/4 + (Math.PI/2 * i/4);
                    projectiles.push({
                        x: this.x + this.width/2,
                        y: this.y + this.height/2,
                        width: weapon.width,
                        height: weapon.height,
                        speed: weapon.projectileSpeed,
                        velX: Math.cos(angle) * weapon.projectileSpeed * this.direction,
                        velY: Math.sin(angle) * weapon.projectileSpeed,
                        damage: weapon.damage / 2,
                        color: weapon.color,
                        isPlayerProjectile: true,
                        isGlowing: weapon.isGlowing || false
                    });
                }
                createParticles(this.x + this.width/2, this.y + this.height/2, 10, this.weapons[this.currentWeaponIndex].color);
                
                // Play weapon sound if callback is provided
                if (playSound) {
                    playSound(weapon.name);
                }
            }
            
            return true;
        }
        
        return false;
    }
    
    switchWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        return this.weapons[this.currentWeaponIndex].name;
    }
    
    draw(ctx, frameCount, keys) {
        // No longer skip drawing based on visibility flags
        // Player is always visible now
        
        ctx.save();
        
        const bodyX = this.x + this.width / 2;
        const bodyY = this.y + this.height / 2;
        
        // Draw special ability aura if active
        if (this.specialAbilityActive) {
            const auraSize = 10 + Math.sin(frameCount * 0.1) * 5;
            const auraColor = this.weapons[this.currentWeaponIndex].color;
            
            ctx.fillStyle = `rgba(${parseInt(auraColor.slice(1, 3), 16)}, ${parseInt(auraColor.slice(3, 5), 16)}, ${parseInt(auraColor.slice(5, 7), 16)}, 0.3)`;
            ctx.beginPath();
            ctx.ellipse(bodyX, bodyY, this.width * 0.7 + auraSize, this.height * 0.9 + auraSize, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(bodyX, this.canvas.height - 50, this.width * 0.8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw leg segments with joints
        this.legs.forEach((leg, index) => {
            // Adjust angles to better simulate horse leg positioning
            let angle = (leg.angle * Math.PI / 180) * this.direction;
            
            // Create more horse-like leg positioning
            if (index < 2) {
                // Front legs
                angle = (((index === 0 ? 30 : 60) + Math.sin(frameCount * 0.1 + leg.phase) * 10) * Math.PI / 180) * this.direction;
            } else if (index < 4) {
                // Middle legs
                angle = (((index === 2 ? 330 : 300) + Math.sin(frameCount * 0.1 + leg.phase) * 10) * Math.PI / 180) * this.direction;
            } else {
                // Back legs
                angle = (((index === 4 ? 120 : 210) + Math.sin(frameCount * 0.1 + leg.phase) * 10) * Math.PI / 180) * this.direction;
            }
            
            // Create joints for a more anatomically horse-like leg structure
            const midLength = leg.length * 0.6;
            const jointX = bodyX + Math.cos(angle) * midLength;
            const jointY = bodyY + Math.sin(angle) * midLength;
            
            // Calculate end position with realistic horse-like movement
            const legEndX = jointX + Math.cos(angle) * leg.length;
            const legEndY = jointY + Math.sin(angle) * leg.length + Math.sin(frameCount * 0.1 + leg.phase) * 3;
            
            // Draw upper leg segment with gradient
            const legGradient = ctx.createLinearGradient(bodyX, bodyY, jointX, jointY);
            legGradient.addColorStop(0, '#0066aa');
            legGradient.addColorStop(1, '#00ccff');
            
            ctx.strokeStyle = legGradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(bodyX, bodyY);
            ctx.lineTo(jointX, jointY);
            ctx.stroke();
            
            // Draw lower leg segment
            const lowerLegGradient = ctx.createLinearGradient(jointX, jointY, legEndX, legEndY);
            lowerLegGradient.addColorStop(0, '#00ccff');
            lowerLegGradient.addColorStop(1, '#00ffff');
            
            ctx.strokeStyle = lowerLegGradient;
            ctx.beginPath();
            ctx.moveTo(jointX, jointY);
            ctx.lineTo(legEndX, legEndY);
            ctx.stroke();
            
            // Draw joint
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(jointX, jointY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw hoof with glow
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            // Draw hooves instead of circular feet
            if (this.direction > 0) {
                ctx.moveTo(legEndX - 4, legEndY);
                ctx.lineTo(legEndX + 4, legEndY);
                ctx.lineTo(legEndX + 4, legEndY + 6);
                ctx.lineTo(legEndX - 4, legEndY + 6);
            } else {
                ctx.moveTo(legEndX + 4, legEndY);
                ctx.lineTo(legEndX - 4, legEndY);
                ctx.lineTo(legEndX - 4, legEndY + 6);
                ctx.lineTo(legEndX + 4, legEndY + 6);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // Draw body as a more horse-shaped form (elongated oval)
        const bodyGradient = ctx.createLinearGradient(
            this.x, this.y, 
            this.x + this.width, this.y + this.height
        );
        bodyGradient.addColorStop(0, '#092344');
        bodyGradient.addColorStop(0.5, '#1a5b9c');
        bodyGradient.addColorStop(1, '#092344');
        
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = '#0af';
        ctx.lineWidth = 2;
        
        // Horse body shape (elongated ellipse)
        ctx.beginPath();
        ctx.ellipse(
            bodyX, bodyY,
            this.width * 0.5, this.height * 0.7,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        
        // Add tech details to body - circuit pattern
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        
        // Draw spine and ribs (circuit-like pattern)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.2, bodyY);
        ctx.lineTo(this.x + this.width * 0.8, bodyY);
        ctx.stroke();
        
        for (let i = 0; i < 5; i++) {
            const ribX = this.x + this.width * (0.3 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(ribX, bodyY - this.height * 0.3);
            ctx.lineTo(ribX, bodyY + this.height * 0.3);
            ctx.stroke();
        }
        
        // Draw energy core in center
        const coreGradient = ctx.createRadialGradient(
            bodyX, bodyY, 2,
            bodyX, bodyY, 10
        );
        coreGradient.addColorStop(0, '#fff');
        coreGradient.addColorStop(0.3, '#0ff');
        coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(bodyX, bodyY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw horse neck (positioned based on direction)
        const neckEndX = this.x + (this.direction > 0 ? this.width * 0.8 : this.width * 0.2);
        const neckEndY = this.y;
        const neckStartX = this.x + (this.direction > 0 ? this.width * 0.7 : this.width * 0.3);
        const neckStartY = this.y + this.height * 0.3;
        
        const neckGradient = ctx.createLinearGradient(
            neckStartX, neckStartY,
            neckEndX, neckEndY
        );
        neckGradient.addColorStop(0, '#1a5b9c');
        neckGradient.addColorStop(1, '#092344');
        
        ctx.fillStyle = neckGradient;
        ctx.beginPath();
        ctx.moveTo(neckStartX, neckStartY);
        ctx.quadraticCurveTo(
            neckStartX + (neckEndX - neckStartX) * 0.1, 
            neckStartY - this.height * 0.4,
            neckEndX, neckEndY
        );
        ctx.lineTo(neckEndX + (this.direction > 0 ? 5 : -5), neckEndY);
        ctx.quadraticCurveTo(
            neckStartX + (neckEndX - neckStartX) * 0.1 + (this.direction > 0 ? 5 : -5), 
            neckStartY - this.height * 0.4,
            neckStartX + (this.direction > 0 ? 5 : -5), neckStartY
        );
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0af';
        ctx.stroke();
        
        // Add mane with glowing cybernetic details
        const maneColors = ['#00ccff', '#0066ff', '#0033aa'];
        for (let i = 0; i < 7; i++) {
            const maneX = neckStartX + (neckEndX - neckStartX) * (i/7);
            const maneY = neckStartY - this.height * 0.1 - (neckStartY - neckEndY) * (i/7);
            
            // Calculate spine curve position
            const t = i/7;
            const spineX = neckStartX + (neckEndX - neckStartX) * t;
            const controlX = neckStartX + (neckEndX - neckStartX) * 0.1;
            const controlY = neckStartY - this.height * 0.4;
            const spineY = (1-t)*(1-t)*neckStartY + 2*(1-t)*t*controlY + t*t*neckEndY;
            
            const maneLength = 10 + Math.sin(frameCount * 0.1 + i) * 3;
            const maneColor = maneColors[i % maneColors.length];
            
            ctx.strokeStyle = maneColor;
            ctx.lineWidth = 2;
            ctx.shadowColor = maneColor;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.moveTo(spineX, spineY);
            ctx.lineTo(
                spineX + (this.direction > 0 ? -maneLength : maneLength), 
                spineY - maneLength * 0.7
            );
            ctx.stroke();
            
            // Add glowing tips to mane
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(
                spineX + (this.direction > 0 ? -maneLength : maneLength), 
                spineY - maneLength * 0.7,
                2, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw horse tail
        const tailStartX = this.x + (this.direction > 0 ? this.width * 0.2 : this.width * 0.8);
        const tailStartY = this.y + this.height * 0.3;
        
        // Draw tail base
        ctx.fillStyle = '#092344';
        ctx.beginPath();
        ctx.moveTo(tailStartX, tailStartY);
        ctx.quadraticCurveTo(
            tailStartX + (this.direction > 0 ? -20 : 20), 
            tailStartY + 15,
            tailStartX + (this.direction > 0 ? -30 : 30), 
            tailStartY + 40
        );
        ctx.lineTo(tailStartX + (this.direction > 0 ? -35 : 35), tailStartY + 40);
        ctx.quadraticCurveTo(
            tailStartX + (this.direction > 0 ? -25 : 25), 
            tailStartY + 15,
            tailStartX, tailStartY + 5
        );
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0af';
        ctx.stroke();
        
        // Add glowing tail strands
        for (let i = 0; i < 5; i++) {
            const strandPhase = frameCount * 0.05 + i * 0.5;
            const strandX = tailStartX + (this.direction > 0 ? -30 : 30) + Math.sin(strandPhase) * 5;
            const strandY = tailStartY + 40;
            const strandLength = 15 + i * 3;
            
            ctx.strokeStyle = '#00ccff';
            ctx.shadowColor = '#00ccff';
            ctx.shadowBlur = 5;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(strandX, strandY);
            ctx.quadraticCurveTo(
                strandX + (this.direction > 0 ? -10 : 10), 
                strandY + strandLength * 0.6,
                strandX + (this.direction > 0 ? -5 : 5), 
                strandY + strandLength
            );
            ctx.stroke();
            
            // Add glowing tips to tail
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(
                strandX + (this.direction > 0 ? -5 : 5), 
                strandY + strandLength,
                2, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw robot head with metallic gradient (more horse-like proportions)
        const headWidth = this.width * 0.4;
        const headHeight = this.height * 0.6;
        const headX = neckEndX + (this.direction > 0 ? 0 : -headWidth);
        const headY = neckEndY - headHeight * 0.7;
        
        // Draw horse-shaped robot head
        const headGradient = ctx.createLinearGradient(
            headX, headY, 
            headX + headWidth, headY + headHeight
        );
        headGradient.addColorStop(0, '#656565');
        headGradient.addColorStop(0.5, '#a9a9a9');
        headGradient.addColorStop(1, '#656565');
        
        ctx.fillStyle = headGradient;
        ctx.strokeStyle = '#0af';
        ctx.lineWidth = 2;
        
        // Create horse head shape
        ctx.beginPath();
        // Curved top of head (forehead)
        ctx.moveTo(headX, headY + headHeight * 0.3);
        ctx.quadraticCurveTo(
            headX + headWidth * 0.5, 
            headY - headHeight * 0.1,
            headX + headWidth, 
            headY + headHeight * 0.3
        );
        
        // Back of head
        if (this.direction > 0) {
            ctx.lineTo(headX + headWidth, headY + headHeight * 0.8);
            // Jaw/chin
            ctx.quadraticCurveTo(
                headX + headWidth * 0.8, 
                headY + headHeight * 0.9,
                headX + headWidth * 0.6, 
                headY + headHeight
            );
            // Muzzle/nose
            ctx.lineTo(headX + headWidth * 0.2, headY + headHeight);
            ctx.quadraticCurveTo(
                headX + headWidth * 0.1, 
                headY + headHeight * 0.7,
                headX, 
                headY + headHeight * 0.5
            );
        } else {
            ctx.lineTo(headX, headY + headHeight * 0.8);
            // Jaw/chin
            ctx.quadraticCurveTo(
                headX + headWidth * 0.2, 
                headY + headHeight * 0.9,
                headX + headWidth * 0.4, 
                headY + headHeight
            );
            // Muzzle/nose
            ctx.lineTo(headX + headWidth * 0.8, headY + headHeight);
            ctx.quadraticCurveTo(
                headX + headWidth * 0.9, 
                headY + headHeight * 0.7,
                headX + headWidth, 
                headY + headHeight * 0.5
            );
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add tech details to head
        ctx.fillStyle = '#222';
        
        // Draw visor/eye display
        const visorY = headY + headHeight * 0.4;
        const visorHeight = headHeight * 0.15;
        
        roundRect(
            ctx, 
            headX + headWidth * 0.2, 
            visorY, 
            headWidth * 0.6, 
            visorHeight, 
            3, true, false
        );
        
        // Draw glowing eye in visor
        const eyeX = headX + headWidth * (this.direction > 0 ? 0.5 : 0.5);
        const eyeY = visorY + visorHeight * 0.5;
        const eyeWidth = headWidth * 0.4;
        const eyeHeight = visorHeight * 0.6;
        
        // Eye glow
        ctx.fillStyle = '#f00';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 15;
        
        // Draw scanner-like eye
        ctx.beginPath();
        ctx.rect(
            eyeX - eyeWidth * 0.5, 
            eyeY - eyeHeight * 0.5, 
            eyeWidth, 
            eyeHeight
        );
        ctx.fill();
        
        // Scanner animation
        const scannerPos = (frameCount % 60) / 60;
        const scannerX = eyeX - eyeWidth * 0.5 + eyeWidth * scannerPos;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.rect(scannerX - 1, eyeY - eyeHeight * 0.5, 2, eyeHeight);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Add ears
        const earWidth = headWidth * 0.15;
        const earHeight = headHeight * 0.3;
        
        // Left ear
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(headX + headWidth * 0.25, headY + headHeight * 0.1);
        ctx.lineTo(headX + headWidth * 0.2 - earWidth, headY - earHeight);
        ctx.lineTo(headX + headWidth * 0.3 - earWidth, headY - earHeight * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0af';
        ctx.stroke();
        
        // Right ear
        ctx.beginPath();
        ctx.moveTo(headX + headWidth * 0.75, headY + headHeight * 0.1);
        ctx.lineTo(headX + headWidth * 0.8 + earWidth, headY - earHeight);
        ctx.lineTo(headX + headWidth * 0.7 + earWidth, headY - earHeight * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add nostril lights on muzzle
        const nostrilY = headY + headHeight * 0.9;
        const nostrilX1 = headX + headWidth * (this.direction > 0 ? 0.25 : 0.75);
        const nostrilX2 = headX + headWidth * (this.direction > 0 ? 0.35 : 0.65);
        
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(nostrilX1, nostrilY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nostrilX2, nostrilY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw weapon with glow effect
        const weapon = this.weapons[this.currentWeaponIndex];
        
        // Calculate weapon position - mounted on the side
        const weaponY = this.y + this.height * 0.3;
        const weaponLength = 25;
        const weaponHeight = 8;
        
        let weaponX;
        if (this.direction > 0) {
            weaponX = this.x + this.width * 0.8;
        } else {
            weaponX = this.x + this.width * 0.2 - weaponLength;
        }
        
        if (weapon.isGlowing) {
            // Draw glowing cannon with special effects
            ctx.save();
            
            // Create radial gradient for the glowing effect
            const cannonX = weaponX + (this.direction > 0 ? weaponLength : 0);
            const cannonY = weaponY + weaponHeight/2;
            const cannonRadius = 6;
            
            const gradient = ctx.createRadialGradient(
                cannonX, cannonY, 0,
                cannonX, cannonY, cannonRadius * 2
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#cccccc');
            gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
            
            // Add glow effect
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
            
            // Draw the cannon barrel
            ctx.fillStyle = '#aaaaaa';
            if (this.direction > 0) {
                roundRect(ctx, weaponX, weaponY, weaponLength - cannonRadius, weaponHeight, 3, true, false);
            } else {
                roundRect(ctx, weaponX + cannonRadius, weaponY, weaponLength - cannonRadius, weaponHeight, 3, true, false);
            }
            
            // Draw the glowing cannon ball at the end
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cannonX, cannonY, cannonRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        } else {
            // Regular weapon drawing
            // Weapon gradient
            const weaponGradient = ctx.createLinearGradient(
                weaponX, weaponY, 
                weaponX + weaponLength, weaponY
            );
            
            weaponGradient.addColorStop(0, weapon.color);
            weaponGradient.addColorStop(1, lightenColor(weapon.color, 30));
            
            ctx.fillStyle = weaponGradient;
            ctx.shadowColor = weapon.color;
            ctx.shadowBlur = 10;
            
            // Draw weapon
            roundRect(ctx, weaponX, weaponY, weaponLength, weaponHeight, 3, true, false);
            
            // Weapon details
            ctx.fillStyle = lightenColor(weapon.color, 50);
            if (this.direction > 0) {
                roundRect(ctx, weaponX + weaponLength - 5, weaponY + 1, 3, weaponHeight - 2, 1, true, false);
            } else {
                roundRect(ctx, weaponX + 2, weaponY + 1, 3, weaponHeight - 2, 1, true, false);
            }
        }
        
        ctx.shadowBlur = 0;
        
        // Add engine exhaust when moving
        if (keys['ArrowLeft'] || keys['ArrowRight']) {
            const exhaustX = this.x + (this.direction > 0 ? this.width * 0.2 : this.width * 0.8);
            const exhaustY = this.y + this.height * 0.7;
            
            // Create random exhaust particles
            for (let i = 0; i < 5; i++) {
                const particleSize = Math.random() * 5 + 3;
                const offsetX = -this.direction * (Math.random() * 20 + 5);
                const offsetY = Math.random() * 8 - 4;
                
                const exhaustGradient = ctx.createRadialGradient(
                    exhaustX, exhaustY, 0,
                    exhaustX, exhaustY, particleSize * 2
                );
                
                exhaustGradient.addColorStop(0, '#fff');
                exhaustGradient.addColorStop(0.2, '#0af');
                exhaustGradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
                
                ctx.fillStyle = exhaustGradient;
                ctx.beginPath();
                ctx.arc(exhaustX + offsetX, exhaustY + offsetY, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    // New method to activate mushroom power-up
    activateMushroomPower(createParticles, playSound) {
        if (!this.mushroomPowerActive && !this.isGrowing) {
            // Store original dimensions
            this.originalWidth = this.width;
            this.originalHeight = this.height;
            
            // Create power-up effect particles
            createParticles(this.x + this.width/4, this.y + this.height/4, 30, '#ff0000');
            
            // Play power-up sound if provided
            if (playSound) {
                playSound();
            }
            
            // Start the growth animation sequence
            this.isGrowing = true;
            this.growthStage = 0;
            this.growthAnimationFrame = 0;
            
            // We'll set mushroomPowerActive to true after the animation completes
            return true;
        }
        return false;
    }
    
    // Helper method to handle the growth animation
    updateGrowthAnimation(createParticles) {
        if (!this.isGrowing) return;
        
        this.growthAnimationFrame++;
        
        // Progress growth every 5 frames instead of toggling visibility
        if (this.growthAnimationFrame % 5 === 0) {
            // Calculate smooth growth progress (0 to 1 over 30 frames)
            const growthProgress = Math.min(this.growthAnimationFrame / 30, 1);
            
            // Apply smooth scaling with more height than width for a more heroic look
            // Width grows to 2x, height grows to 2.5x for a taller, more heroic appearance
            this.width = this.originalWidth * (1 + growthProgress);
            this.height = this.originalHeight * (1 + growthProgress * 1.5);
            
            // Adjust position to prevent clipping through floor
            if (this.y + this.height > this.canvas.height - 50) {
                this.y = this.canvas.height - 50 - this.height;
            }
            
            // Create particles during growth
            if (this.growthAnimationFrame % 10 === 0) {
                createParticles(this.x + this.width/2, this.y + this.height/2, 10, '#ff0000');
            }
            
            // Animation complete after 30 frames (about 0.5 seconds)
            if (this.growthAnimationFrame >= 30) {
                this.isGrowing = false;
                this.mushroomPowerActive = true;
                this.width = this.originalWidth * 2; // More proportional final width
                this.height = this.originalHeight * 2.5; // Taller final height
                
                // Adjust position one final time
                if (this.y + this.height > this.canvas.height - 50) {
                    this.y = this.canvas.height - 50 - this.height;
                }
                
                // Create a final burst of particles
                createParticles(this.x + this.width/2, this.y + this.height/2, 30, '#ff0000');
            }
        }
    }
    
    // New method to deactivate mushroom power-up
    deactivateMushroomPower(createParticles) {
        if (this.mushroomPowerActive && !this.isShrinking) {
            // Start the shrinking animation sequence
            this.isShrinking = true;
            this.shrinkStage = 0;
            this.shrinkAnimationFrame = 0;
            
            // We'll set mushroomPowerActive to false after the animation completes
            return true;
        }
        return false;
    }
    
    // Helper method to handle the shrinking animation
    updateShrinkAnimation(createParticles) {
        if (!this.isShrinking) return;
        
        this.shrinkAnimationFrame++;
        
        // Progress shrinking every 5 frames instead of toggling visibility
        if (this.shrinkAnimationFrame % 5 === 0) {
            // Calculate smooth shrink progress (0 to 1 over 30 frames)
            const shrinkProgress = Math.min(this.shrinkAnimationFrame / 30, 1);
            
            // Apply smooth scaling from powered-up size to original
            // Match the same proportions used in growth
            this.width = this.originalWidth * (2 - shrinkProgress);
            this.height = this.originalHeight * (2.5 - shrinkProgress * 1.5);
            
            // Create particles during shrinking
            if (this.shrinkAnimationFrame % 10 === 0 && createParticles) {
                createParticles(this.x + this.width/2, this.y + this.height/2, 10, '#ff0000');
            }
            
            // Animation complete after 30 frames (about 0.5 seconds)
            if (this.shrinkAnimationFrame >= 30) {
                this.isShrinking = false;
                this.mushroomPowerActive = false;
                this.width = this.originalWidth;
                this.height = this.originalHeight;
                
                // Adjust position to prevent clipping through floor
                if (this.y + this.height > this.canvas.height - 50) {
                    this.y = this.canvas.height - 50 - this.height;
                }
                
                // Create a final burst of particles
                if (createParticles) {
                    createParticles(this.x + this.width/2, this.y + this.height/2, 30, '#ff0000');
                }
            }
        }
    }
}

export default Player; 