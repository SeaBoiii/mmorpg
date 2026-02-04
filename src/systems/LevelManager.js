/**
 * LevelManager - Handles linear dungeon progression
 * Each level introduces enemies gradually and has specific objectives
 */
export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 50; // Can expand later
        this.levelComplete = false;
        this.levelStartTime = 0;
        this.enemiesSpawned = 0;
        this.maxEnemiesForLevel = 0;
        this.spawnWaves = [];
        this.currentWave = 0;
        this.waveTimer = 0;
        this.levelTransitionDelay = 2000; // 2 seconds before next level
        this.waveEnemiesRemaining = 0; // Track enemies from current wave
        this.hasSpawnedFirstWave = false;
    }

    /**
     * Get level configuration for current level
     */
    getLevelConfig(levelNumber) {
        const config = {
            level: levelNumber,
            enemyTypes: [],
            maxEnemies: 5,
            spawnDelay: 2000,
            waves: [],
            isBossLevel: false,
            bossType: null,
            description: "",
            objective: "Defeat all enemies to advance"
        };

        // Tutorial levels - introduce one enemy type at a time (NO ELITES)
        if (levelNumber === 1) {
            config.enemyTypes = ['slime'];
            config.maxEnemies = 3;
            config.description = "Welcome! Defeat these harmless slimes to learn combat basics.";
            config.waves = [
                { enemies: ['slime', 'slime'], delay: 0 },
                { enemies: ['slime'], delay: 3000 }
            ];
        } else if (levelNumber === 2) {
            config.enemyTypes = ['orc'];
            config.maxEnemies = 3;
            config.description = "Orcs are tougher and faster than slimes. Be careful!";
            config.waves = [
                { enemies: ['orc'], delay: 0 },
                { enemies: ['orc', 'orc'], delay: 4000 }
            ];
        } else if (levelNumber === 3) {
            config.enemyTypes = ['shooter'];
            config.maxEnemies = 4;
            config.description = "Shooters attack from range. Keep moving to avoid their projectiles!";
            config.waves = [
                { enemies: ['shooter'], delay: 0 },
                { enemies: ['shooter'], delay: 3000 },
                { enemies: ['shooter', 'shooter'], delay: 6000 }
            ];
        } else if (levelNumber === 4) {
            config.enemyTypes = ['berserker'];
            config.maxEnemies = 2;
            config.description = "Berserkers charge at you aggressively. Time your dodges!";
            config.waves = [
                { enemies: ['berserker'], delay: 0 },
                { enemies: ['berserker'], delay: 5000 }
            ];
        } else if (levelNumber === 5) {
            config.enemyTypes = ['ghost'];
            config.maxEnemies = 3;
            config.description = "Shadow Assassins can turn invisible and deal backstab damage!";
            config.waves = [
                { enemies: ['ghost'], delay: 0 },
                { enemies: ['ghost', 'ghost'], delay: 4000 }
            ];
        } else if (levelNumber === 6) {
            config.enemyTypes = ['tank'];
            config.maxEnemies = 1;
            config.description = "Tanks are slow but incredibly tough. This will take time!";
            config.waves = [
                { enemies: ['tank'], delay: 0 }
            ];
        } else if (levelNumber === 7) {
            config.enemyTypes = ['swarm'];
            config.maxEnemies = 6;
            config.description = "Swarm enemies appear in groups. Handle them quickly!";
            config.waves = [
                { enemies: ['swarm'], delay: 0 }, // Will spawn multiple due to Swarm nature
                { enemies: ['swarm'], delay: 4000 }
            ];
        }
        
        // Basic mixed combat levels (NO ELITES)
        else if (levelNumber === 8) {
            config.enemyTypes = ['slime', 'orc'];
            config.maxEnemies = 5;
            config.description = "Now face multiple enemy types together!";
            config.waves = [
                { enemies: ['slime', 'orc'], delay: 0 },
                { enemies: ['slime', 'slime'], delay: 3000 },
                { enemies: ['orc', 'orc'], delay: 6000 }
            ];
        } else if (levelNumber === 9) {
            config.enemyTypes = ['orc', 'shooter'];
            config.maxEnemies = 6;
            config.description = "Melee and ranged combination - stay mobile!";
            config.waves = [
                { enemies: ['orc', 'shooter'], delay: 0 },
                { enemies: ['shooter', 'shooter'], delay: 4000 },
                { enemies: ['orc', 'orc'], delay: 7000 }
            ];
        }
        
        // First boss level
        else if (levelNumber === 10) {
            config.isBossLevel = true;
            config.maxEnemies = 1;
            config.description = "BOSS FIGHT! Defeat the mighty Tank Champion!";
            config.bossType = 'tank';
            config.waves = [
                { enemies: ['tank'], delay: 0, boss: true }
            ];
        }
        
        // ELITE INTRODUCTION LEVELS (11-17)
        else if (levelNumber === 11) {
            config.enemyTypes = ['slime'];
            config.maxEnemies = 3;
            config.description = "Elite enemies have a glowing aura and are much stronger!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['slime'], delay: 0, elite: true },
                { enemies: ['slime', 'slime'], delay: 4000, elite: true }
            ];
        } else if (levelNumber === 12) {
            config.enemyTypes = ['orc'];
            config.maxEnemies = 2;
            config.description = "Elite Orcs are faster and hit much harder!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['orc'], delay: 0, elite: true },
                { enemies: ['orc'], delay: 5000, elite: true }
            ];
        } else if (levelNumber === 13) {
            config.enemyTypes = ['shooter'];
            config.maxEnemies = 3;
            config.description = "Elite Shooters fire faster and more accurately!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['shooter'], delay: 0, elite: true },
                { enemies: ['shooter', 'shooter'], delay: 4000, elite: true }
            ];
        } else if (levelNumber === 14) {
            config.enemyTypes = ['berserker'];
            config.maxEnemies = 2;
            config.description = "Elite Berserkers charge relentlessly!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['berserker'], delay: 0, elite: true },
                { enemies: ['berserker'], delay: 6000, elite: true }
            ];
        } else if (levelNumber === 15) {
            config.enemyTypes = ['ghost'];
            config.maxEnemies = 2;
            config.description = "Elite Shadow Assassins are masters of stealth and deception!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['ghost'], delay: 0, elite: true },
                { enemies: ['ghost'], delay: 5000, elite: true }
            ];
        } else if (levelNumber === 16) {
            config.enemyTypes = ['tank'];
            config.maxEnemies = 1;
            config.description = "Elite Tank - prepare for a long battle!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['tank'], delay: 0, elite: true }
            ];
        } else if (levelNumber === 17) {
            config.enemyTypes = ['swarm'];
            config.maxEnemies = 4;
            config.description = "Elite Swarms move faster and coordinate better!";
            config.eliteOnly = true;
            config.waves = [
                { enemies: ['swarm'], delay: 0, elite: true },
                { enemies: ['swarm'], delay: 4000, elite: true }
            ];
        }
        
        // PROGRESSIVE MIXED COMBAT (18+)
        else if (levelNumber === 18) {
            config.enemyTypes = ['slime', 'orc', 'shooter'];
            config.maxEnemies = 6;
            config.description = "Mixed combat with elites - the real challenge begins!";
            config.waves = [
                { enemies: ['slime', 'orc'], delay: 0 },
                { enemies: ['shooter'], delay: 3000, elite: true },
                { enemies: ['slime', 'orc', 'shooter'], delay: 6000 }
            ];
        } else if (levelNumber === 19) {
            config.enemyTypes = ['orc', 'berserker', 'ghost'];
            config.maxEnemies = 5;
            config.description = "Aggressive melee fighters with a ghostly surprise!";
            config.waves = [
                { enemies: ['orc', 'berserker'], delay: 0 },
                { enemies: ['ghost'], delay: 4000, elite: true },
                { enemies: ['berserker', 'orc'], delay: 7000 }
            ];
        } 
        
        // Boss levels every 10 levels
        else if (levelNumber % 10 === 0) {
            config.isBossLevel = true;
            config.maxEnemies = 1;
            config.description = `Boss Level ${levelNumber}! Defeat the mighty Champion!`;
            
            // Different boss types based on level
            if (levelNumber === 20) config.bossType = 'berserker';
            else if (levelNumber === 30) config.bossType = 'ghost';
            else if (levelNumber === 40) config.bossType = 'shooter';
            else config.bossType = 'tank';
            
            config.waves = [
                { enemies: [config.bossType], delay: 0, boss: true }
            ];
        }
        
        // Advanced mixed combat levels (20+)
        else {
            const complexity = Math.min(Math.floor(levelNumber / 5), 7); // Increase complexity every 5 levels
            config.maxEnemies = Math.min(4 + complexity, 12);
            
            // Build enemy pool based on level
            const availableEnemies = ['slime', 'orc', 'shooter'];
            if (levelNumber >= 4) availableEnemies.push('berserker');
            if (levelNumber >= 5) availableEnemies.push('ghost');
            if (levelNumber >= 6 && levelNumber % 5 === 0) availableEnemies.push('tank');
            if (levelNumber >= 7) availableEnemies.push('swarm');
            
            config.enemyTypes = availableEnemies;
            config.description = `Level ${levelNumber} - Advanced mixed combat with elites!`;
            
            // Create dynamic waves with elite chances
            const waveCount = Math.min(2 + Math.floor(levelNumber / 10), 4);
            for (let i = 0; i < waveCount; i++) {
                const waveSize = Math.max(1, Math.floor(config.maxEnemies / waveCount));
                const wave = { enemies: [], delay: i * 4000 };
                
                // 30% chance for elite waves in advanced levels
                if (Math.random() < 0.3 && levelNumber >= 18) {
                    wave.elite = true;
                }
                
                for (let j = 0; j < waveSize; j++) {
                    const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                    wave.enemies.push(randomEnemy);
                }
                config.waves.push(wave);
            }
        }

        return config;
    }

    /**
     * Start a new level
     */
    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.levelComplete = false;
        this.levelStartTime = Date.now();
        this.enemiesSpawned = 0;
        this.currentWave = 0;
        this.waveTimer = 0;
        this.waveEnemiesRemaining = 0;
        this.hasSpawnedFirstWave = false;
        
        const config = this.getLevelConfig(levelNumber);
        this.maxEnemiesForLevel = config.maxEnemies;
        this.spawnWaves = config.waves;
        
        // console.log(`Starting Level ${levelNumber}: ${config.description}`);
        // console.log(`Total waves: ${this.spawnWaves.length}`);
        return config;
    }

    /**
     * Update level state with completion-based wave spawning
     */
    update(deltaTime, currentEnemyCount) {
        if (this.levelComplete) return;

        // console.log(`Level ${this.currentLevel} - Wave ${this.currentWave}/${this.spawnWaves.length}, Enemies: ${currentEnemyCount}, Wave Enemies Remaining: ${this.waveEnemiesRemaining}, First wave spawned: ${this.hasSpawnedFirstWave}`);

        // Spawn first wave immediately
        if (!this.hasSpawnedFirstWave && this.spawnWaves.length > 0) {
            const firstWave = this.spawnWaves[0];
            this.waveEnemiesRemaining = this.countEnemiesInWave(firstWave);
            this.currentWave = 1; // Mark first wave as spawned
            this.hasSpawnedFirstWave = true;
            // console.log(`Spawning first wave with ${this.waveEnemiesRemaining} enemies`);
            return { spawnWave: firstWave };
        }

        // Only check for wave completion if we have spawned the first wave
        // and give a small delay to ensure enemies are actually spawned
        if (!this.hasSpawnedFirstWave) {
            return null; // Don't advance until first wave is spawned
        }

        // Check if current wave is complete (no enemies from this wave remaining)
        const isCurrentWaveComplete = currentEnemyCount === 0;
        
        if (isCurrentWaveComplete) {
            // If there are more waves to spawn
            if (this.currentWave < this.spawnWaves.length) {
                const nextWave = this.spawnWaves[this.currentWave];
                this.waveEnemiesRemaining = this.countEnemiesInWave(nextWave);
                this.currentWave++;
                // console.log(`Previous wave completed! Spawning wave ${this.currentWave}/${this.spawnWaves.length} with ${this.waveEnemiesRemaining} enemies`);
                return { spawnWave: nextWave };
            }
            // All waves spawned and no enemies left = level complete
            else {
                // console.log(`All waves completed and no enemies remaining - completing level`);
                this.completeLevel();
            }
        }

        return null;
    }

    /**
     * Count total enemies that will be spawned in a wave
     */
    countEnemiesInWave(wave) {
        let count = 0;
        for (let enemyType of wave.enemies) {
            count += 1; // Each enemy type spawns 1 enemy now
        }
        return count;
    }
    
    /**
     * Mark level as complete
     */
    completeLevel() {
        if (!this.levelComplete) {
            this.levelComplete = true;
            const completionTime = Date.now() - this.levelStartTime;
            // console.log(`Level ${this.currentLevel} completed in ${(completionTime / 1000).toFixed(1)}s!`);
            return true;
        }
        return false;
    }

    /**
     * Check if player can advance to next level
     */
    canAdvanceLevel() {
        return this.levelComplete;
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        if (this.canAdvanceLevel() && this.currentLevel < this.maxLevel) {
            return this.startLevel(this.currentLevel + 1);
        }
        return null;
    }

    /**
     * Get current level status
     */
    getLevelStatus() {
        const config = this.getLevelConfig(this.currentLevel);
        return {
            level: this.currentLevel,
            description: config.description,
            objective: config.objective,
            waveProgress: `${Math.min(this.currentWave, this.spawnWaves.length)}/${this.spawnWaves.length}`,
            isComplete: this.levelComplete,
            isBossLevel: config.isBossLevel
        };
    }
}