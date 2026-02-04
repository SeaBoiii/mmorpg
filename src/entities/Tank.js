import { BaseEnemy } from './BaseEnemy.js';

export class Tank extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 36, // Larger than other enemies
            height: 36,
            maxHp: 120, // Very high HP
            speed: 60, // Very slow
            damage: 25, // High damage
            xpReward: 50,
            color: '#424242', // Dark gray
            maxAttackCooldown: 1200,
            preferredRange: 45
        };
        
        super(x, y, 'tank', config);
        
        // Tank-specific properties
        this.chargeAttackRange = 60;
        this.isHeavyAttacking = false;
        this.heavyAttackCooldown = 0;
        this.maxHeavyAttackCooldown = 4000; // Heavy attack every 4 seconds
        this.stunned = false;
        this.stunnedTimer = 0;
    }
    
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Update heavy attack cooldown
        if (this.heavyAttackCooldown > 0) {
            this.heavyAttackCooldown -= deltaTime;
        }
        
        // Reset heavy attack state when sword swing finishes
        if (this.isHeavyAttacking && !this.swordSwing.active) {
            this.isHeavyAttacking = false;
        }
        
        // Update stun
        if (this.stunned) {
            this.stunnedTimer -= deltaTime;
            if (this.stunnedTimer <= 0) {
                this.stunned = false;
            }
            return; // Can't move while stunned
        }
        
        // Tank movement - very slow and direct
        this.tankMovement(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY);
        
        // Heavy attack if close enough and cooldown ready
        if (!this.isHeavyAttacking && !this.swordSwing.active && 
            distance < this.chargeAttackRange && this.heavyAttackCooldown <= 0) {
            this.startHeavyAttack(player);
        }
    }
    
    tankMovement(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        const shouldMove = distance > 40 && !this.swordSwing.active && !this.isHeavyAttacking;
            
        if (distance > 0 && shouldMove) {
            // Very slow, direct movement toward player
            let moveX = (dx / distance) * this.speed * dt;
            let moveY = (dy / distance) * this.speed * dt;
            
            this.x += moveX;
            this.y += moveY;
            
            if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                this.x = oldX;
                this.y = oldY;
                
                // Try alternative movement directions to avoid getting stuck
                const angleToPlayer = Math.atan2(dy, dx);
                const avoidanceOffsets = [-Math.PI/3, Math.PI/3, -Math.PI/2, Math.PI/2];
                
                let foundPath = false;
                for (const offset of avoidanceOffsets) {
                    const testAngle = angleToPlayer + offset;
                    const testMoveX = Math.cos(testAngle) * this.speed * dt * 0.7;
                    const testMoveY = Math.sin(testAngle) * this.speed * dt * 0.7;
                    
                    this.x = oldX + testMoveX;
                    this.y = oldY + testMoveY;
                    
                    if (!game.dungeonMap || !this.checkCollisionWithWalls(game.dungeonMap)) {
                        foundPath = true;
                        break;
                    }
                }
                
                // Only stun if completely stuck
                if (!foundPath) {
                    this.x = oldX;
                    this.y = oldY;
                    this.stunned = true;
                    this.stunnedTimer = 200; // Reduced from 500ms to 200ms
                }
            }
        }
        
        // Regular attack
        if (!this.swordSwing.active && !this.isHeavyAttacking && 
            distance < 50 && this.attackCooldown <= 0) {
            const dx_attack = (player.x + player.width/2) - (this.x + this.width/2);
            const dy_attack = (player.y + player.height/2) - (this.y + this.height/2);
            const attackAngle = Math.atan2(dy_attack, dx_attack);
            
            this.swordSwing.active = true;
            this.swordSwing.timer = 0;
            this.swordSwing.startAngle = attackAngle - Math.PI / 3;
            this.swordSwing.angle = this.swordSwing.startAngle;
            this.hasDealtDamage = false;
        }
    }
    
    startHeavyAttack(player) {
        this.isHeavyAttacking = true;
        this.heavyAttackCooldown = this.maxHeavyAttackCooldown;
        
        // Heavy attack uses larger sword swing
        const dx_attack = (player.x + player.width/2) - (this.x + this.width/2);
        const dy_attack = (player.y + player.height/2) - (this.y + this.height/2);
        const attackAngle = Math.atan2(dy_attack, dx_attack);
        
        this.swordSwing.active = true;
        this.swordSwing.timer = 0;
        this.swordSwing.duration = 400; // Slower heavy attack
        this.swordSwing.startAngle = attackAngle - Math.PI / 2; // Wider arc
        this.swordSwing.angle = this.swordSwing.startAngle;
        // Note: radius will be calculated by getEffectiveAttackRange() in BaseEnemy
        this.hasDealtDamage = false;
        
        // console.log(`${this.type} HEAVY ATTACK!`);
    }
    
    // Override damage for heavy attacks
    takeDamage(amount) {
        // Tanks take reduced damage
        const actualDamage = Math.ceil(amount * 0.7); // 30% damage reduction
        return super.takeDamage(actualDamage);
    }
    
    render(ctx) {
        ctx.save();
        
        // Tint red if stunned
        if (this.stunned) {
            ctx.fillStyle = '#FF5722';
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Draw larger tank body
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw tank treads/base
        ctx.fillStyle = '#212121';
        ctx.fillRect(this.x + 2, this.y + this.height - 6, this.width - 4, 4);
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 4);
        
        // Heavy attack warning
        if (this.heavyAttackCooldown < 1000 && this.heavyAttackCooldown > 0) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#FF9800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.chargeAttackRange, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Render sword swing with potentially larger radius
        this.renderSwordSwing(ctx);
    }
}