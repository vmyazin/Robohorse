import Player from './entities/Player.js';
import Enemy from './entities/Enemy.js';
import Background from './components/Background.js';
import LevelManager from './levels/LevelManager.js';
import { isColliding } from './utils/helpers.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.frameCount = 0;
        this.lastSpawnTime = 0;
        this.gameSpeed = 1;
        
        // Damage flash effect
        this.damageFlashActive = false;
        this.damageFlashDuration = 10; // frames
        this.damageFlashCounter = 0;
        
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
        
        // Weapons
        this.weapons = [
            { name: "GLOWING CANNON", color: "#ffffff", damage: 15, fireRate: 15, projectileSpeed: 10, width: 10, height: 10, isGlowing: true },
            { name: "NEURAL BEAM", color: "#00f", damage: 10, fireRate: 10, projectileSpeed: 12, width: 5, height: 2 },
            { name: "TENTACLE SCRAMBLER", color: "#f0f", damage: 20, fireRate: 20, projectileSpeed: 8, width: 8, height: 8 },
            { name: "GALLOP CANNON", color: "#0f0", damage: 30, fireRate: 30, projectileSpeed: 10, width: 10, height: 4 },
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
        
        // Control state
        this.keys = {};
        
        // Sound effects
        this.sounds = {
            levelAnnounce: new Audio('sounds/level_announce.mp3')
        };
        
        // Try to preload sounds, but don't crash if they don't exist
        try {
            this.sounds.levelAnnounce.load();
        } catch (e) {
            console.warn('Could not load sound effects:', e);
        }
        
        // Bind event listeners
        this.bindEventListeners();
    }
    
    bindEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Weapon switching
            if (e.code === 'Space' && this.gameStarted && !this.gameOver) {
                const weaponName = this.player.switchWeapon();
                this.weaponDisplay.textContent = weaponName;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
    }
    
    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.startScreen.style.display = 'none';
        this.animate();
    }
    
    resetGame() {
        this.player = new Player(this.canvas, this.weapons);
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.specialTokens = [];
        this.obstacles = [];
        this.particles = [];
        this.score = 0;
        this.gameSpeed = 1;
        
        // Load first level
        const levelData = this.levelManager.loadLevel(0);
        
        // Update displays
        this.updateHealthDisplay();
        this.scoreDisplay.textContent = this.score;
        this.weaponDisplay.textContent = this.weapons[0].name;
        this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
        if (this.levelDisplay) {
            this.levelDisplay.textContent = levelData.name;
        }
        this.gameOverScreen.style.display = 'none';
        
        // Show level announcement
        this.showLevelAnnouncement(levelData.name);
    }
    
    endGame() {
        this.gameOver = true;
        this.finalScoreDisplay.textContent = this.score;
        this.gameOverScreen.style.display = 'block';
    }
    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        this.frameCount++;
        
        // Update player
        this.player.update(this.keys, this.frameCount, this.createParticles.bind(this));
        
        // Check collision with platforms
        let onPlatform = false;
        this.platforms.forEach(platform => {
            // Skip pillars for collision (they're just visual)
            if (platform.type === 'pillar') return;
            
            // Check if player is above the platform and falling
            const playerBottom = this.player.y + this.player.height;
            const playerRight = this.player.x + this.player.width;
            
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
        });
        
        // If not on any platform, check for ground collision
        if (!onPlatform) {
            // Find the ground segment the player is currently over
            const groundSegments = this.platforms.filter(p => p.type === 'ground');
            let currentGround = null;
            
            for (const segment of groundSegments) {
                if (this.player.x + this.player.width/2 >= segment.x && 
                    this.player.x + this.player.width/2 < segment.x + segment.width) {
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
        if (this.keys['x']) {
            this.player.shoot(this.frameCount, this.projectiles, this.createParticles.bind(this));
        }
        
        // Special ability (stampede mode)
        if (this.keys['c']) {
            if (this.player.specialAbility(this.frameCount, this.projectiles, this.createParticles.bind(this))) {
                // Update special tokens display
                this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
            }
        } else if (this.player.specialAbilityActive) {
            // Continue special ability if it's active, even if key is released
            if (this.player.specialAbility(this.frameCount, this.projectiles, this.createParticles.bind(this))) {
                // Update special tokens display
                this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
            }
        }
        
        // Update level manager
        this.levelManager.update();
        
        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.update();
        });
        
        // Log enemy count and positions occasionally
        if (this.frameCount % 300 === 0) {
            console.log("Current enemies:", this.enemies.length);
            if (this.enemies.length > 0) {
                console.log("Enemy positions:", this.enemies.map(e => `(${Math.round(e.x)},${Math.round(e.y)})`).join(', '));
            }
        }
        
        // Update platforms - move with level scrolling
        this.platforms.forEach(platform => {
            platform.x -= this.levelManager.scrollSpeed * this.gameSpeed;
            
            // If a ground segment moves off-screen, reposition it to the right
            if (platform.type === 'ground' && platform.x + platform.width < 0) {
                // Find the rightmost ground segment
                const rightmostGround = this.platforms
                    .filter(p => p.type === 'ground')
                    .reduce((rightmost, current) => 
                        current.x > rightmost.x ? current : rightmost, 
                        { x: 0 });
                
                // Position this segment after the rightmost one
                platform.x = rightmostGround.x + rightmostGround.width;
                
                // Update the height based on sine wave pattern
                const segmentIndex = Math.floor(platform.x / 100);
                const heightVariation = Math.sin(segmentIndex * 0.5) * 20;
                platform.y = (this.canvas.height - 50) + heightVariation;
                platform.height = 50 - heightVariation;
            }
            
            // If a shelf/pillar moves off-screen, reposition it to the right
            if ((platform.type === 'shelf' || platform.type === 'pillar') && platform.x + platform.width < -200) {
                // Find all shelves
                const shelves = this.platforms.filter(p => p.type === 'shelf');
                
                // Find the rightmost shelf
                const rightmostShelf = shelves.reduce((rightmost, current) => 
                    current.x > rightmost.x ? current : rightmost, 
                    { x: 0 });
                
                if (platform.type === 'shelf') {
                    // Position this shelf after the rightmost one
                    platform.x = rightmostShelf.x + 400;
                    
                    // Vary the height
                    const baseY = this.canvas.height - 50;
                    const shelfIndex = shelves.indexOf(platform);
                    platform.y = baseY - 100 - (shelfIndex % 3) * 50;
                    
                    // Find and update the associated pillar
                    const associatedPillar = this.platforms.find(p => 
                        p.type === 'pillar' && 
                        Math.abs(p.x - (platform.x + 65)) < 20);
                    
                    if (associatedPillar) {
                        associatedPillar.x = platform.x + 65;
                        associatedPillar.y = platform.y + 20;
                        associatedPillar.height = baseY - platform.y - 20;
                    }
                }
            }
        });
        
        // Check collision with obstacles
        this.obstacles.forEach(obstacle => {
            // Check if player is colliding with obstacle
            if (isColliding(this.player, obstacle)) {
                // If player is above the obstacle and falling, place them on top
                if (this.player.y + this.player.height < obstacle.y + obstacle.height / 2 && this.player.velY > 0) {
                    // Store the player's velocity before resetting it (for landing detection)
                    const previousVelY = this.player.velY;
                    
                    // Position player on top of obstacle
                    this.player.y = obstacle.y - this.player.height;
                    this.player.velY = 0;
                    this.player.isJumping = false;
                    
                    // Store reference to the obstacle the player is standing on
                    this.player.standingOnObstacle = obstacle;
                    
                    // Check if player is landing on a box and should smash it
                    const isBoxDestroyed = this.player.checkBoxSmash(this.obstacles, this.createParticles.bind(this));
                    
                    // If box was destroyed, remove it and update score
                    if (isBoxDestroyed) {
                        const index = this.obstacles.indexOf(obstacle);
                        if (index !== -1) {
                            // Check if the box contained a mushroom power-up
                            if (obstacle.type === 'box' && obstacle.containsMushroom) {
                                // Spawn a mushroom power-up
                                this.spawnMushroomPowerUp(obstacle.x, obstacle.y - 20);
                            }
                            
                            this.obstacles.splice(index, 1);
                            this.score += obstacle.points;
                            this.scoreDisplay.textContent = this.score;
                            
                            // Create more particles for destruction effect
                            this.createParticles(
                                obstacle.x + obstacle.width/2, 
                                obstacle.y + obstacle.height/2, 
                                20, 
                                '#a67c52'
                            );
                        }
                    }
                } 
                // Otherwise push player back (horizontal collision)
                else if (this.player.x + this.player.width > obstacle.x && this.player.x < obstacle.x + obstacle.width) {
                    // Coming from left
                    if (this.player.x < obstacle.x) {
                        this.player.x = obstacle.x - this.player.width;
                        
                        // Check if player is being crushed between left edge and obstacle
                        if (this.player.x <= 0) {
                            // Player is crushed between left edge and obstacle - apply damage
                            this.player.health -= 2; // Apply 2 damage per frame when crushed
                            this.updateHealthDisplay();
                            
                            // Create crush effect particles
                            this.createParticles(
                                this.player.x + this.player.width, 
                                this.player.y + this.player.height/2, 
                                3, 
                                '#ff0000'
                            );
                            
                            // Activate damage flash effect
                            this.damageFlashActive = true;
                            this.damageFlashCounter = this.damageFlashDuration;
                            
                            // Deactivate mushroom power-up if active
                            if (this.player.mushroomPowerActive) {
                                this.player.deactivateMushroomPower(this.createParticles.bind(this));
                            }
                            
                            // Check if player died from being crushed
                            if (this.player.health <= 0) {
                                this.endGame();
                            }
                        }
                    } 
                    // Coming from right
                    else {
                        this.player.x = obstacle.x + obstacle.width;
                    }
                }
            } else if (this.player.standingOnObstacle === obstacle) {
                // Check if player is still above the obstacle
                const playerBottom = this.player.y + this.player.height;
                const onObstacle = 
                    this.player.x + this.player.width > obstacle.x && 
                    this.player.x < obstacle.x + obstacle.width &&
                    Math.abs(playerBottom - obstacle.y) < 5; // Small tolerance
                
                if (!onObstacle) {
                    // Player has moved off the obstacle
                    this.player.standingOnObstacle = null;
                }
            }
            
            // Move obstacles with level scrolling (already handled by LevelManager)
            // But we need to move the player if they're standing on an obstacle
            if (this.player.standingOnObstacle === obstacle) {
                // Move player with the obstacle (same amount as level scrolling)
                this.player.x -= this.levelManager.scrollSpeed * this.gameSpeed;
            }
        });
        
        // Update projectiles
        this.projectiles.forEach((proj, index) => {
            proj.x += proj.velX;
            proj.y += proj.velY;
            
            // Remove projectiles that are out of bounds
            if (proj.x < 0 || proj.x > this.canvas.width || proj.y < 0 || proj.y > this.canvas.height) {
                this.projectiles.splice(index, 1);
            }
        });
        
        // Update enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.player, this.frameCount, this.createParticles.bind(this));
            
            // Remove enemies that are off-screen to the left or too far to the right
            if (enemy.x + enemy.width < -100 || enemy.x > this.canvas.width + 300) {
                this.enemies.splice(index, 1);
                console.log("Removed enemy that went off-screen. Remaining:", this.enemies.length);
            }
            
            // Check collisions with player projectiles
            this.projectiles.forEach((proj, projIndex) => {
                if (proj.isPlayerProjectile && isColliding(proj, enemy)) {
                    const isDead = enemy.takeDamage(proj.damage);
                    this.projectiles.splice(projIndex, 1);
                    this.createParticles(proj.x, proj.y, 5, proj.color);
                    
                    if (isDead) {
                        this.enemies.splice(index, 1);
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
                    }
                }
            });
            
            // Check collision with player
            if (isColliding(enemy, this.player)) {
                this.player.health -= 1;
                this.updateHealthDisplay();
                this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 3, '#fff');
                
                // Activate damage flash effect
                this.damageFlashActive = true;
                this.damageFlashCounter = this.damageFlashDuration;
                
                // Deactivate mushroom power-up if active
                if (this.player.mushroomPowerActive) {
                    this.player.deactivateMushroomPower(this.createParticles.bind(this));
                }
                
                if (this.player.health <= 0) {
                    this.endGame();
                }
            }
        });
        
        // Handle enemy projectiles hitting player
        this.projectiles.forEach((proj, index) => {
            if (!proj.isPlayerProjectile && isColliding(proj, this.player)) {
                this.player.health -= proj.damage;
                this.updateHealthDisplay();
                this.projectiles.splice(index, 1);
                this.createParticles(proj.x, proj.y, 10, proj.color);
                
                // Activate damage flash effect
                this.damageFlashActive = true;
                this.damageFlashCounter = this.damageFlashDuration;
                
                // Deactivate mushroom power-up if active
                if (this.player.mushroomPowerActive) {
                    this.player.deactivateMushroomPower(this.createParticles.bind(this));
                }
                
                if (this.player.health <= 0) {
                    this.endGame();
                }
            }
        });
        
        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.y += Math.sin(this.frameCount * 0.1) * 0.5; // Floating effect
            
            if (isColliding(powerUp, this.player)) {
                // Apply power-up effect
                if (powerUp.type === 'health') {
                    this.player.health = Math.min(this.player.health + 30, 100);
                    this.updateHealthDisplay();
                } else if (powerUp.type === 'weapon') {
                    const randomWeaponIndex = Math.floor(Math.random() * this.weapons.length);
                    this.player.currentWeaponIndex = randomWeaponIndex;
                    this.weaponDisplay.textContent = this.weapons[randomWeaponIndex].name;
                } else if (powerUp.type === 'mushroom') {
                    this.player.activateMushroomPower(this.createParticles.bind(this));
                    this.mushroomPowerTimer = 0; // Reset timer when collecting a new mushroom
                }
                
                this.powerUps.splice(index, 1);
                this.createParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 15, powerUp.color);
            }
        });
        
        // Update special tokens
        this.specialTokens.forEach((token, index) => {
            token.y += Math.sin(this.frameCount * 0.1) * 0.5; // Floating effect
            
            if (isColliding(token, this.player)) {
                // Add token to player's count if not at max
                if (this.player.specialAbilityTokens < this.player.maxSpecialAbilityTokens) {
                    this.player.specialAbilityTokens++;
                    this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
                    this.specialTokens.splice(index, 1);
                    this.createParticles(token.x + token.width/2, token.y + token.height/2, 15, token.color);
                }
            }
        });
        
        // Update particles
        this.particles.forEach((particle, index) => {
            particle.x += particle.velX;
            particle.y += particle.velY;
            particle.size -= 0.1;
            
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
        if (this.damageFlashActive) {
            this.damageFlashCounter--;
            if (this.damageFlashCounter <= 0) {
                this.damageFlashActive = false;
            }
        }
        
        // Increase game speed over time
        if (this.frameCount % 1000 === 0) {
            this.gameSpeed += 0.1;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.background.draw(this.ctx, this.frameCount);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            if (platform.type === 'ground') {
                // Draw ground with texture
                const gradient = this.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
                gradient.addColorStop(0, '#555');
                gradient.addColorStop(1, '#333');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add texture lines to ground
                this.ctx.strokeStyle = '#444';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < platform.width; i += 20) {
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
                
                // Add horizontal lines for texture
                this.ctx.strokeStyle = '#777';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < platform.height; i += 15) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(platform.x, platform.y + i);
                    this.ctx.lineTo(platform.x + platform.width, platform.y + i);
                    this.ctx.stroke();
                }
            }
        });
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.draw(this.ctx, this.frameCount);
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw projectiles
        this.projectiles.forEach(proj => {
            if (proj.isGlowing) {
                // Draw glowing cannon ball with gradient and glow effect
                this.ctx.save();
                
                // Create radial gradient for the glowing effect
                const gradient = this.ctx.createRadialGradient(
                    proj.x + proj.width/2, proj.y + proj.height/2, 0,
                    proj.x + proj.width/2, proj.y + proj.height/2, proj.width
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.5, '#cccccc');
                gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
                
                // Add glow effect
                this.ctx.shadowColor = '#ffffff';
                this.ctx.shadowBlur = 10;
                
                // Draw the projectile as a circle
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            } else {
                // Draw regular projectiles
                this.ctx.fillStyle = proj.color;
                this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            }
        });
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            if (powerUp.type === 'health') {
                // Draw a heart for health powerups
                this.ctx.fillStyle = '#ff3366'; // Brighter red heart color
                
                // Save context for transformations
                this.ctx.save();
                
                // Move to the center of the powerup
                this.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
                
                // Add floating animation
                this.ctx.translate(0, Math.sin(this.frameCount * 0.1) * 2);
                
                // Add subtle pulsing effect
                const pulseScale = 1 + Math.sin(this.frameCount * 0.2) * 0.1;
                
                // Scale to appropriate size
                const scale = (powerUp.width / 30) * pulseScale;
                this.ctx.scale(scale, scale);
                
                // Draw heart shape with improved bezier curves
                this.ctx.beginPath();
                this.ctx.moveTo(0, 4);
                this.ctx.bezierCurveTo(-10, -8, -15, -3, -8, -10);
                this.ctx.bezierCurveTo(-5, -13, 0, -12, 0, -8);
                this.ctx.bezierCurveTo(0, -12, 5, -13, 8, -10);
                this.ctx.bezierCurveTo(15, -3, 10, -8, 0, 4);
                this.ctx.fill();
                
                // Add glow effect
                this.ctx.shadowColor = '#ff3366';
                this.ctx.shadowBlur = 15;
                this.ctx.fill();
                
                // Add a subtle white highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(-4, -6, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.shadowBlur = 0;
                this.ctx.restore();
            } else if (powerUp.type === 'mushroom') {
                // Draw a Mario-style mushroom
                this.ctx.save();
                
                // Move to the center of the powerup
                this.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
                
                // Add floating animation
                this.ctx.translate(0, Math.sin(this.frameCount * 0.1) * 2);
                
                // Add subtle pulsing effect
                const pulseScale = 1 + Math.sin(this.frameCount * 0.2) * 0.1;
                
                // Scale to appropriate size
                const scale = (powerUp.width / 30) * pulseScale;
                this.ctx.scale(scale, scale);
                
                // Draw mushroom cap (red with white spots)
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(0, -2, 10, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw white spots on cap
                this.ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const spotX = Math.cos(angle) * 5;
                    const spotY = Math.sin(angle) * 5 - 2;
                    this.ctx.beginPath();
                    this.ctx.arc(spotX, spotY, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Draw mushroom stem
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(-3, -2, 6, 10);
                
                // Add glow effect
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(0, -2, 10, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.shadowBlur = 0;
                this.ctx.restore();
            } else {
                // Draw other powerups as circles
                this.ctx.fillStyle = powerUp.color;
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Make absolutely sure we only draw text for non-health powerups
                if (powerUp.type !== 'health') {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(powerUp.type.toUpperCase(), powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 3);
                }
            }
        });
        
        // Draw special tokens
        this.specialTokens.forEach(token => {
            this.ctx.fillStyle = token.color;
            this.ctx.beginPath();
            this.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw star symbol inside
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '15px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('★', token.x + token.width/2, token.y + token.height/2 + 5);
        });
        
        // Draw player
        this.player.draw(this.ctx, this.frameCount, this.keys);
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx, this.frameCount, this.player);
        });
        
        // Draw damage flash effect
        if (this.damageFlashActive) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageFlashCounter / this.damageFlashDuration * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw special ability status indicator
        if (this.player.specialAbilityActive) {
            // Draw duration bar at the top of the screen
            const barWidth = 200;
            const barHeight = 10;
            const x = (this.canvas.width - barWidth) / 2;
            const y = 20;
            
            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x, y, barWidth, barHeight);
            
            // Duration remaining
            const durationPercentage = 1 - (this.player.specialAbilityDuration / this.player.specialAbilityMaxDuration);
            this.ctx.fillStyle = this.player.specialAbilityTokens > 0 ? '#ffff00' : '#ff00ff';
            this.ctx.fillRect(x, y, barWidth * durationPercentage, barHeight);
            
            // Text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPECIAL ACTIVE', x + barWidth / 2, y + barHeight + 12);
        }
        
        // Draw mushroom power-up timer if active
        if (this.player.mushroomPowerActive && !this.player.isGrowing && !this.player.isShrinking) {
            const timerWidth = 100;
            const timerHeight = 10;
            const timerX = this.player.x + this.player.width/2 - timerWidth/2;
            const timerY = this.player.y - 20;
            
            // Draw timer background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(timerX, timerY, timerWidth, timerHeight);
            
            // Draw timer progress
            const progress = 1 - (this.mushroomPowerTimer / this.mushroomPowerDuration);
            const progressWidth = timerWidth * progress;
            
            // Create gradient for timer
            const gradient = this.ctx.createLinearGradient(timerX, timerY, timerX + progressWidth, timerY);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(1, '#ff6666');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(timerX, timerY, progressWidth, timerHeight);
            
            // Add glow effect to timer
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 5;
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.strokeRect(timerX, timerY, timerWidth, timerHeight);
            this.ctx.shadowBlur = 0;
        }
    }
    
    animate() {
        if (!this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(this.animate.bind(this));
        }
    }
    
    spawnEnemy() {
        // Different types of enemies
        const enemyTypes = [
            { color: '#f00', width: 30, height: 30, speed: 1.5, health: 30, maxHealth: 30, points: 100, tentacles: 6 },  // Scout Squid
            { color: '#a00', width: 40, height: 40, speed: 0.8, health: 60, maxHealth: 60, points: 200, tentacles: 8 },  // Heavy Squid
            { color: '#faa', width: 25, height: 25, speed: 2, health: 20, maxHealth: 20, points: 150, tentacles: 5 },    // Stealth Squid
            { color: '#f55', width: 50, height: 50, speed: 0.5, health: 100, maxHealth: 100, points: 300, tentacles: 10 } // Juggernaut Squid
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
        this.specialTokens.push({
            x,
            y,
            width: 20,
            height: 20,
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
        // Update the health bar width based on player health percentage
        const healthPercent = this.player.health;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthValue.textContent = Math.round(healthPercent);
        
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
        if (!this.levelAnnouncement) return;
        
        // Get the current level number
        const levelNumber = this.levelManager.currentLevel + 1;
        
        // Set the level announcement text
        this.levelAnnouncement.innerHTML = `LEVEL ${levelNumber}<br>${levelName}`;
        
        // Remove any existing classes
        this.levelAnnouncement.classList.remove('active', 'fade-out');
        
        // Force a reflow to ensure the transition works
        void this.levelAnnouncement.offsetWidth;
        
        // Add the active class to slide in
        this.levelAnnouncement.classList.add('active');
        
        // Play sound effect
        try {
            this.sounds.levelAnnounce.currentTime = 0;
            this.sounds.levelAnnounce.play().catch(e => console.warn('Could not play sound:', e));
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
        
        // Set a timeout to fade out after 3 seconds
        setTimeout(() => {
            this.levelAnnouncement.classList.remove('active');
            this.levelAnnouncement.classList.add('fade-out');
        }, 3000);
    }
    
    generateTerrain() {
        // Clear existing platforms
        this.platforms = [];
        
        // Base platform properties
        const baseY = this.canvas.height - 50;
        const segmentWidth = 100;
        const segments = Math.ceil(this.canvas.width / segmentWidth) + 1; // +1 for smooth scrolling
        
        // Generate curved ground segments
        for (let i = 0; i < segments; i++) {
            const x = i * segmentWidth;
            // Create a sine wave pattern for the ground
            const heightVariation = Math.sin(i * 0.5) * 20;
            const y = baseY + heightVariation;
            
            this.platforms.push({
                x: x,
                y: y,
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
}

export default Game; 