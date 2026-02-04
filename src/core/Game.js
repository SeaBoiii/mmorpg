import { InputHandler } from './InputHandler.js';
import { Player } from '../entities/Player.js';
import { Slime } from '../entities/Slime.js';
import { Orc } from '../entities/Orc.js';
import { Shooter } from '../entities/Shooter.js';
import { Berserker } from '../entities/Berserker.js';
import { Ghost } from '../entities/Ghost.js';
import { Tank } from '../entities/Tank.js';
import { Swarm } from '../entities/Swarm.js';
import { Item } from '../entities/Item.js';
import { DungeonMap } from '../systems/DungeonMap.js';
import { LevelManager } from '../systems/LevelManager.js';
import { getRandomPosition } from '../utils/GameUtils.js';

export class Game {
    constructor(canvas, gameMode = 'default', difficulty = 'medium') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game configuration
        this.gameMode = gameMode;
        this.difficulty = difficulty;
        this.config = this.getGameConfig();
        
        this.inputHandler = new InputHandler();
        
        // Game state management
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.selectedGameMode = 'dungeon';
        this.selectedDifficulty = 'medium';
        
        // Initialize player at random safe spawn location
        const playerSpawn = this.getRandomPlayerSpawn();
        this.player = new Player(playerSpawn.x, playerSpawn.y);
        
        // World system
        this.dungeonMap = new DungeonMap(25, 15, 32);
        
        // Enemy management (mode-dependent)
        this.enemies = [];
        this.maxEnemies = this.config.maxEnemies;
        this.enemySpawnTimer = 0;
        this.enemySpawnCooldown = this.config.enemySpawnCooldown;
        this.enemiesKilled = 0;
        
        // Level progression system (for default mode)
        this.levelManager = gameMode === 'default' ? new LevelManager() : null;
        this.pendingLevelTransition = false;
        this.levelTransitionTimer = 0;
        
        // Elite and boss system
        this.eliteSpawnChance = 0.15; // 15% chance for elite enemies
        this.bossSpawnLevel = 5; // Spawn boss every 5 levels
        this.currentBoss = null;
        this.lastBossLevel = 0;
        
        // Item/Powerup management (now config-driven)
        this.items = [];
        this.maxItems = this.config.maxItems;
        this.itemSpawnTimer = 0;
        this.itemSpawnCooldown = this.config.itemSpawnCooldown;
        this.lastItemSpawnTime = 0;
        
        // Player powerup tracking
        this.playerPowerups = {
            swordRadius: 0,    // Bonus sword radius
            damageBoost: 0,    // Bonus damage
            speedBoost: 0,     // Bonus movement speed
            healthBoost: 0,    // Bonus max health
            attackSpeed: 0,    // Attack speed reduction (milliseconds)
            xpMultiplier: 0    // XP bonus percentage
        };
        
        // Progression and Achievement System
        this.achievements = {
            firstKill: { unlocked: false, name: 'First Blood', desc: 'Kill your first enemy (Dungeon and Endless Mode, Medium+)' },
            killStreak10: { unlocked: false, name: 'Slayer', desc: 'Kill 10 enemies without dying (Dungeon and Endless Mode, Medium+)' },
            killStreak25: { unlocked: false, name: 'Executioner', desc: 'Kill 25 enemies without dying (Dungeon and Endless Mode, Medium+)' },
            reachLevel5: { unlocked: false, name: 'Apprentice', desc: 'Reach level 5 (Dungeon and Endless Mode, Medium+)' },
            reachLevel10: { unlocked: false, name: 'Veteran', desc: 'Reach level 10 (Dungeon and Endless Mode, Medium+)' },
            firstBoss: { unlocked: false, name: 'Boss Slayer', desc: 'Defeat your first boss (Dungeon and Endless Mode, Medium+)' },
            eliteHunter: { unlocked: false, name: 'Elite Hunter', desc: 'Kill 5 elite enemies (Dungeon and Endless Mode, Medium+)' },
            survive5min: { unlocked: false, name: 'Survivor', desc: 'Survive 5 minutes (Dungeon and Endless Mode, Medium+)' },
            powerupCollector: { unlocked: false, name: 'Collector', desc: 'Collect 20 powerups (Dungeon and Endless Mode, Medium+)' }
        };
        
        this.stats = {
            enemiesKilledThisRun: 0,
            currentKillStreak: 0,
            longestKillStreak: 0,
            elitesKilled: 0,
            bossesKilled: 0,
            powerupsCollected: 0,
            totalPlayTime: 0,
            highestLevel: 1
        };
        
        // Skill system
        this.skillPoints = 0;
        this.skills = {
            healthRegen: 0,      // Max 5: 1 HP/sec per level
            criticalHit: 0,      // Max 3: 10% crit chance per level
            moveSpeed: 0,        // Max 5: 20 speed per level
            swordMastery: 0,     // Max 5: 10 range + 2 damage per level
            itemMagnet: 0,       // Max 3: Increased pickup range
            experience: 0        // Max 5: 10% more XP per level
        };
        
        // Equipment system
        this.equipment = {
            weapon: {
                name: 'Iron Sword',
                damage: 0,
                range: 0,
                speed: 0,
                rarity: 'common'
            }
        };
        
        // Combat system (now config-driven)
        this.playerAttackDamage = this.config.playerDamage;
        this.playerAttackRange = 60; 
        
        // Visual effects
        this.swordSwing = {
            active: false,
            duration: 200, // 200ms sword swing
            timer: 0,
            angle: 0,
            startAngle: 0
            // radius will be calculated dynamically using getEffectiveAttackRange()
        };
        
        // Damage numbers system
        this.damageNumbers = [];
        
        this.gameTime = 0;
        this.deltaTime = 0;
        this.lastTime = 0;
        
        this.running = false;
        this.gameOver = false;
        
