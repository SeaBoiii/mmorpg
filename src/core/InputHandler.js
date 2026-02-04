export class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events
        document.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.pressed = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    isMousePressed() {
        return this.mouse.pressed;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
}