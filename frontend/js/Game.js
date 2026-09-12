import { updateWorld } from './managers/WorldSimulation.js';
import { renderWorld } from './components/WorldRenderer.js';
import SessionState from './managers/SessionState.ts';
import CombatSystem from './managers/CombatSystem.ts';
import Hud from './components/Hud.ts';
import ScoreService from './services/ScoreService.ts';
import FixedStepClock from './managers/FixedStepClock.ts';
import Player from './entities/Player.js';
import Enemy from './entities/Enemy.js';
import Background from './components/Background.js';
import LevelManager from './levels/LevelManager.js';
import SoundManager from './managers/SoundManager.js';
import InputManager from './managers/InputManager.js';
import EffectsManager from './managers/EffectsManager.ts';
import { isColliding } from './utils/helpers.ts';

class Game {
    get gameStarted() { return this.session.started; }
    set gameStarted(value) { this.session.started = value; }
    get gameOver() { return this.session.over; }
    set gameOver(value) { this.session.over = value; }
    get isPaused() { return this.session.paused; }
    set isPaused(value) { this.session.paused = value; }

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.session = new SessionState();

        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.frameCount = 0;
        this.lastSpawnTime = 0;
        this.gameSpeed = 1;
        this.lastPoliceRadioTime = 0;
        
        // Scores data
        this.scoreService = new ScoreService(`${import.meta.env.BASE_URL}api/scores`);
        this.scores = [];
        this.scoresLoaded = false;
        this.scoresError = null;
        
        // Initialize managers
        this.soundManager = new SoundManager(this);
        this.inputManager = new InputManager(this);
        this.effectsManager = new EffectsManager(this);
        this.combat = new CombatSystem(this);
        
        // Frame rate control - simplified
        this.clock = new FixedStepClock();
        this.animationFrameId = null;
        
        // Mushroom power-up duration
        this.mushroomPowerDuration = 600; // 10 seconds at 60fps
        this.mushroomPowerTimer = 0;
        
        this.hud = new Hud();

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
        this.enterKeyButton = document.getElementById('enter-key');
        this.soundToggle = document.getElementById('sound-toggle');
        this.helpToggle = document.getElementById('help-toggle');
        
        // Scoreboard elements
        this.scoreboardOverlay = document.getElementById('scoreboard-overlay');
        this.viewScoreboard = document.getElementById('view-scoreboard');
        this.closeScoreboard = document.getElementById('close-scoreboard');
        
        // Name input state
        this.nameInputSection = document.getElementById('name-input-section');
        this.nameChars = Array.from(document.querySelectorAll('.name-char'));
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
        
        // Game Over name input state
        this.gameOverNameInputSection = document.getElementById('game-over-name-input-section');
        this.gameOverNameChars = Array.from(document.querySelectorAll('.game-over-name-char'));
        this.gameOverCurrentNameIndex = 0;
        this.gameOverPlayerName = ['_', '_', '_', '_', '_', '_'];
        
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
            blasterLeg: 'audio/blaster_shots.mp3',
            // Other sounds
            powerUp: 'audio/power_up.mp3',
            victory: 'audio/power_up.mp3', // Use power_up sound for victory until we have a dedicated one
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
        
        // Add a lastKeyTime property to track when the last key was pressed
        this.lastKeyTime = 0;
        this.keyDebounceTime = 100; // 100ms debounce time
        
        // Start screen toggle timer
        
        // Bind the animate method to this instance
        this.animate = this.animate.bind(this);
        
