import { BaseEnemy } from './BaseEnemy.js';

export class Slime extends BaseEnemy {
    constructor(x, y) {
        const config = {
            width: 24,
            height: 24,
            maxHp: 30,
            speed: 170, // Increased for more aggression
            damage: 10,
            xpReward: 15,
            color: '#8BC34A',
            maxAttackCooldown: 800,
            preferredRange: 10 // Very close - slimes should be clingy
        };
        
        super(x, y, 'slime', config);
    }
    
    // Slimes use aggressive melee AI - get right up to the player
    updateAI(deltaTime, player, game, dx, dy, distance, dt, oldX, oldY) {
        this.aggressiveMeleeAI(player, dt, game);
    }
    
    // Green damage indicators for slime attacks
    getDamageColor() {
        return '#8BC34A'; // Green to match slime color
    }
}