export class Item {
    static TYPES = {
        SWORD_RADIUS: 'sword_radius',
        DAMAGE_BOOST: 'damage_boost',
        SPEED_BOOST: 'speed_boost',
        HEALTH_BOOST: 'health_boost',
        ATTACK_SPEED: 'attack_speed',
        XP_MULTIPLIER: 'xp_multiplier'
    };
    
    static CONFIG = {
        [Item.TYPES.SWORD_RADIUS]: {
            name: 'Sword Extension',
            color: '#FFD700',
            glowColor: '#FFFF00',
            value: 8,
            description: '+8 sword radius',
            rarity: 0.3
        },
        [Item.TYPES.DAMAGE_BOOST]: {
            name: 'Damage Crystal',
            color: '#FF4444',
            glowColor: '#FF8888',
            value: 3,
            description: '+3 damage',
            rarity: 0.25
        },
        [Item.TYPES.SPEED_BOOST]: {
            name: 'Speed Potion',
            color: '#44FF44',
            glowColor: '#88FF88',
            value: 15,
            description: '+15 movement speed',
            rarity: 0.2
        },
        [Item.TYPES.HEALTH_BOOST]: {
            name: 'Health Orb',
            color: '#FF44FF',
            glowColor: '#FF88FF',
            value: 20,
            description: '+20 max health',
            rarity: 0.15
        },
        [Item.TYPES.ATTACK_SPEED]: {
            name: 'Swift Gem',
            color: '#44FFFF',
            glowColor: '#88FFFF',
            value: 30,
            description: '-30ms attack cooldown',
            rarity: 0.08
        },
        [Item.TYPES.XP_MULTIPLIER]: {
            name: 'Wisdom Scroll',
            color: '#8844FF',
            glowColor: '#AA88FF',
            value: 0.2,
            description: '+20% XP gain',
            rarity: 0.02
        }
    };
    
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 16;
        this.height = 16;
        
        const config = Item.CONFIG[type];
        this.name = config.name;
        this.color = config.color;
        this.glowColor = config.glowColor;
        this.value = config.value;
        this.description = config.description;
        
        // Visual effects
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.bobOffset = 0;
        this.bobSpeed = 0.003; // Slow bobbing animation
        
        // Spawn animation
        this.spawnAnimation = {
            active: true,
            timer: 0,
            duration: 500,
            scale: 0
        };
        
        // Despawn timer - items disappear after 5 seconds
        this.despawnTimer = 0;
        this.despawnDuration = 5000; // 5 seconds
        this.shouldDespawn = false;
        
        // console.log(`Item spawned: ${this.name} at (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    update(deltaTime) {
        // Update spawn animation
        if (this.spawnAnimation.active) {
            this.spawnAnimation.timer += deltaTime;
            const progress = Math.min(this.spawnAnimation.timer / this.spawnAnimation.duration, 1);
            this.spawnAnimation.scale = this.easeOutBounce(progress);
            
            if (progress >= 1) {
                this.spawnAnimation.active = false;
                this.spawnAnimation.scale = 1;
            }
        }
        
        // Update glow effect
        this.glowIntensity += this.glowDirection * deltaTime * 0.002;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
        
        // Update bobbing animation
        this.bobOffset += deltaTime;
        
        // Update despawn timer
        this.despawnTimer += deltaTime;
        if (this.despawnTimer >= this.despawnDuration) {
            this.shouldDespawn = true;
        }
    }
    
    render(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const bobY = Math.sin(this.bobOffset * this.bobSpeed) * 3;
        const scale = this.spawnAnimation.active ? this.spawnAnimation.scale : 1;
        
        ctx.save();
        
        // Apply scale and position
        ctx.translate(centerX, centerY + bobY);
        ctx.scale(scale, scale);
        
        // Draw glow effect (flash red when about to despawn)
        const timeLeft = this.despawnDuration - this.despawnTimer;
        const isWarning = timeLeft < 3000; // Last 3 seconds
        const glowSize = 20 + this.glowIntensity * 10;
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        
        if (isWarning && Math.floor(timeLeft / 200) % 2 === 0) {
            // Flash red when about to despawn
            glowGradient.addColorStop(0, '#ff000060');
            glowGradient.addColorStop(0.7, '#ff000030');
            glowGradient.addColorStop(1, '#ff000000');
        } else {
            glowGradient.addColorStop(0, this.glowColor + '40');
            glowGradient.addColorStop(0.7, this.glowColor + '20');
            glowGradient.addColorStop(1, this.glowColor + '00');
        }
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
        
        // Draw item body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw item border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw item symbol based on type
        this.drawSymbol(ctx);
        
        ctx.restore();
    }
    
    drawSymbol(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch (this.type) {
            case Item.TYPES.SWORD_RADIUS:
                ctx.fillText('⚔', 0, 0);
                break;
            case Item.TYPES.DAMAGE_BOOST:
                ctx.fillText('💥', 0, 0);
                break;
            case Item.TYPES.SPEED_BOOST:
                ctx.fillText('⚡', 0, 0);
                break;
            case Item.TYPES.HEALTH_BOOST:
                ctx.fillText('❤', 0, 0);
                break;
            case Item.TYPES.ATTACK_SPEED:
                ctx.fillText('⏱', 0, 0);
                break;
            case Item.TYPES.XP_MULTIPLIER:
                ctx.fillText('📜', 0, 0);
                break;
        }
    }
    
    // Check collision with player
    checkCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
    
    // Easing function for spawn animation
    easeOutBounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
    
    // Get a random item type based on rarity
    static getRandomType() {
        const rand = Math.random();
        let cumulativeRarity = 0;
        
        for (const [type, config] of Object.entries(Item.CONFIG)) {
            cumulativeRarity += config.rarity;
            if (rand <= cumulativeRarity) {
                return type;
            }
        }
        
        // Fallback to most common item
        return Item.TYPES.SWORD_RADIUS;
    }
}