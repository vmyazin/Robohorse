import Obstacle from '../entities/Obstacle.js';
import Enemy from '../entities/Enemy.js';
import { isColliding } from '../utils/helpers.js';

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 0;
        this.levelProgress = 0; // Progress through current level (0-1)
        this.levelPosition = 0; // Current position in pixels
        this.levelLength = 5000; // Pixels to travel to complete a level
        this.scrollSpeed = 2; // Base scroll speed
        
        // Level elements that have been spawned
        this.spawnedElements = [];
        
        console.log("LevelManager initialized with levelPosition:", this.levelPosition);
    }
    
    loadLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.levelProgress = 0;
        this.levelPosition = 0; // Reset level position when loading a new level
        this.spawnedElements = [];
        
        // Get level data
        const levelData = this.getLevelData(levelIndex);
        console.log("Loading level:", levelData.name, "with", levelData.elements.length, "elements");
        
        // Clear existing obstacles
        this.game.obstacles = [];
        
        // Clear existing enemies
        if (!this.game.enemies) {
            console.log("Creating enemies array");
            this.game.enemies = [];
        } else {
            console.log("Clearing", this.game.enemies.length, "existing enemies");
            this.game.enemies = [];
        }
        
        // Set up initial level elements
        this.updateLevelElements();
        
        return levelData;
    }
    
    getLevelData(levelIndex) {
        // Get level data from predefined levels
        return LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
    }
    
    update() {
        // Update level position
        this.levelPosition += this.scrollSpeed * this.game.gameSpeed;
        
        // Calculate level progress based on position
        this.levelProgress = this.levelPosition / this.levelLength;
        
        // Log progress occasionally
        if (this.game.frameCount % 100 === 0) {
            console.log("Level progress:", this.levelProgress.toFixed(2), "Position:", this.levelPosition.toFixed(0), "of", this.levelLength);
        }
        
        // Update level elements based on new progress
        this.updateLevelElements();
        
        // Check if we need to load the next level
        if (this.levelPosition >= this.levelLength) {
            console.log("Level complete! Loading next level");
            this.currentLevel = (this.currentLevel + 1) % LEVELS.length;
            const levelData = this.loadLevel(this.currentLevel);
            this.levelPosition = 0;
            
            // Update level display
            if (this.game.levelDisplay) {
                this.game.levelDisplay.textContent = levelData.name;
            }
            
            // Show level announcement
            if (this.game.showLevelAnnouncement) {
                this.game.showLevelAnnouncement(levelData.name);
            }
        }
        
        // Update obstacles
        for (let i = this.game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.game.obstacles[i];
            
            // Move obstacle with level scrolling
            obstacle.x -= this.scrollSpeed * this.game.gameSpeed;
            
            // Update obstacle state
            obstacle.update();
            
            // Remove obstacles that are off-screen
            if (obstacle.x + obstacle.width < 0) {
                this.game.obstacles.splice(i, 1);
                continue;
            }
            
            // Check collisions with player projectiles
            this.game.projectiles.forEach((proj, projIndex) => {
                if (proj.isPlayerProjectile && isColliding(proj, obstacle)) {
                    const isDead = obstacle.takeDamage(proj.damage);
                    this.game.projectiles.splice(projIndex, 1);
                    this.game.createParticles(proj.x, proj.y, 5, proj.color);
                    
                    if (isDead) {
                        // For car and cybertruck, don't remove them if they're exploding
                        if ((obstacle.type === 'car' || obstacle.type === 'cybertruck') && obstacle.isExploding) {
                            // Play explosion sound
                            try {
                                const explosionSound = this.game.sounds.explosion.cloneNode();
                                explosionSound.volume = 0.5;
                                explosionSound.play();
                            } catch (e) {
                                console.warn('Could not play explosion sound:', e);
                            }
                            
                            // Add score for destroying it
                            this.game.score += obstacle.points;
                            this.game.scoreDisplay.textContent = this.game.score;
                        } else {
                            // For non-exploding obstacles, remove immediately
                            this.game.obstacles.splice(i, 1);
                            this.game.score += obstacle.points;
                            this.game.scoreDisplay.textContent = this.game.score;
                            this.game.createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 20, '#a67c52');
                        }
                    }
                }
            });
        }
        
        // We're removing this code that applies level scrolling to enemies
        // since we want them to move independently of the view
        // Enemies will now compensate for scrolling in their own update method
    }
    
    updateLevelElements() {
        const levelData = this.getLevelData(this.currentLevel);
        const currentPosition = this.levelProgress * this.levelLength;
        
        // Log occasionally
        if (this.game.frameCount % 100 === 0) {
            console.log("Checking for elements at position:", currentPosition.toFixed(0));
            console.log("Spawn range:", currentPosition.toFixed(0), "to", (currentPosition + this.game.canvas.width + 200).toFixed(0));
            console.log("Already spawned elements:", this.spawnedElements.length);
        }
        
        // Check for elements that should be spawned
        levelData.elements.forEach(element => {
            // If element is within spawn range and hasn't been spawned yet
            if (element.position > currentPosition && 
                element.position < currentPosition + this.game.canvas.width + 200 && 
                !this.spawnedElements.includes(element.id)) {
                
                console.log("Spawning element:", element.type, element.subtype, "at position", element.position);
                
                // Spawn the element
                this.spawnElement(element);
                this.spawnedElements.push(element.id);
            }
        });
    }
    
    spawnElement(element) {
        // Calculate the x position more accurately to ensure enemies spawn at the right edge of the screen
        // Instead of adding the full element.position, we calculate the relative position from current view
        const relativePosition = element.position - (this.levelProgress * this.levelLength);
        const x = this.game.canvas.width + Math.min(relativePosition, 200); // Cap at 200px beyond right edge
        
        switch (element.type) {
            case 'obstacle':
                const obstacle = new Obstacle(x, 0, element.subtype, this.game.canvas);
                this.game.obstacles.push(obstacle);
                break;
            case 'enemy':
                const enemyTypes = [
                    { color: '#f00', width: 30, height: 30, speed: 1.5, health: 30, maxHealth: 30, points: 100, tentacles: 6 },
                    { color: '#a00', width: 40, height: 40, speed: 0.8, health: 60, maxHealth: 60, points: 200, tentacles: 8 },
                    { color: '#faa', width: 25, height: 25, speed: 2, health: 20, maxHealth: 20, points: 150, tentacles: 5 },
                    { color: '#f55', width: 50, height: 50, speed: 0.5, health: 100, maxHealth: 100, points: 300, tentacles: 10 }
                ];
                
                const typeIndex = Math.min(parseInt(element.subtype) || 0, enemyTypes.length - 1);
                
                // Ensure y position is within the visible area of the canvas
                let y;
                if (element.y !== undefined) {
                    // Use specified y but ensure it's within bounds
                    y = Math.max(50, Math.min(element.y, this.game.canvas.height - 100));
                } else {
                    // Random y position within the top 2/3 of the screen
                    y = Math.random() * (this.game.canvas.height * 0.67);
                }
                
                console.log("Creating enemy:", typeIndex, "at", x, y);
                
                try {
                    // Create the enemy
                    const enemy = new Enemy(x, y, enemyTypes[typeIndex], this.game.canvas);
                    
                    // Ensure the enemies array exists
                    if (!this.game.enemies) {
                        console.error("game.enemies is undefined! Creating new array.");
                        this.game.enemies = [];
                    }
                    
                    // Add the enemy to the game
                    this.game.enemies.push(enemy);
                    console.log("Enemy added successfully. Total enemies:", this.game.enemies.length);
                } catch (error) {
                    console.error("Error creating enemy:", error);
                }
                break;
            // Add more element types as needed
        }
    }
}

