import { PLAYER_SIZE, advanceAppearance, createAppearance, drawPlayer, getMuzzlePosition } from '../components/PlayerRenderer.js';

const POWERED_SIZE_MULTIPLIER = 1.5;

class Player {
    constructor(canvas, weapons) {
        this.canvas = canvas;
        this.weapons = weapons;
        this.currentWeaponIndex = 0;
        this.currentWeapon = weapons[0];
        
        // Initialize player properties
        this.x = 100;
        this.y = canvas.height / 2;
        this.width = PLAYER_SIZE.width;
        this.height = PLAYER_SIZE.height;
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
        
        this.appearance = createAppearance(this.health);
        this.isMoving = false;

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
    
    update(keys, frameCount, createParticles, playSound, timeScale = 1) {
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
        
        this.isMoving = Boolean(keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['A'] || keys['d'] || keys['D']);

        // Handle movement - support both arrow keys and WASD
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.x -= this.speed * timeScale;
            this.direction = -1;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.x += this.speed * timeScale;
            this.direction = 1;
        }
        
        // Handle jumping - allow 'z' key, 'ArrowUp' key, and 'w' key
        if ((keys['z'] || keys['ArrowUp'] || keys['w'] || keys['W']) && !this.isJumping) {
            this.velY = -this.jumpPower;
            this.isJumping = true;
            this.standingOnObstacle = null; // Clear obstacle reference when jumping
            createParticles(this.x + this.width / 2, this.y + this.height, 10, '#777');
        }
        
        // Apply gravity
        this.velY += 0.5 * timeScale;
        this.y += this.velY * timeScale;
        
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
        
    }

    updateAppearance(timeScale = 1, scrollSpeed = 0) {
        advanceAppearance(this, timeScale, scrollSpeed);
    }

    getMuzzlePosition() {
        return getMuzzlePosition(this);
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
            this.appearance.recoil = 1;
            const muzzle = this.getMuzzlePosition();
            const projX = muzzle.x - (this.direction < 0 ? weapon.width : 0);
            const projY = muzzle.y - weapon.height / 2;
            
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
            createParticles(muzzle.x, muzzle.y, 5, weapon.color);

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
                this.appearance.recoil = 1;
                const muzzle = this.getMuzzlePosition();
                for (let i = 0; i < 5; i++) {
                    const angle = -Math.PI/4 + (Math.PI/2 * i/4);
                    projectiles.push({
                        x: muzzle.x - (this.direction < 0 ? weapon.width : 0),
                        y: muzzle.y - weapon.height / 2,
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
                createParticles(muzzle.x, muzzle.y, 10, weapon.color);
                
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
        this.currentWeapon = this.weapons[this.currentWeaponIndex];
        return this.weapons[this.currentWeaponIndex].name;
    }
    
    draw(ctx) {
        drawPlayer(ctx, this);
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
            this.isShrinking = false;
            this.shrinkScale = 1;
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
            const feetY = this.y + this.height;
            // Calculate smooth growth progress (0 to 1 over 30 frames)
            const growthProgress = Math.min(this.growthAnimationFrame / 30, 1);
            
            const scale = 1 + growthProgress * (POWERED_SIZE_MULTIPLIER - 1);
            this.width = this.originalWidth * scale;
            this.height = this.originalHeight * scale;
            this.y = feetY - this.height;
            
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
                this.width = this.originalWidth * POWERED_SIZE_MULTIPLIER;
                this.height = this.originalHeight * POWERED_SIZE_MULTIPLIER;
                
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
        this.mushroomPowerActive = false;
        this.mushroomPowerTimer = 0;
        const feetY = this.y + this.height;
        this.shrinkScale = Math.min(this.width / PLAYER_SIZE.width, this.height / PLAYER_SIZE.height);
        this.isGrowing = false;
        this.width = PLAYER_SIZE.width;
        this.height = PLAYER_SIZE.height;
        this.y = feetY - this.height;
        this.speed = 5;
        this.jumpPower = 12;
        this.isShrinking = this.shrinkScale > 1;
        this.growthScale = 1;
        
        // Create particles to show the power-down effect
        if (createParticles) {
            createParticles(this.x + this.width / 2, this.y + this.height / 2, 20, '#8B4513');
        }
    }
    
    // Helper method to handle the shrinking animation
    updateShrinkAnimation(createParticles) {
        // Similar to growth animation but in reverse
        if (this.isShrinking) {
            this.shrinkScale = Math.max(1, this.shrinkScale - 0.05);
            
            if (this.shrinkScale <= 1) {
                this.isShrinking = false;
                this.shrinkScale = 1;
            }
            
            if (createParticles && Math.random() < 0.3) {
                createParticles(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    1,
                    '#8B4513'
                );
            }
        }
    }
    
    reset() {
        // Reset position
        this.x = 100;
        this.y = this.canvas.height / 2;
        
        // Reset movement
        this.velY = 0;
        this.isJumping = false;
        this.direction = 1;
        
        // Reset health
        this.health = 100;
        this.width = this.originalWidth = PLAYER_SIZE.width;
        this.height = this.originalHeight = PLAYER_SIZE.height;
        this.appearance = createAppearance(this.health);
        this.isMoving = false;

        // Reset weapons
        this.currentWeaponIndex = 0;
        this.currentWeapon = this.weapons[0];
        this.lastShot = 0;
        
        // Reset special abilities
        this.specialAbilityTokens = 0;
        this.specialAbilityActive = false;
        this.specialAbilityDuration = 0;
        this.specialAbilityLastConsumption = 0;
        
        // Reset mushroom power
        this.mushroomPowerActive = false;
        this.mushroomPowerTimer = 0;
        this.isGrowing = false;
        this.isShrinking = false;
        this.growthScale = 1;
        this.shrinkScale = 1;
        
        // Reset standing on obstacle
        this.standingOnObstacle = null;
        
        // Reset box smashing
        this.isLanding = false;
        this.lastVelY = 0;
    }
}

export default Player; 