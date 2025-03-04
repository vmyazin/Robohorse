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
        
        // Frame rate control - simplified
        this.lastFrameTime = 0;
        
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
            levelAnnounce: new Audio('sounds/level_announce.mp3'),
            explosion: new Audio('audio/explosion.mp3'),
            carHit: new Audio('audio/car_hit.mp3'),
            toasty: new Audio('audio/toasty.mp3')
        };
        
        // Simple Elon Toasty effect
        this.elonToasty = {
            active: false,
            image: new Image(),
            x: canvas.width,
            y: canvas.height - 150,
            width: 150,
            height: 150,
            slideInSpeed: 30,
            slideOutSpeed: 30,
            slideInComplete: false,
            timer: 0,
            displayDuration: 120  // Changed from 8 to 120 (2 seconds at 60fps)
        };
        this.elonToasty.image.src = 'images/elon.png';
        
        // Preload sounds
        try {
            this.sounds.levelAnnounce.load();
            this.sounds.explosion.load();
            this.sounds.carHit.load();
            this.sounds.toasty.load();
        } catch (e) {
            console.warn('Could not load sound effects:', e);
        }
        
        // Bind event listeners
        this.bindEventListeners();
    }
    
    bindEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Spacebar functionality
            if (e.code === 'Space') {
                // Start game if on start screen
                if (!this.gameStarted && !this.gameOver) {
                    this.startGame();
                }
                // Restart game if on game over screen
                else if (this.gameOver) {
                    this.resetGame();
                    this.startGame();
                }
                // Switch weapon during gameplay
                else if (this.gameStarted && !this.gameOver) {
                    const weaponName = this.player.switchWeapon();
                    this.weaponDisplay.textContent = weaponName;
                }
            }
            
            // Easter egg: Ctrl+E triggers Elon Toasty
            if (e.code === 'KeyE' && e.ctrlKey && this.gameStarted && !this.gameOver) {
                e.preventDefault(); // Prevent browser's default behavior
                this.triggerElonToasty();
                console.log("Elon Toasty triggered by keyboard shortcut");
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Add click event listeners for the start and restart instructions
        const startInstruction = document.getElementById('start-instruction');
        if (startInstruction) {
            startInstruction.addEventListener('click', () => {
                if (!this.gameStarted && !this.gameOver) {
                    this.startGame();
                }
            });
        }
        
        const restartInstruction = document.getElementById('restart-instruction');
        if (restartInstruction) {
            restartInstruction.addEventListener('click', () => {
                if (this.gameOver) {
                    this.resetGame();
                    this.startGame();
                }
            });
        }
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
            
            // Check if player is colliding with obstacle
            if (isColliding(this.player, obstacle)) {
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
                            try {
                                const hitSound = this.sounds.carHit.cloneNode();
                                hitSound.volume = 0.3;
                                hitSound.play();
                            } catch (e) {
                                console.warn('Could not play car hit sound:', e);
                            }
                        }
                        
                        // Handle obstacle damage
                        const shouldExplode = obstacle.takeDamage(proj.damage);
                        
                        if (shouldExplode || (obstacle.type === 'box' && obstacle.health <= 0)) {
                            // Play explosion sound for cars/cybertrucks or break sound for boxes
                            try {
                                if (obstacle.type === 'box') {
                                    const breakSound = this.sounds.carHit.cloneNode();
                                    breakSound.volume = 0.5;
                                    breakSound.play();
                                    
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
                                    const explosionSound = this.sounds.explosion.cloneNode();
                                    explosionSound.volume = 0.5;
                                    explosionSound.play();
                                    
                                    // Trigger explosion but don't remove the car yet
                                    // The car will be removed when the explosion animation completes
                                    obstacle.explode();
                                    
                                    // Trigger Elon Toasty easter egg for Cybertruck explosions (10% chance)
                                    if (obstacle.type === 'cybertruck' && Math.random() < 0.1) {
                                        this.triggerElonToasty();
                                    }
                                }
                            } catch (e) {
                                console.warn('Could not play sound:', e);
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
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            proj.x += proj.velX;
            proj.y += proj.velY;
            
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
                this.enemies.splice(i, 1);
                continue;
            }
            
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
            
            // Skip enemies that have been removed
            if (i >= this.enemies.length) continue;
            
            // Check collision with player
            if (isColliding(this.enemies[i], this.player)) {
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
        }
        
        // Handle enemy projectiles hitting player
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Skip player projectiles or those far from the player
            if (proj.isPlayerProjectile || 
                Math.abs(proj.x - this.player.x) > 100 || 
                Math.abs(proj.y - this.player.y) > 100) continue;
            
            if (isColliding(proj, this.player)) {
                this.player.health -= proj.damage;
                this.updateHealthDisplay();
                this.projectiles.splice(i, 1);
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
        }
        
        // Spawn enemies periodically
        if (this.frameCount - this.lastSpawnTime > 300) { // Spawn every 5 seconds at 60fps (was 120 - 2 seconds)
            this.spawnEnemy();
            this.lastSpawnTime = this.frameCount;
        }
        
        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.y += Math.sin(this.frameCount * 0.1) * 0.5; // Floating effect
            
            if (isColliding(powerUp, this.player)) {
                if (powerUp.type === 'health') {
                    this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
                    this.updateHealthDisplay();
                } else if (powerUp.type === 'weapon') {
                    // Cycle to next weapon - fix property name to match Player.js
                    this.player.currentWeaponIndex = (this.player.currentWeaponIndex + 1) % this.weapons.length;
                    this.weaponDisplay.textContent = this.weapons[this.player.currentWeaponIndex].name;
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
        
        // Update particles - limit the number of particles for performance
        const maxParticles = 100; // Limit the maximum number of particles
        if (this.particles.length > maxParticles) {
            this.particles.splice(0, this.particles.length - maxParticles);
        }
        
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
        this.player.health -= 2;
        this.updateHealthDisplay();
        
        this.createParticles(
            this.player.x + this.player.width,
            this.player.y + this.player.height/2,
            3,
            '#ff0000'
        );
        
        this.damageFlashActive = true;
        this.damageFlashCounter = this.damageFlashDuration;
        
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
        this.player.draw(this.ctx, this.frameCount, this.keys);
        
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
        
        // Draw damage flash effect
        if (this.damageFlashActive) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageFlashCounter / this.damageFlashDuration * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw Elon Toasty effect if active
        if (this.elonToasty.active) {
            this.drawElonToasty();
        }
    }
    
    animate(timestamp) {
        if (!this.gameOver) {
            // Update game state
            this.update();
            
            // Draw the game
            this.draw();
            
            // Request the next frame
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
        // Only trigger if not already active
        if (!this.elonToasty.active) {
            this.elonToasty.active = true;
            this.elonToasty.x = this.canvas.width;
            this.elonToasty.slideInComplete = false;
            this.elonToasty.timer = 0;
            
            // Play the toasty sound
            try {
                this.sounds.toasty.currentTime = 0;
                this.sounds.toasty.volume = 0.7;
                this.sounds.toasty.play();
            } catch (e) {
                console.error("Error playing toasty sound:", e);
            }
        }
    }
    
    drawElonToasty() {
        if (!this.elonToasty.slideInComplete) {
            // Slide in from right
            this.elonToasty.x -= this.elonToasty.slideInSpeed;
            
            // Check if slide in is complete
            if (this.elonToasty.x <= this.canvas.width - this.elonToasty.width) {
                this.elonToasty.slideInComplete = true;
                this.elonToasty.timer = 0;
            }
        } else {
            // Wait for a moment
            this.elonToasty.timer++;
            
            // Start sliding out after display duration
            if (this.elonToasty.timer > this.elonToasty.displayDuration) {
                this.elonToasty.x += this.elonToasty.slideOutSpeed;
                
                // Check if completely off screen to deactivate
                if (this.elonToasty.x > this.canvas.width) {
                    this.elonToasty.active = false;
                }
            }
        }
        
        // Draw the image if it's loaded
        if (this.elonToasty.image.complete && this.elonToasty.active) {
            this.ctx.drawImage(
                this.elonToasty.image,
                this.elonToasty.x,
                this.elonToasty.y,
                this.elonToasty.width,
                this.elonToasty.height
            );
        }
    }
}

export default Game; 