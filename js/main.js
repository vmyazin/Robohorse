import Game from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    // Initialize the game
    game.resetGame();
    
    // The game will start when the start button is clicked
    // This is already handled in the Game class with event listeners
}); 