        // Pre-fetch scores
        this.fetchScores();
    }
    
    fetchScores() {
        console.log("Pre-fetching scores on app load");
        this.scoreService.list()
            .then(data => {
                this.scores = data;
                this.scoresLoaded = true;
                this.scoresError = null;
                console.log("Scores pre-fetched successfully:", data.length);
            })
            .catch(error => {
                console.error('Error pre-fetching scores:', error);
                this.scoresError = error.message;
            });
    }
    
    toggleSound() {
        this.soundManager.toggleSound();
    }
    
    togglePause() {
        if (!this.gameStarted || this.gameOver) return;
        this.isPaused = !this.isPaused;
        this.inputManager.keys = {};
        document.getElementById('pause-screen').hidden = !this.isPaused;
        document.getElementById('controls-screen').hidden = true;
        this.helpToggle.setAttribute('aria-label', this.isPaused ? 'Resume game' : 'Pause game');
        this.helpToggle.textContent = this.isPaused ? '▶ Resume' : 'Ⅱ Pause';
        if (this.isPaused) document.getElementById('resume-game').focus();
        else {
            document.activeElement?.blur();
            this.clock.reset();
            this.startLoop();
        }
    }
    

    playSound(soundKey, volume = 0.5) {
        this.soundManager.playSound(soundKey, volume);
    }
    
    bindEventListeners() {
        if (this.listenersBound) return;
        this.listenersBound = true;
        this.inputManager.bindEventListeners();
        
        // Delegate score buttons so Alpine rendering cannot discard their listeners.
        document.addEventListener('click', event => {
            const button = event.target.closest('#enter-key, #game-over-enter-key');
            if (!button) return;
            if (button.id === 'enter-key' && this.missionCompleteScreen.style.display === 'block' && this.playerName.some(char => char !== '_')) this.saveScore();
            if (button.id === 'game-over-enter-key' && this.gameOverScreen.style.display === 'block' && this.gameOverPlayerName.some(char => char !== '_')) this.saveGameOverScore();
        });

        document.getElementById('menu-leaderboard').addEventListener('click', () => this.showScoreboard());
        document.getElementById('resume-game').addEventListener('click', () => this.togglePause());
        document.getElementById('pause-restart').addEventListener('click', () => { this.resetGame(); this.startGame(); });
        document.querySelectorAll('[data-controls]').forEach(button => button.addEventListener('click', () => {
            this.controlsOpener = button;
            document.getElementById('controls-screen').hidden = false;
            document.getElementById('close-controls').focus();
        }));
        document.getElementById('close-controls').addEventListener('click', () => this.closeControls());

        // Scoreboard event listeners
        this.viewScoreboard.addEventListener('click', () => {
            this.showScoreboard();
        });
        
        this.closeScoreboard.addEventListener('click', () => {
            this.hideScoreboard();
        });
    }
    
    startGame() {
        this.isPaused = false;
        document.getElementById('pause-screen').hidden = true;
        document.getElementById('controls-screen').hidden = true;
        document.activeElement?.blur();
        this.helpToggle.disabled = false;
        this.helpToggle.textContent = 'Ⅱ Pause';
        this.helpToggle.setAttribute('aria-label', 'Pause game');
        this.gameStarted = true;
        this.gameOver = false;
        this.startScreen.style.display = 'none';
        
        // Always hide scoreboard when starting the game
        this.hideScoreboard();
        
        // Play background music if sound is enabled
        this.soundManager.playBackgroundMusic();
        
        // Show level announcement when game starts
        const levelData = this.levelManager.getLevelData(this.levelManager.currentLevel);
        this.showLevelAnnouncement(levelData.name);
        
        // Reset police radio timing when starting the game
        this.lastPoliceRadioTime = performance.now();
        
        this.startLoop();
    }
    
    resetGame() {
        this.session.reset();
        this.runId = (this.runId || 0) + 1;
        for (const id of ['restart-instruction-status', 'mission-complete-instruction-status']) document.getElementById(id).textContent = '';
        // Reset game state
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.frameCount = 0;
        this.lastSpawnTime = 0;
        this.gameSpeed = 1;
        this.mushroomPowerTimer = 0;
        
        
        // Make sure start screen is visible initially
        this.startScreen.style.display = 'block';
        this.hideScoreboard();
        
        
        // Reset player using the reset method
        this.player.reset();
        
        // Clear game entities
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.specialTokens = [];
        this.obstacles = [];
        this.particles = [];
        this.platforms = [];
        
        // Reset level manager
        this.levelManager.resetToFirstLevel();
        
        // Update level display
        const currentLevel = this.levelManager.getCurrentLevel();
        if (this.levelDisplay && currentLevel) {
            this.levelDisplay.textContent = currentLevel.name;
        }
        
        // Reset UI
        this.updateHealthDisplay();
        this.scoreDisplay.textContent = '0';
        if (this.weaponDisplay) {
            this.weaponDisplay.textContent = this.player.currentWeapon.name;
        }
        if (this.specialTokensDisplay) {
            this.specialTokensDisplay.textContent = this.player.specialAbilityTokens;
        }
        
        // Hide game over and mission complete screens
        this.gameOverScreen.style.display = 'none';
        this.missionCompleteScreen.style.display = 'none';
        
        // Show start screen
        this.startScreen.style.display = 'block';
        
        // Reset name input for mission complete
        this.nameChars.forEach(char => char.classList.remove('active'));
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
        
        // Reset name input for game over
        this.gameOverNameChars.forEach(char => char.classList.remove('active'));
        this.gameOverCurrentNameIndex = 0;
        this.gameOverPlayerName = ['_', '_', '_', '_', '_', '_'];
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Generate terrain
        this.generateTerrain();
        
        // Start animation loop
        this.clock.reset();
        this.startLoop();
    }
    
    endGame() {
        this.helpToggle.disabled = true;
        this.gameOver = true;
        this.gameStarted = false;
        
        // Update final score display
        this.finalScoreDisplay.textContent = this.score;
        
        // Show game over screen
        this.gameOverScreen.style.display = 'block';

        // Skip name entry if score is 0
        if (this.score === 0) {
            // Hide name input section
            if (this.gameOverNameInputSection) {
                this.gameOverNameInputSection.style.display = 'none';
            }
            
            // Hide enter key button
            const gameOverEnterKey = document.getElementById('game-over-enter-key');
            if (gameOverEnterKey) {
                gameOverEnterKey.style.display = 'none';
            }

            // Show restart instruction and view scoreboard immediately
            const restartInstruction = document.getElementById('restart-instruction');
            if (restartInstruction) {
                restartInstruction.style.display = 'block';
                restartInstruction.innerHTML = 'Play again <small>SPACE</small>';
            }

            const viewScoreboard = document.getElementById('view-scoreboard');
            if (viewScoreboard) {
                viewScoreboard.style.display = 'block';
            }
        } else {
            // Make sure the name input section is visible first
            if (this.gameOverNameInputSection) {
                this.gameOverNameInputSection.style.display = 'block';
            }
            
            // Re-initialize game over name input elements for non-zero scores
            // Make sure the elements exist
            this.gameOverNameChars = Array.from(document.querySelectorAll('.game-over-name-char'));
            
            // If no characters found, wait briefly and try again (Alpine.js might need time to render)
            if (this.gameOverNameChars.length === 0) {
                setTimeout(() => {
                    this.gameOverNameChars = Array.from(document.querySelectorAll('.game-over-name-char'));
                    this.gameOverCurrentNameIndex = 0;
                    this.gameOverPlayerName = ['_', '_', '_', '_', '_', '_'];
                    this.updateNameDisplay(false);
                }, 100);
            } else {
                this.gameOverCurrentNameIndex = 0;
                this.gameOverPlayerName = ['_', '_', '_', '_', '_', '_'];
                
                // Update the name display to show the cursor on the first character
                this.updateNameDisplay(false);
            }
            
            // Ensure the name input section is visible
            const nameInputContainer = document.querySelector('.name-input-container');
            if (nameInputContainer) {
                nameInputContainer.style.display = 'flex';
            }
            
            // Show enter key button
            const gameOverEnterKey = document.getElementById('game-over-enter-key');
            if (gameOverEnterKey) {
                gameOverEnterKey.style.display = 'flex';
            }
            
            // Keep retry and leaderboard available independently of saving.
            const restartInstruction = document.getElementById('restart-instruction');
            if (restartInstruction) {
                restartInstruction.style.display = 'block';
                restartInstruction.innerHTML = 'Play again <small>SPACE</small>';
            }
            
            const viewScoreboard = document.getElementById('view-scoreboard');
            if (viewScoreboard) {
                viewScoreboard.style.display = 'block';
            }
            
            // Force a refresh of the Alpine.js component if it exists
            if (this.gameOverNameInputSection && this.gameOverNameInputSection.__x) {
                try {
                    this.gameOverNameInputSection.__x.$data.name = ['_', '_', '_', '_', '_', '_'];
                    this.gameOverNameInputSection.__x.$data.currentIndex = 0;
                } catch (error) {
                    console.error('Error updating Alpine.js state:', error);
                }
            }
        }
        
        // Stop background music and play death sound
        this.soundManager.stopBackgroundMusic();
        this.soundManager.playSound('horseScream', 0.7);
    }
    
    update(timeScale) {
        updateWorld(this, timeScale);
    }

    draw() {
        renderWorld(this);
    }

    startLoop() {
        if (this.animationFrameId !== null) return;
        this.clock.reset();
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    animate(timestamp) {
        this.animationFrameId = null;
        this.clock.advance(timestamp, () => {
            if (this.session.canSimulate && !document.hidden) {
                this.update(1);
            }
        });
        this.draw();
        if (!this.gameOver || this.isPaused) {
            this.animationFrameId = requestAnimationFrame(this.animate);
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
        
        this.hud.render(this.hudState());
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
    hudState() {
        return {
            score: this.score,
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            weapon: this.player.currentWeapon.name,
            tokens: this.player.specialAbilityTokens,
            playing: this.gameStarted,
        };
    }

    drawUI() {
        this.hud.render(this.hudState());
    }

    showMissionComplete() {
        this.helpToggle.disabled = true;
        this.session.finish();
        this.gameStarted = false;
        this.gameOver = false;  // This is a mission complete, not a game over
        
        // Update score display
        this.missionCompleteScore.textContent = this.score;
        
        // Show mission complete screen
        this.missionCompleteScreen.style.display = 'block';
        
        // Ensure the title is "MISSION COMPLETE"
        const missionTitle = this.missionCompleteScreen.querySelector('h1');
        missionTitle.textContent = "MISSION COMPLETE";
        
        // Initialize name input
        this.nameChars = Array.from(document.querySelectorAll('.name-char'));
        this.currentNameIndex = 0;
        this.playerName = ['_', '_', '_', '_', '_', '_'];
        this.updateNameDisplay(true);
        
        // Show name input section
        if (this.nameInputSection) {
            this.nameInputSection.style.display = 'block';
        }
        
        if (this.enterKeyButton) {
            this.enterKeyButton.style.display = 'flex';
        }
        
        // Retrying never requires score submission.
        const missionCompleteInstruction = document.getElementById('mission-complete-instruction');
        if (missionCompleteInstruction) {
            missionCompleteInstruction.style.display = 'block';
            missionCompleteInstruction.innerHTML = 'Play again <small>SPACE</small>';
        }
        
        // Stop background music and play victory sound
        this.soundManager.stopBackgroundMusic();
        this.soundManager.playSound('victory', 0.7);
    }

    handleNameInput(key) {
        // Only handle input if we're on the mission complete or game over screen
        const onMissionComplete = this.missionCompleteScreen.style.display === 'block';
        const onGameOver = this.gameOverScreen.style.display === 'block';
        
        if (!onMissionComplete && !onGameOver) return;
        
        // Debounce mechanism to prevent double input
        const currentTime = Date.now();
        if (currentTime - this.lastKeyTime < this.keyDebounceTime) {
            return; // Ignore this key press if it's too soon after the last one
        }
        this.lastKeyTime = currentTime;
        
        // Determine which set of variables to use based on the current screen
        const nameChars = onMissionComplete ? this.nameChars : this.gameOverNameChars;
        const playerName = onMissionComplete ? this.playerName : this.gameOverPlayerName;
        let currentNameIndex = onMissionComplete ? this.currentNameIndex : this.gameOverCurrentNameIndex;
        
        // Handle backspace
        if (key === 'Backspace') {
            if (currentNameIndex > 0) {
                currentNameIndex--;
                playerName[currentNameIndex] = '_';
            }
        } 
        // Handle letters, numbers, and space
        else if (/^[a-zA-Z0-9 ]$/.test(key) && currentNameIndex < 6) {
            playerName[currentNameIndex] = key.toUpperCase();
            currentNameIndex = Math.min(currentNameIndex + 1, 5);
        }
        
        // Update the current index based on which screen we're on
        if (onMissionComplete) {
            this.currentNameIndex = currentNameIndex;
            
            // Also update Alpine.js state if it exists
            try {
                const nameInputSection = document.getElementById('name-input-section');
                if (nameInputSection && nameInputSection.__x) {
                    nameInputSection.__x.$data.name = [...playerName];
                    nameInputSection.__x.$data.currentIndex = currentNameIndex;
                }
            } catch (error) {
                console.error('Error updating Alpine.js state:', error);
            }
        } else {
            this.gameOverCurrentNameIndex = currentNameIndex;
            
            // Also update Alpine.js state if it exists
            try {
                const gameOverNameInputSection = document.getElementById('game-over-name-input-section');
                if (gameOverNameInputSection && gameOverNameInputSection.__x) {
                    gameOverNameInputSection.__x.$data.name = [...playerName];
                    gameOverNameInputSection.__x.$data.currentIndex = currentNameIndex;
                }
            } catch (error) {
                console.error('Error updating Alpine.js state:', error);
            }
        }
        
        // Update the display
        this.updateNameDisplay(onMissionComplete);
    }

    updateNameDisplay(isMissionComplete = true) {
        const nameChars = isMissionComplete ? this.nameChars : this.gameOverNameChars;
        const playerName = isMissionComplete ? this.playerName : this.gameOverPlayerName;
        const currentNameIndex = isMissionComplete ? this.currentNameIndex : this.gameOverCurrentNameIndex;
        
        // Check if nameChars is defined and has elements
        if (!nameChars || nameChars.length === 0) {
            console.warn(`Name characters not found for ${isMissionComplete ? 'mission complete' : 'game over'} screen`);
            
            // Try to requery elements
            if (isMissionComplete) {
                this.nameChars = Array.from(document.querySelectorAll('.name-char'));
            } else {
                this.gameOverNameChars = Array.from(document.querySelectorAll('.game-over-name-char'));
            }
            
            // If still no elements, log error and return
            if ((isMissionComplete && this.nameChars.length === 0) || 
                (!isMissionComplete && this.gameOverNameChars.length === 0)) {
                console.error(`Unable to find name character elements for ${isMissionComplete ? 'mission complete' : 'game over'} screen`);
                return;
            }
        }
        
        // Get the latest elements
        const updatedNameChars = isMissionComplete ? this.nameChars : this.gameOverNameChars;
        
        // Update each character display
        updatedNameChars.forEach((charElement, index) => {
            if (!charElement) {
                console.warn(`Character element at index ${index} is undefined`);
                return;
            }
            
            try {
                charElement.textContent = playerName[index];
                charElement.classList.toggle('active', index === currentNameIndex);
                
                // Ensure visibility
                charElement.style.display = 'inline-flex';
                charElement.style.visibility = 'visible';
            } catch (error) {
                console.error(`Error updating character element at index ${index}:`, error);
            }
        });
        
        // Update Alpine.js state if it exists
        try {
            const section = isMissionComplete ? 
                document.getElementById('name-input-section') : 
                document.getElementById('game-over-name-input-section');
                
            if (section && section.__x) {
                section.__x.$data.name = [...playerName];
                section.__x.$data.currentIndex = currentNameIndex;
            }
        } catch (error) {
            console.error('Error updating Alpine.js state:', error);
        }
    }

    // New method to save score to the database
    saveScore() {
        const runId = this.runId;
        document.getElementById('mission-complete-instruction-status').textContent = 'Saving score…';
        // Try to get the name from Alpine.js first, then fall back to our internal state
        let playerName;
        try {
            const nameInputSection = document.getElementById('name-input-section');
            if (nameInputSection && nameInputSection.__x) {
                playerName = nameInputSection.__x.$data.name.join('').replace(/_/g, ' ').trim();
            } else {
                playerName = this.playerName.join('').replace(/_/g, ' ').trim();
            }
        } catch (error) {
            console.error('Error accessing Alpine.js state:', error);
            playerName = this.playerName.join('').replace(/_/g, ' ').trim();
        }
        
        // Use a valid short fallback when no name was entered
        const finalName = playerName || 'ANON';
        
        console.log(`Saving score for ${finalName}: ${this.score}`);
        
        // Hide name input section and show loading message
        if (this.nameInputSection) {
            this.nameInputSection.style.display = 'none';
        }
        
        // Make API call to save the score
        this.scoreService.save({ name: finalName, score: this.score })
        .then(data => {
            if (this.runId !== runId) return;
            document.getElementById('mission-complete-instruction-status').textContent = 'Score saved.';
            console.log('Score saved successfully:', data);
            
            // Refresh scores after saving
            this.fetchScores();
            
            // Show success message
            const missionCompleteInstruction = document.getElementById('mission-complete-instruction');
            if (missionCompleteInstruction) {
                missionCompleteInstruction.style.display = 'block';
            }
        })
        .catch(error => {
            if (this.runId !== runId) return;
            console.error('Error saving score:', error);
            
            // Show error message
            const missionCompleteInstruction = document.getElementById('mission-complete-instruction');
            if (missionCompleteInstruction) {
                document.getElementById('mission-complete-instruction-status').textContent = 'Error saving score. Try saving again.';
                missionCompleteInstruction.style.display = 'block';
            }
            
            // Show name input section again in case of error
            if (this.nameInputSection) {
                this.nameInputSection.style.display = 'block';
            }
        });
    }

    saveGameOverScore() {
        const runId = this.runId;
        document.getElementById('restart-instruction-status').textContent = 'Saving score…';
        // Try to get the name from Alpine.js first, then fall back to our internal state
        let playerName;
        try {
            const gameOverNameInputSection = document.getElementById('game-over-name-input-section');
            if (gameOverNameInputSection && gameOverNameInputSection.__x) {
                playerName = gameOverNameInputSection.__x.$data.name.join('').replace(/_/g, ' ').trim();
            } else {
                // Use the gameOverPlayerName array instead of gameOverName
                playerName = this.gameOverPlayerName.join('').replace(/_/g, ' ').trim();
            }
        } catch (error) {
            console.error('Error accessing Alpine.js state:', error);
            // Use the gameOverPlayerName array instead of gameOverName
            playerName = this.gameOverPlayerName.join('').replace(/_/g, ' ').trim();
        }
        
        // Use a valid short fallback when no name was entered
        const finalName = playerName || 'ANON';
        
        console.log(`Saving game over score for ${finalName}: ${this.score}`);
        
        // Hide name input section before making the API call
        if (this.gameOverNameInputSection) {
            this.gameOverNameInputSection.style.display = 'none';
        }
        
        // Make API call to save the score
        this.scoreService.save({ name: finalName, score: this.score })
        .then(data => {
            if (this.runId !== runId) return;
            document.getElementById('restart-instruction-status').textContent = 'Score saved.';
            console.log('Game over score saved successfully:', data);
            
            // Refresh scores after saving
            this.fetchScores();
            
            // Show success message
            const restartInstruction = document.getElementById('restart-instruction');
            if (restartInstruction) {
                restartInstruction.style.display = 'block';
            }
            
            // Show view scoreboard button
            const viewScoreboard = document.getElementById('view-scoreboard');
            if (viewScoreboard) {
                viewScoreboard.style.display = 'block';
            }
        })
        .catch(error => {
            if (this.runId !== runId) return;
            console.error('Error saving game over score:', error);
            
            // Show error message
            const restartInstruction = document.getElementById('restart-instruction');
            if (restartInstruction) {
                document.getElementById('restart-instruction-status').textContent = 'Error saving score. Try saving again.';
                restartInstruction.style.display = 'block';
            }
            
            // Show view scoreboard button
            const viewScoreboard = document.getElementById('view-scoreboard');
            if (viewScoreboard) {
                viewScoreboard.style.display = 'block';
            }
            
            // Show name input section again in case of error
            if (this.gameOverNameInputSection) {
                this.gameOverNameInputSection.style.display = 'block';
            }
        });
    }

    showScoreboard() {
        // Show the scoreboard overlay
        this.scoreboardOverlay.style.display = 'flex';
        
        this.closeScoreboard.style.display = 'block';
        this.closeScoreboard.focus();

        // Get the scoreboard body element
        const scoreboardBody = document.querySelector('.scoreboard-body');
        
        // If scores are already loaded, display them
        if (this.scoresLoaded) {
            this.displayScores(this.scores, scoreboardBody);
        } 
        // If there was an error loading scores, show error message
        else if (this.scoresError) {
            scoreboardBody.innerHTML = `<div class="empty-message">Failed to load scores: ${this.scoresError}</div>`;
            
            // Try fetching scores again
            this.fetchScores();
        }
        // If scores are still loading, show loading indicator and fetch them
        else {
            scoreboardBody.innerHTML = '<div class="loading-spinner"></div>';
            
            // If scores haven't been loaded yet, fetch them now
            if (!this.scoresLoaded) {
                this.scoreService.list()
                    .then(data => {
                        this.scores = data;
                        this.scoresLoaded = true;
                        this.scoresError = null;
                        this.displayScores(data, scoreboardBody);
                    })
                    .catch(error => {
                        console.error('Error fetching scores:', error);
                        scoreboardBody.innerHTML = '<div class="empty-message">Failed to load scores</div>';
                        this.scoresError = error.message;
                    });
            }
        }
    }
    
    // Helper method to display scores in the scoreboard
    displayScores(data, scoreboardBody) {
        // Clear existing entries
        scoreboardBody.innerHTML = '';
        
        // Check if we have scores
        if (data && data.length > 0) {
            // Sort scores by highest first
            data.sort((a, b) => b.score - a.score);
            
            // Display top 10 scores
            const topScores = data.slice(0, 10);
            
            topScores.forEach((scoreData, index) => {
                // Create a new row for each score
                const scoreRow = document.createElement('div');
                scoreRow.className = 'scoreboard-row';
                
                // Create rank element
                const rankElement = document.createElement('div');
                rankElement.className = 'rank';
                rankElement.textContent = (index + 1).toString();
                
                // Create name element
                const nameElement = document.createElement('div');
                nameElement.className = 'name';
                // Use name field from the database
                nameElement.textContent = scoreData.name ? 
                    scoreData.name.substring(0, 6).toUpperCase() : 'UNKNOWN';
                
                // Create score element
                const scoreElement = document.createElement('div');
                scoreElement.className = 'score';
                scoreElement.textContent = scoreData.score.toString();
                
                // Add elements to the row
                scoreRow.appendChild(rankElement);
                scoreRow.appendChild(nameElement);
                scoreRow.appendChild(scoreElement);
                
                // Add row to the scoreboard
                scoreboardBody.appendChild(scoreRow);
            });
        } else {
            // If no scores, show a message
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No scores available yet';
            scoreboardBody.appendChild(emptyMessage);
        }
    }
    
    closeControls() {
        document.getElementById('controls-screen').hidden = true;
        this.controlsOpener?.focus();
    }

    hideScoreboard() {
        const wasOpen = this.scoreboardOverlay.style.display === 'flex';
        this.scoreboardOverlay.style.display = 'none';
        if (wasOpen && !this.gameStarted) document.getElementById(this.gameOver ? 'view-scoreboard' : 'menu-leaderboard').focus();
    }

}

export default Game;
