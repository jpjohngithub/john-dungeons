/**
 * @file UIManager.js
 * @description Manages HUD updates, loading screen transitions, health bar, and souls score counters.
 */

export class UIManager {
    constructor() {
        this.loadingScreen = null;
        this.progressBar = null;
        this.progressText = null;
        this.healthFill = null;
        this.scoreVal = null;
        this.fpsCounter = null;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
    }

    init(engine) {
        this.engine = engine;
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.healthFill = document.getElementById('health-fill');
        this.scoreVal = document.getElementById('score-val');
        this.fpsCounter = document.getElementById('fps-counter');
    }

    /**
     * Update loading progress bar.
     * @param {number} progress 0.0 to 1.0
     * @param {string} statusText 
     */
    setProgress(progress, statusText) {
        const pct = Math.floor(progress * 100);
        if (this.progressBar) this.progressBar.style.width = `${pct}%`;
        if (this.progressText) this.progressText.textContent = `${statusText} ... ${pct}%`;
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 800);
        }
    }

    updateHUD(player, entityManager) {
        if (this.healthFill) {
            const hpPct = Math.max(0, (player.health / player.maxHealth) * 100);
            this.healthFill.style.width = `${hpPct}%`;
        }

        if (this.scoreVal) {
            this.scoreVal.textContent = entityManager.soulsCount;
        }

        // FPS Calculation
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
            if (this.fpsCounter) this.fpsCounter.textContent = `FPS: ${this.fps}`;
            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    update(dt) {
        // HUD frame updates handled explicitly in main loop
    }
}
