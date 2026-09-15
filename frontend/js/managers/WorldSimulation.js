import { updateBossBattle } from './BossBattle.js';
import { isColliding } from '../utils/helpers.ts';

export function updateWorld(game, timeScale = 1) {
        if (!game.gameStarted || game.gameOver) return;
        
        // Use a default timeScale of 1 if not provided (for backward compatibility)
        timeScale = timeScale || 1;
        
        const previousPlayer = { x: game.player.x, y: game.player.y, width: game.player.width, height: game.player.height };
        game.frameCount++;
        
        // Update player with sound callback and timeScale
        game.player.update(game.inputManager.keys, game.frameCount, game.createParticles.bind(game), (weaponName) => {
            // Play weapon sound
            const soundKey = game.weaponSounds[weaponName];
            if (soundKey) {
                game.soundManager.playSound(soundKey, 0.3);
            }
        }, timeScale);
        
        const previousSupport = game.player.standingOnObstacle;
        game.player.standingOnObstacle = null;

        // Update obstacles with optimized collision detection
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = game.obstacles[i];
            
            // Skip obstacles that are far off-screen
            if (obstacle.x + obstacle.width < -300) {
                game.obstacles.splice(i, 1);
                continue;
            }
            
            // Update obstacle state with timeScale
            if (obstacle.update) {
                obstacle.update(timeScale);
            }
            
            // Remove obstacles that have finished exploding
            if ((obstacle.type === 'car' || obstacle.type === 'cybertruck') && 
                obstacle.isExploding && obstacle.explosionRadius <= 0) {
                game.obstacles.splice(i, 1);
                continue;
            }
            
            // Remove explosion-only objects that have finished exploding
            if ((obstacle.type === 'car_explosion' || obstacle.type === 'cybertruck_explosion') && 
                (!obstacle.isExploding || obstacle.explosionRadius <= 0)) {
                game.obstacles.splice(i, 1);
                continue;
            }
            
            // Check if player is colliding with obstacle
            if (!obstacle.isExploding && (isColliding(game.player, obstacle) || obstacle.type === 'car' || obstacle.type === 'cybertruck')) {
                // Skip collision for explosion-only objects
                if (obstacle.type === 'car_explosion' || obstacle.type === 'cybertruck_explosion') {
                    continue;
                }
                
                // Handle player-obstacle collision
                game.combat.collide(obstacle, previousPlayer, previousSupport);
            }
            
            // Only process projectile collisions if the obstacle is not already exploding
            if (!obstacle.isExploding && (obstacle.type === 'car' || obstacle.type === 'cybertruck' || obstacle.type === 'box')) {
                // Get nearby projectiles - use rectangle bounds check instead of filter
                for (let j = game.projectiles.length - 1; j >= 0; j--) {
                    const proj = game.projectiles[j];
                    if (isColliding(proj, obstacle)) {
                        // Remove projectile
                        game.projectiles.splice(j, 1);
                        game.createParticles(proj.x, proj.y, 3, proj.color);
                        
                        // Play car hit sound for vehicles
                        if (obstacle.type === 'car' || obstacle.type === 'cybertruck') {
                            game.soundManager.playSound('carHit', 0.3);
                        }
                        
                        // Handle obstacle damage
                        const shouldExplode = obstacle.takeDamage(proj.damage, proj.isPlayerProjectile ? 1 : 0.5);
                        
                        if (shouldExplode || (obstacle.type === 'box' && obstacle.health <= 0)) {
                            // Play explosion sound for cars/cybertrucks or break sound for boxes
                            if (obstacle.type === 'box') {
                                game.soundManager.playSound('carHit', 0.5);
                                
                                // Spawn mushroom if box contained one
                                if (obstacle.containsMushroom) {
                                    game.spawnMushroomPowerUp(obstacle.x, obstacle.y - 20);
                                }
                                
                                // Create particles for box destruction
                                game.createParticles(
                                    obstacle.x + obstacle.width/2,
                                    obstacle.y + obstacle.height/2,
                                    15,
                                    obstacle.color
                                );
                                
                                // Remove the box
                                game.obstacles.splice(i, 1);
                            } else {
                                game.soundManager.playSound('explosion', 0.5);
                                
                                // Trigger explosion but don't remove the car yet
                                // The car will be removed when the explosion animation completes
                                obstacle.explode();
                                
                                // Remove the car immediately after triggering the explosion
                                game.obstacles.splice(i, 1);
                                
                                // Create a new explosion object to handle the animation
                                game.obstacles.push({
                                    ...obstacle,
                                    // Only keep properties needed for explosion
                                    type: obstacle.type + '_explosion', // Mark as explosion only
                                    x: obstacle.x,
                                    y: obstacle.y,
                                    width: obstacle.width,
                                    height: obstacle.height,
                                    isExploding: true,
                                    explosionTimer: 0,
                                    explosionDuration: obstacle.explosionDuration,
                                    explosionRadius: obstacle.explosionRadius,
                                    explosionParticles: obstacle.explosionParticles,
                                    explosionHitEnemies: obstacle.explosionHitEnemies,
                                    update: obstacle.update,
                                    draw: function(ctx, frameCount) {
                                        // Only draw the explosion, not the car
                                        this.drawExplosion(ctx);
                                    },
                                    drawExplosion: obstacle.drawExplosion,
                                    isInExplosionRadius: obstacle.isInExplosionRadius
                                });
                                
                                // Reward every Cybertruck takedown with the Elon Toasty easter egg.
                                if (obstacle.type === 'cybertruck') {
                                    game.triggerElonToasty();
                                }
                            }
                            
                            // Add score
                            game.score += obstacle.points;
                            game.scoreDisplay.textContent = game.score;
                            break; // Exit projectile loop once explosion is triggered or box is destroyed
                        }
                    }
                }
            }
        }
        
        // Check collision with platforms - use simple for loop instead of filter for better performance
        let onPlatform = false;
            const playerBottom = game.player.y + game.player.height;
            const playerRight = game.player.x + game.player.width;
        const playerCenterX = game.player.x + game.player.width / 2;
        const viewRangeX = game.canvas.width / 2;
        
        // Only check platforms that are near the player
        for (let i = 0; i < game.platforms.length; i++) {
            const platform = game.platforms[i];
            
            // Skip platforms that are far from the player
            if (Math.abs(platform.x - game.player.x) > viewRangeX) continue;
            
            // Skip pillars for collision (they're just visual)
            if (platform.type === 'pillar') continue;
            
            // Check if player is above the platform and falling
            if (game.player.velY >= 0 && // Player is falling
                playerBottom <= platform.y + 10 && // Player is above or slightly into platform
                playerBottom >= platform.y - 10 && // Not too far above
                game.player.x < platform.x + platform.width &&
                playerRight > platform.x) {
                
                // Position player on top of platform
                game.player.y = platform.y - game.player.height;
                game.player.velY = 0;
                game.player.isJumping = false;
                onPlatform = true;
                
                // Create dust particles when landing on a platform
                if (game.player.lastVelY > 3) {
                    game.createParticles(
                        game.player.x + game.player.width/2, 
                        game.player.y + game.player.height, 
                        5, 
                        '#aaa'
                    );
                }
            }
            
            // Horizontal collision (only for shelves, not ground)
            if (platform.type === 'shelf' && 
                playerBottom > platform.y + 5 && 
                game.player.y < platform.y + platform.height) {
                
                // Coming from left
                if (playerRight >= platform.x && playerRight <= platform.x + 20 && game.player.x < platform.x) {
                    game.player.x = platform.x - game.player.width;
                }
                // Coming from right
                else if (game.player.x <= platform.x + platform.width && game.player.x >= platform.x + platform.width - 20 && playerRight > platform.x + platform.width) {
                    game.player.x = platform.x + platform.width;
                }
            }
        }
        
        // If not on any platform, check for ground collision
        if (!onPlatform) {
            // Find the ground segment the player is currently over - use simple loop instead of filter
            let currentGround = null;
            
            for (let i = 0; i < game.platforms.length; i++) {
                const segment = game.platforms[i];
                if (segment.type !== 'ground') continue;
                if (Math.abs(segment.x - game.player.x) > viewRangeX) continue;
                
                if (playerCenterX >= segment.x && 
                    playerCenterX < segment.x + segment.width) {
                    currentGround = segment;
                    break;
                }
            }
            
            if (currentGround && game.player.y + game.player.height > currentGround.y) {
                game.player.y = currentGround.y - game.player.height;
                game.player.velY = 0;
                game.player.isJumping = false;
                
                // Create dust particles when landing on the ground
                if (game.player.lastVelY > 3) {
                    game.createParticles(
                        game.player.x + game.player.width/2, 
                        game.player.y + game.player.height, 
                        5, 
                        '#aaa'
                    );
                }
            }
        }
        
        // Resolve animation after floor/platform collisions and before computing shot origins.
        game.player.updateAppearance(timeScale, game.gameSpeed);

        // Shooting
        if (game.inputManager.keys[' ']) {
            game.player.shoot(game.frameCount, game.projectiles, game.createParticles.bind(game), (weaponName) => {
                // Play weapon sound
                const soundKey = game.weaponSounds[weaponName];
                if (soundKey) {
                    game.soundManager.playSound(soundKey, 0.3);
                }
            });
        }
        
        // Special ability (stampede mode)
        if (game.inputManager.keys['c']) {
            if (game.player.specialAbility(game.frameCount, game.projectiles, game.createParticles.bind(game), (weaponName) => {
                // Play weapon sound
                const soundKey = game.weaponSounds[weaponName];
                if (soundKey) {
                    game.soundManager.playSound(soundKey, 0.3);
                }
            })) {
                // Special ability was activated
                game.specialTokensDisplay.textContent = game.player.specialAbilityTokens;
            }
        } else if (game.player.specialAbilityActive) {
            // Continue special ability if it's active, even if key is released
            if (game.player.specialAbility(game.frameCount, game.projectiles, game.createParticles.bind(game), (weaponName) => {
                // Play weapon sound
                const soundKey = game.weaponSounds[weaponName];
                if (soundKey) {
                    game.soundManager.playSound(soundKey, 0.3);
                }
            })) {
                // Update special tokens display
                game.specialTokensDisplay.textContent = game.player.specialAbilityTokens;
            }
        }
        
        // Update level manager
        if (!game.boss) game.levelManager.update();
        
        // Update projectiles
        for (let i = game.projectiles.length - 1; i >= 0; i--) {
            const proj = game.projectiles[i];
            
            proj.x += proj.velX * timeScale;
            
            // Apply sine wave motion for Robohorse Cannon shots
            if (proj.isSineWave) {
                // Update the phase with each frame
                proj.sinePhase += proj.sineFrequency * timeScale;
                // Calculate Y position based on sine wave (around the initial Y position)
                proj.y = proj.initialY + Math.sin(proj.sinePhase) * proj.sineAmplitude;
                
                // Add trailing particle effect for sine wave shots
                if (game.frameCount % 2 === 0) {
                    game.createParticles(proj.x + proj.width/2, proj.y + proj.height/2, 1, proj.color);
                }
            } else {
                // Normal straight-line movement for other projectiles
                proj.y += proj.velY * timeScale;
            }
            
            // Ensure projectiles don't go below the floor level
            const floorLevel = game.canvas.height - 50;
            const accessibilityMargin = 5; // Small margin for projectiles
            if (proj.y + proj.height > floorLevel + accessibilityMargin) {
                if (Math.random() < 0.7 || !proj.isPlayerProjectile) {
                    // Most projectiles hitting the floor should be removed
                    game.projectiles.splice(i, 1);
                    // Create impact particles
                    game.createParticles(
                        proj.x + proj.width / 2,
                        floorLevel,
                        5,
                        proj.color
                    );
                    continue;
                } else {
                    // Some projectiles might bounce with reduced velocity
                    proj.velY = -proj.velY * 0.4;
                    proj.y = floorLevel + accessibilityMargin - proj.height;
                }
            }
            
            // Remove projectiles that are out of bounds
            if (proj.x < -50 || proj.x > game.canvas.width + 50 || 
                proj.y < -50 || proj.y > game.canvas.height + 50) {
                game.projectiles.splice(i, 1);
                continue;
            }
        }
        
        updateBossBattle(game);
        if (!game.gameStarted) return;

        // Update enemies
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            const previousEnemy = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

            const enemyShot = enemy.update(game.player, game.frameCount, game.createParticles.bind(game), timeScale);
            if (enemyShot) game.projectiles.push(enemyShot);
            
            // Remove enemies that are off-screen to the left or too far to the right
            if (enemy.x + enemy.width < -100 || enemy.x > game.canvas.width + 300) {
                game.removeEnemyFromExplosionSets(enemy);
                game.enemies.splice(i, 1);
                continue;
            }
            
            // Check for enemies in range of exploding vehicles
            for (let j = 0; j < game.obstacles.length; j++) {
                const obstacle = game.obstacles[j];
                // Only check exploding vehicles (cars and cybertrucks) and explosion-only objects
                if (((obstacle.type === 'car' || obstacle.type === 'cybertruck' || 
                      obstacle.type === 'car_explosion' || obstacle.type === 'cybertruck_explosion') && 
                    obstacle.isExploding)) {
                    
                    // Skip if enemy no longer exists or has already been hit
                    if (!enemy || obstacle.explosionHitEnemies.has(enemy)) {
                        continue;
                    }
                    
                    // Check if enemy is within explosion radius
                    if (obstacle.isInExplosionRadius(enemy)) {
                        // Apply explosion damage to enemy
                        const isDead = enemy.takeDamage(obstacle.explosionDamage);
                        
                        // Add enemy to the set of hit enemies to prevent multiple hits
                        obstacle.explosionHitEnemies.add(enemy);
                        
                        // Create explosion impact particles
                        game.createParticles(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2,
                            10,
                            '#ff6600'
                        );
                        
                        // If enemy is killed by explosion
                        if (isDead) {
                            game.removeEnemyFromExplosionSets(enemy);
                            game.enemies.splice(i, 1);
                            game.score += enemy.points;
                            game.scoreDisplay.textContent = game.score;
                            game.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#f00');
                            
                            // Randomly spawn power-up or special token
                            const rand = Math.random();
                            if (rand < 0.2) {
                                game.spawnPowerUp(enemy.x, enemy.y);
                            } else if (rand < 0.5) {
                                game.spawnSpecialToken(enemy.x, enemy.y);
                            }
                            
                            break; // Exit loop after enemy is destroyed
                        }
                    }
                }
            }
            
            // Skip enemies that have been removed
            if (game.enemies[i] !== enemy) continue;
            
            const stomp = game.combat.stompEnemy(enemy, previousPlayer, previousEnemy);
            if (stomp?.dead) {
                game.removeEnemyFromExplosionSets(enemy);
                game.enemies.splice(i, 1);
                game.score += enemy.points;
                game.scoreDisplay.textContent = game.score;
                game.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 20, '#f00');
                const rand = Math.random();
                if (rand < 0.2) game.spawnPowerUp(enemy.x, enemy.y);
                else if (rand < 0.5) game.spawnSpecialToken(enemy.x, enemy.y);
                continue;
            }

            // Check collisions with player projectiles
            for (let j = game.projectiles.length - 1; j >= 0; j--) {
                const proj = game.projectiles[j];
                
                // Skip non-player projectiles or those far from the enemy
                if (!proj.isPlayerProjectile || 
                    Math.abs(proj.x - enemy.x) > 100 || 
                    Math.abs(proj.y - enemy.y) > 100) continue;
                
                if (isColliding(proj, enemy)) {
                    const isDead = enemy.takeDamage(proj.damage);
                    game.projectiles.splice(j, 1);
                    game.createParticles(proj.x, proj.y, 5, proj.color);
                    
                    if (isDead) {
                        game.removeEnemyFromExplosionSets(enemy);
                        game.enemies.splice(i, 1);
                        game.score += enemy.points;
                        game.scoreDisplay.textContent = game.score;
                        game.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#f00');
                        
                        // Randomly spawn power-up or special token
                        const rand = Math.random();
                        if (rand < 0.2) {
                            game.spawnPowerUp(enemy.x, enemy.y);
                        } else if (rand < 0.5) {
                            game.spawnSpecialToken(enemy.x, enemy.y);
                        }
                        
                        break; // Exit loop after enemy is destroyed
                    }
                }
            }
            
            // Check collision with player
            if (!stomp && game.enemies[i] === enemy && isColliding(enemy, game.player)) {
                // Subtract health but ensure it stays as a valid number
                game.player.health = Math.max(0, game.player.health - 1);
                game.updateHealthDisplay();
                game.createParticles(game.player.x + game.player.width/2, game.player.y + game.player.height/2, 3, '#fff');
                
                // Activate damage flash effect
                game.effectsManager.triggerDamageFlash();
                
                // Deactivate mushroom power-up if active
                if (game.player.mushroomPowerActive) {
                    game.player.deactivateMushroomPower(game.createParticles.bind(game));
                }
                
                if (game.player.health <= 0) {
                    game.endGame();
                }
            }
        }
        
        // Handle enemy projectiles hitting player
        for (let i = game.projectiles.length - 1; i >= 0; i--) {
            const proj = game.projectiles[i];
            
            // Skip player projectiles or those far from the player
            if (proj.isPlayerProjectile || 
                Math.abs(proj.x - game.player.x) > 100 || 
                Math.abs(proj.y - game.player.y) > 100) continue;
            
            if (isColliding(proj, game.player)) {
                // Subtract health but ensure it stays as a valid number
                game.player.health = Math.max(0, game.player.health - proj.damage);
                game.updateHealthDisplay();
                game.projectiles.splice(i, 1);
                game.createParticles(proj.x, proj.y, 10, proj.color);
                
                // Activate damage flash effect
                game.effectsManager.triggerDamageFlash();
                
                // Deactivate mushroom power-up if active
                if (game.player.mushroomPowerActive) {
                    game.player.deactivateMushroomPower(game.createParticles.bind(game));
                }
                
                if (game.player.health <= 0) {
                    game.endGame();
                }
            }
        }
        
        // Spawn enemies periodically
        if (!game.boss && game.frameCount - game.lastSpawnTime > 300) { // Spawn every 5 seconds at 60fps (was 120 - 2 seconds)
            game.spawnEnemy();
            game.lastSpawnTime = game.frameCount;
        }
        
        // Update power-ups
        game.powerUps.forEach((powerUp, index) => {
            powerUp.y += Math.sin(game.frameCount * 0.1) * 0.5; // Floating effect
            
            // Ensure power-ups don't go below the floor level
            const floorLevel = game.canvas.height - 50; // Same floor level as used for player
            const accessibilityMargin = 10; // Smaller margin than enemies for better visibility
            if (powerUp.y + powerUp.height > floorLevel + accessibilityMargin) {
                powerUp.y = floorLevel + accessibilityMargin - powerUp.height;
            }
            
            if (isColliding(powerUp, game.player)) {
                // Play power-up sound
                game.soundManager.playSound('powerUp', 0.5);
                
                if (powerUp.type === 'health') {
                    game.player.health = Math.min(game.player.health + 20, game.player.maxHealth);
                    game.updateHealthDisplay();
                } else if (powerUp.type === 'weapon') {
                    // Cycle to next weapon - fix property name to match Player.js
                    game.player.currentWeaponIndex = (game.player.currentWeaponIndex + 1) % game.weapons.length;
                    game.weaponDisplay.textContent = game.weapons[game.player.currentWeaponIndex].name;
                } else if (powerUp.type === 'mushroom') {
                    game.player.activateMushroomPower(game.createParticles.bind(game), () => {
                        // Play mushroom power-up sound
                        game.soundManager.playSound('powerUp', 0.6);
                    });
                }
                
                // Remove the power-up after collecting
                game.powerUps.splice(index, 1);
                game.createParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 15, powerUp.color);
            }
        });
        
        // Update special tokens
        game.specialTokens.forEach((token, index) => {
            token.y += Math.sin(game.frameCount * 0.1) * 0.5; // Floating effect
            
            // Ensure special tokens don't go below the floor level
            const floorLevel = game.canvas.height - 50; // Same floor level as used for player
            const accessibilityMargin = 10; // Smaller margin than enemies for better visibility
            if (token.y + token.height > floorLevel + accessibilityMargin) {
                token.y = floorLevel + accessibilityMargin - token.height;
            }
            
            if (isColliding(token, game.player)) {
                // Add token to player's count if not at max
                if (game.player.specialAbilityTokens < game.player.maxSpecialAbilityTokens) {
                    // Play power-up sound
                    game.soundManager.playSound('powerUp', 0.5);
                    
                    game.player.specialAbilityTokens++;
                    game.specialTokensDisplay.textContent = game.player.specialAbilityTokens;
                    game.specialTokens.splice(index, 1);
                    game.createParticles(token.x + token.width/2, token.y + token.height/2, 15, token.color);
                }
            }
        });
        
        // Update particles - limit the number of particles for performance
        const maxParticles = 100; // Limit the maximum number of particles
        if (game.particles.length > maxParticles) {
            game.particles.splice(0, game.particles.length - maxParticles);
        }
        
        game.particles.forEach((particle, index) => {
            particle.x += particle.velX;
            particle.y += particle.velY;
            particle.size -= 0.1;
            
            // Ensure particles don't go below the floor level
            const floorLevel = game.canvas.height - 50;
            if (particle.y > floorLevel) {
                // For particles below floor level, either bounce them up or make them fade faster
                if (Math.random() < 0.5) {
                    particle.velY = -particle.velY * 0.5; // Bounce with reduced velocity
                } else {
                    particle.size -= 0.3; // Make it fade faster
                }
            }
            
            if (particle.size <= 0) {
                game.particles.splice(index, 1);
            }
        });
        
        // Update mushroom power-up timer
        if (game.player.mushroomPowerActive && !game.player.isGrowing && !game.player.isShrinking) {
            game.mushroomPowerTimer++;
            
            // Deactivate mushroom power-up when timer expires
            if (game.mushroomPowerTimer >= game.mushroomPowerDuration) {
                game.mushroomPowerTimer = 0;
                game.player.deactivateMushroomPower(game.createParticles.bind(game));
            }
        }
        
        // Update damage flash effect
        game.effectsManager.update();
        
        // Increase game speed over time - but more gradually
        if (game.frameCount % 1000 === 0) {
            game.gameSpeed += 0.05; // Reduced from 0.1 to make the speed increase more gradual
        }
        
        // Log enemy count and positions less frequently to reduce console spam
        if (game.frameCount % 600 === 0) { // Reduced frequency from 300 to 600
            console.log("Current enemies:", game.enemies.length);
            if (game.enemies.length > 0 && game.enemies.length < 10) { // Only log positions if there are fewer than 10 enemies
                console.log("Enemy positions:", game.enemies.map(e => `(${Math.round(e.x)},${Math.round(e.y)})`).join(', '));
            }
        }
        
        // Update platforms - move with level scrolling
        // Process ALL platforms, not just visible ones
        for (let i = 0; i < game.platforms.length; i++) {
            const platform = game.platforms[i];
            
            // Move platform with level scrolling
            if (!game.boss) platform.x -= game.levelManager.scrollSpeed * game.gameSpeed;
            
            // If a ground segment moves off-screen, reposition it to the right
            if (platform.type === 'ground' && platform.x + platform.width < -100) { // Changed from -200 to -100 for smoother terrain
                // Find the rightmost ground segment
                let rightmostGround = { x: 0 };
                for (let j = 0; j < game.platforms.length; j++) {
                    const p = game.platforms[j];
                    if (p.type === 'ground' && p.x > rightmostGround.x) {
                        rightmostGround = p;
                    }
                }
                
                // Position this segment after the rightmost one with a small overlap to prevent gaps
                platform.x = rightmostGround.x + rightmostGround.width - 1;
                
                // Update the height based on sine wave pattern
                const segmentIndex = Math.floor(platform.x / 100);
                const heightVariation = Math.sin(segmentIndex * 0.5) * 20;
                platform.y = (game.canvas.height - 50) + heightVariation;
                platform.height = 50 - heightVariation;
            }
            
            // If a shelf/pillar moves off-screen, reposition it to the right
            if ((platform.type === 'shelf' || platform.type === 'pillar') && platform.x + platform.width < -200) {
                // Find all shelves
                const shelves = [];
                for (let j = 0; j < game.platforms.length; j++) {
                    if (game.platforms[j].type === 'shelf') {
                        shelves.push(game.platforms[j]);
                    }
                }
                
                // Find the rightmost shelf
                let rightmostShelf = { x: 0 };
                for (let j = 0; j < shelves.length; j++) {
                    if (shelves[j].x > rightmostShelf.x) {
                        rightmostShelf = shelves[j];
                    }
                }
                
                if (platform.type === 'shelf') {
                    // Position this shelf after the rightmost one
                    platform.x = rightmostShelf.x + 400;
                    
                    // Vary the height
                    const baseY = game.canvas.height - 50;
                    const shelfIndex = shelves.indexOf(platform);
                    platform.y = baseY - 100 - (shelfIndex % 3) * 50;
                    
                    // Find and update the associated pillar
                    for (let j = 0; j < game.platforms.length; j++) {
                        const p = game.platforms[j];
                        if (p.type === 'pillar' && Math.abs(p.x - (platform.x + 65)) < 20) {
                            p.x = platform.x + 65;
                            p.y = platform.y + 20;
                            p.height = baseY - platform.y - 20;
                            break;
                        }
                    }
                }
            }
        }
        
        // Check if it's time to play police radio sound
        if (game.gameStarted && !game.gameOver) {
            const timeElapsedSinceStart = !game.lastPoliceRadioTime ? 0 : performance.now() - game.lastPoliceRadioTime;
            
            // Check if initial delay has passed before playing the first radio sound
            if (game.lastPoliceRadioTime && timeElapsedSinceStart >= (game.lastPoliceRadioTime === performance.now() ? 20000 : game.soundManager.policeRadioInterval)) {
                game.soundManager.playPoliceRadio();
                game.lastPoliceRadioTime = performance.now();
            }
        }
    }
    
