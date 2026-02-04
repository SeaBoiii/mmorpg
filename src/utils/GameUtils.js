// Utility functions for combat and collision detection

export function getDistance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

export function getRandomPosition(maxX, maxY, margin = 50) {
    const x = margin + Math.random() * (maxX - 2 * margin);
    const y = margin + Math.random() * (maxY - 2 * margin);
    
    // console.log(`getRandomPosition: maxX=${maxX}, maxY=${maxY}, margin=${margin} -> x=${x}, y=${y}`);
    
    return { x, y };
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}