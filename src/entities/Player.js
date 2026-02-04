export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;  // Reduced from 48 to fit through 32px tile passages
        this.height = 24; // Reduced from 48 to fit through 32px tile passages
        this.speed = 200; // pixels per second
        
        // Velocity tracking for enemy AI prediction
        this.velocity = { x: 0, y: 0 };
        this.lastPosition = { x: x, y: y };
        
        this.stats = {
            hp: 100,
            maxHp: 100,
            attack: 10, // Reduced player attack damage
            level: 1,
            xp: 0,
            xpToNext: 100
        };
        
        // Visual properties - bright green for visibility
        this.color = '#00FF00';
        this.originalColor = '#00FF00';
        this.damageColor = '#FF0000';
        
        // Damage flash effect
        this.damageFlash = {
            active: false,
            duration: 500, // 500ms flash duration
            timer: 0
        };
        
        // Death animation
        this.isDead = false;
        this.deathAnimation = {
            active: false,
            timer: 0,
            duration: 1000, // 1 second death animation
            scale: 1,
            rotation: 0,
            opacity: 1
        };
        
        // console.log(`Player created at position: ${this.x}, ${this.y}`);
    }
    
    update(deltaTime, inputHandler) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Track velocity for enemy AI prediction
        const oldX = this.x;
        const oldY = this.y;
        
        // Handle death animation
        if (this.deathAnimation.active) {
            this.deathAnimation.timer += deltaTime;
            const progress = this.deathAnimation.timer / this.deathAnimation.duration;
            
            if (progress >= 1) {
                // Death animation complete
                return 'gameOver';
            }
            
            // Animate death effects
            this.deathAnimation.scale = 1 - (progress * 0.7); // Shrink to 30% size
            this.deathAnimation.rotation = progress * Math.PI * 4; // 2 full rotations
            this.deathAnimation.opacity = 1 - progress; // Fade out
            
            return; // Don't do normal behavior during death
        }
        
        if (this.isDead) return;
        
        // Update damage flash effect
        if (this.damageFlash.active) {
            this.damageFlash.timer += deltaTime;
            if (this.damageFlash.timer >= this.damageFlash.duration) {
                this.damageFlash.active = false;
                this.damageFlash.timer = 0;
                this.color = this.originalColor; // Reset to normal color
            } else {
                // Gradually fade from red back to green
                const progress = this.damageFlash.timer / this.damageFlash.duration;
                const red = Math.floor(255 * (1 - progress));
                const green = Math.floor(255 * progress);
                this.color = `rgb(${red}, ${green}, 0)`;
            }
        }
        
        // Movement
        let dx = 0;
        let dy = 0;
        
        if (inputHandler.isKeyPressed('KeyW') || inputHandler.isKeyPressed('ArrowUp')) {
            dy = -1;
        }
        if (inputHandler.isKeyPressed('KeyS') || inputHandler.isKeyPressed('ArrowDown')) {
            dy = 1;
        }
        if (inputHandler.isKeyPressed('KeyA') || inputHandler.isKeyPressed('ArrowLeft')) {
            dx = -1;
        }
        if (inputHandler.isKeyPressed('KeyD') || inputHandler.isKeyPressed('ArrowRight')) {
            dx = 1;
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; // 1/sqrt(2)
            dy *= 0.707;
        }
        
        // Apply movement with safety check
        if (!isNaN(dt) && dt > 0 && dt < 1) { // Sanity check deltaTime
            this.x += dx * this.speed * dt;
            this.y += dy * this.speed * dt;
        }
        
        // Calculate velocity for enemy AI prediction
        this.velocity.x = (this.x - oldX) / dt;
        this.velocity.y = (this.y - oldY) / dt;
        this.lastPosition.x = oldX;
        this.lastPosition.y = oldY;
        
        // Keep player in bounds (assuming canvas is 800x600)
        this.x = Math.max(0, Math.min(800 - this.width, this.x));
        this.y = Math.max(0, Math.min(600 - this.height, this.y));
    }
    
    render(ctx) {
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
        
        // Draw player as a simple rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Only draw face if not in death animation
        if (!this.deathAnimation.active) {
            // Draw a simple face
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x + 8, this.y + 8, 4, 4); // Left eye
            ctx.fillRect(this.x + 20, this.y + 8, 4, 4); // Right eye
            ctx.fillRect(this.x + 12, this.y + 20, 8, 2); // Mouth
        }
        
        ctx.restore();
    }
    
    takeDamage(amount) {
        // Prevent damage during death animation
        if (this.isDead) {
            return false;
        }
        
        // Validate damage amount
        if (isNaN(amount) || amount < 0) {
            console.warn('Invalid damage amount:', amount);
            return false;
        }
        
        this.stats.hp = Math.max(0, this.stats.hp - amount);
        
        // Validate HP isn't NaN
        if (isNaN(this.stats.hp)) {
            console.error('Player HP became NaN! Resetting to 1');
            this.stats.hp = 1;
        }
        
        // Check for death
        if (this.stats.hp <= 0) {
            this.isDead = true;
            this.deathAnimation.active = true;
            this.deathAnimation.timer = 0;
            // console.log("Player died! Starting death animation...");
            return true;
        }
        
        // Start damage flash effect (but don't prevent multiple damage)
        this.damageFlash.active = true;
        this.damageFlash.timer = 0;
        
        // console.log(`Player took ${amount} damage! HP: ${this.stats.hp}/${this.stats.maxHp}`);
        return true;
    }
    
    heal(amount) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    }
    
    gainXP(amount) {
        this.stats.xp += amount;
        while (this.stats.xp >= this.stats.xpToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.stats.xp -= this.stats.xpToNext;
        this.stats.level++;
        this.stats.maxHp += 20;
        this.stats.hp = this.stats.maxHp; // Full heal on level up
        this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5);
        
        // console.log(`Level up! Now level ${this.stats.level}`);
        
        // Return level up info for skill point granting
        return { levelUp: true, newLevel: this.stats.level };
    }
}