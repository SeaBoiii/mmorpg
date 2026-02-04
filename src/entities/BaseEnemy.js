export class BaseEnemy {
    constructor(x, y, type, config) {
        // console.log(`BaseEnemy constructor called with: x=${x}, y=${y}, type=${type}`);
        
        this.x = x;
        this.y = y;
        this.width = config.width || 28;
        this.height = config.height || 28;
        this.type = type;
        
        // console.log(`Enemy created with final position: x=${this.x}, y=${this.y}`);
        
        // Enemy stats from config
        this.maxHp = config.maxHp;
        this.hp = this.maxHp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.xpReward = config.xpReward;
        
        // Visual properties
        this.color = config.color;
        this.originalColor = this.color;
        this.isDead = false;
        
        // Death animation properties
        this.deathAnimation = {
            active: false,
            timer: 0,
            duration: 800, // 800ms death animation
            scale: 1,
            rotation: 0,
            opacity: 1
        };
        
        // AI properties
        this.attackCooldown = 0;
        this.maxAttackCooldown = config.maxAttackCooldown || 800;
        this.preferredRange = config.preferredRange || 50;
        
        // Formation and prediction properties
        this.formationIndex = 0; // Will be set by game when spawning
        this.predictedPlayerPos = { x: 0, y: 0 };
        this.formationOffset = { x: 0, y: 0 };
        
        // Pathfinding properties to prevent getting stuck
        this.stuckTimer = 0;
        this.lastPosition = { x: this.x, y: this.y };
        this.lastDistanceToPlayer = Infinity;
        this.stuckThreshold = 200; // Reduced to 200ms for faster unstuck detection
        this.randomMoveTimer = 0;
        this.progressCheckTimer = 0;
        this.wallAvoidanceAngle = 0; // For better wall navigation
        
        // Attack animation
        this.swordSwing = {
            active: false,
            timer: 0,
            duration: 300, // 300ms swing duration
            angle: 0,
            startAngle: 0,
            radius: 25 // Smaller than player
        };
        
        // Damage visual effects
        this.damageFlash = {
            active: false,
            timer: 0,
            duration: 150
        };
        
        this.hasBeenHit = false;
        this.hasDealtDamage = false;
        
        // Damage modifiers
        this.tempDamageMultiplier = 1; // Initialize to prevent NaN damage
    }
    
    update(deltaTime, player, game = null) {
        if (this.isDead && !this.deathAnimation.active) return;
        
        // Handle death animation
        if (this.deathAnimation.active) {
            this.deathAnimation.timer += deltaTime;
            const progress = this.deathAnimation.timer / this.deathAnimation.duration;
            
            if (progress >= 1) {
                // Animation complete, mark for removal
                this.deathAnimation.active = false;
                return;
            }
            
            // Animate death effects
            this.deathAnimation.scale = 1 - (progress * 0.8); // Shrink to 20% size
            this.deathAnimation.rotation = progress * Math.PI * 2; // Full rotation
            this.deathAnimation.opacity = 1 - progress; // Fade out
            
            // Change color to darker as it dies
            const fade = Math.floor(255 * (1 - progress));
            this.color = `rgb(${fade}, ${fade}, ${fade})`;
            
            return; // Don't do normal AI behavior during death
        }
        
        if (this.isDead) return;
        
        const dt = deltaTime / 1000;
        
        // Apply continuous effects for special enemies
        if (this.regeneration && !this.isDead) {
            // Elite slime regeneration
            this.hp = Math.min(this.maxHp, this.hp + (this.regeneration * dt));
        }
        
        if (this.berserkerMode && !this.isDead) {
            // Elite orc gets faster when damaged
            const healthPercent = this.hp / this.maxHp;
            if (!this.baseSpeed) this.baseSpeed = this.speed; // Store original speed
            const speedMultiplier = 2 - healthPercent; // Gets up to 2x speed at low health
            this.speed = Math.floor(this.baseSpeed * speedMultiplier);
        }
        
        // Safety check for deltaTime
        if (dt > 0.1) return;
        
        const oldX = this.x;
        const oldY = this.y;
        
        // Player distance calculation
        const dx = (player.x + player.width/2) - (this.x + this.width/2);
        const dy = (player.y + player.height/2) - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if making progress toward player
        this.progressCheckTimer += deltaTime;
        if (this.progressCheckTimer > 200) {
            if (Math.abs(distance - this.lastDistanceToPlayer) < 5) {
                this.stuckTimer += deltaTime;
            } else {
                this.stuckTimer = Math.max(0, this.stuckTimer - deltaTime);
            }
            this.lastDistanceToPlayer = distance;
            this.progressCheckTimer = 0;
        }
        
        // Update damage flash
        if (this.damageFlash.active) {
            this.damageFlash.timer += deltaTime;
            if (this.damageFlash.timer >= this.damageFlash.duration) {
                this.damageFlash.active = false;
                this.damageFlash.timer = 0;
                this.color = this.originalColor;
            }
        }
        
        // Update sword swing animation
        if (this.swordSwing.active) {
            this.swordSwing.timer += deltaTime;
            if (this.swordSwing.timer >= this.swordSwing.duration) {
                this.swordSwing.active = false;
                this.swordSwing.timer = 0;
            } else {
                const progress = this.swordSwing.timer / this.swordSwing.duration;
                this.swordSwing.angle = this.swordSwing.startAngle + (Math.PI * 2/3) * progress;
                
                // Check for player damage during swing (only once per swing)
                if (!this.hasDealtDamage && progress > 0.3 && progress < 0.7) {
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y + player.height / 2;
                    const enemyCenterX = this.x + this.width / 2;
                    const enemyCenterY = this.y + this.height / 2;
                    
                    const distToPlayer = Math.sqrt(
                        Math.pow(playerCenterX - enemyCenterX, 2) + 
                        Math.pow(playerCenterY - enemyCenterY, 2)
                    );
                    
                    if (distToPlayer < this.swordSwing.radius + 15) {
                        const multiplier = this.tempDamageMultiplier || 1; // Fallback to 1 if undefined
                        const actualDamage = Math.round(this.damage * multiplier);
                        
                        // Validate damage isn't NaN
                        if (isNaN(actualDamage)) {
                            console.error(`${this.type} calculated NaN damage! damage: ${this.damage}, multiplier: ${multiplier}`);
                            return;
                        }
                        
                        // console.log(`${this.type} hit player for ${actualDamage} damage!`);
                        player.takeDamage(actualDamage);
                        
                        // Reset kill streak when player takes damage
                        if (game && game.stats) {
                            game.stats.currentKillStreak = 0;
                        }
                        
                        // Add damage indicator with enemy-specific color
                        if (game && game.addDamageNumber) {
                            const damageColor = this.tempDamageMultiplier > 1 ? '#FF1744' : this.getDamageColor();
                            game.addDamageNumber(playerCenterX, playerCenterY - 20, actualDamage, damageColor);
                        }
                        
                        this.hasDealtDamage = true;
                    }
                }
            }
        }
        
        // Reset damage flag when not swinging
        if (!this.swordSwing.active) {
            this.hasDealtDamage = false;
        }
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // If stuck for too long, use random movement
        if (this.stuckTimer > this.stuckThreshold) {
            this.randomMoveTimer += deltaTime;
            if (this.randomMoveTimer > 150) {
                this.performRandomMovement(dt, game);
                this.randomMoveTimer = 0;
                if (Math.random() < 0.4) {
                    this.stuckTimer = 0;
                }
            }
            return; // Skip normal AI when doing random movement
        }
        
        // Call the specific enemy's AI behavior
        this.updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY);
    }
    
    // Override this method in specific enemy classes
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Default melee behavior
        this.meleeAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY);
    }
    
    meleeAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Calculate predicted player position based on velocity
        const predictionTime = 0.5; // Predict 0.5 seconds ahead
        let predictedX = player.x + (player.velocity?.x || 0) * predictionTime;
        let predictedY = player.y + (player.velocity?.y || 0) * predictionTime;
        
        // Add formation offset for coordinated encircling
        const formationRadius = 80;
        const formationAngle = (this.formationIndex * Math.PI * 2 / 8) + (Date.now() * 0.001); // Slowly rotating formation
        const formationX = predictedX + Math.cos(formationAngle) * formationRadius;
        const formationY = predictedY + Math.sin(formationAngle) * formationRadius;
        
        // Calculate movement towards formation position
        const formationDx = formationX - (this.x + this.width / 2);
        const formationDy = formationY - (this.y + this.height / 2);
        const formationDistance = Math.sqrt(formationDx * formationDx + formationDy * formationDy);
        
        // Enhanced pathfinding toward formation position (not just player)
        const shouldMove = formationDistance > 25 && !this.swordSwing.active;
            
        if (formationDistance > 0 && shouldMove) {
            // Move toward formation position
            let moveX = (formationDx / formationDistance) * this.speed * dt;
            let moveY = (formationDy / formationDistance) * this.speed * dt;
            
            // Add some variation to avoid clustering
            const noise = (Math.sin(Date.now() * 0.002 + this.formationIndex) * 0.15); // Reduced noise
            moveX *= (1 + noise);
            moveY *= (1 + noise);
            
            // Try direct movement first
            this.x += moveX;
            this.y += moveY;
            
            if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                // Revert and try smarter pathfinding
                this.x = oldX;
                this.y = oldY;
                
                // Try diagonal approaches with wall avoidance
                const angleToPlayer = Math.atan2(dy, dx);
                const avoidanceOffsets = [-Math.PI/4, Math.PI/4, -Math.PI/2, Math.PI/2];
                
                for (const offset of avoidanceOffsets) {
                    const testAngle = angleToPlayer + offset;
                    const testMoveX = Math.cos(testAngle) * this.speed * dt * 0.9; // Less speed reduction
                    const testMoveY = Math.sin(testAngle) * this.speed * dt * 0.9;
                    
                    this.x = oldX + testMoveX;
                    this.y = oldY + testMoveY;
                    
                    if (!game.dungeonMap || !this.checkCollisionWithWalls(game.dungeonMap)) {
                        break; // Found valid movement direction
                    }
                }
                
                // If all directions fail, revert to old position
                if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                    this.x = oldX;
                    this.y = oldY;
                    this.performRandomMovement(dt, game);
                }
            }
        }
        
        // Melee attack
        if (!this.swordSwing.active && distance < 50 && this.attackCooldown <= 0) {
            // Start sword swing animation
            const dx_attack = (player.x + player.width/2) - (this.x + this.width/2);
            const dy_attack = (player.y + player.height/2) - (this.y + this.height/2);
            const attackAngle = Math.atan2(dy_attack, dx_attack);
            
            this.swordSwing.active = true;
            this.swordSwing.timer = 0;
            this.swordSwing.startAngle = attackAngle - Math.PI / 3;
            this.swordSwing.angle = this.swordSwing.startAngle;
            this.hasDealtDamage = false;
            
            // console.log(`${this.type} starting sword swing at distance ${distance.toFixed(1)}!`);
        }
    }

    aggressiveMeleeAI(player, dt, game) {
        // More aggressive AI that charges directly at player with minimal hesitation
        const dx = (player.x + player.width/2) - (this.x + this.width/2);
        const dy = (player.y + player.height/2) - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Direct movement towards player - no dodging or formation keeping
        if (distance > this.preferredRange) {
            const moveSpeed = this.speed * dt;
            const moveDistance = Math.min(moveSpeed, distance - this.preferredRange);
            
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * moveDistance;
            const moveY = Math.sin(angle) * moveDistance;
            
            this.x += moveX;
            this.y += moveY;
            
            // Check for collisions and handle them simply
            if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                this.x -= moveX;
                this.y -= moveY;
                // Try moving around obstacles with simple side-step
                const sideAngle = angle + Math.PI/2;
                const sideX = Math.cos(sideAngle) * moveSpeed * 0.5;
                const sideY = Math.sin(sideAngle) * moveSpeed * 0.5;
                this.x += sideX;
                this.y += sideY;
                if (game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                    this.x -= sideX * 2; // Try other side
                    this.y -= sideY * 2;
                    if (game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                        this.x += sideX; // Reset
                        this.y += sideY;
                    }
                }
            }
        }
        
        // Attack when close enough
        if (!this.swordSwing.active && distance < 50 && this.attackCooldown <= 0) {
            const attackAngle = Math.atan2(dy, dx);
            
            this.swordSwing.active = true;
            this.swordSwing.timer = 0;
            this.swordSwing.startAngle = attackAngle - Math.PI / 3;
            this.swordSwing.angle = this.swordSwing.startAngle;
            this.hasDealtDamage = false;
            
            // console.log(`${this.type} starting sword swing at distance ${distance.toFixed(1)}!`);
        }
    }  
    
    // Get damage indicator color for this enemy type
    getDamageColor() {
        // Override in specific enemy classes for custom colors
        return '#FF4444'; // Default red
    }
    
    takeDamage(amount) {
        if (this.isDead) return;
        
        this.hp -= amount;
        this.hasBeenHit = true;
        
        // Start damage flash effect
        this.damageFlash.active = true;
        this.damageFlash.timer = 0;
        this.color = '#ffffff';
        
        // console.log(`${this.type} took ${amount} damage. HP: ${this.hp}/${this.maxHp}`);
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.deathAnimation.active = true;
            this.deathAnimation.timer = 0;
            // console.log(`${this.type} has died`);
        }
    }
    
    render(ctx) {
        if (this.isDead && !this.deathAnimation.active) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.save();
        
        // Elite glow effect
        if (this.isElite && this.eliteGlow) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
        }
        
        // Boss glow effect
        if (this.isBoss && this.bossGlow) {
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 20;
        }
        
        // Apply death animation transformations
        if (this.deathAnimation.active) {
            ctx.globalAlpha = this.deathAnimation.opacity;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathAnimation.rotation);
            ctx.scale(this.deathAnimation.scale, this.deathAnimation.scale);
            ctx.translate(-centerX, -centerY);
        }
        
        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Elite border
        if (this.isElite) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        
        // Boss border and label
        if (this.isBoss) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Boss label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', this.x + this.width/2, this.y - 2);
        }
        
        // Call specific enemy rendering if needed
        this.renderSpecific(ctx);
        
        ctx.restore();
        
        // Render sword swing if active
        if (this.swordSwing.active) {
            this.renderSwordSwing(ctx);
        }
        
        // Debug: Show HP bar (always show for elites/bosses)
        if (!this.isDead && (this.hp < this.maxHp || this.isElite || this.isBoss)) {
            const barWidth = this.isBoss ? this.width + 20 : this.width;
            const barHeight = this.isBoss ? 6 : 4;
            const barX = this.isBoss ? this.x - 10 : this.x;
            const barY = this.y - (this.isBoss ? 12 : 8);
            
            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar
            const healthPercent = this.hp / this.maxHp;
            if (this.isBoss) {
                ctx.fillStyle = '#FF4444';
            } else if (this.isElite) {
                ctx.fillStyle = '#FFD700';
            } else {
                ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.2 ? '#FF9800' : '#F44336');
            }
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
    
    // Override in specific enemies if needed
    renderSpecific(ctx) {
        // Default: no special rendering
    }
    
    renderSwordSwing(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const swordLength = this.swordSwing.radius;
        
        // Calculate sword end position
        const endX = centerX + Math.cos(this.swordSwing.angle) * swordLength;
        const endY = centerY + Math.sin(this.swordSwing.angle) * swordLength;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    checkCollisionWithWalls(dungeonMap) {
        const corners = [
            { x: this.x, y: this.y },
            { x: this.x + this.width, y: this.y },
            { x: this.x, y: this.y + this.height },
            { x: this.x + this.width, y: this.y + this.height }
        ];
        
        for (let corner of corners) {
            if (dungeonMap.isSolid(corner.x, corner.y)) {
                return true;
            }
        }
        return false;
    }
    
    performRandomMovement(dt, game) {
        const directions = [
            { x: 1, y: 0 },   // Right
            { x: -1, y: 0 },  // Left
            { x: 0, y: 1 },   // Down
            { x: 0, y: -1 },  // Up
            { x: 0.7, y: 0.7 },   // Diagonal down-right
            { x: -0.7, y: 0.7 },  // Diagonal down-left
            { x: 0.7, y: -0.7 },  // Diagonal up-right
            { x: -0.7, y: -0.7 }  // Diagonal up-left
        ];

        // Shuffle directions for variety
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        const oldX = this.x;
        const oldY = this.y;
        const moveDistance = this.speed * dt * 0.6; // Slower for careful navigation

        for (let dir of directions) {
            this.x = oldX + dir.x * moveDistance;
            this.y = oldY + dir.y * moveDistance;

            // Check bounds and walls
            if (this.x >= 0 && this.x + this.width <= game?.dungeonMap?.width * game?.dungeonMap?.tileSize &&
                this.y >= 0 && this.y + this.height <= game?.dungeonMap?.height * game?.dungeonMap?.tileSize &&
                (!game?.dungeonMap || !this.checkCollisionWithWalls(game.dungeonMap))) {
                return; // Found valid direction
            }
        }

        // If no direction worked, stay in place
        this.x = oldX;
        this.y = oldY;
    }
}