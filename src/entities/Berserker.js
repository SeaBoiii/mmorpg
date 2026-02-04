import { BaseEnemy } from './BaseEnemy.js';

export class Berserker extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 26,
            height: 26,
            maxHp: 15, // Low HP
            speed: 250, // Very fast
            damage: 18, // High damage
            xpReward: 30,
            color: '#FF1744', // Bright red
            maxAttackCooldown: 600,
            preferredRange: 30 // Gets very close
        };
        
        super(x, y, 'berserker', config);
        
        // Berserker-specific properties
        this.chargeSpeed = 350; // Even faster when charging
        this.isCharging = false;
        this.chargeTarget = null;
        this.chargeCooldown = 0;
        this.maxChargeCooldown = 3000; // Charge every 3 seconds
    }
    
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Update charge cooldown
        if (this.chargeCooldown > 0) {
            this.chargeCooldown -= deltaTime;
        }
        
        // Start charging if close enough and cooldown ready
        if (!this.isCharging && distance < 200 && this.chargeCooldown <= 0) {
            this.startCharge(player);
        }
        
        if (this.isCharging) {
            this.chargeAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY);
        } else {
            // Normal aggressive movement - ignore formation, go straight for player
            this.aggressiveMeleeAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY);
        }
    }
    
    startCharge(player) {
        this.isCharging = true;
        this.chargeTarget = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2
        };
        this.chargeCooldown = this.maxChargeCooldown;
        // console.log(`${this.type} CHARGING!`);
    }
    
    chargeAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        if (!this.chargeTarget) {
            this.isCharging = false;
            return;
        }
        
        // Move towards charge target at high speed
        const targetDx = this.chargeTarget.x - (this.x + this.width / 2);
        const targetDy = this.chargeTarget.y - (this.y + this.height / 2);
        const targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        
        if (targetDistance > 5) {
            const moveX = (targetDx / targetDistance) * this.chargeSpeed * dt;
            const moveY = (targetDy / targetDistance) * this.chargeSpeed * dt;
            
            this.x += moveX;
            this.y += moveY;
            
            // Handle wall collisions during charge
            if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                this.x = oldX;
                this.y = oldY;
                this.isCharging = false; // Stop charge if hit wall
            }
        } else {
            // Reached target, stop charging
            this.isCharging = false;
            this.chargeTarget = null;
        }
    }
    
    aggressiveMeleeAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Simple direct movement toward player - no formation behavior
        const shouldMove = distance > 25 && !this.swordSwing.active;
            
        if (distance > 0 && shouldMove) {
            // Move directly toward player
            let moveX = (dx / distance) * this.speed * dt;
            let moveY = (dy / distance) * this.speed * dt;
            
            this.x += moveX;
            this.y += moveY;
            
            if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                this.x = oldX;
                this.y = oldY;
            }
        }
        
        // Melee attack with shorter range
        if (!this.swordSwing.active && distance < 40 && this.attackCooldown <= 0) {
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
    
    render(ctx) {
        super.render(ctx);
        
        // Add charge effect
        if (this.isCharging) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 20 + Math.sin(Date.now() * 0.01) * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}