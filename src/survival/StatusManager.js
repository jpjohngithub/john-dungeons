/**
 * @file StatusManager.js
 * @description Manages survival stats (hunger, temperature, stamina) via GAS-like AttributeSet.
 */

import EventBus from '../core/EventBus.js';

export class StatusManager {
    /**
     * @param {Object} [options]
     * @param {number} [options.hunger=100]
     * @param {number} [options.temperature=50]
     * @param {number} [options.stamina=100]
     * @param {number} [options.hp=100]
     * @param {number} [options.maxHp=100]
     */
    constructor(options = {}) {
        this.hunger = options.hunger !== undefined ? options.hunger : 100;
        this.maxHunger = 100;
        this.temperature = options.temperature !== undefined ? options.temperature : 50; // 50 = ideal
        this.minTemperature = 0;
        this.maxTemperature = 100;
        this.stamina = options.stamina !== undefined ? options.stamina : 100;
        this.maxStamina = 100;
        this.hp = options.hp !== undefined ? options.hp : 100;
        this.maxHp = options.maxHp !== undefined ? options.maxHp : 100;

        this._hungerDrainTimer = 0;
        this._starveTimer = 0;
        this._freezeTimer = 0;
        this._heatstrokeTimer = 0;
    }

    /**
     * Update status attributes and apply survival effects over time.
     * @param {number} delta time elapsed in seconds
     * @param {string} [biome='temperate'] 'snow', 'desert', or 'temperate'
     * @param {boolean} [isSprinting=false]
     * @param {boolean} [nearCampfire=false]
     */
    update(delta, biome = 'temperate', isSprinting = false, nearCampfire = false) {
        // 1. Hunger: drains 1/min = 1/60 per second
        let hungerDrainMultiplier = 1.0;
        if (this.temperature > 80) {
            hungerDrainMultiplier = 2.0; // Hot increases hunger drain 2x
        }
        this.hunger = Math.max(0, this.hunger - (1 / 60) * hungerDrainMultiplier * delta);
        EventBus.emit('status.hunger.changed', { hunger: this.hunger, max: this.maxHunger });

        // Hunger effects
        if (this.hunger < 10) {
            this._starveTimer += delta;
            if (this._starveTimer >= 5) {
                this._starveTimer = 0;
                this.hp = Math.max(0, this.hp - 1); // 1 hp / 5s drain
                EventBus.emit('status.effect.applied', { effect: 'starving', damage: 1 });
            }
        }

        // 2. Temperature & Biome integration
        let targetTemp = 50;
        if (biome === 'snow') {
            targetTemp = 0;
        } else if (biome === 'desert') {
            targetTemp = 100;
        }

        if (nearCampfire) {
            // Campfire warms nearby players: +2 temp/s toward 50
            const diff = 50 - this.temperature;
            if (Math.abs(diff) > 0.1) {
                this.temperature += Math.sign(diff) * Math.min(Math.abs(diff), 2 * delta);
            }
        } else {
            // Slowly pull toward biome target temp
            const diff = targetTemp - this.temperature;
            if (Math.abs(diff) > 0.01) {
                this.temperature += Math.sign(diff) * Math.min(Math.abs(diff), 0.5 * delta);
            }
        }
        EventBus.emit('status.temperature.changed', { temperature: this.temperature });

        // Temperature effects
        if (this.temperature < 10) {
            this._freezeTimer += delta;
            if (this._freezeTimer >= 5) {
                this._freezeTimer = 0;
                this.hp = Math.max(0, this.hp - 2); // 2 hp / 5s drain
                EventBus.emit('status.effect.applied', { effect: 'freezing', damage: 2, vfx: 'frost' });
            }
        } else if (this.temperature > 90) {
            this._heatstrokeTimer += delta;
            if (this._heatstrokeTimer >= 5) {
                this._heatstrokeTimer = 0;
                this.hp = Math.max(0, this.hp - 2); // 2 hp / 5s drain
                EventBus.emit('status.effect.applied', { effect: 'heatstroke', damage: 2, vfx: 'haze' });
            }
        }

        // 3. Stamina
        if (isSprinting) {
            this.stamina = Math.max(0, this.stamina - 20 * delta);
        } else {
            let staminaRegenRate = 15;
            if (this.hunger < 30) {
                staminaRegenRate *= 0.5; // -20% or halved stamina regen when hungry (<30)
            }
            if (this.temperature < 20) {
                staminaRegenRate *= 0.5; // <20 cold: stamina regen halved
            }
            this.stamina = Math.min(this.maxStamina, this.stamina + staminaRegenRate * delta);
        }
    }

    /**
     * Consume food item to restore hunger.
     * @param {Object} foodItem 
     * @param {number} foodItem.nutritionValue 
     */
    consumeFood(foodItem) {
        if (!foodItem || !foodItem.nutritionValue) return;
        this.hunger = Math.min(this.maxHunger, this.hunger + foodItem.nutritionValue);
        EventBus.emit('status.hunger.changed', { hunger: this.hunger, max: this.maxHunger });
        EventBus.emit('status.effect.applied', { effect: 'fed', restored: foodItem.nutritionValue });
    }

    /**
     * Get speed multiplier based on status effects.
     * @returns {number}
     */
    getSpeedMultiplier() {
        let mult = 1.0;
        if (this.hunger > 80) {
            mult += 0.1; // +10% speed when well-fed
        }
        return mult;
    }
}

export default StatusManager;
