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
        
        // DOM elements
        this.healthDisplay = document.getElementById('health');
        this.scoreDisplay = document.getElementById('score');
        this.weaponDisplay = document.getElementById('weapon');
        this.specialTokensDisplay = document.getElementById('special-tokens');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.levelDisplay = document.getElementById('level');
        
        // Weapons
        this.weapons = [
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
        this.platforms = [
            { x: 0, y: canvas.height - 50, width: canvas.width, height: 50 }
        ];
        
        // Level manager - ensure enemies array is initialized first
        console.log("Initializing level manager with enemies array:", this.enemies);
        this.levelManager = new LevelManager(this);
        
        // Control state
        this.keys = {};
        
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
        this.healthDisplay.textContent = this.player.health;
        this.scoreDisplay.textContent = this.score;
        this.weaponDisplay.textContent = this.weapons[0].name;
        this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
        if (this.levelDisplay) {
            this.levelDisplay.textContent = levelData.name;
        }
        this.gameOverScreen.style.display = 'none';
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
        
        // Log enemy count and positions occasionally
        if (this.frameCount % 300 === 0) {
            console.log("Current enemies:", this.enemies.length);
            if (this.enemies.length > 0) {
                console.log("Enemy positions:", this.enemies.map(e => `(${Math.round(e.x)},${Math.round(e.y)})`).join(', '));
            }
        }
        
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
                this.healthDisplay.textContent = this.player.health;
                this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 3, '#fff');
                
                // Activate damage flash effect
                this.damageFlashActive = true;
                this.damageFlashCounter = this.damageFlashDuration;
                
                if (this.player.health <= 0) {
                    this.endGame();
                }
            }
        });
        
        // Check collision with obstacles
        this.obstacles.forEach(obstacle => {
            // Check if player is colliding with obstacle
            if (isColliding(this.player, obstacle)) {
                // If player is above the obstacle and falling, place them on top
                if (this.player.y + this.player.height < obstacle.y + obstacle.height / 2 && this.player.velY > 0) {
                    this.player.y = obstacle.y - this.player.height;
                    this.player.velY = 0;
                    this.player.isJumping = false;
                    
                    // Store reference to the obstacle the player is standing on
                    this.player.standingOnObstacle = obstacle;
                } 
                // Otherwise push player back (horizontal collision)
                else if (this.player.x + this.player.width > obstacle.x && this.player.x < obstacle.x + obstacle.width) {
                    // Coming from left
                    if (this.player.x < obstacle.x) {
                        this.player.x = obstacle.x - this.player.width;
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
        
        // Handle enemy projectiles hitting player
        this.projectiles.forEach((proj, index) => {
            if (!proj.isPlayerProjectile && isColliding(proj, this.player)) {
                this.player.health -= proj.damage;
                this.healthDisplay.textContent = this.player.health;
                this.projectiles.splice(index, 1);
                this.createParticles(proj.x, proj.y, 10, proj.color);
                
                // Activate damage flash effect
                this.damageFlashActive = true;
                this.damageFlashCounter = this.damageFlashDuration;
                
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
                    this.healthDisplay.textContent = this.player.health;
                } else if (powerUp.type === 'weapon') {
                    const randomWeaponIndex = Math.floor(Math.random() * this.weapons.length);
                    this.player.currentWeaponIndex = randomWeaponIndex;
                    this.weaponDisplay.textContent = this.weapons[randomWeaponIndex].name;
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
        this.background.draw(this.frameCount);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.draw(this.ctx, this.frameCount, this.player);
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
            this.ctx.fillStyle = proj.color;
            this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        });
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(powerUp.type.toUpperCase(), powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 3);
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
        const types = ['health', 'weapon'];
        const type = types[Math.floor(Math.random() * types.length)];
        const color = type === 'health' ? '#0f0' : '#ff0';
        
        this.powerUps.push({
            x,
            y,
            width: 20,
            height: 20,
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
}

export default Game; 