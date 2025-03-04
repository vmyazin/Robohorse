// js/managers/InputManager.js
// Responsible for managing all input-related functionality in the game

class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {};
        
        // DOM elements for click events
        this.soundToggleElement = document.getElementById('sound-toggle');
        this.startInstruction = document.getElementById('start-instruction');
        this.restartInstruction = document.getElementById('restart-instruction');
    }
    
    bindEventListeners() {
        // Keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Click event listeners
        this.handleClickEvents();
    }
    
    handleKeyDown(e) {
        this.keys[e.key] = true;
        
        // Spacebar functionality
        if (e.code === 'Space') {
            // Start game if on start screen
            if (!this.game.gameStarted && !this.game.gameOver) {
                this.game.startGame();
            }
            // Restart game if on game over screen
            else if (this.game.gameOver) {
                this.game.resetGame();
                this.game.startGame();
            }
            // Switch weapon during gameplay
            else if (this.game.gameStarted && !this.game.gameOver) {
                const weaponName = this.game.player.switchWeapon();
                this.game.weaponDisplay.textContent = weaponName;
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
        
        // Start instruction click handler
        if (this.startInstruction) {
            this.startInstruction.addEventListener('click', () => {
                if (!this.game.gameStarted && !this.game.gameOver) {
                    this.game.startGame();
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