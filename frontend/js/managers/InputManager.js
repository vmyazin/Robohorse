// js/managers/InputManager.js
// Responsible for managing all input-related functionality in the game

class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.isProcessingKey = false; // Flag to track if a key is being processed
        
        // DOM elements for click events
        this.soundToggleElement = document.getElementById('sound-toggle');
        this.helpToggleElement = document.getElementById('help-toggle');
        this.startInstruction = document.getElementById('start-instruction');
        this.restartInstruction = document.getElementById('restart-instruction');
        this.missionCompleteInstruction = document.getElementById('mission-complete-instruction');
    }
    
    bindEventListeners() {
        // Keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Click event listeners
        this.handleClickEvents();
    }
    
    handleKeyDown(e) {
        // Set the key state
        this.keys[e.key] = true;
        
        // Handle name input on mission complete or game over screen
        if (this.game.missionCompleteScreen.style.display === 'block' || this.game.gameOverScreen.style.display === 'block') {
            // Prevent default behavior for letter, number, space, and backspace keys
            if (/^[a-zA-Z0-9 ]$/.test(e.key) || e.key === 'Backspace' || e.key === 'Enter') {
                e.preventDefault();
                
                // Prevent double input by checking if we're already processing a key
                if (this.isProcessingKey) return;
                this.isProcessingKey = true;
                
                // Process the key input
                this.game.handleNameInput(e.key);
                
                // Reset the flag after a short delay
                setTimeout(() => {
                    this.isProcessingKey = false;
                }, 50);
            }
            
            // Handle Enter key to save score
            if (e.key === 'Enter') {
                if (this.game.missionCompleteScreen.style.display === 'block') {
                    // Check if at least one character has been entered
                    const hasEnteredName = this.game.playerName.some(char => char !== '_');
                    if (hasEnteredName) {
                        this.game.saveScore();
                    }
                } else if (this.game.gameOverScreen.style.display === 'block') {
                    // Check if at least one character has been entered
                    const hasEnteredName = this.game.gameOverPlayerName.some(char => char !== '_');
                    if (hasEnteredName) {
                        this.game.saveGameOverScore();
                    }
                }
                return;
            }
            
            // Only allow space to restart if on the appropriate screen
            if (e.code === 'Space') {
                this.game.resetGame();
                this.game.startGame();
            }
            return;
        }
        
        // Enter key for weapon swapping (changed from Space)
        if (e.key === 'Enter') {
            // Switch weapon during gameplay
            if (this.game.gameStarted && !this.game.gameOver) {
                const weaponName = this.game.player.switchWeapon();
                this.game.weaponDisplay.textContent = weaponName;
            }
        }
        
        // Spacebar functionality - now for starting/restarting game and resuming from pause
        if (e.code === 'Space') {
            // Start game if on start screen
            if (!this.game.gameStarted && !this.game.gameOver) {
                this.game.startGame();
            }
            // Resume game if paused
            else if (this.game.isPaused) {
                this.game.togglePause();
            }
            // Restart game if on game over screen
            else if (this.game.gameOver) {
                this.game.resetGame();
                this.game.startGame();
            }
        }
        
        // Level navigation with [ and ] keys
        if (this.game.gameStarted && !this.game.gameOver) {
            if (e.key === '[') {
                this.game.goToPreviousLevel();
            } else if (e.key === ']') {
                this.game.goToNextLevel();
            }
        }
        
        // Sound toggle with Ctrl+S
        if (e.code === 'KeyS' && e.ctrlKey) {
            e.preventDefault(); // Prevent browser save dialog
            this.game.soundManager.toggleSound();
        }
        
        // Easter egg: Ctrl+E triggers Elon Toasty
        if (e.code === 'KeyE' && e.ctrlKey && this.game.gameStarted && !this.game.gameOver) {
            e.preventDefault(); // Prevent browser's default behavior
            this.game.triggerElonToasty();
            console.log("Elon Toasty triggered by keyboard shortcut");
        }

        // Debug shortcut: Ctrl+1 shows mission complete screen
        if (e.code === 'Digit1' && e.ctrlKey && this.game.gameStarted && !this.game.gameOver) {
            e.preventDefault(); // Prevent browser's default behavior
            this.game.showMissionComplete();
            console.log("Mission complete screen triggered by keyboard shortcut");
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    
    handleClickEvents() {
        // Sound toggle button click handler
        if (this.soundToggleElement) {
            this.soundToggleElement.addEventListener('click', () => {
                this.game.soundManager.toggleSound();
            });
        }
        
        // Help toggle button click handler
        if (this.helpToggleElement) {
            this.helpToggleElement.addEventListener('click', () => {
                this.game.togglePause();
            });
        }
        
        // Start instruction click handler
        if (this.startInstruction) {
            this.startInstruction.addEventListener('click', () => {
                if (!this.game.gameStarted && !this.game.gameOver) {
                    this.game.startGame();
                } else if (this.game.isPaused) {
                    this.game.togglePause();
                }
            });
        }
        
        // Restart instruction click handler
        if (this.restartInstruction) {
            this.restartInstruction.addEventListener('click', () => {
                if (this.game.gameOver) {
                    this.game.resetGame();
                    this.game.startGame();
                }
            });
        }
        
        // Mission complete instruction click handler
        if (this.missionCompleteInstruction) {
            this.missionCompleteInstruction.addEventListener('click', () => {
                if (this.missionCompleteInstruction.style.display === 'block') {
                    this.game.resetGame();
                    this.game.startGame();
                }
            });
        }
    }
    
    // Method to check if a key is currently pressed
    isKeyPressed(key) {
        return this.keys[key] === true;
    }
    
    // Method to reset all key states
    resetKeys() {
        this.keys = {};
    }
}

export default InputManager; 