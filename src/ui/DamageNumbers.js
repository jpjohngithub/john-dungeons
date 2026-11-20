/**
 * @file DamageNumbers.js
 * @description Floating damage numbers system.
 */

export class DamageNumbersManager {
    constructor() {
        /** @type {HTMLElement|null} */
        this.container = null;
        this.initDOM();
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.id = 'damage-numbers-container';
        this.container.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; overflow: hidden; z-index: 1500;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Spawn a damage number at screen coordinates.
     * @param {number} x 
     * @param {number} y 
     * @param {number|string} amount 
     * @param {string} [type='normal'] 
     */
    spawn(x, y, amount, type = 'normal') {
        const el = document.createElement('div');
        el.innerText = amount;
        
        let color = '#ffffff';
        if (type === 'critical') color = '#ffff00';
        else if (type === 'shield') color = '#00ffff';
        else if (type === 'fire') color = '#ff3300';

        el.style.cssText = `
            position: absolute; left: ${x}px; top: ${y}px; color: ${color};
            font-weight: bold; font-size: 20px; text-shadow: 1px 1px 2px black;
            transition: transform 0.6s ease-out, opacity 0.6s ease-out;
            transform: translateY(0) scale(1.2); opacity: 1;
        `;

        this.container.appendChild(el);

        setTimeout(() => {
            el.style.transform = 'translateY(-50px) scale(0.8)';
            el.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            el.remove();
        }, 650);
    }
}

export default new DamageNumbersManager();
