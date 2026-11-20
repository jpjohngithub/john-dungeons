/**
 * @file Minimap.js
 * @description Vector minimap rendering to canvas.
 */

export class Minimap {
    constructor() {
        /** @type {HTMLCanvasElement|null} */
        this.canvas = null;
        /** @type {CanvasRenderingContext2D|null} */
        this.ctx = null;
        this.initDOM();
    }

    initDOM() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'hud-minimap';
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.canvas.style.cssText = `
            position: absolute; top: 20px; right: 20px; width: 200px; height: 200px;
            background: rgba(0,0,0,0.6); border: 2px solid white; border-radius: 50%;
            overflow: hidden; box-sizing: border-box;
        `;
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
    }

    /**
     * Update minimap view.
     * @param {Object} playerPos 
     * @param {number} playerRot 
     * @param {Array} entities 
     */
    update(playerPos, playerRot, entities = []) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 200, 200);

        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(-playerRot);

        // Draw player indicator
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-6, 6);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();

        // Draw nearby entities
        for (const e of entities) {
            const dx = (e.position.x - playerPos.x);
            const dz = (e.position.z - playerPos.z);
            ctx.fillStyle = e.isEnemy ? '#ff0000' : '#00ffff';
            ctx.beginPath();
            ctx.arc(dx, dz, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export default new Minimap();
