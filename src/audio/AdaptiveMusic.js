/**
 * @file AdaptiveMusic.js
 * @description Dynamic music state machine and crossfading.
 */

import AudioManager from './AudioManager.js';

export const MusicState = {
    EXPLORATION: 'EXPLORATION',
    COMBAT: 'COMBAT',
    STORM_CLOSING: 'STORM_CLOSING',
    FINAL_ZONE: 'FINAL_ZONE',
    VICTORY: 'VICTORY',
    DEFEAT: 'DEFEAT'
};

export class AdaptiveMusic {
    constructor() {
        /** @type {MusicState} */
        this.currentState = MusicState.EXPLORATION;
        this.lastCombatTime = 0;
        this.combatTimeout = 10000; // 10s
    }

    /**
     * Set music state and trigger transition.
     * @param {MusicState} state 
     */
    setState(state) {
        if (this.currentState === state) return;
        this.currentState = state;

        switch (state) {
            case MusicState.EXPLORATION:
                AudioManager.playMusic('music_exploration');
                break;
            case MusicState.COMBAT:
                AudioManager.playMusic('music_combat');
                break;
            case MusicState.STORM_CLOSING:
                AudioManager.playMusic('music_storm');
                break;
            case MusicState.VICTORY:
                AudioManager.playMusic('music_victory', false);
                break;
            case MusicState.DEFEAT:
                AudioManager.playMusic('music_defeat', false);
                break;
            default:
                break;
        }
    }

    /**
     * Update combat status and timers.
     * @param {boolean} enemiesNearby 
     * @param {boolean} recentlyDamaged 
     */
    update(enemiesNearby, recentlyDamaged) {
        const now = Date.now();
        if (enemiesNearby || recentlyDamaged) {
            this.lastCombatTime = now;
            if (this.currentState === MusicState.EXPLORATION) {
                this.setState(MusicState.COMBAT);
            }
        } else if (this.currentState === MusicState.COMBAT) {
            if (now - this.lastCombatTime > this.combatTimeout) {
                this.setState(MusicState.EXPLORATION);
            }
        }
    }
}

export default new AdaptiveMusic();
