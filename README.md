# MMORPG - 2D RPG Game

A single-player 2D RPG built with vanilla JavaScript and HTML5 Canvas. Experience action-packed combat, exploration, and character progression in a browser-based dungeon adventure.

> "Wanted a MMO but got Touhou instead" - A bullet-hell inspired RPG experience

## 🎮 Features

- **Dynamic Combat System** - Face diverse enemies including Orcs, Slimes, Ghosts, Berserkers, Tanks, and Swarms
- **Player Progression** - Gain XP, level up, and grow stronger with each victory
- **Inventory & Equipment** - Collect items and manage your gear
- **Dungeon Exploration** - Navigate procedurally generated or hand-crafted dungeons
- **Real-time Action** - Fast-paced gameplay with smooth canvas rendering
- **Save/Load System** - Progress persists using browser localStorage

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (required due to CORS restrictions)

### Running the Game

**Option 1: Python HTTP Server**
```bash
cd c:\git\mmorpg
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

**Option 2: VS Code Live Server**
- Install the Live Server extension
- Right-click `index.html` and select "Open with Live Server"

## 📁 Project Structure

```
mmorpg/
├── index.html              # Main entry point
├── README.md              # This file
├── src/                   # Game source code
│   ├── main.js           # Game initialization and entry point
│   ├── core/             # Core game systems
│   │   ├── Game.js       # Main game loop and state management
│   │   └── InputHandler.js # Keyboard and input handling
│   ├── entities/         # Game objects and characters
│   │   ├── Player.js     # Player character class
│   │   ├── Enemy.js      # Base enemy class
│   │   ├── Orc.js        # Orc enemy type
│   │   ├── Slime.js      # Slime enemy type
│   │   ├── Ghost.js      # Ghost enemy type
│   │   ├── Berserker.js  # Berserker enemy type
│   │   ├── Tank.js       # Tank enemy type
│   │   ├── Shooter.js    # Shooter enemy type
│   │   ├── Swarm.js      # Swarm enemy type
│   │   ├── Item.js       # Collectible items
│   │   └── BaseEnemy.js  # Base class for enemies
│   ├── systems/          # Game mechanics and systems
│   │   ├── DungeonMap.js # Dungeon generation and management
│   │   └── LevelManager.js # Level progression and difficulty
│   └── utils/            # Utility functions
│       └── GameUtils.js  # Helper functions
├── assets/               # Game resources
│   ├── sprites/         # 2D character and object sprites
│   ├── audio/           # Sound effects and music
│   └── data/            # Game data (JSON files)
└── styles/              # CSS styling
    ├── main.css         # Main stylesheet
    └── achievements-disabled.css # Achievement system styling
```

## 🎯 Game Systems

### Combat
- Turn-based or real-time combat mechanics
- Multiple enemy types with unique abilities
- Damage calculation and hit/miss system
- Boss encounters and challenging enemies

### Progression
- Experience point system (XP)
- Level-up mechanics with stat increases
- Skill unlocks and advancement

### Inventory
- Item collection and management
- Equipment system for gear upgrades
- Item effects and consumables

### Dungeons
- Multiple dungeon levels to explore
- Tile-based or free-movement navigation
- Enemy spawning and waves

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Vanilla JavaScript** | Core game logic and mechanics |
| **HTML5 Canvas** | Real-time 2D graphics rendering |
| **Web Audio API** | Sound effects and background music |
| **localStorage** | Game save data persistence |
| **ES6 Modules** | Code organization and modularity |

## 📖 Development Guide

### Game Loop
- Uses `requestAnimationFrame()` for 60fps smooth rendering
- Separate `update()` and `render()` cycles
- Canvas is cleared each frame

### State Management
- State machines for game states (Menu, Playing, Paused, Game Over)
- Entity behavior trees and simple AI
- Event-driven architecture

### Asset Pipeline
- PNG/JPG for sprite graphics
- JSON for game data configuration
- MP3/OGG for audio files
- Preload all assets before game starts

### Debugging
- Browser DevTools Console for logging
- Network tab for asset loading verification
- Breakpoints and step-through debugging

## 🎨 Art & Audio

The game uses 2D sprite graphics and audio assets. Consider using:
- **Sprite Atlases** - Combine multiple sprites into one image for optimization
- **Animations** - Frame-based or time-based sprite animation
- **Sound Effects** - Event-triggered audio for combat, items, and UI
- **Background Music** - Looping ambient tracks

## 💾 Save System

Game progress is saved to browser localStorage, including:
- Player stats (level, XP, HP, items)
- Current dungeon location
- Equipment and inventory
- Achievement progress

## 🚀 Deployment

The game is ready for static hosting:
- **GitHub Pages** - Host directly from GitHub repository
- **Netlify** - Drag-and-drop deployment
- **Vercel** - Optimized hosting for web apps

## 🐛 Known Issues & Future Improvements

- Swarm enemy type is marked as broken (Swarm_Broken.js)
- Achievement system UI needs completion
- Additional enemy types can be easily added by extending `BaseEnemy.js`
- Multiplayer features could be added with server integration

## 📝 License

Free to Use

## 👤 Author

Aleem Siddique + Copilot

---

**Happy adventuring!** 🎮✨
