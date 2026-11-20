/**
 * @file RadialMenu.js
 * @description Radial quick-access menu.
 */

export class RadialMenu {
    constructor() {
        /** @type {HTMLElement|null} */
        this.element = null;
        this.isOpen = false;
        this.initDOM();
    }

    initDOM() {
        this.element = document.createElement('div');
        this.element.id = 'radial-menu';
        this.element.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
            width: 300px; height: 300px; background: rgba(0,0,0,0.8); border: 2px solid white;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, opacity 0.2s; opacity: 0; pointer-events: none; z-index: 2000;
        `;
        document.body.appendChild(this.element);
    }

    open() {
        this.isOpen = true;
        this.element.style.transform = 'translate(-50%, -50%) scale(1)';
        this.element.style.opacity = '1';
        this.element.style.pointerEvents = 'auto';
    }

    close() {
        this.isOpen = false;
        this.element.style.transform = 'translate(-50%, -50%) scale(0)';
        this.element.style.opacity = '0';
        this.element.style.pointerEvents = 'none';
    }
}

export default new RadialMenu();