// Define levels
const LEVELS = [
    {
        name: "Training Grounds",
        description: "Learn the basics of movement and combat",
        elements: [
            { id: 1, type: "obstacle", subtype: "box", position: 500 },
            { id: 2, type: "obstacle", subtype: "box", position: 800 },
            { id: 3, type: "enemy", subtype: "0", position: 1200, y: 200 },
            { id: 4, type: "obstacle", subtype: "car", position: 1500 },
            { id: 5, type: "enemy", subtype: "0", position: 1800, y: 150 },
            { id: 6, type: "obstacle", subtype: "box", position: 2200 },
            { id: 7, type: "obstacle", subtype: "box", position: 2300 },
            { id: 8, type: "enemy", subtype: "1", position: 2600, y: 100 },
            { id: 9, type: "obstacle", subtype: "cybertruck", position: 3000 },
            { id: 10, type: "enemy", subtype: "0", position: 3500, y: 250 },
            { id: 11, type: "obstacle", subtype: "box", position: 4000 },
            { id: 12, type: "enemy", subtype: "2", position: 4500, y: 180 }
        ]
    },
    {
        name: "Urban Assault",
        description: "Navigate through a city under attack",
        elements: [
            { id: 1, type: "obstacle", subtype: "car", position: 300 },
            { id: 2, type: "obstacle", subtype: "box", position: 500 },
            { id: 3, type: "obstacle", subtype: "box", position: 600 },
            { id: 4, type: "enemy", subtype: "1", position: 800, y: 150 },
            { id: 5, type: "obstacle", subtype: "cybertruck", position: 1000 },
            { id: 6, type: "enemy", subtype: "0", position: 1200, y: 200 },
            { id: 7, type: "enemy", subtype: "0", position: 1300, y: 100 },
            { id: 8, type: "obstacle", subtype: "box", position: 1500 },
            { id: 9, type: "obstacle", subtype: "car", position: 1800 },
            { id: 10, type: "enemy", subtype: "2", position: 2000, y: 180 },
            { id: 11, type: "obstacle", subtype: "box", position: 2200 },
            { id: 12, type: "obstacle", subtype: "box", position: 2300 },
            { id: 13, type: "enemy", subtype: "1", position: 2500, y: 120 },
            { id: 14, type: "obstacle", subtype: "cybertruck", position: 2800 },
            { id: 15, type: "enemy", subtype: "3", position: 3000, y: 150 },
            { id: 16, type: "obstacle", subtype: "box", position: 3200 },
            { id: 17, type: "obstacle", subtype: "car", position: 3500 },
            { id: 18, type: "enemy", subtype: "2", position: 3800, y: 200 },
            { id: 19, type: "obstacle", subtype: "box", position: 4000 },
            { id: 20, type: "enemy", subtype: "3", position: 4500, y: 180 }
        ]
    },
    {
        name: "Cephalopod Stronghold",
        description: "Infiltrate the enemy base",
        elements: [
            { id: 1, type: "enemy", subtype: "1", position: 200, y: 150 },
            { id: 2, type: "obstacle", subtype: "box", position: 400 },
            { id: 3, type: "enemy", subtype: "0", position: 600, y: 200 },
            { id: 4, type: "obstacle", subtype: "cybertruck", position: 800 },
            { id: 5, type: "enemy", subtype: "2", position: 1000, y: 100 },
            { id: 6, type: "enemy", subtype: "1", position: 1200, y: 200 },
            { id: 7, type: "obstacle", subtype: "box", position: 1400 },
            { id: 8, type: "obstacle", subtype: "box", position: 1500 },
            { id: 9, type: "enemy", subtype: "3", position: 1700, y: 150 },
            { id: 10, type: "obstacle", subtype: "car", position: 2000 },
            { id: 11, type: "enemy", subtype: "2", position: 2200, y: 180 },
            { id: 12, type: "enemy", subtype: "2", position: 2300, y: 120 },
            { id: 13, type: "obstacle", subtype: "box", position: 2500 },
            { id: 14, type: "enemy", subtype: "3", position: 2700, y: 150 },
            { id: 15, type: "obstacle", subtype: "cybertruck", position: 3000 },
            { id: 16, type: "enemy", subtype: "3", position: 3200, y: 200 },
            { id: 17, type: "enemy", subtype: "3", position: 3300, y: 100 },
            { id: 18, type: "obstacle", subtype: "box", position: 3500 },
            { id: 19, type: "enemy", subtype: "3", position: 3800, y: 150 },
            { id: 20, type: "obstacle", subtype: "car", position: 4000 },
            { id: 21, type: "enemy", subtype: "3", position: 4200, y: 180 },
            { id: 22, type: "enemy", subtype: "3", position: 4300, y: 120 },
            { id: 23, type: "enemy", subtype: "3", position: 4400, y: 200 },
            { id: 24, type: "enemy", subtype: "3", position: 4500, y: 100 }
        ]
    }
];

export default LevelManager; 