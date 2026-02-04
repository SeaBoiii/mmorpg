import { BaseEnemy } from './BaseEnemy.js';

export class Ghost extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 24,
            height: 24,
            maxHp: 30,
            speed: 140, // Fast and agile
            damage: 18, // High damage but fragile
            xpReward: 40,
            color: '#4A148C', // Dark purple
            maxAttackCooldown: 1200,
            preferredRange: 30
        };
        
        super(x, y, 'ghost', config);
        
        // Shadow Assassin properties
        this.stealthMode = false;
        this.stealthTimer = 0;
        this.maxStealthDuration = 3000; // 3 seconds invisible
        this.stealthCooldown = 0;
        this.maxStealthCooldown = 8000; // 8 second cooldown
        
        this.backstabMultiplier = 2.5; // Extra damage from behind
        this.shadowCloneActive = false;
        this.cloneCooldown = 0;
        this.maxCloneCooldown = 12000; // 12 second cooldown
        
        this.alpha = 1.0;
        this.phaseTimer = 0;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        
        // Shadow trail effect
        this.shadowTrail = [];
        this.maxTrailLength = 8;
    }
    
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Update cooldowns
        if (this.stealthCooldown > 0) {
            this.stealthCooldown -= deltaTime;
        }
        if (this.cloneCooldown > 0) {
            this.cloneCooldown -= deltaTime;
        }
        
        // Update stealth mode
        this.updateStealth(deltaTime, player, distance);
        
        // Update shadow trail
        this.updateShadowTrail();
        
        // AI behavior based on distance and stealth
        if (distance > 200 && this.stealthCooldown <= 0 && !this.stealthMode) {
            this.activateStealth();
        } else if (distance > 400 && this.cloneCooldown <= 0) {
            this.createShadowClone(player, game);
        }
        
        // Movement and attack logic
        this.shadowAssassinMovement(deltaTime, player, game, dx, dy, distance, dt);
    }
    
    updateStealth(deltaTime, player, distance) {
        if (this.stealthMode) {
            this.stealthTimer -= deltaTime;
            
            // Become visible when attacking or timer expires
            if (this.stealthTimer <= 0 || this.swordSwing.active || distance < 40) {
                this.stealthMode = false;
                this.alpha = 1.0;
                this.stealthCooldown = this.maxStealthCooldown;
            } else {
                // Gradually become more transparent
                const stealthProgress = 1 - (this.stealthTimer / this.maxStealthDuration);
                this.alpha = Math.max(0.15, 1 - stealthProgress * 0.85);
            }
        }
    }
    
    activateStealth() {
        this.stealthMode = true;
        this.stealthTimer = this.maxStealthDuration;
        // console.log(`${this.type} enters stealth mode!`);
    }
    
    createShadowClone(player, game) {
        // Create a visual shadow clone that confuses the player
        if (game && game.addDamageNumber) {
            game.addDamageNumber(this.x + this.width/2, this.y, 'SHADOW CLONE', '#9C27B0');
        }
        
        this.shadowCloneActive = true;
        this.cloneCooldown = this.maxCloneCooldown;
        
        // Clone lasts for 4 seconds
        setTimeout(() => {
            this.shadowCloneActive = false;
        }, 4000);
        
        // console.log(`${this.type} creates shadow clone!`);
    }
    
    updateShadowTrail() {
        // Add current position to trail
        this.shadowTrail.push({ x: this.x, y: this.y, alpha: 0.6 });
        
        // Limit trail length
        if (this.shadowTrail.length > this.maxTrailLength) {
            this.shadowTrail.shift();
        }
        
        // Fade trail
        this.shadowTrail.forEach((trail, index) => {
            trail.alpha *= 0.9;
        });
    }
    
    shadowAssassinMovement(deltaTime, player, game, dx, dy, distance, dt) {
        // Store player position for backstab detection
        this.lastPlayerX = player.x;
        this.lastPlayerY = player.y;
        
        // Calculate movement strategy
        let moveStrategy = 'direct'; // direct, flank, retreat
        
        if (this.stealthMode && distance < 100) {
            moveStrategy = 'flank'; // Try to get behind player
        } else if (distance < 60 && this.hp < this.maxHp * 0.3) {
            moveStrategy = 'retreat'; // Low health retreat
        }
        
        let targetX = player.x + player.width / 2;
        let targetY = player.y + player.height / 2;
        
        if (moveStrategy === 'flank') {
            // Try to position behind player for backstab
            const behindDistance = 50;
            const playerDirection = Math.atan2(player.velocity?.y || 0, player.velocity?.x || 0);
            targetX = (player.x + player.width / 2) - Math.cos(playerDirection) * behindDistance;
            targetY = (player.y + player.height / 2) - Math.sin(playerDirection) * behindDistance;
        } else if (moveStrategy === 'retreat') {
            // Move away from player
            const retreatDistance = 120;
            const angle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
            targetX = this.x + this.width / 2 + Math.cos(angle) * retreatDistance;
            targetY = this.y + this.height / 2 + Math.sin(angle) * retreatDistance;
        }
        
        // Calculate movement
        const targetDx = targetX - (this.x + this.width / 2);
        const targetDy = targetY - (this.y + this.height / 2);
        const targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        
        const shouldMove = targetDistance > 25;
        
        if (targetDistance > 0 && shouldMove) {
            // Faster movement in stealth
            const currentSpeed = this.stealthMode ? this.speed * 1.3 : this.speed;
            const moveX = (targetDx / targetDistance) * currentSpeed * dt;
            const moveY = (targetDy / targetDistance) * currentSpeed * dt;
            
            this.x += moveX;
            this.y += moveY;
            
            // Check wall collisions
            if (game && game.dungeonMap && game.dungeonMap.isSolid(this.x + this.width/2, this.y + this.height/2)) {
                this.x -= moveX;
                this.y -= moveY;
            }
        }
        
        // Attack logic with backstab bonus
        if (!this.swordSwing.active && distance < 60 && this.attackCooldown <= 0) {
            const isBackstab = this.checkBackstabPosition(player);
            
            if (isBackstab && game && game.addDamageNumber) {
                game.addDamageNumber(this.x + this.width/2, this.y - 20, 'BACKSTAB!', '#FF1744');
                // Increase damage for this attack
                this.tempDamageMultiplier = this.backstabMultiplier;
            }
            
            const dx_attack = (player.x + player.width/2) - (this.x + this.width/2);
            const dy_attack = (player.y + player.height/2) - (this.y + this.height/2);
            const attackAngle = Math.atan2(dy_attack, dx_attack);
            
            this.swordSwing.active = true;
            this.swordSwing.timer = 0;
            this.swordSwing.startAngle = attackAngle - Math.PI / 3;
            this.swordSwing.angle = this.swordSwing.startAngle;
            this.hasDealtDamage = false;
            
            // Exit stealth when attacking
            if (this.stealthMode) {
                this.stealthMode = false;
                this.alpha = 1.0;
                this.stealthCooldown = this.maxStealthCooldown;
            }
        }
    }
    
    checkBackstabPosition(player) {
        // Check if ghost is behind the player based on player's facing direction
        const ghostCenter = { x: this.x + this.width/2, y: this.y + this.height/2 };
        const playerCenter = { x: player.x + player.width/2, y: player.y + player.height/2 };
        
        // Assume player faces the direction they're moving, or forward if stationary
        const playerDirection = Math.atan2(player.velocity?.y || 0, player.velocity?.x || 1);
        const ghostDirection = Math.atan2(ghostCenter.y - playerCenter.y, ghostCenter.x - playerCenter.x);
        
        // Check if ghost is within 90 degrees behind the player
        let angleDiff = Math.abs(playerDirection - ghostDirection);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        return angleDiff > Math.PI * 0.6; // Within 108 degrees behind
    }
    
    render(ctx) {
        ctx.save();
        
        // Render shadow trail
        this.shadowTrail.forEach((trail, index) => {
            ctx.globalAlpha = trail.alpha * 0.3;
            ctx.fillStyle = this.color;
            ctx.fillRect(trail.x, trail.y, this.width * 0.7, this.height * 0.7);
        });
        
        // Render shadow clone if active
        if (this.shadowCloneActive) {
            ctx.globalAlpha = 0.4;
            const cloneOffset = 30;
            const cloneX = this.x + Math.sin(Date.now() * 0.01) * cloneOffset;
            const cloneY = this.y + Math.cos(Date.now() * 0.01) * cloneOffset;
            
            ctx.fillStyle = '#9C27B0';
            ctx.fillRect(cloneX, cloneY, this.width, this.height);
            
            // Clone glow
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#E1BEE7';
            ctx.beginPath();
            ctx.arc(cloneX + this.width/2, cloneY + this.height/2, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main ghost rendering
        ctx.globalAlpha = this.alpha;
        super.render(ctx);
        
        // Shadow aura effect
        if (!this.stealthMode || this.alpha > 0.3) {
            ctx.globalAlpha = this.alpha * 0.4;
            ctx.fillStyle = '#7B1FA2';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Stealth indicator
        if (this.stealthMode && this.stealthTimer > 1000) {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#9C27B0';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
        
        // Reset temp damage multiplier after rendering
        this.tempDamageMultiplier = 1;
    }
}