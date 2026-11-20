/**
 * @file InputManager.js
 * @description Centralized keyboard and mouse state tracker for responsive TPS controls.
 */

export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            isLocked: false,
            leftDown: false,
            rightDown: false
        };

        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        window.addEventListener('mousemove', (e) => {
            if (this.mouse.isLocked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.leftDown = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.leftDown = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });

        document.addEventListener('click', () => {
            if (!this.mouse.isLocked) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouse.isLocked = document.pointerLockElement === document.body;
        });
    }

    init(engine) {
        this.engine = engine;
    }

    isDown(code) {
        return !!this.keys[code];
    }

    /**
     * Clear frame-based delta movements.
     */
    lateUpdate() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }

    update(dt) {
        this.lateUpdate();
    }
}
