/**
 * @file Compass.js
 * @description Top compass bar rendering.
 */

export class Compass {
    constructor() {
        /** @type {HTMLElement|null} */
        this.element = null;
        this.markers = new Map();
        this.initDOM();
    }

    initDOM() {
        this.element = document.createElement('div');
        this.element.id = 'hud-compass';
        this.element.style.cssText = `
            position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
            width: 300px; height: 40px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: bold; color: white; letter-spacing: 2px;
        `;
        this.element.innerText = 'N   NE   E   SE   S   SW   W   NW';
        document.body.appendChild(this.element);
    }

    /**
     * Add or update a marker on the compass.
     * @param {string} id 
     * @param {Object} position 
     * @param {string} type 
     * @param {string} color 
     */
    addMarker(id, position, type, color) {
        this.markers.set(id, { position, type, color });
    }

    removeMarker(id) {
        this.markers.delete(id);
    }

    update(playerRotationY) {
        // Update compass display based on rotation
    }
}

export default new Compass();
