# Copilot Instructions

## Project Overview
This is a single-player 2D RPG built with JavaScript and HTML5 Canvas. The game runs in web browsers and focuses on simple, accessible gameplay mechanics.

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Architecture**: Entity Component System (ECS) or simple class-based OOP
- **Assets**: 2D sprites, JSON for data, Web Audio API for sound

## Architecture & Structure
- `src/` - Main game source code
  - `core/` - Core game systems (Game loop, Scene manager, Input handler)
  - `entities/` - Game entities (Player, NPCs, Items)
  - `systems/` - Game systems (Combat, Inventory, Dialogue)
  - `scenes/` - Game scenes (Menu, World, Battle)
  - `utils/` - Utility functions and helpers
- `assets/` - Game assets (sprites, audio, data files)
- `styles/` - CSS styling
- `index.html` - Main entry point

## Key Workflows
- **Development**: Use Live Server extension or `python -m http.server` to serve locally
- **Testing**: Manual testing in browser, console.log debugging
- **Deployment**: Static hosting (GitHub Pages, Netlify, Vercel)
- **Asset Pipeline**: Simple file organization, consider sprite atlases for optimization

## Conventions & Patterns
- **Game Loop**: Use requestAnimationFrame() for smooth 60fps rendering
- **State Management**: Simple state machines for game states and entity behaviors
- **Canvas Rendering**: Separate update() and render() methods, clear canvas each frame
- **Input Handling**: Event listeners with key mapping objects
- **Asset Loading**: Preload all assets before game starts, use Promise.all()

## Dependencies & Integration Points
- **No external frameworks** - Pure vanilla JavaScript for learning and simplicity
- **Browser APIs**: Canvas 2D Context, Web Audio API, LocalStorage for save games
- **Asset Formats**: PNG/JPG for sprites, JSON for game data, MP3/OGG for audio
- **Module System**: ES6 modules or simple script loading order

## Getting Started
1. Open `index.html` in a web server (not file:// due to CORS)
2. Use browser dev tools for debugging (Console, Network tabs)
3. Start with basic game loop, then add systems incrementally
4. Test frequently across different browsers

## Core RPG Systems to Implement
- Player character with stats (HP, MP, Level, XP)
- Tile-based movement or free movement
- Simple combat system (turn-based or real-time)
- Inventory and equipment system
- Basic dialogue system
- Save/load using localStorage

---
*This file should be updated as the project evolves to reflect actual patterns and conventions found in the codebase.*