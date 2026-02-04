import { BaseEnemy } from './BaseEnemy.js';

export class Shooter extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 22,
            height: 22,
            maxHp: 20,
            speed: 210, // Increased from 180 for more dynamic positioning
            damage: 8,
            xpReward: 20,
            color: '#FF9800',
            maxAttackCooldown: 800,
            preferredRange: 180 // Increased from 120 to better utilize longer shooting range
        };
        
        super(x, y, 'shooter', config);
        
        // Shooter-specific properties
        this.projectiles = [];
        this.shootCooldown = 0;
        this.maxShootCooldown = 1200;
        this.shootRange = 350; // Increased from 200 for long-range shooting
    }
    
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Update projectiles
        this.updateProjectiles(dt, game);
        
        // Update shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Calculate predicted player position (shorter prediction for more responsive movement)
        const predictionTime = 0.3; // Reduced from 0.7 for more responsive movement
        let predictedX = player.x + (player.velocity?.x || 0) * predictionTime;
        let predictedY = player.y + (player.velocity?.y || 0) * predictionTime;
        
        // Create formation around predicted position at preferred range
        const formationAngle = (this.formationIndex * Math.PI * 2 / 6) + (Date.now() * 0.002); // Faster rotation for more dynamic positioning
        const targetX = predictedX + Math.cos(formationAngle) * this.preferredRange;
        const targetY = predictedY + Math.sin(formationAngle) * this.preferredRange;
        
        // Calculate movement towards target formation position
        const targetDx = targetX - (this.x + this.width / 2);
        const targetDy = targetY - (this.y + this.height / 2);
        const targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        
        // Shooter movement AI - move towards formation position
        const shouldMove = targetDistance > 15; // Smaller tolerance for tighter formation
            
        if (targetDistance > 0 && shouldMove) {
            let moveX = (targetDx / targetDistance) * this.speed * dt;
            let moveY = (targetDy / targetDistance) * this.speed * dt;
            
            // Add very slight variation to prevent perfect overlap (minimal impact)
            const variation = 1.0 + Math.sin(Date.now() * 0.003 + this.formationIndex) * 0.05;
            moveX *= variation;
            moveY *= variation;
            
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
        
        // Shooting attack
        if (distance <= this.shootRange && this.shootCooldown <= 0) {
            this.shootProjectile(player);
        }
    }
    
    shootProjectile(player) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Calculate predicted player position for better accuracy
        const predictionTime = 0.4; // Reduced from 0.8 for more responsive targeting
        const predictedPlayerX = (player.x + player.width / 2) + (player.velocity?.x || 0) * predictionTime;
        const predictedPlayerY = (player.y + player.height / 2) + (player.velocity?.y || 0) * predictionTime;
        
        // Calculate direction to predicted position
        const dx = predictedPlayerX - centerX;
        const dy = predictedPlayerY - centerY;
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
            // console.log(`${this.type} shot projectile at player`);
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
                
                // Reset kill streak when player takes damage
                if (game && game.stats) {
                    game.stats.currentKillStreak = 0;
                }
                
                // Add damage indicator with shooter-specific color
                if (game.addDamageNumber) {
                    const playerCenterX = game.player.x + game.player.width / 2;
                    const playerCenterY = game.player.y + game.player.height / 2;
                    game.addDamageNumber(playerCenterX, playerCenterY - 20, proj.damage, this.getDamageColor());
                }
                
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
    
    renderSpecific(ctx) {
        // Render projectiles
        for (const proj of this.projectiles) {
            ctx.fillStyle = proj.color;
            ctx.fillRect(proj.x - proj.size/2, proj.y - proj.size/2, proj.size, proj.size);
        }
    }
    
    // Red damage indicators for shooter attacks (distinct from player's green)
    getDamageColor() {
        return '#FF0000'; // Bright red for clear distinction
    }
}