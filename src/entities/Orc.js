import { BaseEnemy } from './BaseEnemy.js';

export class Orc extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 28,
            height: 28,
            maxHp: 50,
            speed: 200, // Increased for more aggression
            damage: 15,
            xpReward: 25,
            color: '#F44336',
            maxAttackCooldown: 800,
            preferredRange: 15 // Much closer - get in the player's face
        };
        
        super(x, y, 'orc', config);
    }
    
    // Orcs use aggressive melee AI - no formation, direct assault
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        this.aggressiveMeleeAI(player, dt, game);
    }
    
    // Red damage indicators for orc attacks
    getDamageColor() {
        return '#F44336'; // Red to match orc color
    }
}