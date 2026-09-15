import Game from './Game.js';
import { fitGameViewport } from './components/GameViewport.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    fitGameViewport(document.getElementById('game-container'), canvas);
    const game = new Game(canvas);
    if (import.meta.env.MODE === 'test') window.__game = game;
    
    // Initialize the game
    game.resetGame();
    
    // Start the animation loop to enable toggle functionality
    game.startLoop();
    
    // The game will start when the space key is pressed
    // This is already handled in the Game class with event listeners
}); 