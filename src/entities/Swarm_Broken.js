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
            console.log(`${this.type} beginning resurrection...`);
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
            
            console.log(`${this.type} has been resurrected!`);
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
    }\n    \n    performSwarmAttack(player) {\n        const dx_attack = (player.x + player.width/2) - (this.x + this.width/2);\n        const dy_attack = (player.y + player.height/2) - (this.y + this.height/2);\n        const attackAngle = Math.atan2(dy_attack, dx_attack);\n        \n        this.swordSwing.active = true;\n        this.swordSwing.timer = 0;\n        this.swordSwing.duration = 200; // Quick attack\n        this.swordSwing.startAngle = attackAngle - Math.PI / 6;\n        this.swordSwing.angle = this.swordSwing.startAngle;\n        this.swordSwing.radius = 35;\n        this.hasDealtDamage = false;\n    }\n    \n    // Override takeDamage to add dodge chance\n    takeDamage(amount) {\n        // Check for dodge\n        if (this.dodgeCooldown <= 0 && Math.random() < this.dodgeChance) {\n            this.dodgeCooldown = this.maxDodgeCooldown;\n            console.log(`${this.type} dodged attack!`);\n            \n            // Visual dodge effect - quick dash away\n            const dodgeDistance = 30;\n            const dodgeAngle = Math.random() * Math.PI * 2;\n            this.x += Math.cos(dodgeAngle) * dodgeDistance;\n            this.y += Math.sin(dodgeAngle) * dodgeDistance;\n            \n            return false; // No damage taken\n        }\n        \n        // Take normal damage\n        this.lastDamageTime = Date.now();\n        return super.takeDamage(amount);\n    }\n    \n    render(ctx) {\n        ctx.save();\n        \n        // Handle resurrection visual\n        if (this.isResurrecting) {\n            ctx.globalAlpha = 0.3 + (this.resurrectProgress * 0.7);\n            \n            // Resurrection glow\n            ctx.fillStyle = '#00FF88';\n            ctx.beginPath();\n            ctx.arc(this.x + this.width/2, this.y + this.height/2, \n                   this.width * (1 + this.resurrectProgress), 0, Math.PI * 2);\n            ctx.fill();\n        }\n        \n        // Main body with pack coordination glow\n        const livingMembers = this.swarmMembers.filter(m => !m.isDead || m.isResurrecting).length;\n        if (livingMembers > 1) {\n            // Pack glow - stronger with more members\n            ctx.globalAlpha = 0.2 + (livingMembers * 0.1);\n            ctx.fillStyle = '#FF8F00';\n            ctx.beginPath();\n            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width * 1.5, 0, Math.PI * 2);\n            ctx.fill();\n        }\n        \n        // Main swarm body\n        ctx.globalAlpha = this.isDead ? 0.3 : 1.0;\n        ctx.fillStyle = this.color;\n        ctx.fillRect(this.x, this.y, this.width, this.height);\n        \n        // Formation role indicator\n        if (!this.isDead && this.formationRole !== 'normal') {\n            ctx.strokeStyle = this.formationRole === 'rusher' ? '#FF0000' : '#00BFFF';\n            ctx.lineWidth = 2;\n            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);\n        }\n        \n        // Recently damaged flash\n        if (Date.now() - this.lastDamageTime < 200) {\n            ctx.globalAlpha = 0.7;\n            ctx.fillStyle = '#FFFFFF';\n            ctx.fillRect(this.x, this.y, this.width, this.height);\n        }\n        \n        ctx.restore();\n        \n        // Render sword swing\n        this.renderSwordSwing(ctx);\n    }\n    \n    // Enhanced static method for coordinated swarm spawning\n    static spawnSwarmGroup(centerX, centerY, count = 5) {\n        const swarmEnemies = [];\n        const radius = 50;\n        \n        for (let i = 0; i < count; i++) {\n            const angle = (i / count) * Math.PI * 2;\n            const x = centerX + Math.cos(angle) * radius;\n            const y = centerY + Math.sin(angle) * radius;\n            \n            // Add some randomness but keep formation\n            const randomX = x + (Math.random() - 0.5) * 20;\n            const randomY = y + (Math.random() - 0.5) * 20;\n            \n            const swarmMember = new Swarm(randomX, randomY);\n            swarmEnemies.push(swarmMember);\n        }\n        \n        // Set up coordination between swarm members\n        swarmEnemies.forEach(member => {\n            member.setSwarmMembers(swarmEnemies);\n        });\n        \n        console.log(`Spawned coordinated swarm group of ${count} members`);\n        return swarmEnemies;\n    }\n}