        // Set up mouse click handlers for combat and UI
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Initialize achievements panel
        setTimeout(() => {
            this.initializeAchievementsPanel();
            this.updateAchievementsPanel();
        }, 100); // Small delay to ensure DOM is ready
    }
    
    // Get configuration based on game mode and difficulty
    getGameConfig() {
        const difficulties = {
            easy: {
                playerDamage: 15,
                enemyDamageMultiplier: 0.7,
                maxEnemies: 60, // High cap but starts much lower
                enemySpawnCooldown: 800,
                enemyScalingPerLevel: 2, // Reduced from 4 back to 2
                maxEnemyCap: 120,
                maxItems: 8,
                itemSpawnCooldown: 6000,
                itemCooldownReduction: 400
            },
            medium: {
                playerDamage: 10,
                enemyDamageMultiplier: 1.0,
                maxEnemies: 100, // High cap but starts much lower
                enemySpawnCooldown: 600,
                enemyScalingPerLevel: 3, // Reduced from 6 back to 3
                maxEnemyCap: 200,
                maxItems: 6,
                itemSpawnCooldown: 8000,
                itemCooldownReduction: 500
            },
            hard: {
                playerDamage: 8,
                enemyDamageMultiplier: 1.3,
                maxEnemies: 150, // High cap but starts much lower
                enemySpawnCooldown: 400,
                enemyScalingPerLevel: 4, // Keep at 4 for hard mode challenge
                maxEnemyCap: 300,
                maxItems: 4,
                itemSpawnCooldown: 12000,
                itemCooldownReduction: 600
            }
        };
        
        return difficulties[this.difficulty];
    }
    
    // Get available enemy types based on game mode
    getAvailableEnemyTypes() {
        switch (this.gameMode) {
            case 'touhou':
                return ['shooter'];
            case 'default':
            default:
                return ['slime', 'orc', 'shooter'];
        }
    }
    
    getRandomPlayerSpawn() {
        const playerSize = 24; // Player width/height
        const safeDistance = 150; // Minimum distance from enemies and walls
        const attempts = 50;
        
        for (let i = 0; i < attempts; i++) {
            // Generate position well within arena bounds
            const margin = 80; // Extra margin from walls
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = margin + Math.random() * (this.height - margin * 2);
            
            // Check if position is on floor (not in walls)
            if (this.dungeonMap && this.dungeonMap.isSolid(x + playerSize/2, y + playerSize/2)) {
                continue; // Try another position
            }
            
            // Since no enemies exist yet during initialization, this spawn is safe
            // console.log(`Player spawn position found: (${Math.round(x)}, ${Math.round(y)})`);
            return { x: x, y: y };
        }
        
        // Fallback to center if no position found
        // console.log("Using fallback player spawn position");
        return { x: this.width / 2 - playerSize / 2, y: this.height / 2 - playerSize / 2 };
    }

    start() {
        this.running = true;
        // console.log("Game started - should spawn enemies soon");
        // console.log("Canvas dimensions:", this.width, "x", this.height);
        
        // Spawn initial enemies up to 80% of max capacity
        // console.log("Creating initial enemies");
        const initialSpawnCount = Math.floor(this.maxEnemies * 0.25); // Reduced from 80% to 25% - start with fewer enemies
        for (let i = 0; i < initialSpawnCount; i++) {
            this.spawnEnemy();
        }
        // console.log(`Initial enemies created, total enemies: ${this.enemies.length}`);
        
        this.gameLoop();
    }
    
    renderSwordSwing() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        let swordLength = this.getEffectiveAttackRange(); // Use powerup-enhanced range
        
        // Calculate sword end position
        const endX = playerCenterX + Math.cos(this.swordSwing.angle) * swordLength;
        const endY = playerCenterY + Math.sin(this.swordSwing.angle) * swordLength;
        
        // Check for walls in sword path and shorten if needed
        const actualLength = this.getSwordLengthToWall(playerCenterX, playerCenterY, this.swordSwing.angle, swordLength);
        const actualEndX = playerCenterX + Math.cos(this.swordSwing.angle) * actualLength;
        const actualEndY = playerCenterY + Math.sin(this.swordSwing.angle) * actualLength;
        
        // Draw sword as a line (thicker if powerups applied)
        const swordWidth = Math.min(4 + Math.floor(this.playerPowerups.swordRadius / 10), 8);
        this.ctx.strokeStyle = '#FFD700'; // Gold color
        this.ctx.lineWidth = swordWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(playerCenterX, playerCenterY);
        this.ctx.lineTo(actualEndX, actualEndY);
        this.ctx.stroke();
        
        // Draw attack range circle (faint) - only the usable range
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(playerCenterX, playerCenterY, actualLength, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    addDamageNumber(x, y, damage, color = '#FFD700') {
        this.damageNumbers.push({
            x: x,
            y: y,
            text: `-${damage}`,
            color: color,
            opacity: 1,
            timer: 0,
            duration: 1000, // 1 second duration
            speed: 50 // pixels per second upward movement
        });
    }
    
    handlePlayerCollision(oldX, oldY) {
        // Check collision with player corners and edges
        const playerCorners = [
            { x: this.player.x, y: this.player.y },
            { x: this.player.x + this.player.width, y: this.player.y },
            { x: this.player.x, y: this.player.y + this.player.height },
            { x: this.player.x + this.player.width, y: this.player.y + this.player.height }
        ];
        
        let collided = false;
        for (let corner of playerCorners) {
            if (this.dungeonMap.isSolid(corner.x, corner.y)) {
                collided = true;
                break;
            }
        }
        
        if (collided) {
            this.player.x = oldX;
            this.player.y = oldY;
        }
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop = (timestamp) => {
        if (!this.running) return;
        
        // Initialize lastTime on first frame
        if (this.lastTime === 0) {
            this.lastTime = timestamp;
        }
        
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.gameTime += this.deltaTime;
        
        // Handle different game states
        switch (this.gameState) {
            case 'start':
                this.renderStartScreen();
                break;
            case 'playing':
                this.update(this.deltaTime);
                this.render();
                break;
            case 'gameOver':
                this.render();
                this.renderGameOverScreen();
                break;
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        if (this.gameOver) return; // Stop updating if game is over
        
        // Add basic debug to see if update is running
        if (Math.random() < 0.002) { // Very occasional logging
            // console.log(`UPDATE RUNNING - DeltaTime: ${deltaTime}ms, Enemies: ${this.enemies.length}`);
        }
        
        // Store old position for collision detection
        const oldPlayerX = this.player.x;
        const oldPlayerY = this.player.y;
        
        const playerResult = this.player.update(deltaTime, this.inputHandler);
        
        // Handle level up and grant skill points
        if (playerResult && playerResult.levelUp) {
            this.skillPoints += 1; // Grant 1 skill point per level
            this.stats.highestLevel = Math.max(this.stats.highestLevel, playerResult.newLevel);
            this.addDamageNumber(this.player.x + this.player.width/2, this.player.y - 20, 'LEVEL UP!', '#00FF00');
        }
        
        // Check for game over
        if (playerResult === 'gameOver') {
            this.gameState = 'gameOver';
            this.stats.currentKillStreak = 0; // Reset kill streak on death
            // console.log("Game Over!");
            return;
        }
        
        // Update play time and check achievements
        this.stats.totalPlayTime += deltaTime;
        this.checkAchievements();
        
        // Check collision with walls/gates and revert if needed
        this.handlePlayerCollision(oldPlayerX, oldPlayerY);
        

        // Update sword swing animation
        if (this.swordSwing.active) {
            this.swordSwing.timer += deltaTime;
            if (this.swordSwing.timer >= this.swordSwing.duration) {
                this.swordSwing.active = false;
                this.swordSwing.timer = 0;
            } else {
                // Animate sword swing from startAngle to startAngle + 120 degrees
                const progress = this.swordSwing.timer / this.swordSwing.duration;
                this.swordSwing.angle = this.swordSwing.startAngle + (Math.PI * 2) * progress; // Full 360-degree circle swing
                
                // Check for enemy hits during sword swing (full circle damage)
                // console.log(`Player swing active, checking ${this.enemies.length} enemies...`);
                this.enemies.forEach((enemy, index) => {
                    if (!enemy.isDead && !enemy.hasBeenHit) {
                        const enemyCenterX = enemy.x + enemy.width / 2;
                        const enemyCenterY = enemy.y + enemy.height / 2;
                        const playerCenterX = this.player.x + this.player.width / 2;
                        const playerCenterY = this.player.y + this.player.height / 2;
                        
                        const distance = Math.sqrt(
                            Math.pow(enemyCenterX - playerCenterX, 2) +
                            Math.pow(enemyCenterY - playerCenterY, 2)
                        );
                        
                        // console.log(`Enemy ${index}: Distance ${distance.toFixed(1)}, Radius ${this.swordSwing.radius}, Dead: ${enemy.isDead}, Hit: ${enemy.hasBeenHit}`);
                        
                        // Simple circle damage - no arc checking
                        if (distance < this.getEffectiveAttackRange()) { // Use powerup-enhanced range
                            // console.log(`Enemy ${index} is within attack range!`);
                            // Check if there's a wall between player and enemy
                            if (!this.isPathBlocked(playerCenterX, playerCenterY, enemyCenterX, enemyCenterY)) {
                                const damage = this.getEffectiveAttackDamage(); // Use powerup-enhanced damage
                                const damageResult = enemy.takeDamage(damage);
                                enemy.hasBeenHit = true; // Prevent multiple hits from same swing
                                
                                this.addDamageNumber(
                                    enemyCenterX,
                                    enemy.y,
                                    damage,
                                    '#ffaa00'
                                );
                                
                                // console.log(`🗡️ Player HIT ${enemy.type} for ${damage} damage! Distance: ${distance.toFixed(1)}, Enemy killed: ${damageResult}`);
                                
                                // Handle boss death (just clear boss reference and show message)
                                if (damageResult && enemy.isBoss) {
                                    this.currentBoss = null;
                                    this.addDamageNumber(enemyCenterX, enemy.y - 30, 'BOSS DEFEATED!', '#FFD700');
                                    console.log('🎉 BOSS DEFEATED!');
                                }
                                
                                // Handle elite death (just show message)
                                if (damageResult && enemy.isElite) {
                                    console.log('💎 Elite defeated!');
                                }
                            } else {
                                // console.log(`🚧 Attack blocked by wall - ${enemy.type} at distance ${distance.toFixed(1)}`);
                            }
                        } else {
                            console.log(`Enemy ${index} too far: ${distance.toFixed(1)} > ${this.swordSwing.radius}`);
                        }
                    } else {
                        console.log(`Enemy ${index} skipped - Dead: ${enemy.isDead}, Already hit: ${enemy.hasBeenHit}`);
                    }
                });
            }
        }
        
        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(dmgNum => {
            dmgNum.timer += deltaTime;
            dmgNum.y -= dmgNum.speed * (deltaTime / 1000); // Float upward
            dmgNum.opacity = 1 - (dmgNum.timer / dmgNum.duration);
            return dmgNum.timer < dmgNum.duration;
        });
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player, this);
            
            // Safety check: if enemy is stuck in wall, try to reposition them
            if (this.dungeonMap.isSolid(enemy.x + enemy.width/2, enemy.y + enemy.height/2)) {
                this.repositionStuckEnemy(enemy);
            }
        });
        
        // Remove dead enemies and handle rewards (mode-dependent)
        const enemiesBeforeFilter = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead && !enemy.deathAnimation.active) {
                // Only gain XP in endless modes (not dungeon mode)
                if (this.gameMode !== 'dungeon') {
                    this.player.gainXP(enemy.xpReward);
                }
                this.enemiesKilled++; // Track actual kills
                
                // Update progression stats
                this.stats.enemiesKilledThisRun++;
                this.stats.currentKillStreak++;
                this.stats.longestKillStreak = Math.max(this.stats.longestKillStreak, this.stats.currentKillStreak);
                
                // Track special enemy kills
                if (enemy.isBoss) {
                    this.stats.bossesKilled++;
                    if (this.gameMode !== 'dungeon') {
                        this.skillPoints += 3; // Bonus skill points for boss (endless modes)
                    }
                }
                if (enemy.isElite) {
                    this.stats.elitesKilled++;
                    if (this.gameMode !== 'dungeon') {
                        this.skillPoints += 1; // Bonus skill point for elite (endless modes)
                    }
                }
                
                const xpGain = this.gameMode !== 'dungeon' ? enemy.xpReward : 0;
                console.log(`Enemy removed! ${xpGain > 0 ? `Gained ${xpGain} XP.` : ''} Total killed: ${this.enemiesKilled}, Kill streak: ${this.stats.currentKillStreak}`);
                
                // In endless modes, immediately spawn a replacement enemy
                if (this.gameMode !== 'dungeon') {
                    setTimeout(() => {
                        this.spawnEnemy();
                        console.log("Spawned replacement enemy");
                    }, 100); // Small delay to avoid spawning issues
                }
                
                return false;
            }
            return true;
        });
        
        // Handle game mode specific logic
        if (this.gameMode === 'dungeon') {
            this.updateLevelBasedProgression(deltaTime);
        } else {
            this.updateEndlessMode(deltaTime);
        }
        
        // Handle item spawning (skip for dungeon mode)
        if (this.gameMode !== 'dungeon') {
            this.updateItemSpawning(deltaTime);
            
            // Update items
            this.items.forEach(item => {
                item.update(deltaTime);
            });
        }
        
        // Check item collection (skip for dungeon mode)
        if (this.gameMode !== 'dungeon') {
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                if (item.checkCollision(this.player)) {
                    this.collectPowerup(item);
                    this.items.splice(i, 1);
                }
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render dungeon map
        this.dungeonMap.render(this.ctx);
        
        // Debug: show enemy count with living/dead breakdown
        const livingEnemies = this.enemies.filter(e => !e.isDead || e.deathAnimation.active).length;
        const deadEnemies = this.enemies.filter(e => e.isDead && !e.deathAnimation.active).length;
        
        // Show level objectives for dungeon mode, debug info for endless modes
        if (this.gameMode === 'dungeon' && this.levelManager) {
            const levelStatus = this.levelManager.getLevelStatus();
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            
            if (levelStatus.isComplete) {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillText('🎉 LEVEL COMPLETE! 🎉', this.width / 2, this.height - 80);
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('Next level starting in 2 seconds...', this.width / 2, this.height - 60);
            } else {
                // Level title and description
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText(`LEVEL ${levelStatus.level}`, this.width / 2, this.height - 100);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(levelStatus.description, this.width / 2, this.height - 80);
                
                // Objective info
                const remainingEnemies = this.enemies.filter(e => !e.isDead || e.deathAnimation.active).length;
                this.ctx.fillStyle = '#00CCFF';
                this.ctx.font = '16px Arial';
                if (remainingEnemies > 0) {
                    this.ctx.fillText(`🎯 Defeat ${remainingEnemies} remaining enemies`, this.width / 2, this.height - 60);
                } else if (this.levelManager.currentWave < this.levelManager.spawnWaves.length) {
                    this.ctx.fillText(`⏳ Next wave incoming...`, this.width / 2, this.height - 60);
                }
                
                // Wave progress
                this.ctx.fillStyle = '#CCCCCC';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`Wave ${this.levelManager.currentWave}/${this.levelManager.spawnWaves.length}`, this.width / 2, this.height - 40);
            }
        } else {
            // Show debug info for endless modes
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Enemies: ${livingEnemies} alive, ${deadEnemies} dead (${this.enemies.length} total)`, 10, this.height - 80);
            this.ctx.fillText(`Killed: ${this.enemiesKilled}`, 10, this.height - 60);
            this.ctx.fillText(`Level: ${this.player.stats.level} | XP: ${this.player.stats.xp}`, 10, this.height - 40);
        }
        
        // Render player
        this.player.render(this.ctx);
        
        // Render sword swing effect
        if (this.swordSwing.active) {
            this.renderSwordSwing();
        }
        
        // Render enemies
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });
        
        // Render items (skip for dungeon mode)
        if (this.gameMode !== 'dungeon') {
            this.items.forEach(item => {
                item.render(this.ctx);
            });
        }
        
        // Render damage numbers
        this.damageNumbers.forEach(dmgNum => {
            this.ctx.save();
            this.ctx.globalAlpha = dmgNum.opacity;
            this.ctx.fillStyle = dmgNum.color;
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(dmgNum.text, dmgNum.x, dmgNum.y);
            this.ctx.restore();
        });
        
        // Update UI
        this.updateUI();
        
        // Render game over screen if needed
        if (this.gameOver) {
            this.renderGameOverScreen();
        }
    }
    
    renderGameOverScreen() {
        const ctx = this.ctx;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game Over title
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 120);
        
        // Player stats
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.fillText(`Final Level: ${this.player.stats.level}`, this.canvas.width / 2, this.canvas.height / 2 - 70);
        ctx.fillText(`Enemies Defeated: ${this.stats.enemiesKilledThisRun}`, this.canvas.width / 2, this.canvas.height / 2 - 50);
        ctx.fillText(`Longest Kill Streak: ${this.stats.longestKillStreak}`, this.canvas.width / 2, this.canvas.height / 2 - 30);
        ctx.fillText(`Survival Time: ${Math.floor(this.stats.totalPlayTime / 1000)}s`, this.canvas.width / 2, this.canvas.height / 2 - 10);
        
        // Achievement count
        const unlockedCount = Object.values(this.achievements).filter(a => a.unlocked).length;
        const totalCount = Object.keys(this.achievements).length;
        ctx.fillText(`Achievements: ${unlockedCount}/${totalCount}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        // Restart button
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.canvas.width / 2 - 80, this.canvas.height / 2 + 40, 160, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('RESTART GAME', this.canvas.width / 2, this.canvas.height / 2 + 65);
        
        ctx.textAlign = 'left'; // Reset alignment
    }
    
    initializeAchievementsPanel() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;
        
        achievementsList.innerHTML = '';
        
        // Create achievement elements for each achievement
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            const achievementElement = document.createElement('div');
            achievementElement.className = 'achievement locked';
            achievementElement.id = `achievement-${key}`;
            
            achievementElement.innerHTML = `
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            `;
            
            achievementsList.appendChild(achievementElement);
        });
    }
    
    updateAchievementsPanel() {
        const achievementsDisabled = (this.gameMode !== 'default' || this.difficulty === 'easy');
        
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            const element = document.getElementById(`achievement-${key}`);
            if (element) {
                if (achievementsDisabled) {
                    element.className = 'achievement disabled';
                } else if (achievement.unlocked) {
                    element.className = 'achievement unlocked';
                } else {
                    element.className = 'achievement locked';
                }
            }
        });
        
        // Update achievements panel header to show status
        const achievementsPanel = document.getElementById('achievementsPanel');
        const header = achievementsPanel?.querySelector('h3');
        if (header) {
            if (achievementsDisabled) {
                header.textContent = 'Achievements (Disabled)';
                header.style.color = '#888';
            } else {
                header.textContent = 'Achievements';
                header.style.color = '#FFD700';
            }
        }
    }
    
    updateUI() {
        // Basic player stats
        const hp = this.player.stats.hp;
        const maxHp = this.player.stats.maxHp;
        
        // Debug NaN health issue
        if (isNaN(hp) || isNaN(maxHp)) {
            console.error('Player health is NaN!', { hp, maxHp, playerStats: this.player.stats });
        }
        
        document.getElementById('playerHP').textContent = `${hp}/${maxHp}`;
        
        // Update health bar
        const healthPercent = Math.max(0, (hp / maxHp) * 100);
        document.getElementById('healthBar').style.width = `${healthPercent}%`;
        
        // Mode-specific UI updates
        if (this.gameMode === 'dungeon' && this.levelManager) {
            // Level-based progression UI
            const levelStatus = this.levelManager.getLevelStatus();
            document.getElementById('playerLevel').textContent = `Level ${levelStatus.level}`;
            document.getElementById('playerXP').textContent = `Wave ${this.levelManager.currentWave}`;
            document.getElementById('playerXPNext').textContent = `${this.levelManager.spawnWaves.length}`;
            
            // Use XP bar as wave progress bar
            const waveProgress = (this.levelManager.currentWave / Math.max(1, this.levelManager.spawnWaves.length)) * 100;
            document.getElementById('xpBar').style.width = `${Math.min(100, waveProgress)}%`;
            
            // Change bar color based on status
            if (levelStatus.isComplete) {
                document.getElementById('xpBar').style.background = 'linear-gradient(90deg, #00ff00, #32ff32)';
            } else {
                document.getElementById('xpBar').style.background = 'linear-gradient(90deg, #ff8c00, #ffa500)';
            }
        } else {
            // Endless mode: Show XP and level
            const xp = this.player.stats.xp;
            const xpToNext = this.player.stats.xpToNext;
            
            document.getElementById('playerLevel').textContent = this.player.stats.level;
            document.getElementById('playerXP').textContent = xp;
            document.getElementById('playerXPNext').textContent = xpToNext;
            
            // Update XP bar
            const xpPercent = Math.max(0, (xp / xpToNext) * 100);
            document.getElementById('xpBar').style.width = `${xpPercent}%`;
            document.getElementById('xpBar').style.background = 'linear-gradient(90deg, #4169E1, #00BFFF)';
        }
        
        // Update powerup display in the UI
        const statsDiv = document.getElementById('playerStats');
        
        // Remove old powerup display
        const oldPowerups = statsDiv.querySelector('#powerupStats');
        if (oldPowerups) {
            oldPowerups.remove();
        }
        
        // Add current powerup stats
        const powerupDiv = document.createElement('div');
        powerupDiv.id = 'powerupStats';
        powerupDiv.innerHTML = `
            <div style="margin-top: 10px; font-size: 11px; color: #ffd700;">
                <div>Sword: +${this.playerPowerups.swordRadius}</div>
                <div>Damage: +${this.playerPowerups.damageBoost}</div>
                <div>Speed: +${this.playerPowerups.speedBoost}</div>
                <div>Health: +${this.playerPowerups.healthBoost}</div>
                <div>Attack Speed: -${this.playerPowerups.attackSpeed}ms</div>
                <div>XP Boost: +${this.playerPowerups.xpMultiplier}%</div>
                <div style="margin-top: 8px; color: #00ff00;">Skill Points: ${this.skillPoints}</div>
                <div style="color: #ff8800;">Kill Streak: ${this.stats.currentKillStreak}</div>
            </div>
        `;
        statsDiv.appendChild(powerupDiv);
    }
    
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        if (this.gameState === 'start') {
            this.handleStartScreenClick(clickX, clickY);
        } else if (this.gameState === 'gameOver') {
            this.handleGameOverClick(clickX, clickY);
        } else if (this.gameState === 'playing') {
            this.handleAttack(event);
        }
    }
    
    handleStartScreenClick(x, y) {
        // Game mode selection (y: 137-177, y: 177-217, y: 217-257)
        if (y >= 137 && y <= 177 && x >= this.width / 2 - 150 && x <= this.width / 2 + 150) {
            this.selectedGameMode = 'dungeon';
        } else if (y >= 177 && y <= 217 && x >= this.width / 2 - 150 && x <= this.width / 2 + 150) {
            this.selectedGameMode = 'default';
        } else if (y >= 217 && y <= 257 && x >= this.width / 2 - 150 && x <= this.width / 2 + 150) {
            this.selectedGameMode = 'touhou';
        }
        
        // Difficulty selection (y: 317-357, y: 357-397, y: 397-437)
        else if (y >= 317 && y <= 357 && x >= this.width / 2 - 150 && x <= this.width / 2 + 150) {
            this.selectedDifficulty = 'easy';
        } else if (y >= 357 && y <= 397 && x >= this.width / 2 - 150 && x <= this.width / 2 + 150) {
            this.selectedDifficulty = 'medium';
        } else if (y >= 397 && y <= 437 && x >= this.width / 2 - 150 && x <= this.width / 2 + 150) {
            this.selectedDifficulty = 'hard';
        }
        
        // Start button (y: 490-525)
        else if (y >= 490 && y <= 525 && x >= this.width / 2 - 60 && x <= this.width / 2 + 60) {
            this.startNewGame();
        }
    }
    
    handleGameOverClick(x, y) {
        // Restart button (centered, y: 50-90 from middle)
        const restartY = this.height / 2 + 50;
        if (y >= restartY && y <= restartY + 40 && x >= this.width / 2 - 80 && x <= this.width / 2 + 80) {
            // Reset stats immediately when restart button is clicked
            this.stats.enemiesKilledThisRun = 0;
            this.stats.currentKillStreak = 0;
            this.stats.longestKillStreak = 0;
            this.stats.totalPlayTime = 0;
            this.stats.elitesKilled = 0;
            this.stats.bossesKilled = 0;
            this.stats.powerupsCollected = 0;
            
            this.gameState = 'start';
        }
    }
    
    handleAttack(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Calculate angle from player to click for sword swing
        const dx = clickX - (this.player.x + this.player.width / 2);
        const dy = clickY - (this.player.y + this.player.height / 2);
        const attackAngle = Math.atan2(dy, dx);
        
        // Start sword swing animation
        this.swordSwing.active = true;
        this.swordSwing.timer = 0;
        this.swordSwing.startAngle = attackAngle - Math.PI / 3; // Start 60 degrees before target (wider than before)
        this.swordSwing.angle = this.swordSwing.startAngle;
        
        // Reset hit flags for all enemies
        this.enemies.forEach(enemy => {
            enemy.hasBeenHit = false;
        });
    }
    
    spawnEnemy() {
        // console.log(`Attempting to spawn enemy. Current enemies: ${this.enemies.length}`);
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const minDistanceFromPlayer = 120; // Minimum pixels away from player
        
        // Try to spawn different enemy types with proper size validation
        const maxAttempts = 50;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // First, determine what enemy type we want to spawn
            let enemyType = this.determineEnemyType();
            let enemySize = this.getEnemySizeForType(enemyType);
            
            // Generate random position with safe margins
            const margin = enemySize + 32;
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = margin + Math.random() * (this.height - margin * 2);
            
            // Check distance from player
            const distanceFromPlayer = Math.sqrt(
                Math.pow(x - playerCenterX, 2) + Math.pow(y - playerCenterY, 2)
            );
            
            if (distanceFromPlayer < minDistanceFromPlayer) {
                continue; // Too close to player
            }
            
            // Validate position with correct enemy size
            if (this.isValidSpawnPosition(x, y, enemySize)) {
                // Create the enemy at the validated position
                const enemy = this.createEnemyOfType(enemyType, x, y);
                if (enemy) {
                    this.finalizeEnemySpawn(enemy);
                    return;
                }
            }
        }
        
        console.warn("Could not find valid spawn position for enemy after", maxAttempts, "attempts");
    }
    
    determineEnemyType() {
        const rand = Math.random();
        
        if (this.gameMode === 'touhou') {
            return 'shooter';
        } else {
            // Default mode: varied enemy types
            if (rand < 0.15) return 'shooter';
            else if (rand < 0.35) return 'slime';
            else if (rand < 0.55) return 'orc';
            else if (rand < 0.7) return 'berserker';
            else if (rand < 0.83) return 'ghost';
            else if (rand < 0.92) return 'tank';
            else return 'swarm';
        }
    }
    
    getEnemySizeForType(enemyType) {
        switch (enemyType) {
            case 'tank': return 36;
            case 'slime': 
            case 'orc': 
            case 'berserker': return 28;
            case 'shooter': return 22;
            case 'ghost': return 24;
            case 'swarm': return 16;
            default: return 28;
        }
    }
    
    isValidSpawnPosition(x, y, enemySize) {
        // Check multiple points within the enemy bounds
        const checkPoints = [
            { x: x + enemySize/2, y: y + enemySize/2 }, // Center
            { x: x + 5, y: y + 5 },                     // Near top-left
            { x: x + enemySize - 5, y: y + 5 },          // Near top-right
            { x: x + 5, y: y + enemySize - 5 },          // Near bottom-left
            { x: x + enemySize - 5, y: y + enemySize - 5 } // Near bottom-right
        ];
        
        for (let point of checkPoints) {
            if (this.dungeonMap.isSolid(point.x, point.y)) {
                return false;
            }
        }
        
        return true;
    }
    
    createEnemyOfType(enemyType, x, y) {
        let enemy;
        
        if (enemyType === 'shooter') {
            enemy = new Shooter(x, y);
            if (this.gameMode === 'touhou') {
                // Balance adjustments for Touhou mode
                enemy.maxHp = 15;
                enemy.hp = 15;
                enemy.speed = 180;
                enemy.damage = 6;
                enemy.maxShootCooldown = 1500;
                enemy.xpReward = 25;
            }
        } else if (enemyType === 'slime') {
            enemy = new Slime(x, y);
        } else if (enemyType === 'orc') {
            enemy = new Orc(x, y);
        } else if (enemyType === 'berserker') {
            enemy = new Berserker(x, y);
        } else if (enemyType === 'ghost') {
            enemy = new Ghost(x, y);
        } else if (enemyType === 'tank') {
            enemy = new Tank(x, y);
        } else if (enemyType === 'swarm') {
            // Return a single swarm enemy - the static method handles coordination
            enemy = new Swarm(x, y);
            // console.log(`Spawned SWARM enemy!`);
        }
        
        return enemy;
    }
    
    finalizeEnemySpawn(enemy) {
        // Apply difficulty damage multiplier
        if (this.config.enemyDamageMultiplier !== 1.0) {
            enemy.damage = Math.round(enemy.damage * this.config.enemyDamageMultiplier);
        }
        
        // Chance to make enemy elite (DISABLED in dungeon mode)
        if (!enemy.isBoss && this.gameMode !== 'dungeon' && Math.random() < this.eliteSpawnChance) {
            enemy = this.createEliteEnemy(enemy);
            // console.log(`Spawned ELITE ${enemy.type}!`);
        }
        
        // Assign formation index for coordinated AI behavior
        enemy.formationIndex = this.enemies.length % 8;

        this.enemies.push(enemy);
        
        // console.log(`Successfully spawned ${enemy.type} at (${Math.round(enemy.x)}, ${Math.round(enemy.y)}). Total enemies: ${this.enemies.length}`);
    }
    
    repositionStuckEnemy(enemy) {
        console.warn(`Enemy ${enemy.type} stuck in wall at (${enemy.x}, ${enemy.y}), attempting to reposition...`);
        
        const maxAttempts = 20;
        const maxDistance = 60;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Try positions in a circle around current location
            const angle = (attempt / maxAttempts) * Math.PI * 2;
            const distance = 20 + (attempt / maxAttempts) * maxDistance;
            
            const newX = enemy.x + Math.cos(angle) * distance;
            const newY = enemy.y + Math.sin(angle) * distance;
            
            // Make sure the new position is within bounds
            const margin = Math.max(enemy.width, enemy.height) / 2;
            if (newX < margin || newX > this.width - margin || 
                newY < margin || newY > this.height - margin) {
                continue;
            }
            
            // Check if the new position is valid
            if (this.isValidSpawnPosition(newX, newY, Math.max(enemy.width, enemy.height))) {
                enemy.x = newX;
                enemy.y = newY;
                // console.log(`Successfully repositioned ${enemy.type} to (${Math.round(newX)}, ${Math.round(newY)})`);
                return;
            }
        }
        
        console.warn(`Could not reposition stuck ${enemy.type}, removing from game`);
        enemy.isDead = true;
    }
    
    oldSpawnEnemy() {
        console.log(`Attempting to spawn enemy. Current enemies: ${this.enemies.length}`);
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const minDistanceFromPlayer = 120; // Minimum pixels away from player
        const enemySize = 28;
        
        let attempts = 0;
        let pos = null;
        
        // Try to find a valid spawn position
        while (attempts < 50) { // Increased attempts from 30 to 50
            // Generate random position with safe margins from boundaries
            const margin = enemySize + 32; // Extra margin to avoid walls
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = margin + Math.random() * (this.height - margin * 2);
            
            // Check distance from player
            const distanceFromPlayer = Math.sqrt(
                Math.pow(x - playerCenterX, 2) + Math.pow(y - playerCenterY, 2)
            );
            
            if (distanceFromPlayer < minDistanceFromPlayer) {
                attempts++;
                continue; // Too close to player
            }
            
            // Ensure enemy won't spawn in walls (check multiple points)
            const checkPoints = [
                { x: x + enemySize/2, y: y + enemySize/2 }, // Center
                { x: x + 5, y: y + 5 },                     // Near top-left
                { x: x + enemySize - 5, y: y + 5 },          // Near top-right
                { x: x + 5, y: y + enemySize - 5 },          // Near bottom-left
                { x: x + enemySize - 5, y: y + enemySize - 5 } // Near bottom-right
            ];
            
            let validPosition = true;
            for (let point of checkPoints) {
                if (this.dungeonMap.isSolid(point.x, point.y)) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                pos = { x: x, y: y };
                // console.log(`Found valid position after ${attempts + 1} attempts: (${Math.round(x)}, ${Math.round(y)})`);
                break;
            }
            
            attempts++;
        }
        
        // console.log(`Spawn attempts completed: ${attempts}, success: ${pos !== null}`);
        
        // If we couldn't find a random position, use safe arena positions
        if (!pos) {
            // Safe positions well within the open arena (avoiding outer walls)
            const safePositions = [
                { x: 100, y: 100 }, { x: 200, y: 150 }, { x: 350, y: 100 },
                { x: 150, y: 250 }, { x: 400, y: 200 }, { x: 500, y: 150 },
                { x: 100, y: 300 }, { x: 300, y: 350 }, { x: 450, y: 300 },
                { x: 250, y: 200 }, { x: 550, y: 250 }, { x: 150, y: 400 },
                { x: 400, y: 350 }, { x: 600, y: 300 }, { x: 300, y: 450 }
            ].filter(p => {
                const dist = Math.sqrt(Math.pow(p.x - playerCenterX, 2) + Math.pow(p.y - playerCenterY, 2));
                return dist >= minDistanceFromPlayer && 
                       p.x >= 64 && p.x + enemySize <= this.width - 64 &&
                       p.y >= 64 && p.y + enemySize <= this.height - 64 &&
                       !this.dungeonMap.isSolid(p.x + enemySize/2, p.y + enemySize/2);
            });
            
            if (safePositions.length > 0) {
                pos = safePositions[Math.floor(Math.random() * safePositions.length)];
                // console.log(`Using safe fallback position: (${pos.x}, ${pos.y})`);
            } else {
                console.warn("Could not find any safe spawn position!");
                return; // Don't spawn if no safe position
            }
        }
        
        // Choose enemy type based on game mode
        const availableTypes = this.getAvailableEnemyTypes();
        const rand = Math.random();
        let enemy;
        
        if (this.gameMode === 'touhou') {
            // Touhou mode: only shooters with reduced stats for balance
            enemy = new Shooter(pos.x, pos.y);
            // Balance adjustments for Touhou mode
            enemy.maxHp = 15; // Reduced from 20
            enemy.hp = 15;
            enemy.speed = 180; // Reduced from 210 to 180 for Touhou balance
            enemy.damage = 6; // Reduced from 8
            enemy.maxShootCooldown = 1500; // Slower shooting (was 1200)
            enemy.xpReward = 25; // Increased XP reward
        } else {
            // Default mode: varied enemy types with new enemies
            if (rand < 0.15) {
                enemy = new Shooter(pos.x, pos.y);
            } else if (rand < 0.35) {
                enemy = new Slime(pos.x, pos.y); 
            } else if (rand < 0.55) {
                enemy = new Orc(pos.x, pos.y);
            } else if (rand < 0.7) {
                enemy = new Berserker(pos.x, pos.y);
            } else if (rand < 0.83) {
                enemy = new Ghost(pos.x, pos.y);
            } else if (rand < 0.92) {
                enemy = new Tank(pos.x, pos.y);
            } else {
                // Spawn swarm group (3-5 enemies)
                const swarmCount = 3 + Math.floor(Math.random() * 3);
                const swarmEnemies = Swarm.spawnSwarmGroup(pos.x, pos.y, swarmCount);
                
                // Add all swarm enemies except the first one (we'll use first as the main enemy)
                for (let i = 1; i < swarmEnemies.length; i++) {
                    const swarmEnemy = swarmEnemies[i];
                    swarmEnemy.formationIndex = this.enemies.length + i;
                    this.enemies.push(swarmEnemy);
                }
                
                enemy = swarmEnemies[0]; // Use first as the main spawn
                // console.log(`Spawned SWARM GROUP of ${swarmCount} enemies!`);
            }
        }
        
        // Apply difficulty damage multiplier to enemy
        if (this.config.enemyDamageMultiplier !== 1.0) {
            enemy.damage = Math.round(enemy.damage * this.config.enemyDamageMultiplier);
        }
        
        // Chance to make enemy elite (but not if it's already special)
        if (!enemy.isBoss && Math.random() < this.eliteSpawnChance) {
            enemy = this.createEliteEnemy(enemy);
            // console.log(`Spawned ELITE ${enemy.type}!`);
        }
        
        // Assign formation index for coordinated AI behavior
        enemy.formationIndex = this.enemies.length % 8; // Cycle through 8 formation positions

        this.enemies.push(enemy);
        
        // console.log(`Successfully spawned ${enemy.type} at (${Math.round(pos.x)}, ${Math.round(pos.y)}). Total enemies: ${this.enemies.length}`);
    }
    
    spawnBoss() {
        // console.log('BOSS SPAWN TRIGGERED!');
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const minDistanceFromPlayer = 200; // Spawn boss further away
        
        // Find position for boss (larger enemy)
        for (let attempts = 0; attempts < 30; attempts++) {
            const margin = 80;
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = margin + Math.random() * (this.height - margin * 2);
            
            const distanceFromPlayer = Math.sqrt(
                Math.pow(x - playerCenterX, 2) + Math.pow(y - playerCenterY, 2)
            );
            
            if (distanceFromPlayer >= minDistanceFromPlayer && 
                !this.dungeonMap.isSolid(x + 20, y + 20)) {
                
                const boss = this.createBossEnemy(x, y);
                this.enemies.push(boss);
                this.currentBoss = boss;
                
                console.log(`BOSS SPAWNED at (${Math.round(x)}, ${Math.round(y)})!`);
                
                // Add dramatic effect
                this.addDamageNumber(x + 20, y - 20, 'BOSS APPEARS!', '#FF0000');
                return;
            }
        }
        
        // console.log('Failed to spawn boss - no valid position found');
        const steps = 10; // Number of points to check along the path
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = x1 + (x2 - x1) * t;
            const checkY = y1 + (y2 - y1) * t;
            
            if (this.dungeonMap.isSolid(checkX, checkY)) {
                return true; // Path is blocked
            }
        }
        return false; // Path is clear
    }
    
    // Get the effective sword length before hitting a wall
    getSwordLengthToWall(startX, startY, angle, maxLength) {
        const steps = 20; // Number of points to check along sword path
        
        for (let i = 1; i <= steps; i++) {
            const distance = (maxLength / steps) * i;
            const checkX = startX + Math.cos(angle) * distance;
            const checkY = startY + Math.sin(angle) * distance;
            
            if (this.dungeonMap.isSolid(checkX, checkY)) {
                return distance - (maxLength / steps); // Return distance to just before the wall
            }
        }
        
        return maxLength; // No wall found, return full length
    }
    
    // Check if there's a wall blocking the path between two points
    isPathBlocked(x1, y1, x2, y2) {
        const steps = 10; // Number of points to check along the path
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = x1 + (x2 - x1) * t;
            const checkY = y1 + (y2 - y1) * t;
            
            if (this.dungeonMap.isSolid(checkX, checkY)) {
                return true; // Path is blocked
            }
        }
        return false; // Path is clear
    }
    
    // Create an elite version of an enemy
    createEliteEnemy(baseEnemy) {
        // Elite enemies have enhanced stats and special abilities
        baseEnemy.isElite = true;
        baseEnemy.maxHp = Math.floor(baseEnemy.maxHp * 1.8); // 80% more HP
        baseEnemy.hp = baseEnemy.maxHp;
        baseEnemy.damage = Math.floor(baseEnemy.damage * 1.3); // 30% more damage
        baseEnemy.speed = Math.floor(baseEnemy.speed * 1.2); // 20% faster
        baseEnemy.xpReward = Math.floor(baseEnemy.xpReward * 2.5); // 150% more XP
        
        // Visual distinction - darker color with golden outline
        const originalColor = baseEnemy.color;
        baseEnemy.color = this.darkenColor(originalColor);
        baseEnemy.eliteGlow = true;
        
        // Special elite abilities based on type
        if (baseEnemy.type === 'slime') {
            baseEnemy.regeneration = 2; // HP per second
        } else if (baseEnemy.type === 'orc') {
            baseEnemy.berserkerMode = true; // Gets faster when damaged
        } else if (baseEnemy.type === 'shooter') {
            baseEnemy.burstShot = true; // Shoots 3 projectiles
            baseEnemy.maxShootCooldown *= 0.7; // Shoots faster
        }
        
        return baseEnemy;
    }
    
    // Create a boss enemy
    createBossEnemy(x, y) {
        // Boss is a super-elite orc with unique abilities
        const boss = new Orc(x, y);
        boss.isBoss = true;
        boss.maxHp = 200; // Massive HP
        boss.hp = boss.maxHp;
        boss.damage = 25; // High damage
        boss.speed = 120; // Slower but deadly
        boss.xpReward = 500; // Huge XP reward
        boss.width = 40; // Larger size
        boss.height = 40;
        
        // Boss visual - red with pulsing effect
        boss.color = '#800000';
        boss.bossGlow = true;
        boss.chargeAbility = true; // Can charge at player
        boss.lastChargeTime = 0;
        boss.areaAttack = true; // Periodic area damage
        boss.lastAreaAttack = 0;
        
        return boss;
    }
    
    // Darken a color for elite enemies
    darkenColor(color) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Check and unlock achievements
    checkAchievements() {
        let newAchievements = [];
        
        // Only unlock achievements in default game mode and medium/hard difficulty
        if (this.gameMode !== 'default' || this.difficulty === 'easy') {
            return false;
        }
        
        // First kill
        if (!this.achievements.firstKill.unlocked && this.stats.enemiesKilledThisRun >= 1) {
            this.achievements.firstKill.unlocked = true;
            newAchievements.push(this.achievements.firstKill);
        }
        
        // Kill streaks
        if (!this.achievements.killStreak10.unlocked && this.stats.currentKillStreak >= 10) {
            this.achievements.killStreak10.unlocked = true;
            newAchievements.push(this.achievements.killStreak10);
        }
        
        if (!this.achievements.killStreak25.unlocked && this.stats.currentKillStreak >= 25) {
            this.achievements.killStreak25.unlocked = true;
            newAchievements.push(this.achievements.killStreak25);
        }
        
        // Level achievements
        if (!this.achievements.reachLevel5.unlocked && this.player.stats.level >= 5) {
            this.achievements.reachLevel5.unlocked = true;
            newAchievements.push(this.achievements.reachLevel5);
        }
        
        if (!this.achievements.reachLevel10.unlocked && this.player.stats.level >= 10) {
            this.achievements.reachLevel10.unlocked = true;
            newAchievements.push(this.achievements.reachLevel10);
        }
        
        // Boss and elite kills
        if (!this.achievements.firstBoss.unlocked && this.stats.bossesKilled >= 1) {
            this.achievements.firstBoss.unlocked = true;
            newAchievements.push(this.achievements.firstBoss);
        }
        
        if (!this.achievements.eliteHunter.unlocked && this.stats.elitesKilled >= 5) {
            this.achievements.eliteHunter.unlocked = true;
            newAchievements.push(this.achievements.eliteHunter);
        }
        
        // Survival time
        if (!this.achievements.survive5min.unlocked && this.stats.totalPlayTime >= 300000) {
            this.achievements.survive5min.unlocked = true;
            newAchievements.push(this.achievements.survive5min);
        }
        
        // Powerup collection
        if (!this.achievements.powerupCollector.unlocked && this.stats.powerupsCollected >= 20) {
            this.achievements.powerupCollector.unlocked = true;
            newAchievements.push(this.achievements.powerupCollector);
        }
        
        // Display new achievements
        newAchievements.forEach(achievement => {
            this.addDamageNumber(this.width / 2, 100, `${achievement.name} Unlocked!`, '#FFD700');
            // console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.desc}`);
        });
        
        // Update achievements panel if achievements were unlocked
        if (newAchievements.length > 0) {
            this.updateAchievementsPanel();
        }
        
        return newAchievements.length > 0;
    }
    
    // Start a new game with selected settings
    startNewGame() {
        // Reset game state
        this.gameMode = this.selectedGameMode;
        this.difficulty = this.selectedDifficulty;
        this.config = this.getGameConfig();
        
        // Update configuration-dependent values
        this.maxEnemies = this.config.maxEnemies;
        this.enemySpawnCooldown = this.config.enemySpawnCooldown;
        this.maxItems = this.config.maxItems;
        this.itemSpawnCooldown = this.config.itemSpawnCooldown;
        this.playerAttackDamage = this.config.playerDamage;
        
        // Reset game variables
        this.enemies = [];
        this.items = [];
        this.enemySpawnTimer = 0;
        this.itemSpawnTimer = 0;
        this.enemiesKilled = 0;
        this.damageNumbers = [];
        this.gameTime = 0;
        this.lastTime = 0;
        
        // Reset progression stats for new run
        this.stats.enemiesKilledThisRun = 0;
        this.stats.currentKillStreak = 0;
        this.stats.longestKillStreak = 0; // Reset longest streak for each new game
        this.stats.totalPlayTime = 0;
        
        // Reset player
        const playerSpawn = this.getRandomPlayerSpawn();
        this.player = new Player(playerSpawn.x, playerSpawn.y);
        
        // Reset powerups
        this.playerPowerups = {
            swordRadius: 0,
            damageBoost: 0,
            speedBoost: 0,
            healthBoost: 0,
            attackSpeed: 0,
            xpMultiplier: 0
        };
        
        // Reset achievements for new game
        Object.keys(this.achievements).forEach(key => {
            this.achievements[key].unlocked = false;
        });
        
        // Update achievements panel
        this.updateAchievementsPanel();
        
        // Initialize game mode specific systems
        if (this.gameMode === 'dungeon') {
            // Level-based progression system
            this.levelManager = new LevelManager();
            this.pendingLevelTransition = false;
            this.levelTransitionTimer = 0;
            
            // Start level 1
            const levelConfig = this.levelManager.startLevel(1);
            console.log(`Starting Level 1: ${levelConfig.description}`);
            
            // Don't spawn initial enemies - they will be spawned by level system
        } else {
            // Endless modes - spawn initial enemies
            this.levelManager = null;
            const initialSpawnCount = Math.floor(this.maxEnemies * 0.25); // Start with 25%
            for (let i = 0; i < initialSpawnCount; i++) {
                this.spawnEnemy();
            }
        }
        
        this.gameState = 'playing';
        console.log(`New game started - Mode: ${this.gameMode}, Difficulty: ${this.difficulty}`);
    }
    
    // Render start screen with game mode and difficulty selection
    renderStartScreen() {
        const ctx = this.ctx;
        
        // Clear canvas with dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Game title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('2D RPG Adventure', this.width / 2, 80);
        
        // Game mode selection
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Game Mode', this.width / 2, 130);
        
        ctx.font = '16px Arial';
        const gameModes = [
            { name: 'Dungeon Campaign', value: 'dungeon', desc: 'Level-based progression, learn enemy types' },
            { name: 'Endless Mode', value: 'default', desc: 'Classic endless survival with mixed enemies' },
            { name: 'Touhou Mode', value: 'touhou', desc: 'Endless waves, shooters only' }
        ];
        
        gameModes.forEach((mode, index) => {
            const y = 155 + index * 40;
            const isSelected = this.selectedGameMode === mode.value;
            
            // Highlight selected mode
            if (isSelected) {
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.width / 2 - 150, y - 18, 300, 35);
                ctx.fillStyle = '#000000';
            } else {
                ctx.fillStyle = '#FFFFFF';
            }
            
            ctx.fillText(mode.name, this.width / 2, y);
            ctx.font = '12px Arial';
            ctx.fillText(mode.desc, this.width / 2, y + 15);
            ctx.font = '16px Arial';
        });
        
        // Difficulty selection
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Difficulty', this.width / 2, 310);
        
        ctx.font = '16px Arial';
        const difficulties = [
            { name: 'Easy', value: 'easy', desc: 'More power' },
            { name: 'Medium', value: 'medium', desc: 'Balanced' },
            { name: 'Hard', value: 'hard', desc: 'Challenge' }
        ];
        
        difficulties.forEach((diff, index) => {
            const y = 335 + index * 40;
            const isSelected = this.selectedDifficulty === diff.value;
            
            // Highlight selected difficulty
            if (isSelected) {
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(this.width / 2 - 150, y - 18, 300, 35);
                ctx.fillStyle = '#000000';
            } else {
                ctx.fillStyle = '#FFFFFF';
            }
            
            ctx.fillText(diff.name, this.width / 2, y);
            ctx.font = '12px Arial';
            ctx.fillText(diff.desc, this.width / 2, y + 15);
            ctx.font = '16px Arial';
        });
        
        // Start button
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.width / 2 - 60, 490, 120, 35);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('START', this.width / 2, 512);
        
        // Instructions
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial';
        ctx.fillText('Click to select and start', this.width / 2, 560);
    }
    
    /**
     * Update level-based progression for default game mode
     */
    updateLevelBasedProgression(deltaTime) {
        if (!this.levelManager) return;
        
        // Handle level transition delay
        if (this.pendingLevelTransition) {
            this.levelTransitionTimer += deltaTime;
            if (this.levelTransitionTimer >= 2000) { // 2 second delay
                this.advanceToNextLevel();
                this.pendingLevelTransition = false;
                this.levelTransitionTimer = 0;
            }
            return;
        }
        
        // Update level manager
        const livingEnemyCount = this.enemies.filter(e => !e.isDead && (!e.deathAnimation || !e.deathAnimation.active)).length;
        // console.log(`Living enemies: ${livingEnemyCount}, Total enemies: ${this.enemies.length}`);
        const levelUpdate = this.levelManager.update(deltaTime, livingEnemyCount);
        
        if (levelUpdate && levelUpdate.spawnWave) {
            this.spawnWave(levelUpdate.spawnWave);
            
            // Heal player to max HP after each wave in the tutorial level (level 1)
            if (this.levelManager.currentLevel === 1 && this.levelManager.currentWave > 1) {
                const oldHp = this.player.stats.hp;
                this.player.heal(this.player.stats.maxHp);
                // console.log(`Tutorial healing: ${oldHp} -> ${this.player.stats.hp} HP`);
                
                // Show healing message
                if (this.addDamageNumber) {
                    this.addDamageNumber(
                        this.player.x + this.player.width/2, 
                        this.player.y, 
                        'HEALED!', 
                        '#00FF00'
                    );
                }
            }
        }
        
        // Check if level is complete and ready to advance
        if (this.levelManager.canAdvanceLevel() && !this.pendingLevelTransition) {
            // console.log(`Level ${this.levelManager.currentLevel} completed! Advancing in 2 seconds...`);
            // console.log('Current state:', { 
            //    currentWave: this.levelManager.currentWave, 
            //    totalWaves: this.levelManager.spawnWaves.length,
            //    livingEnemies: livingEnemyCount,
            //    waveEnemiesRemaining: this.levelManager.waveEnemiesRemaining
            // });
            this.pendingLevelTransition = true;
            this.levelTransitionTimer = 0;
        }
    }
    
    /**
     * Update endless mode (touhou, etc.)
     */
    updateEndlessMode(deltaTime) {
        // Original endless enemy spawning logic
        if (isNaN(deltaTime) || deltaTime < 0) {
            console.warn(`Invalid deltaTime: ${deltaTime}, skipping spawn timer update`);
            return;
        }
        
        // Reset spawn timer if it becomes NaN
        if (isNaN(this.enemySpawnTimer)) {
            console.warn("enemySpawnTimer was NaN, resetting to 0");
            this.enemySpawnTimer = 0;
        }
        
        this.enemySpawnTimer += deltaTime;
        
        if (this.enemySpawnTimer >= this.enemySpawnCooldown) {
            const livingEnemies = this.enemies.filter(e => !e.isDead || e.deathAnimation.active).length;
            
            // Increase max enemies based on player level (config-driven scaling)
            const playerLevel = this.player.stats.level;
            const levelBasedMaxEnemies = Math.min(
                this.maxEnemies + (playerLevel - 1) * this.config.enemyScalingPerLevel, 
                this.config.maxEnemyCap
            );
            
            // Check for boss spawn
            const shouldSpawnBoss = (playerLevel % this.bossSpawnLevel === 0) && 
                                    (playerLevel > this.lastBossLevel) && 
                                    !this.currentBoss;
            
            // console.log(`ENDLESS SPAWN CHECK - Level: ${playerLevel}, Living: ${livingEnemies}, Target: ${levelBasedMaxEnemies}, Boss: ${shouldSpawnBoss}`);
            
            if (shouldSpawnBoss) {
                this.spawnBoss();
                this.lastBossLevel = playerLevel;
            } else if (livingEnemies < levelBasedMaxEnemies) {
                const needed = levelBasedMaxEnemies - livingEnemies;
                console.log(`SPAWNING: Need ${needed} more enemies`);
                this.spawnEnemy();
                console.log(`Level ${playerLevel} spawn: Living enemies: ${livingEnemies + 1}/${levelBasedMaxEnemies}`);
            }
            
            this.enemySpawnTimer = 0;
        }
    }
    
    /**
     * Spawn a wave of enemies for level-based progression
     */
    spawnWave(wave) {
        // console.log(`Spawning wave:`, wave.enemies, wave.elite ? '(ELITE)' : '', wave.boss ? '(BOSS)' : '');
        // console.log(`Current enemy count before spawning: ${this.enemies.length}`);
        
        let spawnedCount = 0;
        // Spawn enemies synchronously to avoid timing issues
        for (let i = 0; i < wave.enemies.length; i++) {
            const enemyType = wave.enemies[i];
            const enemy = this.spawnSpecificEnemyType(enemyType, wave.boss || false, wave.elite || false);
            if (enemy) {
                // console.log(`Wave spawned ${enemyType}${wave.boss ? ' (BOSS)' : ''}${wave.elite ? ' (ELITE)' : ''}`);
                spawnedCount++;
            } else {
                console.warn(`Failed to spawn ${enemyType}`);
            }
        }
        
        // console.log(`Wave spawning complete: ${spawnedCount} enemies spawned, Total enemies now: ${this.enemies.length}`);
    }
    
    /**
     * Advance to the next level
     */
    advanceToNextLevel() {
        if (!this.levelManager) return;
        
        const nextLevelConfig = this.levelManager.nextLevel();
        if (nextLevelConfig) {
            // console.log(`Advanced to Level ${this.levelManager.currentLevel}!`);
            // console.log(`Description: ${nextLevelConfig.description}`);
            
            // Clear any remaining enemies from previous level
            this.enemies = [];
            
            // The LevelManager will now handle wave spawning automatically
            // No need to manually spawn the first wave here
        } else {
            // console.log("Game completed! All levels finished!");
            // Could trigger victory screen here
        }
    }
    
    /**
     * Spawn a specific enemy type (used by level system)
     */
    spawnSpecificEnemyType(enemyType, isBoss = false, isElite = false) {
        const maxAttempts = 50;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const minDistanceFromPlayer = 120;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const enemySize = this.getEnemySizeForType(enemyType);
            const margin = enemySize + 32;
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = margin + Math.random() * (this.height - margin * 2);
            
            // Check distance from player
            const distanceFromPlayer = Math.sqrt(
                Math.pow(x - playerCenterX, 2) + Math.pow(y - playerCenterY, 2)
            );
            
            if (distanceFromPlayer < minDistanceFromPlayer) {
                continue;
            }
            
            // Validate position
            if (this.isValidSpawnPosition(x, y, enemySize)) {
                let enemy = this.createEnemyOfType(enemyType, x, y);
                if (enemy) {
                    // Make boss version if requested
                    if (isBoss) {
                        enemy.isBoss = true;
                        enemy.hp *= 3;
                        enemy.maxHp *= 3;
                        enemy.damage *= 2;
                        enemy.xpReward *= 5;
                        console.log(`Created BOSS ${enemyType}!`);
                    }
                    // Make elite version if requested
                    else if (isElite) {
                        enemy = this.createEliteEnemy(enemy);
                        console.log(`Created ELITE ${enemyType}!`);
                    }
                    
                    this.finalizeEnemySpawn(enemy);
                    return enemy;
                }
            }
        }
        
        console.warn(`Could not spawn ${enemyType} after ${maxAttempts} attempts`);
        return null;
    }
    
    updateItemSpawning(deltaTime) {
        // Remove despawned items
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].shouldDespawn) {
                // console.log(`Item despawned: ${this.items[i].name}`);
                this.items.splice(i, 1);
            }
        }
        
        this.itemSpawnTimer += deltaTime;
        
        // Balanced spawn rate: config-driven difficulty scaling
        const playerLevel = this.player.stats.level;
        const levelBonus = Math.min((playerLevel - 1) * this.config.itemCooldownReduction, 3000);
        const spawnCooldown = Math.max(this.itemSpawnCooldown - levelBonus, 5000);
        
        // Only spawn if under item limit and cooldown passed
        if (this.itemSpawnTimer >= spawnCooldown && this.items.length < this.maxItems) {
            this.spawnItem();
            this.itemSpawnTimer = 0;
            this.lastItemSpawnTime = Date.now();
        }
    }
    
    spawnItem() {
        const attempts = 50;
        
        for (let i = 0; i < attempts; i++) {
            const x = 50 + Math.random() * (this.width - 100);
            const y = 50 + Math.random() * (this.height - 100);
            
            // Check if position is on floor and away from player
            if (!this.dungeonMap.isSolid(x, y)) {
                const playerDistance = Math.sqrt(
                    Math.pow(x - this.player.x, 2) + Math.pow(y - this.player.y, 2)
                );
                
                // Only spawn if far enough from player
                if (playerDistance > 100) {
                    const itemType = Item.getRandomType();
                    const item = new Item(x, y, itemType);
                    this.items.push(item);
                    // console.log(`Spawned ${item.name} at (${Math.round(x)}, ${Math.round(y)})`);
                    return;
                }
            }
        }
        
        // console.log("Failed to find valid item spawn position");
    }
    
    collectPowerup(item) {
        // console.log(`Collected powerup: ${item.name}`);
        
        // Track powerup collection
        this.stats.powerupsCollected++;
        
        // Apply powerup effects
        switch (item.type) {
            case Item.TYPES.SWORD_RADIUS:
                this.playerPowerups.swordRadius += item.value;
                // console.log(`Sword radius increased! Total bonus: +${this.playerPowerups.swordRadius}`);
                break;
                
            case Item.TYPES.DAMAGE_BOOST:
                this.playerPowerups.damageBoost += item.value;
                this.player.stats.attack += item.value; // Directly increase attack
                // console.log(`Damage increased! Total bonus: +${this.playerPowerups.damageBoost}`);
                break;
                
            case Item.TYPES.SPEED_BOOST:
                this.playerPowerups.speedBoost += item.value;
                this.player.speed += item.value; // Directly increase speed
                // console.log(`Speed increased! Total bonus: +${this.playerPowerups.speedBoost}`);
                break;
                
            case Item.TYPES.HEALTH_BOOST:
                this.playerPowerups.healthBoost += item.value;
                this.player.stats.maxHp += item.value;
                this.player.stats.hp += item.value; // Also heal the player
                // console.log(`Max health increased! Total bonus: +${this.playerPowerups.healthBoost}`);
                break;
                
            case Item.TYPES.ATTACK_SPEED:
                this.playerPowerups.attackSpeed += item.value;
                // Attack speed bonus will be applied when checking attack cooldown
                // console.log(`Attack speed improved! Total bonus: -${this.playerPowerups.attackSpeed}ms`);
                break;
                
            case Item.TYPES.XP_MULTIPLIER:
                this.playerPowerups.xpMultiplier += item.value;
                // console.log(`XP multiplier increased! Total bonus: +${this.playerPowerups.xpMultiplier}%`);
                break;
        }
        
        // Show collection effect (could add visual feedback here)
        this.addDamageNumber(item.x + item.width/2, item.y, item.name, item.color);
    }
    
    // Get current effective attack range (base + powerups)
    getEffectiveAttackRange() {
        return this.playerAttackRange + this.playerPowerups.swordRadius;
    }
    
    // Get current effective attack damage (base + powerups) 
    getEffectiveAttackDamage() {
        return this.playerAttackDamage + this.playerPowerups.damageBoost;
    }
}