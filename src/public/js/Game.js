import Player from './entities/Player.js';
import Enemy from './entities/Enemy.js';
import Background from './components/Background.js';
import LevelManager from './levels/LevelManager.js';
import SoundManager from './managers/SoundManager.js';
import InputManager from './managers/InputManager.js';
import EffectsManager from './managers/EffectsManager.js';
import { isColliding } from './utils/helpers.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.frameCount = 0;
        this.lastSpawnTime = 0;
        this.gameSpeed = 1;
        this.lastPoliceRadioTime = 0;
        
        // Initialize managers
        this.soundManager = new SoundManager(this);
        this.inputManager = new InputManager(this);
        this.effectsManager = new EffectsManager(this);
        
        // Frame rate control - simplified
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        
        // Mushroom power-up duration
        this.mushroomPowerDuration = 600; // 10 seconds at 60fps
        this.mushroomPowerTimer = 0;
        
        // DOM elements
        this.healthBar = document.getElementById('health-bar');
        this.healthValue = document.getElementById('health-value');
        this.scoreDisplay = document.getElementById('score');
        this.weaponDisplay = document.getElementById('weapon');
        this.specialTokensDisplay = document.getElementById('special-tokens');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.levelDisplay = document.getElementById('level');
        this.levelAnnouncement = document.getElementById('level-announcement');
        this.missionCompleteScreen = document.getElementById('mission-complete');
        this.missionCompleteScore = document.getElementById('mission-complete-score');
        
        // Name input state
        this.nameChars = Array.from(document.getElementsByClassName('name-char'));
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
        
        // Weapons
        this.weapons = [
            { name: "GLOWING CANNON", color: "#ffffff", damage: 15, fireRate: 15, projectileSpeed: 10, width: 10, height: 10, isGlowing: true },
            { name: "NEURAL BEAM", color: "#ff8c00", damage: 10, fireRate: 10, projectileSpeed: 12, width: 5, height: 2 },
            { name: "TENTACLE SCRAMBLER", color: "#f0f", damage: 20, fireRate: 20, projectileSpeed: 8, width: 8, height: 8 },
            { name: "ROBOHORSE CANNON", color: "#0f0", damage: 30, fireRate: 30, projectileSpeed: 10, width: 10, height: 4 },
            { name: "LEG LAUNCHERS", color: "#ff0", damage: 5, fireRate: 5, projectileSpeed: 15, width: 3, height: 3 }
        ];
        
        // Game entities
        this.player = new Player(canvas, this.weapons);
        this.background = new Background(canvas);
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.specialTokens = [];
        this.obstacles = [];
        this.particles = [];
        this.platforms = [];
        
        // Generate curved terrain segments
        this.generateTerrain();
        
        // Level manager - ensure enemies array is initialized first
        console.log("Initializing level manager with enemies array:", this.enemies);
        this.levelManager = new LevelManager(this);
        
        // Sound effects
        const soundsConfig = {
            explosion: 'audio/explosion.mp3',
            carHit: 'audio/car_hit.mp3',
            toasty: 'audio/toasty.mp3',
            // Weapon sounds
            blasterGlowing: 'audio/blaster_shot_high.mp3',
            blasterNeural: 'audio/blaster_shot_snap.mp3',
            blasterTentacle: 'audio/blaster_shots_pee.mp3',
            blasterRobo: 'audio/blaster_shots.mp3',
            blasterLeg: 'audio/blaster_shot_leg.mp3',
            // Other sounds
            powerUp: 'audio/power_up.mp3',
            horseScream: 'audio/horse_scream_die.mp3',
            alienWhisper1: 'audio/alien_whisper_1.mp3',
            alienWhisper2: 'audio/alien_whisper_2.mp3',
            alienWhisper3: 'audio/alien_whisper_3.mp3',
            backgroundMusic: 'audio/soundtrack_1.mp3',
            policeRadio1: 'audio/police_radio_1.mp3',
            policeRadio2: 'audio/police_radio_2.mp3'
        };
        
        // Initialize sounds in the SoundManager
        this.soundManager.loadSounds(soundsConfig);
        
        // Weapon sound mapping
        this.weaponSounds = {
            "GLOWING CANNON": "blasterGlowing",
            "NEURAL BEAM": "blasterNeural",
            "TENTACLE SCRAMBLER": "blasterTentacle",
            "ROBOHORSE CANNON": "blasterRobo",
            "LEG LAUNCHERS": "blasterLeg"
        };
        
        // Bind event listeners
        this.bindEventListeners();
    }
    
    toggleSound() {
        this.soundManager.toggleSound();
    }
    
    togglePause() {
        if (this.gameStarted && !this.gameOver) {
            this.isPaused = !this.isPaused;
            
            // Show/hide start screen when paused/unpaused
            if (this.isPaused) {
                this.startScreen.style.display = 'block';
                document.getElementById('help-toggle').classList.add('active');
                document.getElementById('start-instruction').textContent = 'Press SPACE to resume';
            } else {
                this.startScreen.style.display = 'none';
                document.getElementById('help-toggle').classList.remove('active');
                // Continue the animation loop if unpausing
                if (!this.animationFrameId) {
                    this.animate(performance.now());
                }
            }
        }
    }
    
    playSound(soundKey, volume = 0.5) {
        this.soundManager.playSound(soundKey, volume);
    }
    
    bindEventListeners() {
        this.inputManager.bindEventListeners();
    }
    
    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.startScreen.style.display = 'none';
        
        // Play background music if sound is enabled
        this.soundManager.playBackgroundMusic();
        
        // Show level announcement when game starts
        const levelData = this.levelManager.getLevelData(this.levelManager.currentLevel);
        this.showLevelAnnouncement(levelData.name);
        
        // Reset police radio timing when starting the game
        this.lastPoliceRadioTime = performance.now();
        
        this.animate();
    }
    
    resetGame() {
        // Reset game state
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.frameCount = 0;
        this.lastSpawnTime = 0;
        this.gameSpeed = 1;
        
        // Reset player by creating a new instance
        this.player = new Player(this.canvas, this.weapons);
        
        // Clear all game objects
        this.enemies = [];
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.projectiles = [];
        this.specialTokens = [];
        
        // Reset level manager
        if (this.levelManager) {
            this.levelManager.resetToFirstLevel();
            this.currentLevel = this.levelManager.getCurrentLevel();
            
            // Update level display
            if (this.levelDisplay) {
                this.levelDisplay.textContent = this.currentLevel.name;
            }
        }
        
        // Reset UI
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = '0';
        }
        this.updateHealthDisplay();
        
        // Hide game over and mission complete screens
        this.gameOverScreen.style.display = 'none';
        this.missionCompleteScreen.style.display = 'none';
        
        // Show start screen
        this.startScreen.style.display = 'block';
        
        // Stop background music
        this.soundManager.stopBackgroundMusic();
        
        // Reset name input
        this.nameChars.forEach(char => char.classList.remove('active'));
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
    }
    
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        // Hide the game over screen
        this.gameOverScreen.style.display = 'none';
        
        // Update final score display
        this.finalScoreDisplay.textContent = this.score;
        
        // Show mission complete screen instead of game over screen
        this.missionCompleteScreen.style.display = 'block';
        
        // Change the title to "GAME OVER" instead of "MISSION COMPLETE"
        const missionTitle = this.missionCompleteScreen.querySelector('h1');
        missionTitle.textContent = "GAME OVER";
        
        // Update score display
        this.missionCompleteScore.textContent = this.score;
        
        // Reset name input
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
        this.updateNameDisplay();
        this.nameChars[0].classList.add('active');
        
        // Hide restart instruction until score is saved
        const restartInstruction = document.getElementById('mission-complete-instruction');
        restartInstruction.style.display = 'none';
        
        // Stop background music and play death sound
        this.soundManager.stopBackgroundMusic();
        this.soundManager.playSound('horseScream', 0.7);
    }
    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        this.frameCount++;
        
        // Update player with sound callback
        this.player.update(this.inputManager.keys, this.frameCount, this.createParticles.bind(this), (weaponName) => {
            // Play weapon sound
            const soundKey = this.weaponSounds[weaponName];
            if (soundKey) {
                this.soundManager.playSound(soundKey, 0.3);
            }
        });
        
        // Update obstacles with optimized collision detection
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // Skip obstacles that are far off-screen
            if (obstacle.x + obstacle.width < -300) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Update obstacle state
            obstacle.update();
            
            // Remove obstacles that have finished exploding
            if ((obstacle.type === 'car' || obstacle.type === 'cybertruck') && 
                obstacle.isExploding && obstacle.explosionRadius <= 0) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Remove explosion-only objects that have finished exploding
            if ((obstacle.type === 'car_explosion' || obstacle.type === 'cybertruck_explosion') && 
                (!obstacle.isExploding || obstacle.explosionRadius <= 0)) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Check if player is colliding with obstacle
            if (isColliding(this.player, obstacle)) {
                // Skip collision for explosion-only objects
                if (obstacle.type === 'car_explosion' || obstacle.type === 'cybertruck_explosion') {
                    continue;
                }
                
                // Handle player-obstacle collision
                this.handlePlayerObstacleCollision(obstacle);
            }
            
            // Only process projectile collisions if the obstacle is not already exploding
            if (!obstacle.isExploding && (obstacle.type === 'car' || obstacle.type === 'cybertruck' || obstacle.type === 'box')) {
                // Get nearby projectiles - use rectangle bounds check instead of filter
                for (let j = this.projectiles.length - 1; j >= 0; j--) {
                    const proj = this.projectiles[j];
                    if (!proj.isPlayerProjectile) continue;
                    
                    // Quick bounds check before detailed collision
                    if (Math.abs(proj.x - obstacle.x) > 100 || Math.abs(proj.y - obstacle.y) > 100) continue;
                    
                    if (isColliding(proj, obstacle)) {
                        // Remove projectile
                        this.projectiles.splice(j, 1);
                        this.createParticles(proj.x, proj.y, 3, proj.color);
                        
                        // Play car hit sound for vehicles
                        if (obstacle.type === 'car' || obstacle.type === 'cybertruck') {
                            this.soundManager.playSound('carHit', 0.3);
                        }
                        
                        // Handle obstacle damage
                        const shouldExplode = obstacle.takeDamage(proj.damage);
                        
                        if (shouldExplode || (obstacle.type === 'box' && obstacle.health <= 0)) {
                            // Play explosion sound for cars/cybertrucks or break sound for boxes
                            if (obstacle.type === 'box') {
                                this.soundManager.playSound('carHit', 0.5);
                                
                                // Spawn mushroom if box contained one
                                if (obstacle.containsMushroom) {
                                    this.spawnMushroomPowerUp(obstacle.x, obstacle.y - 20);
                                }
                                
                                // Create particles for box destruction
                                this.createParticles(
                                    obstacle.x + obstacle.width/2,
                                    obstacle.y + obstacle.height/2,
                                    15,
                                    obstacle.color
                                );
                                
                                // Remove the box
                                this.obstacles.splice(i, 1);
                            } else {
                                this.soundManager.playSound('explosion', 0.5);
                                
                                // Trigger explosion but don't remove the car yet
                                // The car will be removed when the explosion animation completes
                                obstacle.explode();
                                
                                // Remove the car immediately after triggering the explosion
                                this.obstacles.splice(i, 1);
                                
                                // Create a new explosion object to handle the animation
                                this.obstacles.push({
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
                                
                                // Trigger Elon Toasty easter egg for Cybertruck explosions (10% chance)
                                if (obstacle.type === 'cybertruck' && Math.random() < 0.1) {
                                    this.triggerElonToasty();
                                }
                            }
                            
                            // Add score
                            this.score += obstacle.points;
                            this.scoreDisplay.textContent = this.score;
                            break; // Exit projectile loop once explosion is triggered or box is destroyed
                        }
                    }
                }
            }
        }
        
        // Check collision with platforms - use simple for loop instead of filter for better performance
        let onPlatform = false;
            const playerBottom = this.player.y + this.player.height;
            const playerRight = this.player.x + this.player.width;
        const playerCenterX = this.player.x + this.player.width / 2;
        const viewRangeX = this.canvas.width / 2;
        
        // Only check platforms that are near the player
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            
            // Skip platforms that are far from the player
            if (Math.abs(platform.x - this.player.x) > viewRangeX) continue;
            
            // Skip pillars for collision (they're just visual)
            if (platform.type === 'pillar') continue;
            
            // Check if player is above the platform and falling
            if (this.player.velY >= 0 && // Player is falling
                playerBottom <= platform.y + 10 && // Player is above or slightly into platform
                playerBottom >= platform.y - 10 && // Not too far above
                this.player.x < platform.x + platform.width &&
                playerRight > platform.x) {
                
                // Position player on top of platform
                this.player.y = platform.y - this.player.height;
                this.player.velY = 0;
                this.player.isJumping = false;
                onPlatform = true;
                
                // Create dust particles when landing on a platform
                if (this.player.lastVelY > 3) {
                    this.createParticles(
                        this.player.x + this.player.width/2, 
                        this.player.y + this.player.height, 
                        5, 
                        '#aaa'
                    );
                }
            }
            
            // Horizontal collision (only for shelves, not ground)
            if (platform.type === 'shelf' && 
                playerBottom > platform.y + 5 && 
                this.player.y < platform.y + platform.height) {
                
                // Coming from left
                if (playerRight >= platform.x && playerRight <= platform.x + 20 && this.player.x < platform.x) {
                    this.player.x = platform.x - this.player.width;
                }
                // Coming from right
                else if (this.player.x <= platform.x + platform.width && this.player.x >= platform.x + platform.width - 20 && playerRight > platform.x + platform.width) {
                    this.player.x = platform.x + platform.width;
                }
            }
        }
        
        // If not on any platform, check for ground collision
        if (!onPlatform) {
            // Find the ground segment the player is currently over - use simple loop instead of filter
            let currentGround = null;
            
            for (let i = 0; i < this.platforms.length; i++) {
                const segment = this.platforms[i];
                if (segment.type !== 'ground') continue;
                if (Math.abs(segment.x - this.player.x) > viewRangeX) continue;
                
                if (playerCenterX >= segment.x && 
                    playerCenterX < segment.x + segment.width) {
                    currentGround = segment;
                    break;
                }
            }
            
            if (currentGround && this.player.y + this.player.height > currentGround.y) {
                this.player.y = currentGround.y - this.player.height;
                this.player.velY = 0;
                this.player.isJumping = false;
                
                // Create dust particles when landing on the ground
                if (this.player.lastVelY > 3) {
                    this.createParticles(
                        this.player.x + this.player.width/2, 
                        this.player.y + this.player.height, 
                        5, 
                        '#aaa'
                    );
                }
            }
        }
        
        // Shooting
        if (this.inputManager.keys[' ']) {
            this.player.shoot(this.frameCount, this.projectiles, this.createParticles.bind(this), (weaponName) => {
                // Play weapon sound
                const soundKey = this.weaponSounds[weaponName];
                if (soundKey) {
                    this.soundManager.playSound(soundKey, 0.3);
                }
            });
        }
        
        // Special ability (stampede mode)
        if (this.inputManager.keys['c']) {
            if (this.player.specialAbility(this.frameCount, this.projectiles, this.createParticles.bind(this), (weaponName) => {
                // Play weapon sound
                const soundKey = this.weaponSounds[weaponName];
                if (soundKey) {
                    this.soundManager.playSound(soundKey, 0.3);
                }
            })) {
                // Special ability was activated
                this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
            }
        } else if (this.player.specialAbilityActive) {
            // Continue special ability if it's active, even if key is released
            if (this.player.specialAbility(this.frameCount, this.projectiles, this.createParticles.bind(this), (weaponName) => {
                // Play weapon sound
                const soundKey = this.weaponSounds[weaponName];
                if (soundKey) {
                    this.soundManager.playSound(soundKey, 0.3);
                }
            })) {
                // Update special tokens display
                this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
            }
        }
        
        // Update level manager
        this.levelManager.update();
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            proj.x += proj.velX;
            
            // Apply sine wave motion for Robohorse Cannon shots
            if (proj.isSineWave) {
                // Update the phase with each frame
                proj.sinePhase += proj.sineFrequency;
                // Calculate Y position based on sine wave (around the initial Y position)
                proj.y = proj.initialY + Math.sin(proj.sinePhase) * proj.sineAmplitude;
                
                // Add trailing particle effect for sine wave shots
                if (this.frameCount % 2 === 0) {
                    this.createParticles(proj.x + proj.width/2, proj.y + proj.height/2, 1, proj.color);
                }
            } else {
                // Normal straight-line movement for other projectiles
                proj.y += proj.velY;
            }
            
            // Ensure projectiles don't go below the floor level
            const floorLevel = this.canvas.height - 50;
            const accessibilityMargin = 5; // Small margin for projectiles
            if (proj.y + proj.height > floorLevel + accessibilityMargin) {
                if (Math.random() < 0.7 || !proj.isPlayerProjectile) {
                    // Most projectiles hitting the floor should be removed
                    this.projectiles.splice(i, 1);
                    // Create impact particles
                    this.createParticles(
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
            if (proj.x < -50 || proj.x > this.canvas.width + 50 || 
                proj.y < -50 || proj.y > this.canvas.height + 50) {
                this.projectiles.splice(i, 1);
                continue;
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            enemy.update(this.player, this.frameCount, this.createParticles.bind(this));
            
            // Remove enemies that are off-screen to the left or too far to the right
            if (enemy.x + enemy.width < -100 || enemy.x > this.canvas.width + 300) {
                this.removeEnemyFromExplosionSets(enemy);
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Check for enemies in range of exploding vehicles
            for (let j = 0; j < this.obstacles.length; j++) {
                const obstacle = this.obstacles[j];
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
                        this.createParticles(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2,
                            10,
                            '#ff6600'
                        );
                        
                        // If enemy is killed by explosion
                        if (isDead) {
                            this.removeEnemyFromExplosionSets(enemy);
                            this.enemies.splice(i, 1);
                            this.score += enemy.points;
                            this.scoreDisplay.textContent = this.score;
                            this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#f00');
                            
                            // Randomly spawn power-up or special token
                            const rand = Math.random();
                            if (rand < 0.2) {
                                this.spawnPowerUp(enemy.x, enemy.y);
                            } else if (rand < 0.5) {
                                this.spawnSpecialToken(enemy.x, enemy.y);
                            }
                            
                            break; // Exit loop after enemy is destroyed
                        }
                    }
                }
            }
            
            // Skip enemies that have been removed
            if (i >= this.enemies.length) continue;
            
            // Check collisions with player projectiles
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const proj = this.projectiles[j];
                
                // Skip non-player projectiles or those far from the enemy
                if (!proj.isPlayerProjectile || 
                    Math.abs(proj.x - enemy.x) > 100 || 
                    Math.abs(proj.y - enemy.y) > 100) continue;
                
                if (isColliding(proj, enemy)) {
                    const isDead = enemy.takeDamage(proj.damage);
                    this.projectiles.splice(j, 1);
                    this.createParticles(proj.x, proj.y, 5, proj.color);
                    
                    if (isDead) {
                        this.removeEnemyFromExplosionSets(enemy);
                        this.enemies.splice(i, 1);
                        this.score += enemy.points;
                        this.scoreDisplay.textContent = this.score;
                        this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#f00');
                        
                        // Randomly spawn power-up or special token
                        const rand = Math.random();
                        if (rand < 0.2) {
                            this.spawnPowerUp(enemy.x, enemy.y);
                        } else if (rand < 0.5) {
                            this.spawnSpecialToken(enemy.x, enemy.y);
                        }
                        
                        break; // Exit loop after enemy is destroyed
                    }
                }
            }
            
            // Check collision with player
            if (i < this.enemies.length && isColliding(this.enemies[i], this.player)) {
                // Subtract health but ensure it stays as a valid number
                this.player.health = Math.max(0, this.player.health - 1);
                this.updateHealthDisplay();
                this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 3, '#fff');
                
                // Activate damage flash effect
                this.effectsManager.triggerDamageFlash();
                
                // Deactivate mushroom power-up if active
                if (this.player.mushroomPowerActive) {
                    this.player.deactivateMushroomPower(this.createParticles.bind(this));
                }
                
                if (this.player.health <= 0) {
                    this.endGame();
                }
            }
        }
        
        // Handle enemy projectiles hitting player
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Skip player projectiles or those far from the player
            if (proj.isPlayerProjectile || 
                Math.abs(proj.x - this.player.x) > 100 || 
                Math.abs(proj.y - this.player.y) > 100) continue;
            
            if (isColliding(proj, this.player)) {
                // Subtract health but ensure it stays as a valid number
                this.player.health = Math.max(0, this.player.health - proj.damage);
                this.updateHealthDisplay();
                this.projectiles.splice(i, 1);
                this.createParticles(proj.x, proj.y, 10, proj.color);
                
                // Activate damage flash effect
                this.effectsManager.triggerDamageFlash();
                
                // Deactivate mushroom power-up if active
                if (this.player.mushroomPowerActive) {
                    this.player.deactivateMushroomPower(this.createParticles.bind(this));
                }
                
                if (this.player.health <= 0) {
                    this.endGame();
                }
            }
        }
        
        // Spawn enemies periodically
        if (this.frameCount - this.lastSpawnTime > 300) { // Spawn every 5 seconds at 60fps (was 120 - 2 seconds)
            this.spawnEnemy();
            this.lastSpawnTime = this.frameCount;
        }
        
        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.y += Math.sin(this.frameCount * 0.1) * 0.5; // Floating effect
            
            // Ensure power-ups don't go below the floor level
            const floorLevel = this.canvas.height - 50; // Same floor level as used for player
            const accessibilityMargin = 10; // Smaller margin than enemies for better visibility
            if (powerUp.y + powerUp.height > floorLevel + accessibilityMargin) {
                powerUp.y = floorLevel + accessibilityMargin - powerUp.height;
            }
            
            if (isColliding(powerUp, this.player)) {
                // Play power-up sound
                this.soundManager.playSound('powerUp', 0.5);
                
                if (powerUp.type === 'health') {
                    this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
                    this.updateHealthDisplay();
                } else if (powerUp.type === 'weapon') {
                    // Cycle to next weapon - fix property name to match Player.js
                    this.player.currentWeaponIndex = (this.player.currentWeaponIndex + 1) % this.weapons.length;
                    this.weaponDisplay.textContent = this.weapons[this.player.currentWeaponIndex].name;
                } else if (powerUp.type === 'mushroom') {
                    this.player.activateMushroomPower(this.createParticles.bind(this), () => {
                        // Play mushroom power-up sound
                        this.soundManager.playSound('powerUp', 0.6);
                    });
                }
                
                // Remove the power-up after collecting
                this.powerUps.splice(index, 1);
                this.createParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 15, powerUp.color);
            }
        });
        
        // Update special tokens
        this.specialTokens.forEach((token, index) => {
            token.y += Math.sin(this.frameCount * 0.1) * 0.5; // Floating effect
            
            // Ensure special tokens don't go below the floor level
            const floorLevel = this.canvas.height - 50; // Same floor level as used for player
            const accessibilityMargin = 10; // Smaller margin than enemies for better visibility
            if (token.y + token.height > floorLevel + accessibilityMargin) {
                token.y = floorLevel + accessibilityMargin - token.height;
            }
            
            if (isColliding(token, this.player)) {
                // Add token to player's count if not at max
                if (this.player.specialAbilityTokens < this.player.maxSpecialAbilityTokens) {
                    // Play power-up sound
                    this.soundManager.playSound('powerUp', 0.5);
                    
                    this.player.specialAbilityTokens++;
                    this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
                    this.specialTokens.splice(index, 1);
                    this.createParticles(token.x + token.width/2, token.y + token.height/2, 15, token.color);
                }
            }
        });
        
        // Update particles - limit the number of particles for performance
        const maxParticles = 100; // Limit the maximum number of particles
        if (this.particles.length > maxParticles) {
            this.particles.splice(0, this.particles.length - maxParticles);
        }
        
        this.particles.forEach((particle, index) => {
            particle.x += particle.velX;
            particle.y += particle.velY;
            particle.size -= 0.1;
            
            // Ensure particles don't go below the floor level
            const floorLevel = this.canvas.height - 50;
            if (particle.y > floorLevel) {
                // For particles below floor level, either bounce them up or make them fade faster
                if (Math.random() < 0.5) {
                    particle.velY = -particle.velY * 0.5; // Bounce with reduced velocity
                } else {
                    particle.size -= 0.3; // Make it fade faster
                }
            }
            
            if (particle.size <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // Update mushroom power-up timer
        if (this.player.mushroomPowerActive && !this.player.isGrowing && !this.player.isShrinking) {
            this.mushroomPowerTimer++;
            
            // Deactivate mushroom power-up when timer expires
            if (this.mushroomPowerTimer >= this.mushroomPowerDuration) {
                this.mushroomPowerTimer = 0;
                this.player.deactivateMushroomPower(this.createParticles.bind(this));
            }
        }
        
        // Update damage flash effect
        this.effectsManager.update();
        
        // Increase game speed over time - but more gradually
        if (this.frameCount % 1000 === 0) {
            this.gameSpeed += 0.05; // Reduced from 0.1 to make the speed increase more gradual
        }
        
        // Log enemy count and positions less frequently to reduce console spam
        if (this.frameCount % 600 === 0) { // Reduced frequency from 300 to 600
            console.log("Current enemies:", this.enemies.length);
            if (this.enemies.length > 0 && this.enemies.length < 10) { // Only log positions if there are fewer than 10 enemies
                console.log("Enemy positions:", this.enemies.map(e => `(${Math.round(e.x)},${Math.round(e.y)})`).join(', '));
            }
        }
        
        // Update platforms - move with level scrolling
        // Process ALL platforms, not just visible ones
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            
            // Move platform with level scrolling
            platform.x -= this.levelManager.scrollSpeed * this.gameSpeed;
            
            // If a ground segment moves off-screen, reposition it to the right
            if (platform.type === 'ground' && platform.x + platform.width < -100) { // Changed from -200 to -100 for smoother terrain
                // Find the rightmost ground segment
                let rightmostGround = { x: 0 };
                for (let j = 0; j < this.platforms.length; j++) {
                    const p = this.platforms[j];
                    if (p.type === 'ground' && p.x > rightmostGround.x) {
                        rightmostGround = p;
                    }
                }
                
                // Position this segment after the rightmost one with a small overlap to prevent gaps
                platform.x = rightmostGround.x + rightmostGround.width - 1;
                
                // Update the height based on sine wave pattern
                const segmentIndex = Math.floor(platform.x / 100);
                const heightVariation = Math.sin(segmentIndex * 0.5) * 20;
                platform.y = (this.canvas.height - 50) + heightVariation;
                platform.height = 50 - heightVariation;
            }
            
            // If a shelf/pillar moves off-screen, reposition it to the right
            if ((platform.type === 'shelf' || platform.type === 'pillar') && platform.x + platform.width < -200) {
                // Find all shelves
                const shelves = [];
                for (let j = 0; j < this.platforms.length; j++) {
                    if (this.platforms[j].type === 'shelf') {
                        shelves.push(this.platforms[j]);
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
                    const baseY = this.canvas.height - 50;
                    const shelfIndex = shelves.indexOf(platform);
                    platform.y = baseY - 100 - (shelfIndex % 3) * 50;
                    
                    // Find and update the associated pillar
                    for (let j = 0; j < this.platforms.length; j++) {
                        const p = this.platforms[j];
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
        if (this.gameStarted && !this.gameOver) {
            const timeElapsedSinceStart = !this.lastPoliceRadioTime ? 0 : performance.now() - this.lastPoliceRadioTime;
            
            // Check if initial delay has passed before playing the first radio sound
            if (this.lastPoliceRadioTime && timeElapsedSinceStart >= (this.lastPoliceRadioTime === performance.now() ? 20000 : this.soundManager.policeRadioInterval)) {
                this.soundManager.playPoliceRadio();
                this.lastPoliceRadioTime = performance.now();
            }
        }
    }
    
    handlePlayerObstacleCollision(obstacle) {
        // If player is above the obstacle and falling, place them on top
        if (this.player.y + this.player.height < obstacle.y + obstacle.height / 2 && this.player.velY > 0) {
            const previousVelY = this.player.velY;
            this.player.y = obstacle.y - this.player.height;
            this.player.velY = 0;
            this.player.isJumping = false;
            this.player.standingOnObstacle = obstacle;
            
            // Check if player is landing on a box and should smash it
            if (obstacle.type === 'box') {
                const isBoxDestroyed = this.player.checkBoxSmash([obstacle], this.createParticles.bind(this));
                if (isBoxDestroyed) {
                    const index = this.obstacles.indexOf(obstacle);
                    if (index !== -1) {
                        if (obstacle.containsMushroom) {
                            this.spawnMushroomPowerUp(obstacle.x, obstacle.y - 20);
                        }
                        this.obstacles.splice(index, 1);
                        this.score += obstacle.points;
                        this.scoreDisplay.textContent = this.score;
                        this.createParticles(
                            obstacle.x + obstacle.width/2,
                            obstacle.y + obstacle.height/2,
                            15,
                            obstacle.color
                        );
                    }
                }
            }
        } 
        // Handle horizontal collisions
        else if (this.player.x + this.player.width > obstacle.x && this.player.x < obstacle.x + obstacle.width) {
            if (this.player.x < obstacle.x) {
                this.player.x = obstacle.x - this.player.width;
                if (this.player.x <= 0) {
                    this.handlePlayerCrush();
                }
            } else {
                this.player.x = obstacle.x + obstacle.width;
            }
        }
    }
    
    handlePlayerCrush() {
        // Subtract health but ensure it stays as a valid number
        this.player.health = Math.max(0, this.player.health - 2);
        this.updateHealthDisplay();
        
        this.createParticles(
            this.player.x + this.player.width,
            this.player.y + this.player.height/2,
            3,
            '#ff0000'
        );
        
        this.effectsManager.triggerDamageFlash();
        
        if (this.player.mushroomPowerActive) {
            this.player.deactivateMushroomPower(this.createParticles.bind(this));
        }
        
        if (this.player.health <= 0) {
            this.endGame();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.background.draw(this.ctx, this.frameCount);
        
        // Draw platforms - use simple for loop instead of filter for better performance
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            
            // Skip platforms that are not visible
            if (platform.x + platform.width <= 0 || platform.x >= this.canvas.width) continue;
            
            if (platform.type === 'ground') {
                // Draw ground with texture
                const gradient = this.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
                gradient.addColorStop(0, '#555');
                gradient.addColorStop(1, '#333');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add texture lines to ground - optimize by drawing fewer lines
                this.ctx.strokeStyle = '#444';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < platform.width; i += 40) { // Increased spacing from 20 to 40
                    this.ctx.beginPath();
                    this.ctx.moveTo(platform.x + i, platform.y);
                    this.ctx.lineTo(platform.x + i, platform.y + platform.height);
                    this.ctx.stroke();
                }
            } else if (platform.type === 'shelf') {
                // Draw concrete shelf with a slight 3D effect
                this.ctx.fillStyle = '#777';
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add highlight on top
                this.ctx.fillStyle = '#999';
                this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
                
                // Add shadow at bottom
                this.ctx.fillStyle = '#555';
                this.ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
            } else if (platform.type === 'pillar') {
                // Draw concrete pillar
                const gradient = this.ctx.createLinearGradient(platform.x, 0, platform.x + platform.width, 0);
                gradient.addColorStop(0, '#666');
                gradient.addColorStop(0.5, '#888');
                gradient.addColorStop(1, '#666');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add horizontal lines for texture - optimize by drawing fewer lines
                this.ctx.strokeStyle = '#777';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < platform.height; i += 30) { // Increased spacing from 15 to 30
                    this.ctx.beginPath();
                    this.ctx.moveTo(platform.x, platform.y + i);
                    this.ctx.lineTo(platform.x + platform.width, platform.y + i);
                    this.ctx.stroke();
                }
            }
        }
        
        // Draw obstacles - use simple for loop instead of filter for better performance
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            
            // Skip obstacles that are not visible
            if (obstacle.x + obstacle.width <= 0 || obstacle.x >= this.canvas.width) continue;
            
            obstacle.draw(this.ctx, this.frameCount);
        }
        
        // Draw power-ups
        for (let i = 0; i < this.powerUps.length; i++) {
            const powerUp = this.powerUps[i];
            
            // Draw power-up base
            this.ctx.fillStyle = powerUp.color;
                this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
            // Draw power-up icon
            this.ctx.fillStyle = '#fff';
            if (powerUp.type === 'health') {
                // Draw plus sign
                this.ctx.fillRect(powerUp.x + powerUp.width/2 - 2, powerUp.y + powerUp.height/4, 4, powerUp.height/2);
                this.ctx.fillRect(powerUp.x + powerUp.width/4, powerUp.y + powerUp.height/2 - 2, powerUp.width/2, 4);
            } else if (powerUp.type === 'weapon') {
                // Draw star
                const centerX = powerUp.x + powerUp.width/2;
                const centerY = powerUp.y + powerUp.height/2;
                const spikes = 5;
                const outerRadius = powerUp.width/2 - 2;
                const innerRadius = powerUp.width/4;
                
                this.ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI/2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
            } else if (powerUp.type === 'mushroom') {
                // Draw mushroom cap
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 - 2, powerUp.width/2 - 2, 0, Math.PI, true);
                this.ctx.fill();
                
                // Draw mushroom stem
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(powerUp.x + powerUp.width/2 - 3, powerUp.y + powerUp.height/2 - 2, 6, powerUp.height/2);
                
                // Draw spots
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + powerUp.width/2 - 5, powerUp.y + powerUp.height/2 - 5, 2, 0, Math.PI * 2);
                this.ctx.arc(powerUp.x + powerUp.width/2 + 3, powerUp.y + powerUp.height/2 - 7, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Draw glow effect
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2 + 2, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        // Draw special tokens
        for (let i = 0; i < this.specialTokens.length; i++) {
            const token = this.specialTokens[i];
            
            // Draw token base
            this.ctx.fillStyle = token.color;
            this.ctx.beginPath();
            this.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw token icon (galloping horse silhouette)
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw glow effect
            this.ctx.shadowColor = token.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/2 + 2, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        // Draw player
        this.player.draw(this.ctx, this.frameCount, this.inputManager.keys);
        
        // Draw enemies - use simple for loop instead of filter for better performance
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            // Skip enemies that are not visible
            if (enemy.x + enemy.width <= 0 || enemy.x >= this.canvas.width) continue;
            
            enemy.draw(this.ctx, this.frameCount, this.player);
        }
        
        // Draw projectiles - use simple for loop instead of filter for better performance
        for (let i = 0; i < this.projectiles.length; i++) {
            const proj = this.projectiles[i];
            
            // Skip projectiles that are not visible
            if (proj.x + proj.width <= 0 || proj.x >= this.canvas.width || 
                proj.y + proj.height <= 0 || proj.y >= this.canvas.height) continue;
            
            // Draw projectile
            this.ctx.fillStyle = proj.color;
            
            if (proj.isGlowing) {
                // Add glow effect for glowing projectiles
                this.ctx.shadowColor = proj.color;
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            
            // Reset shadow
            if (proj.isGlowing) {
                this.ctx.shadowBlur = 0;
            }
        }
        
        // Draw particles - use simple for loop instead of filter for better performance
        // Limit the number of particles drawn to improve performance
        const maxParticlesToDraw = 50; // Reduced from 100 to 50
        let particlesDrawn = 0;
        
        for (let i = 0; i < this.particles.length && particlesDrawn < maxParticlesToDraw; i++) {
            const particle = this.particles[i];
            
            // Skip particles that are not visible
            if (particle.x <= 0 || particle.x >= this.canvas.width || 
                particle.y <= 0 || particle.y >= this.canvas.height) continue;
            
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            particlesDrawn++;
        }
        
        // Draw UI elements
        this.drawUI();
        
        // Draw effects
        this.effectsManager.draw(this.ctx);
    }
    
    animate(timestamp) {
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        if (!this.gameOver && !this.isPaused) {
            // Update game state
            this.update();
            
            // Draw the game
            this.draw();
            
            // Request the next frame
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        } else if (this.isPaused) {
            // When paused, only redraw the game (no updates) and keep requesting frames
            // This ensures the game remains visible behind the pause screen
            this.draw();
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        } else {
            this.animationFrameId = null;
        }
    }
    
    spawnEnemy() {
        // Different types of enemies with reduced speeds
        const enemyTypes = [
            { color: '#f00', width: 30, height: 30, speed: 1.0, health: 30, maxHealth: 30, points: 100, tentacles: 6 },  // Scout Squid (was 1.5)
            { color: '#a00', width: 40, height: 40, speed: 0.6, health: 60, maxHealth: 60, points: 200, tentacles: 8 },  // Heavy Squid (was 0.8)
            { color: '#faa', width: 25, height: 25, speed: 1.3, health: 20, maxHealth: 20, points: 150, tentacles: 5 },  // Stealth Squid (was 2.0)
            { color: '#f55', width: 50, height: 50, speed: 0.4, health: 100, maxHealth: 100, points: 300, tentacles: 10 } // Juggernaut Squid (was 0.5)
        ];
        
        // Select a random enemy type based on game progress
        const typeIndex = Math.min(Math.floor(this.score / 1000), enemyTypes.length - 1);
        const type = enemyTypes[Math.floor(Math.random() * (typeIndex + 1))];
        
        // Random position outside the screen
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -type.width : this.canvas.width;
            y = Math.random() * this.canvas.height;
        } else {
            x = Math.random() * this.canvas.width;
            y = -type.height;
        }
        
        this.enemies.push(new Enemy(x, y, type, this.canvas));
        
        // Play alien whisper sound occasionally when enemies spawn
        if (Math.random() < 0.3) { // 30% chance to play the sound
            this.soundManager.playAlienWhisper();
        }
    }
    
    spawnPowerUp(x, y) {
        const types = ['health', 'weapon', 'mushroom'];
        const type = types[Math.floor(Math.random() * types.length)];
        let color;
        let size;
        
        switch(type) {
            case 'health':
                color = '#ff3366';
                size = 25;
                break;
            case 'weapon':
                color = '#ff0';
                size = 20;
                break;
            case 'mushroom':
                color = '#ff0000';
                size = 25;
                break;
            default:
                color = '#ff0';
                size = 20;
        }
        
        // Ensure power-up doesn't spawn below floor level
        const floorLevel = this.canvas.height - 50;
        const accessibilityMargin = 10;
        if (y + size > floorLevel + accessibilityMargin) {
            y = floorLevel + accessibilityMargin - size;
        }
        
        this.powerUps.push({
            x,
            y,
            width: size,
            height: size,
            type,
            color
        });
    }
    
    spawnSpecialToken(x, y) {
        // Ensure special token doesn't spawn below floor level
        const floorLevel = this.canvas.height - 50;
        const accessibilityMargin = 10;
        const tokenSize = 20;
        
        if (y + tokenSize > floorLevel + accessibilityMargin) {
            y = floorLevel + accessibilityMargin - tokenSize;
        }
        
        this.specialTokens.push({
            x,
            y,
            width: tokenSize,
            height: tokenSize,
            color: '#ff00ff'
        });
    }
    
    createParticles(x, y, amount, color) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            
            this.particles.push({
                x,
                y,
                size: Math.random() * 3 + 2,
                velX: Math.cos(angle) * speed,
                velY: Math.sin(angle) * speed,
                color
            });
        }
    }
    
    // New method to update health display
    updateHealthDisplay() {
        // Ensure health is a valid number and capped at maxHealth
        if (typeof this.player.health !== 'number' || isNaN(this.player.health) || !isFinite(this.player.health)) {
            this.player.health = this.player.maxHealth;
        }
        
        // Cap health at maxHealth
        this.player.health = Math.min(this.player.health, this.player.maxHealth);
        
        // Calculate health percentage
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        
        // Update the health bar width based on player health percentage
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthValue.textContent = Math.round(this.player.health);
        
        // Change color based on health level
        if (healthPercent > 60) {
            this.healthBar.style.background = 'linear-gradient(to right, #0f0, #0f0)';
        } else if (healthPercent > 30) {
            this.healthBar.style.background = 'linear-gradient(to right, #ff0, #ff0)';
        } else {
            this.healthBar.style.background = 'linear-gradient(to right, #f00, #f00)';
        }
    }
    
    // Add a new method to spawn mushroom power-ups
    spawnMushroomPowerUp(x, y) {
        // Ensure mushroom doesn't spawn below floor level
        const floorLevel = this.canvas.height - 50;
        const accessibilityMargin = 10;
        const size = 25;
        
        if (y + size > floorLevel + accessibilityMargin) {
            y = floorLevel + accessibilityMargin - size;
        }
        
        this.powerUps.push({
            x,
            y,
            width: 25,
            height: 25,
            type: 'mushroom',
            color: '#ff0000'
        });
        
        // Create particles for visual effect
        this.createParticles(x + 12.5, y + 12.5, 15, '#ff0000');
    }
    
    // Add a new method to show level announcement
    showLevelAnnouncement(levelName) {
        // Extract level number from level name if possible
        const levelNumber = this.levelManager.currentLevel + 1;
        
        // Set content
        this.levelAnnouncement.innerHTML = `LEVEL ${levelNumber}<br>${levelName}`;
        
        // Remove any existing classes
        this.levelAnnouncement.classList.remove('active', 'fade-out');
        
        // Force a reflow to ensure the transition works
        void this.levelAnnouncement.offsetWidth;
        
        // Add the active class to slide in
        this.levelAnnouncement.classList.add('active');
        
        // Set a timeout to fade out after 3 seconds
        setTimeout(() => {
            this.levelAnnouncement.classList.remove('active');
            this.levelAnnouncement.classList.add('fade-out');
        }, 3000);
    }
    
    generateTerrain() {
        // Clear existing platforms
        this.platforms = [];
        
        // Create ground segments
        const baseY = this.canvas.height - 50;
        const segmentWidth = 100;
        const segmentCount = Math.ceil(this.canvas.width / segmentWidth) + 4; // Add extra segments
        
        for (let i = 0; i < segmentCount; i++) {
            // Create a sine wave pattern for the ground
            const segmentIndex = i;
            const heightVariation = Math.sin(segmentIndex * 0.5) * 20;
            
            this.platforms.push({
                x: i * segmentWidth,
                y: baseY + heightVariation,
                width: segmentWidth + 1, // +1 to avoid gaps
                height: 50 - heightVariation, // Adjust height to fill to bottom
                type: 'ground'
            });
        }
        
        // Add concrete shelves on pillars
        const shelfCount = 5;
        for (let i = 0; i < shelfCount; i++) {
            // Position shelves at different x positions
            const x = 300 + i * 400;
            // Vary the height of the shelves
            const y = baseY - 100 - (i % 3) * 50;
            
            // Add the shelf platform
            this.platforms.push({
                x: x,
                y: y,
                width: 150,
                height: 20,
                type: 'shelf'
            });
            
            // Add the supporting pillar
            this.platforms.push({
                x: x + 65, // Center the pillar under the shelf
                y: y + 20, // Start from bottom of shelf
                width: 20,
                height: baseY - y - 20, // Extend to ground level
                type: 'pillar'
            });
        }
    }
    
    triggerElonToasty() {
        this.effectsManager.triggerElonToasty();
    }
    
    // Add a helper method to remove an enemy from all explosion hit sets
    removeEnemyFromExplosionSets(enemy) {
        // Clean up any references to this enemy in explosion hit sets
        for (const obstacle of this.obstacles) {
            if ((obstacle.type === 'car' || obstacle.type === 'cybertruck' || 
                 obstacle.type === 'car_explosion' || obstacle.type === 'cybertruck_explosion') && 
                obstacle.isExploding && 
                obstacle.explosionHitEnemies && 
                obstacle.explosionHitEnemies.has(enemy)) {
                obstacle.explosionHitEnemies.delete(enemy);
            }
        }
    }
    
    // Add new helper method to validate level obstacle placement
    validateLevelObstaclePlacement() {
        // Get all levels from the level manager
        const allLevels = this.levelManager.getAllLevels();
        
        for (let levelIndex = 0; levelIndex < allLevels.length; levelIndex++) {
            const level = allLevels[levelIndex];
            const obstacles = level.elements.filter(e => e.type === 'obstacle');
            
            // Sort by position to check consecutive obstacles
            obstacles.sort((a, b) => a.position - b.position);
            
            // Check for potential overlaps in the level definition
            for (let i = 0; i < obstacles.length - 1; i++) {
                const current = obstacles[i];
                const next = obstacles[i + 1];
                
                // Estimate obstacle width based on subtype
                let currentWidth = 50;  // default width
                let nextWidth = 50;     // default width
                
                if (current.subtype === 'car') currentWidth = 180;
                if (current.subtype === 'cybertruck') currentWidth = 200;
                if (current.subtype === 'box') currentWidth = 40;
                
                if (next.subtype === 'car') nextWidth = 180;
                if (next.subtype === 'cybertruck') nextWidth = 200;
                if (next.subtype === 'box') nextWidth = 40;
                
                // Check if there's enough space between obstacles
                const distance = next.position - current.position;
                const minSafeDistance = currentWidth + 20; // width of current + safe margin
                
                if (distance < minSafeDistance) {
                    console.warn(`Potential obstacle overlap in level ${levelIndex + 1} "${level.name}": ` +
                        `${current.subtype} (id: ${current.id}) at position ${current.position} ` +
                        `may overlap with ${next.subtype} (id: ${next.id}) at position ${next.position}. ` + 
                        `Consider increasing distance to at least ${minSafeDistance} pixels.`);
                }
            }
        }
    }
    
    // Add level navigation methods
    goToNextLevel() {
        if (!this.levelManager) return;
        
        const allLevels = this.levelManager.getAllLevels();
        const nextLevelIndex = (this.levelManager.currentLevel + 1) % allLevels.length;
        
        console.log(`Navigating to next level: ${nextLevelIndex + 1}`);
        const levelData = this.levelManager.loadLevel(nextLevelIndex);
        
        // Update level display
        if (this.levelDisplay) {
            this.levelDisplay.textContent = levelData.name;
        }
        
        // Show level announcement
        this.showLevelAnnouncement(levelData.name);
        
        // Play level change sound
        this.soundManager.playSound('powerUp', 0.5);
    }
    
    goToPreviousLevel() {
        if (!this.levelManager) return;
        
        const allLevels = this.levelManager.getAllLevels();
        const prevLevelIndex = (this.levelManager.currentLevel - 1 + allLevels.length) % allLevels.length;
        
        console.log(`Navigating to previous level: ${prevLevelIndex + 1}`);
        const levelData = this.levelManager.loadLevel(prevLevelIndex);
        
        // Update level display
        if (this.levelDisplay) {
            this.levelDisplay.textContent = levelData.name;
        }
        
        // Show level announcement
        this.showLevelAnnouncement(levelData.name);
        
        // Play level change sound
        this.soundManager.playSound('powerUp', 0.5);
    }
    
    // Draw UI elements on the canvas
    drawUI() {
        // Only draw UI if game is started
        if (!this.gameStarted) return;
        
        const ctx = this.ctx;
        
        // Set text properties
        ctx.font = '16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        
        // Draw score
        ctx.fillText(`Score: ${this.score}`, 20, 30);
    }

    showMissionComplete() {
        this.gameStarted = false;
        this.missionCompleteScore.textContent = this.score;
        this.missionCompleteScreen.style.display = 'block';
        
        // Ensure the title is "MISSION COMPLETE"
        const missionTitle = this.missionCompleteScreen.querySelector('h1');
        missionTitle.textContent = "MISSION COMPLETE";
        
        // Reset name input
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
        this.updateNameDisplay();
        this.nameChars[0].classList.add('active');
        
        // Hide restart instruction until score is saved
        const restartInstruction = document.getElementById('mission-complete-instruction');
        restartInstruction.style.display = 'none';
        
        // Play victory sound
        this.soundManager.stopBackgroundMusic();
        this.soundManager.playSound('powerUp', 0.7);
    }

    handleNameInput(key) {
        // Only handle input if we're on the mission complete screen
        if (this.missionCompleteScreen.style.display !== 'block') return;

        // Handle Enter key to save score
        if (key === 'Enter') {
            // Check if at least one character has been entered
            const hasEnteredName = this.playerName.some(char => char !== '_');
            if (hasEnteredName) {
                this.saveScore();
            }
            return;
        }

        // Handle backspace
        if (key === 'Backspace') {
            // Remove active class from current position
            this.nameChars[this.currentNameIndex].classList.remove('active');
            
            // Find the rightmost non-underscore character
            let lastCharIndex = this.playerName.length - 1;
            while (lastCharIndex >= 0 && this.playerName[lastCharIndex] === '_') {
                lastCharIndex--;
            }
            
            // If we found a character to delete
            if (lastCharIndex >= 0) {
                this.playerName[lastCharIndex] = '_';
                this.currentNameIndex = lastCharIndex;
            } else {
                this.currentNameIndex = 0;
            }
            
            // Add active class to new position
            this.nameChars[this.currentNameIndex].classList.add('active');
            this.updateNameDisplay();
            return;
        }

        // Only allow letters and numbers
        if (!/^[A-Za-z0-9]$/.test(key)) return;

        // Update current character
        if (this.currentNameIndex < 6) {
            this.playerName[this.currentNameIndex] = key.toUpperCase();
            this.nameChars[this.currentNameIndex].classList.remove('active');
            
            if (this.currentNameIndex < 5) {
                this.currentNameIndex++;
                this.nameChars[this.currentNameIndex].classList.add('active');
            }
            
            this.updateNameDisplay();
        }
    }

    updateNameDisplay() {
        this.nameChars.forEach((char, index) => {
            char.textContent = this.playerName[index];
        });
    }

    // New method to save score to the database
    saveScore() {
        // Get player name from input
        const playerName = this.playerName.join('').replace(/_/g, '');
        
        // Prepare score data
        const scoreData = {
            gameId: 'robohorse-v1',
            playerId: playerName,
            score: this.score
        };
        
        // Save score to database
        fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save score');
            }
            return response.json();
        })
        .then(data => {
            console.log('Score saved successfully:', data);
            
            // Show restart instruction after score is saved
            const restartInstruction = document.getElementById('mission-complete-instruction');
            restartInstruction.style.display = 'block';
        })
        .catch(error => {
            console.error('Error saving score:', error);
            
            // Show restart instruction even if there was an error
            const restartInstruction = document.getElementById('mission-complete-instruction');
            restartInstruction.style.display = 'block';
        });
    }
}

export default Game; 