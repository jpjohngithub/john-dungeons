/**
 * @file HUDManager.js
 * @description HUD overlay manager using DOM/CSS.
 */

import EventBus from '../core/EventBus.js';

export class HUDManager {
    constructor() {
        /** @type {HTMLElement|null} */
        this.container = null;
        this.initDOM();
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.id = 'game-hud';
        this.container.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; font-family: sans-serif; color: white;
            box-sizing: border-box; overflow: hidden; z-index: 1000;
        `;

        // Health & Shield bars container
        const stats = document.createElement('div');
        stats.style.cssText = `position: absolute; bottom: 30px; left: 30px; display: flex; flex-direction: column; gap: 8px;`;
        
        this.healthBar = document.createElement('div');
        this.healthBar.style.cssText = `width: 250px; height: 20px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 4px; overflow: hidden;`;
        this.healthFill = document.createElement('div');
        this.healthFill.style.cssText = `width: 100%; height: 100%; background: #ff3333; transition: width 0.2s;`;
        this.healthBar.appendChild(this.healthFill);

        stats.appendChild(this.healthBar);
        this.container.appendChild(stats);

        // Damage vignette
        this.vignette = document.createElement('div');
        this.vignette.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            box-shadow: inset 0 0 100px rgba(255,0,0,0); transition: box-shadow 0.3s;
        `;
        this.container.appendChild(this.vignette);

        document.body.appendChild(this.container);
    }

    /**
     * Update HUD elements with player data.
     * @param {Object} playerData 
     */
    update(playerData) {
        if (playerData.health !== undefined) {
            const pct = Math.max(0, Math.min(100, playerData.health));
            this.healthFill.style.width = `${pct}%`;
            if (pct < 30) {
                this.vignette.style.boxShadow = 'inset 0 0 80px rgba(255,0,0,0.6)';
            } else {
                this.vignette.style.boxShadow = 'inset 0 0 0px rgba(255,0,0,0)';
            }
        }
    }

    triggerDamageFlash() {
        this.vignette.style.boxShadow = 'inset 0 0 120px rgba(255,0,0,0.8)';
        setTimeout(() => {
            this.vignette.style.boxShadow = 'inset 0 0 0px rgba(255,0,0,0)';
        }, 200);
    }
}

export default new HUDManager();
