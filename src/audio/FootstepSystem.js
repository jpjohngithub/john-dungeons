/**
 * @file FootstepSystem.js
 * @description Surface-based footsteps sound management.
 */

import AudioManager from './AudioManager.js';

export const Surfaces = {
    GRASS: 'grass',
    DIRT: 'dirt',
    STONE: 'stone',
    WOOD: 'wood',
    WATER: 'water',
    SNOW: 'snow',
    METAL: 'metal',
    SAND: 'sand'
};

export class FootstepSystem {
    constructor() {
        this.surfaceConfigs = {
            [Surfaces.GRASS]: { sounds: ['grass1', 'grass2'], volume: 0.8, pitchRange: [0.9, 1.1] },
            [Surfaces.DIRT]: { sounds: ['dirt1', 'dirt2'], volume: 0.8, pitchRange: [0.9, 1.1] },
            [Surfaces.STONE]: { sounds: ['stone1', 'stone2'], volume: 1.0, pitchRange: [0.95, 1.05] },
            [Surfaces.WOOD]: { sounds: ['wood1', 'wood2'], volume: 0.9, pitchRange: [0.9, 1.1] },
            [Surfaces.WATER]: { sounds: ['water1', 'water2'], volume: 1.0, pitchRange: [0.8, 1.2] },
            [Surfaces.SNOW]: { sounds: ['snow1', 'snow2'], volume: 0.7, pitchRange: [0.85, 1.15] },
            [Surfaces.METAL]: { sounds: ['metal1', 'metal2'], volume: 1.0, pitchRange: [0.9, 1.1] },
            [Surfaces.SAND]: { sounds: ['sand1', 'sand2'], volume: 0.8, pitchRange: [0.9, 1.1] }
        };

        this.stepInterval = 500; // ms
        this.lastStepTime = 0;
    }

    /**
     * Play footstep sound based on surface and movement speed.
     * @param {string} surface 
     * @param {number} speed 
     * @param {Object} position 
     */
    playFootstep(surface, speed, position) {
        const now = Date.now();
        const interval = Math.max(200, 600 - speed * 40);

        if (now - this.lastStepTime < interval) return;
        this.lastStepTime = now;

        const config = this.surfaceConfigs[surface] || this.surfaceConfigs[Surfaces.DIRT];
        const randomSound = config.sounds[Math.floor(Math.random() * config.sounds.length)];

        AudioManager.playSound(randomSound, position, { volume: config.volume });
    }
}

export default new FootstepSystem();
