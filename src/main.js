import { Game } from './core/Game.js';

let currentGame = null;

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    // Create game instance (starts in 'start' state)
    currentGame = new Game(canvas);
    currentGame.start();
    
    // console.log('Game initialized in start screen mode');
});