import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

/**
 * InputManager handles keyboard, mouse, and gamepad input with configurable bindings and deadzones.
 */
export class InputManager {
    constructor() {
        this.keysDown = new Set();
        this.keysJustPressed = new Set();
        this.keysJustReleased = new Set();
        this._previousKeysDown = new Set();

        this.mouse = {
            position: new THREE.Vector2(),
            delta: new THREE.Vector2(),
            buttons: new Set(),
            buttonsJustPressed: new Set(),
            buttonsJustReleased: new Set(),
            _previousButtons: new Set(),
            wheel: 0
        };

        this.gamepadIndex = null;
        this.gamepadDeadzone = 0.15;

        this.bindings = {
            moveForward: ['KeyW', 'ArrowUp'],
            moveBackward: ['KeyS', 'ArrowDown'],
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            jump: ['Space'],
            sprint: ['ShiftLeft', 'ShiftRight'],
            crouch: ['KeyC', 'ControlLeft'],
            aim: ['MouseRight'],
            attack: ['MouseLeft'],
            interact: ['KeyE'],
            swapShoulder: ['KeyQ']
        };

        this._initListeners();
    }

    _initListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.keysDown.has(e.code)) {
                this.keysJustPressed.add(e.code);
            }
            this.keysDown.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keysDown.delete(e.code);
            this.keysJustReleased.add(e.code);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.position.set(e.clientX, e.clientY);
            this.mouse.delta.x += e.movementX;
            this.mouse.delta.y += e.movementY;
        });

        window.addEventListener('mousedown', (e) => {
            const btn = `Mouse${e.button}`;
            if (!this.mouse.buttons.has(btn)) {
                this.mouse.buttonsJustPressed.add(btn);
            }
            this.mouse.buttons.add(btn);
        });

        window.addEventListener('mouseup', (e) => {
            const btn = `Mouse${e.button}`;
            this.mouse.buttons.delete(btn);
            this.mouse.buttonsJustReleased.add(btn);
        });

        window.addEventListener('wheel', (e) => {
            this.mouse.wheel += e.deltaY;
        }, { passive: true });

        window.addEventListener('gamepadconnected', (e) => {
            if (this.gamepadIndex === null) {
                this.gamepadIndex = e.gamepad.index;
                EventBus.emit('gamepad:connected', { gamepad: e.gamepad });
            }
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                EventBus.emit('gamepad:disconnected', {});
            }
        });
    }

    update() {
        this.keysJustPressed.clear();
        this.keysJustReleased.clear();

        this.mouse.buttonsJustPressed.clear();
        this.mouse.buttonsJustReleased.clear();
        this.mouse.delta.set(0, 0);
        this.mouse.wheel = 0;
    }

    _applyDeadzone(value, deadzone) {
        if (Math.abs(value) < deadzone) return 0;
        return (value - Math.sign(value) * deadzone) / (1 - deadzone);
    }

    getAxis(name) {
        let value = 0;

        if (name === 'horizontal') {
            if (this.getAction('moveRight')) value += 1;
            if (this.getAction('moveLeft')) value -= 1;
        } else if (name === 'vertical') {
            if (this.getAction('moveForward')) value += 1;
            if (this.getAction('moveBackward')) value -= 1;
        }

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
            const gp = gamepads[this.gamepadIndex];
            if (name === 'horizontal') {
                value += this._applyDeadzone(gp.axes[0], this.gamepadDeadzone);
            } else if (name === 'vertical') {
                value -= this._applyDeadzone(gp.axes[1], this.gamepadDeadzone);
            } else if (name === 'lookX') {
                value += this._applyDeadzone(gp.axes[2], this.gamepadDeadzone);
            } else if (name === 'lookY') {
                value += this._applyDeadzone(gp.axes[3], this.gamepadDeadzone);
            }
        }

        return Math.max(-1, Math.min(1, value));
    }

    getAction(name) {
        const codes = this.bindings[name];
        if (!codes) return false;

        for (const code of codes) {
            if (code.startsWith('Mouse')) {
                if (this.mouse.buttons.has(code)) return true;
            } else {
                if (this.keysDown.has(code)) return true;
            }
        }

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
            const gp = gamepads[this.gamepadIndex];
            if (name === 'jump' && gp.buttons[0]?.pressed) return true;
            if (name === 'sprint' && gp.buttons[10]?.pressed) return true;
            if (name === 'crouch' && gp.buttons[1]?.pressed) return true;
            if (name === 'aim' && gp.buttons[6]?.pressed) return true;
            if (name === 'attack' && gp.buttons[7]?.pressed) return true;
            if (name === 'interact' && gp.buttons[2]?.pressed) return true;
        }

        return false;
    }

    getActionJustPressed(name) {
        const codes = this.bindings[name];
        if (!codes) return false;

        for (const code of codes) {
            if (code.startsWith('Mouse')) {
                if (this.mouse.buttonsJustPressed.has(code)) return true;
            } else {
                if (this.keysJustPressed.has(code)) return true;
            }
        }
        return false;
    }
}
