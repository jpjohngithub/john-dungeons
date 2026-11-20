/**
 * @file InventoryUI.js
 * @description Full inventory panel grid UI.
 */

export class InventoryUI {
    constructor() {
        /** @type {HTMLElement|null} */
        this.element = null;
        this.isOpen = false;
        this.initDOM();
    }

    initDOM() {
        this.element = document.createElement('div');
        this.element.id = 'inventory-panel';
        this.element.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 600px; height: 400px; background: rgba(20,20,20,0.9); border: 2px solid #555;
            border-radius: 8px; display: none; grid-template-columns: repeat(6, 1fr);
            gap: 10px; padding: 20px; box-sizing: border-box; z-index: 2500;
        `;

        // 24 Slots (6x4)
        for (let i = 0; i < 24; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                background: rgba(40,40,40,0.8); border: 1px solid #777; border-radius: 4px;
                display: flex; align-items: center; justify-content: center; color: white;
            `;
            this.element.appendChild(slot);
        }

        document.body.appendChild(this.element);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.element.style.display = this.isOpen ? 'grid' : 'none';
    }
}

export default new InventoryUI();
