import { BaseEnemy } from './BaseEnemy.js';

export class Swarm extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 18, // Slightly larger
            height: 18,
            maxHp: 15, // More durable
            speed: 200, // Fast but not too fast
            damage: 8, // Reasonable damage
            xpReward: 12,
            color: '#795548', // Brown
            maxAttackCooldown: 600,
            preferredRange: 25
        };
        
        super(x, y, 'swarm', config);
        
        // Enhanced swarm properties
        this.swarmBehavior = true;
        this.noiseOffset = Math.random() * Math.PI * 2;
        this.swarmId = Math.random(); // Unique ID for this swarm group
        this.resurrectTimer = 0;
        this.maxResurrectTime = 5000; // 5 seconds to resurrect
        this.canResurrect = true;
        this.dodgeChance = 0.25; // 25% chance to dodge attacks
        this.dodgeCooldown = 0;
        this.maxDodgeCooldown = 2000; // 2 second dodge cooldown
        this.isResurrecting = false;
        this.resurrectProgress = 0;
        
        // Swarm coordination
        this.swarmMembers = [];
        this.formationRole = 'normal'; // 'normal', 'flanker', 'rusher'
        this.lastDamageTime = 0;
    }
    
    // Set reference to other swarm members for coordination
    setSwarmMembers(members) {
        this.swarmMembers = members;
    }
    
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Update cooldowns
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= deltaTime;
        }
        
        // Handle resurrection
        if (this.isDead && this.canResurrect) {
            this.handleResurrection(deltaTime, game);
            return;
        }
        
        // Enhanced swarm movement with coordination
        this.coordinatedSwarmMovement(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY);
    }
    
    handleResurrection(deltaTime, game) {
        if (!this.isResurrecting) {
            this.isResurrecting = true;
            this.resurrectTimer = this.maxResurrectTime;
            // console.log(`${this.type} beginning resurrection...`);
        }
        
        this.resurrectTimer -= deltaTime;
        this.resurrectProgress = 1 - (this.resurrectTimer / this.maxResurrectTime);
        
        if (this.resurrectTimer <= 0) {
            // Resurrect!
            this.isDead = false;
            this.hp = Math.floor(this.maxHp * 0.4); // Resurrect with 40% HP
            this.isResurrecting = false;
            this.canResurrect = false; // Can only resurrect once
            this.alpha = 1.0;
            
            if (game && game.addDamageNumber) {
                game.addDamageNumber(this.x + this.width/2, this.y, 'REVIVED!', '#00FF00');
            }
            
            // console.log(`${this.type} has been resurrected!`);
        }
    }
    
    coordinatedSwarmMovement(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        // Count living swarm members
        const livingMembers = this.swarmMembers.filter(m => !m.isDead || m.isResurrecting).length;
        
        // Get speed boost based on pack size
        const packBonus = Math.max(1, livingMembers * 0.1); // 10% speed per living member
        const currentSpeed = this.speed * packBonus;
        
        const shouldMove = distance > 20 && !this.swordSwing.active;
            
        if (distance > 0 && shouldMove) {
            let targetX = player.x + player.width/2;
            let targetY = player.y + player.height/2;
            
            // Formation behavior based on role and pack size
            if (livingMembers >= 2) {
                this.applyFormationBehavior(player, targetX, targetY, livingMembers);
            }
            
            // Calculate movement
            const targetDx = targetX - (this.x + this.width / 2);
            const targetDy = targetY - (this.y + this.height / 2);
            const targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            
            if (targetDistance > 0) {
                let baseX = (targetDx / targetDistance) * currentSpeed * dt;
                let baseY = (targetDy / targetDistance) * currentSpeed * dt;
                
                // Add swarm erratic movement (less chaotic than before)
                const time = Date.now() * 0.008 + this.noiseOffset;
                const erraticX = Math.sin(time * 0.5) * 20 * dt;
                const erraticY = Math.cos(time * 0.6) * 20 * dt;
                
                const moveX = baseX + erraticX;
                const moveY = baseY + erraticY;
                
                this.x += moveX;
                this.y += moveY;
                
                if (game && game.dungeonMap && this.checkCollisionWithWalls(game.dungeonMap)) {
                    this.x = oldX;
                    this.y = oldY;
                    this.noiseOffset += Math.PI / 6; // Less dramatic direction change
                }
            }
        }
        
        // Coordinated attack
        if (!this.swordSwing.active && distance < 30 && this.attackCooldown <= 0) {
            this.performSwarmAttack(player);
        }
    }
    
    applyFormationBehavior(player, targetX, targetY, livingMembers) {
        // Assign roles based on member count and position
        const memberIndex = this.swarmMembers.indexOf(this);
        
        if (livingMembers >= 3) {
            if (memberIndex === 0) {
                this.formationRole = 'rusher'; // Direct attack
            } else {
                this.formationRole = 'flanker'; // Try to surround
                const flankAngle = (memberIndex / livingMembers) * Math.PI * 2;
                const flankDistance = 60;
                targetX = player.x + player.width/2 + Math.cos(flankAngle) * flankDistance;
                targetY = player.y + player.height/2 + Math.sin(flankAngle) * flankDistance;
            }
        }
    }
    
    performSwarmAttack(player) {
        const dx_attack = (player.x + player.width/2) - (this.x + this.width/2);
        const dy_attack = (player.y + player.height/2) - (this.y + this.height/2);
        const attackAngle = Math.atan2(dy_attack, dx_attack);
        
        this.swordSwing.active = true;
        this.swordSwing.timer = 0;
        this.swordSwing.duration = 200; // Quick attack
        this.swordSwing.startAngle = attackAngle - Math.PI / 6;
        this.swordSwing.angle = this.swordSwing.startAngle;
        this.swordSwing.radius = 35;
        this.hasDealtDamage = false;
    }
    
    // Override takeDamage to add dodge chance
    takeDamage(amount) {
        // Check for dodge
        if (this.dodgeCooldown <= 0 && Math.random() < this.dodgeChance) {
            this.dodgeCooldown = this.maxDodgeCooldown;
            // console.log(`${this.type} dodged attack!`);
            
            // Visual dodge effect - quick dash away
            const dodgeDistance = 30;
            const dodgeAngle = Math.random() * Math.PI * 2;
            this.x += Math.cos(dodgeAngle) * dodgeDistance;
            this.y += Math.sin(dodgeAngle) * dodgeDistance;
            
            return; // No damage taken - early return
        }
        
        // Take normal damage by calling parent method
        this.lastDamageTime = Date.now();
        super.takeDamage(amount);
    }
    
    render(ctx) {
        ctx.save();
        
        // Handle resurrection visual
        if (this.isResurrecting) {
            ctx.globalAlpha = 0.3 + (this.resurrectProgress * 0.7);
            
            // Resurrection glow
            ctx.fillStyle = '#00FF88';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   this.width * (1 + this.resurrectProgress), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main body with pack coordination glow
        const livingMembers = this.swarmMembers.filter(m => !m.isDead || m.isResurrecting).length;
        if (livingMembers > 1) {
            // Pack glow - stronger with more members
            ctx.globalAlpha = 0.2 + (livingMembers * 0.1);
            ctx.fillStyle = '#FF8F00';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main swarm body
        ctx.globalAlpha = this.isDead ? 0.3 : 1.0;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Formation role indicator
        if (!this.isDead && this.formationRole !== 'normal') {
            ctx.strokeStyle = this.formationRole === 'rusher' ? '#FF0000' : '#00BFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }
        
        // Recently damaged flash
        if (Date.now() - this.lastDamageTime < 200) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
        
        // Render sword swing
        this.renderSwordSwing(ctx);
    }
    
    // Enhanced static method for coordinated swarm spawning
    static spawnSwarmGroup(centerX, centerY, count = 5) {
        const swarmEnemies = [];
        const radius = 50;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Add some randomness but keep formation
            const randomX = x + (Math.random() - 0.5) * 20;
            const randomY = y + (Math.random() - 0.5) * 20;
            
            const swarmMember = new Swarm(randomX, randomY);
            swarmEnemies.push(swarmMember);
        }
        
        // Set up coordination between swarm members
        swarmEnemies.forEach(member => {
            member.setSwarmMembers(swarmEnemies);
        });
        
        // console.log(`Spawned coordinated swarm group of ${count} members`);
        return swarmEnemies;
    }
}