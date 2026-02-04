export class Tile {
    static TYPES = {
        FLOOR: 0,
        WALL: 1
    };
    
    static COLORS = {
        [Tile.TYPES.FLOOR]: '#2c2c2c',
        [Tile.TYPES.WALL]: '#666666'
    };
    
    constructor(type = Tile.TYPES.FLOOR) {
        this.type = type;
        this.solid = (type === Tile.TYPES.WALL);
    }
    
    render(ctx, x, y, size) {
        ctx.fillStyle = Tile.COLORS[this.type];
        ctx.fillRect(x * size, y * size, size, size);
    }
}

export class DungeonMap {
    constructor(width, height, tileSize = 32) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];
        
        this.generateDungeon();
    }
    
    generateDungeon() {
        // Initialize with floors
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new Tile(Tile.TYPES.FLOOR);
            }
        }
        
        // Create outer walls only
        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = new Tile(Tile.TYPES.WALL);
            this.tiles[this.height - 1][x] = new Tile(Tile.TYPES.WALL);
        }
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = new Tile(Tile.TYPES.WALL);
            this.tiles[y][this.width - 1] = new Tile(Tile.TYPES.WALL);
        }
        
        // console.log("Open arena generated - no internal walls for easy pathfinding");
    }
    
isValidTile(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    getTile(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (this.isValidTile(tileX, tileY)) {
            return this.tiles[tileY][tileX];
        }
        return new Tile(Tile.TYPES.WALL); // Return wall if out of bounds
    }
    
    isSolid(x, y) {
        return this.getTile(x, y).solid;
    }
    
    render(ctx, camera = { x: 0, y: 0 }) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x].render(ctx, x - camera.x / this.tileSize, y - camera.y / this.tileSize, this.tileSize);
            }
        }
    }
}