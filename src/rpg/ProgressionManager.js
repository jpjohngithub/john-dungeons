/**
 * @file ProgressionManager.js
 * @description In-match XP, leveling thresholds, stat bonuses, and talent point rewards.
 */

import EventBus from '../core/EventBus.js';

export class ProgressionManager {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.maxLevel = 10;
    }

    /**
     * Get XP threshold required for next level.
     * @param {number} lvl 
     * @returns {number}
     */
    getXpThreshold(lvl) {
        return lvl * 100;
    }

    /**
     * Add XP and check for level ups.
     * @param {number} amount 
     */
    addXp(amount) {
        if (this.level >= this.maxLevel) return;

        this.xp += amount;
        EventBus.emit('xp.gained', { xp: this.xp, added: amount });

        let threshold = this.getXpThreshold(this.level);
        while (this.xp >= threshold && this.level < this.maxLevel) {
            this.xp -= threshold;
            this.level += 1;
            threshold = this.getXpThreshold(this.level);

            EventBus.emit('level.up', {
                level: this.level,
                rewards: {
                    maxHpBonus: 5,
                    maxShieldBonus: 5,
                    talentPoints: 1,
                    healPercent: 0.25
                }
            });
        }
    }
}

export default ProgressionManager;
