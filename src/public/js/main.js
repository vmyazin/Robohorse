import Game from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    // Initialize the game
    game.resetGame();
    
    // Start the animation loop to enable toggle functionality
    requestAnimationFrame(game.animate);
    
    // The game will start when the space key is pressed
    // This is already handled in the Game class with event listeners
}); 