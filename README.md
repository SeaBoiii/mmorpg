# MMORPG - 2D RPG Game

[![GitHub](https://img.shields.io/badge/github-SeaBoiii/mmorpg-blue?logo=github)](https://github.com/SeaBoiii/mmorpg)
[![License](https://img.shields.io/badge/license-Free%20to%20Use-green.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A single-player 2D RPG built with vanilla JavaScript and HTML5 Canvas. Experience action-packed combat, exploration, and character progression in a browser-based dungeon adventure.

> *"Wanted a MMO but got Touhou instead"* - A bullet-hell inspired RPG experience

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [How to Play](#-how-to-play)
- [Project Structure](#-project-structure)
- [Game Systems](#-game-systems)
- [Achievements](#-achievements)
- [Technology Stack](#️-technology-stack)
- [Development Guide](#-development-guide)
- [Tips for Beginners](#-tips-for-beginners)
- [Contributing](#-contributing)
- [Known Issues & Future Improvements](#-known-issues--future-improvements)
- [License](#-license)
- [Author](#-author)

## 🎮 Features

- **Dynamic Combat System** - Face diverse enemies including Orcs, Slimes, Ghosts, Berserkers, Tanks, Shooters, and Swarms
- **Multiple Game Modes** - Choose between Dungeon Campaign, Endless Mode, or Touhou Mode
- **Difficulty Settings** - Easy, Medium, and Hard difficulty options
- **Player Progression** - Gain XP, level up, and grow stronger with each victory
- **Powerup System** - Collect items that permanently boost your abilities
- **Achievement System** - Unlock 9 unique achievements (Medium/Hard only)
- **Dungeon Exploration** - Navigate through procedurally generated dungeons
- **Real-time Action** - Fast-paced gameplay with smooth 60fps canvas rendering
- **Save/Load System** - Progress persists using browser localStorage
- **Boss Battles** - Face powerful boss enemies every 5 levels
- **Elite Enemies** - Encounter stronger variants with better rewards

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (required due to CORS restrictions)

### Running the Game

**Option 1: Python HTTP Server**
```bash
# Navigate to the project directory
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

**Option 2: VS Code Live Server**
- Install the Live Server extension
- Right-click `index.html` and select "Open with Live Server"

**Option 3: Node.js HTTP Server**
```bash
npx http-server -p 8000
# Open http://localhost:8000 in your browser
```

## 🎮 How to Play

### Controls
- **Movement**: `WASD` or `Arrow Keys` to move your character
- **Attack**: Automatic when near enemies
- **Menu Navigation**: Click to select game mode, difficulty, and start game

### Game Modes
1. **Dungeon Campaign** - Level-based progression system where you learn enemy types gradually
2. **Endless Mode** - Classic endless survival with mixed enemy types and increasing difficulty
3. **Touhou Mode** - Bullet-hell inspired mode with endless waves of shooter enemies only

### Difficulty Levels
- **Easy** - More power, great for learning the game (achievements disabled)
- **Medium** - Balanced experience, recommended for most players
- **Hard** - True challenge for experienced players

### Objectives
- Survive waves of enemies
- Collect powerups to enhance your abilities
- Level up and increase your stats
- Unlock achievements (Medium/Hard difficulty only)
- Beat your high score!

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

### Enemy Types
The game features diverse enemy types, each with unique behaviors:

- **Slime** 🟢 - Basic enemy, slow movement, low health
- **Orc** 🟤 - Melee fighter, moderate stats, aggressive
- **Ghost** 👻 - Fast movement, phases through walls, unpredictable
- **Shooter** 🔴 - Ranged attacks, keeps distance, shoots projectiles
- **Berserker** ⚡ - High damage, fast attack speed, dangerous up close
- **Tank** 🛡️ - High health, slow movement, tough to kill
- **Swarm** 🐝 - Multiple weak enemies, overwhelm with numbers

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

### Powerups & Items
- **Health Boost** - Increases maximum HP
- **Damage Boost** - Enhances attack power
- **Speed Boost** - Faster movement
- **Sword Radius** - Increased attack range
- **Attack Speed** - Faster attacks
- **XP Multiplier** - Bonus experience points

## 🏆 Achievements

Unlock achievements by playing on Medium or Hard difficulty in Dungeon Campaign or Endless Mode:

| Achievement | Requirement |
|------------|-------------|
| 🩸 **First Blood** | Kill your first enemy |
| ⚔️ **Slayer** | Kill 10 enemies without dying |
| 💀 **Executioner** | Kill 25 enemies without dying |
| 📚 **Apprentice** | Reach level 5 |
| 🎖️ **Veteran** | Reach level 10 |
| 👑 **Boss Slayer** | Defeat your first boss |
| ⭐ **Elite Hunter** | Kill 5 elite enemies |
| 🛡️ **Survivor** | Survive for 5 minutes |
| 💎 **Collector** | Collect 20 powerups |

*Note: Achievements are disabled on Easy difficulty*

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
- **GitHub Pages** - Host directly from your GitHub repository
- **Netlify** - Drag-and-drop deployment with continuous deployment
- **Vercel** - Optimized hosting for web apps with automatic deployments

Simply upload all files to your preferred hosting service. No build process required!

## 💡 Tips for Beginners

1. **Start with Easy or Medium difficulty** to learn enemy patterns
2. **Try Dungeon Campaign mode first** - it introduces enemies gradually
3. **Collect powerups** - they significantly boost your survival chances
4. **Keep moving** - standing still makes you an easy target
5. **Learn enemy patterns** - each enemy type has unique behavior
6. **Watch your HP** - retreat when health is low to recover
7. **Level up strategically** - each level increases your stats

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs and issues
- 💡 Suggest new features or improvements
- 🎨 Create or improve game assets (sprites, sounds)
- 📝 Improve documentation
- ✨ Add new enemy types or game mechanics
- 🧪 Write tests for game systems

To contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues & Future Improvements

### Known Issues
- Swarm enemy type has some bugs (see `Swarm_Broken.js`)
- Achievement system UI needs visual polish

### Planned Features
- Additional enemy types can be easily added by extending `BaseEnemy.js`
- Boss battles and mini-bosses
- More diverse powerups and special abilities
- Sound effects and background music
- Mobile touch controls
- Multiplayer features with server integration
- Procedural dungeon generation improvements

## 🔧 For Developers

### Adding New Enemy Types
1. Create a new class extending `BaseEnemy.js` in `src/entities/`
2. Define unique stats and behavior
3. Import and add to enemy spawn pool in `Game.js`

### Code Structure
- **Entity Component System** - Clean separation of game logic
- **State machines** - For game states and AI
- **Event-driven** - Input handling and game events
- **Modular design** - Easy to extend and modify

### Performance Tips
- Use sprite atlases for better performance
- Implement object pooling for bullets/particles
- Optimize collision detection with spatial partitioning
- Profile with browser DevTools

## 📝 License

Free to Use

## 👤 Author

Aleem Siddique + Copilot

---

**Happy adventuring!** 🎮✨
