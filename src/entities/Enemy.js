export class Enemy {
    constructor(x, y, type = 'slime') {
        console.log(`Enemy constructor called with: x=${x}, y=${y}, type=${type}`);
        
        this.x = x;
        this.y = y;
        // Size based on type
        if (type === 'shooter') {
            this.width = 22;  // Smaller than others
            this.height = 22;
        } else {
            this.width = 28;  // Standard size
            this.height = 28;
        }
        this.type = type;
        
        console.log(`Enemy created with final position: x=${this.x}, y=${this.y}`);
        
        // Enemy stats based on type
        if (type === 'shooter') {
            this.maxHp = 20;  // Less health
            this.speed = 180; // Fastest movement
            this.damage = 8;  // Less melee damage
            this.xpReward = 20;
        } else if (type === 'slime') {
            this.maxHp = 30;
            this.speed = 100;
            this.damage = 10;
            this.xpReward = 15;
        } else {
            this.maxHp = 50;
            this.speed = 150;
            this.damage = 15;
            this.xpReward = 25;
        }
        this.hp = this.maxHp;
        
        // Visual properties
        if (type === 'shooter') {
            this.color = '#FF9800'; // Orange color for shooters
        } else if (type === 'slime') {
            this.color = '#8BC34A'; // Green
        } else {
            this.color = '#F44336'; // Red
        }
        this.originalColor = this.color;
        this.isDead = false;
        
        // Projectile system for shooters
        this.projectiles = [];
        this.shootCooldown = 0;
        this.maxShootCooldown = type === 'shooter' ? 1200 : 0; // Shooters only
        this.shootRange = 200; // Maximum shooting distance
        
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
        this.maxAttackCooldown = 800; // Reduced from 1000ms to 800ms for more frequent attacks
        this.preferredRange = type === 'shooter' ? 120 : 50; // Shooters keep distance
        
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
        
        // Update projectiles for shooters
        if (this.type === 'shooter') {
            this.updateProjectiles(dt, game);
        }
        
        // Update shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Safety check for deltaTime
        if (isNaN(dt) || dt <= 0 || dt > 1) {
            return;
        }
        
        // Store old position for collision detection
        const oldX = this.x;
        const oldY = this.y;
        
        // Calculate distance to player (needed for multiple checks)
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate current distance to player for progress tracking
        const currentDistanceToPlayer = Math.sqrt(
            Math.pow(player.x + player.width/2 - (this.x + this.width/2), 2) + 
            Math.pow(player.y + player.height/2 - (this.y + this.height/2), 2)
        );
        
        // Check progress toward player instead of just movement
        this.progressCheckTimer += deltaTime;
        if (this.progressCheckTimer >= 200) { // Check every 200ms
            const progressMade = this.lastDistanceToPlayer - currentDistanceToPlayer;
            
            if (Math.abs(progressMade) < 2) { // Less than 2 pixels closer to player
                this.stuckTimer += this.progressCheckTimer;
            } else {
                this.stuckTimer = 0;
            }
            
            this.lastDistanceToPlayer = currentDistanceToPlayer;
            this.progressCheckTimer = 0;
        }
        
        // Update sword swing animation first (independent of movement/distance)
        if (this.swordSwing.active) {
            this.swordSwing.timer += deltaTime;
            
            if (this.swordSwing.timer >= this.swordSwing.duration) {
                this.swordSwing.active = false;
                this.attackCooldown = this.maxAttackCooldown;
                console.log(`${this.type} finished sword swing, cooldown reset`);
            } else {
                // Animate sword swing with wider arc
                const progress = this.swordSwing.timer / this.swordSwing.duration;
                this.swordSwing.angle = this.swordSwing.startAngle + (Math.PI * 2/3) * progress;
                
                // Deal damage at the middle of the swing (once per swing)
                if (progress > 0.3 && progress < 0.7 && !this.hasDealtDamage) {
                    const damageDealt = player.takeDamage(this.damage);
                    
                    if (damageDealt && game && game.addDamageNumber) {
                        const playerCenterX = player.x + player.width / 2;
                        const playerCenterY = player.y + player.height / 2;
                        game.addDamageNumber(playerCenterX, playerCenterY - 20, this.damage, '#FF4444');
                    }
                    
                    this.hasDealtDamage = true;
                    console.log(`${this.type} dealt ${this.damage} damage to player during swing!`);
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
        
        // Enhanced pathfinding toward player (different behavior for shooters)
        const shouldMove = this.type === 'shooter' ? 
            (distance > this.preferredRange || distance < this.preferredRange - 20) : // Shooters maintain distance
            (distance > 40 && !this.swordSwing.active); // Melee enemies close in
            
        if (distance > 0 && shouldMove) {
            let moveX, moveY;
            
            if (this.type === 'shooter' && distance < this.preferredRange) {
                // Shooter too close - move away from player
                moveX = -(dx / distance) * this.speed * dt * 0.7;
                moveY = -(dy / distance) * this.speed * dt * 0.7;
            } else {
                // Move toward player
                moveX = (dx / distance) * this.speed * dt;
                moveY = (dy / distance) * this.speed * dt;
            }
            
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
                    const testMoveX = Math.cos(testAngle) * this.speed * dt * 0.8;
                    const testMoveY = Math.sin(testAngle) * this.speed * dt * 0.8;
                    
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
        
        // Attack behavior based on enemy type
        if (this.type === 'shooter') {
            // Shooter: ranged attack with projectiles
            if (distance <= this.shootRange && this.shootCooldown <= 0) {
                this.shootProjectile(player);
            }
        } else {
            // Melee enemies: sword swing attack
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
                
                console.log(`${this.type} starting sword swing at distance ${distance.toFixed(1)}!`);
            }
        }
    }
    
    render(ctx) {
        if (this.isDead && !this.deathAnimation.active) return;
        
        // Debug logging
        if (Math.random() < 0.05) {
            console.log(`Rendering enemy at ${this.x}, ${this.y}`);
        }
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.save();
        
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
        
        // Render projectiles for shooters
        if (this.type === 'shooter') {
            this.renderProjectiles(ctx);
        }
        
        // Don't draw eyes or health bar during death animation
        if (!this.deathAnimation.active) {
            // Draw simple eyes (adjusted for smaller size)
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x + 6, this.y + 8, 4, 4);  // Adjusted positions for 28x28 size
            ctx.fillRect(this.x + 18, this.y + 8, 4, 4); // Adjusted positions for 28x28 size
            
            // Draw health bar above enemy
            if (this.hp < this.maxHp) {
                const barWidth = 32; // Slightly smaller bar for smaller enemy
                const barHeight = 3;
                const barX = this.x - 2;
                const barY = this.y - 8;
                
                // Background bar
                ctx.fillStyle = 'red';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Health bar
                ctx.fillStyle = 'green';
                const healthWidth = (this.hp / this.maxHp) * barWidth;
                ctx.fillRect(barX, barY, healthWidth, barHeight);
            }
        }
        
        // Draw sword swing if active
        if (this.swordSwing.active) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const progress = this.swordSwing.timer / this.swordSwing.duration;
            
            // Draw swing trail with gradient effect
            ctx.strokeStyle = `rgba(204, 68, 68, ${0.8 - progress * 0.4})`; // Fade during swing
            ctx.lineWidth = 3 + Math.sin(progress * Math.PI) * 2; // Thickness varies during swing
            
            // Draw the main swing arc
            ctx.beginPath();
            ctx.arc(
                centerX,
                centerY,
                this.swordSwing.radius,
                this.swordSwing.startAngle,
                this.swordSwing.angle
            );
            ctx.stroke();
            
            // Add swing effect lines for more visual impact
            const numLines = 3;
            for (let i = 0; i < numLines; i++) {
                const offsetRadius = this.swordSwing.radius - (i * 4);
                if (offsetRadius > 10) {
                    ctx.strokeStyle = `rgba(255, 100, 100, ${0.3 - progress * 0.2})`;
                    ctx.lineWidth = 2 - i * 0.5;
                    ctx.beginPath();
                    ctx.arc(
                        centerX,
                        centerY,
                        offsetRadius,
                        this.swordSwing.startAngle + (i * 0.1),
                        this.swordSwing.angle - (i * 0.1)
                    );
                    ctx.stroke();
                }
            }
            
            // Draw sword tip indicator
            const tipX = centerX + Math.cos(this.swordSwing.angle) * this.swordSwing.radius;
            const tipY = centerY + Math.sin(this.swordSwing.angle) * this.swordSwing.radius;
            ctx.fillStyle = `rgba(255, 200, 0, ${0.8 - progress * 0.6})`;
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            
            // Start death animation instead of immediate removal
            this.deathAnimation.active = true;
            this.deathAnimation.timer = 0;
            
            console.log(`${this.type} defeated! Starting death animation.`);
        }
        return this.isDead;
    }
    
    // Check if point (like mouse click) is inside enemy
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    // Check collision with dungeon walls
    checkCollisionWithWalls(dungeonMap) {
        // Check enemy corners for collision
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
    
    // Try alternative movement when blocked by walls
    tryAlternativeMovement(oldX, oldY, dx, dy, dt, dungeonMap) {
        const moveDistance = this.speed * dt;
        
        // Try moving only horizontally first
        if (Math.abs(dx) > Math.abs(dy)) {
            this.x = oldX + (dx > 0 ? moveDistance : -moveDistance);
            this.y = oldY;
            
            if (this.checkCollisionWithWalls(dungeonMap)) {
                // Horizontal blocked, try vertical
                this.x = oldX;
                this.y = oldY + (dy > 0 ? moveDistance : -moveDistance);
                
                if (this.checkCollisionWithWalls(dungeonMap)) {
                    // Both blocked, try diagonal alternatives
                    this.x = oldX;
                    this.y = oldY;
                    this.tryDiagonalMovement(oldX, oldY, dx, dy, moveDistance, dungeonMap);
                }
            }
        } else {
            // Try vertical first
            this.x = oldX;
            this.y = oldY + (dy > 0 ? moveDistance : -moveDistance);
            
            if (this.checkCollisionWithWalls(dungeonMap)) {
                // Vertical blocked, try horizontal
                this.x = oldX + (dx > 0 ? moveDistance : -moveDistance);
                this.y = oldY;
                
                if (this.checkCollisionWithWalls(dungeonMap)) {
                    // Both blocked, try diagonal alternatives
                    this.x = oldX;
                    this.y = oldY;
                    this.tryDiagonalMovement(oldX, oldY, dx, dy, moveDistance, dungeonMap);
                }
            }
        }
    }
    
    // Try diagonal movement alternatives when stuck
    tryDiagonalMovement(oldX, oldY, dx, dy, moveDistance, dungeonMap) {
        const alternatives = [
            { x: moveDistance * 0.5, y: dy > 0 ? moveDistance : -moveDistance },
            { x: dx > 0 ? moveDistance : -moveDistance, y: moveDistance * 0.5 },
            { x: moveDistance * 0.5, y: dy > 0 ? -moveDistance : moveDistance },
            { x: dx > 0 ? -moveDistance : moveDistance, y: moveDistance * 0.5 }
        ];
        
        for (let alt of alternatives) {
            this.x = oldX + alt.x;
            this.y = oldY + alt.y;
            
            if (!this.checkCollisionWithWalls(dungeonMap)) {
                return; // Found valid alternative movement
            }
        }
        
        // No alternatives worked, stay in place
        this.x = oldX;
        this.y = oldY;
    }
    
    // Perform intelligent random movement when stuck
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
        
        // Try random directions until one works
        const shuffled = directions.sort(() => Math.random() - 0.5);
        
        for (let dir of shuffled) {
            const oldX = this.x;
            const oldY = this.y;
            const moveDistance = this.speed * dt * 0.5; // Slower when stuck
            
            this.x += dir.x * moveDistance;
            this.y += dir.y * moveDistance;
            
            if (!game || !game.dungeonMap || !this.checkCollisionWithWalls(game.dungeonMap)) {
                // Valid move found
                console.log(`Enemy unstuck with random movement: ${dir.x}, ${dir.y}`);
                return;
            } else {
                // Revert and try next direction
                this.x = oldX;
                this.y = oldY;
            }
        }
        
        // If no direction works, nudge slightly
        this.x += (Math.random() - 0.5) * 2;
        this.y += (Math.random() - 0.5) * 2;
    }
    
    shootProjectile(player) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        // Calculate direction to player
        const dx = playerCenterX - centerX;
        const dy = playerCenterY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const projectile = {
                x: centerX,
                y: centerY,
                vx: (dx / distance) * 250, // Projectile speed
                vy: (dy / distance) * 250,
                size: 4,
                color: '#FFD700', // Golden projectile
                damage: this.damage,
                life: 2000 // 2 seconds lifetime
            };
            
            this.projectiles.push(projectile);
            this.shootCooldown = this.maxShootCooldown;
            console.log(`${this.type} shot projectile at player`);
        }
    }
    
    updateProjectiles(dt, game) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Update position
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            
            // Update lifetime
            proj.life -= dt * 1000;
            
            // Remove if expired or hit walls
            if (proj.life <= 0 || 
                (game && game.dungeonMap && game.dungeonMap.isSolid(proj.x, proj.y))) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (game && game.player && this.checkProjectilePlayerCollision(proj, game.player)) {
                // Damage player
                game.player.takeDamage(proj.damage);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkProjectilePlayerCollision(projectile, player) {
        return projectile.x >= player.x && 
               projectile.x <= player.x + player.width &&
               projectile.y >= player.y && 
               projectile.y <= player.y + player.height;
    }
    
    renderProjectiles(ctx) {
        for (const proj of this.projectiles) {
            ctx.fillStyle = proj.color;
            ctx.fillRect(proj.x - proj.size/2, proj.y - proj.size/2, proj.size, proj.size);
        }
    }
}