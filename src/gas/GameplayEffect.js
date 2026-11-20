/**
 * @file GameplayEffect.js
 * @description Buff/Debuff system supporting instant, duration, and infinite effects with stacking and presets.
 */

/**
 * @typedef {'INSTANT' | 'DURATION' | 'INFINITE'} EffectType
 */

/**
 * @typedef {'aggregate' | 'refresh' | 'independent'} StackPolicy
 */

export class GameplayEffect {
    /**
     * @param {Object} options 
     * @param {string} options.id 
     * @param {EffectType} [options.type='DURATION'] 
     * @param {number} [options.duration=0] 
     * @param {number} [options.period=0] 
     * @param {number} [options.maxStacks=1] 
     * @param {StackPolicy} [options.stackPolicy='refresh'] 
     * @param {import('./AttributeSet.js').Modifier[]} [options.modifiers=[]] 
     * @param {string[]} [options.grantedTags=[]] 
     * @param {string[]} [options.removedOnTags=[]] 
     * @param {Function} [options.onPeriodic] Callback for periodic tick
     */
    constructor(options) {
        this.id = options.id;
        this.type = options.type || 'DURATION';
        this.duration = options.duration || 0;
        this.remaining = this.duration;
        this.period = options.period || 0;
        this.periodTimer = 0;
        this.stackCount = 1;
        this.maxStacks = options.maxStacks || 1;
        this.stackPolicy = options.stackPolicy || 'refresh';
        /** @type {import('./AttributeSet.js').Modifier[]} */
        this.modifiers = options.modifiers || [];
        /** @type {string[]} */
        this.grantedTags = options.grantedTags || [];
        /** @type {string[]} */
        this.removedOnTags = options.removedOnTags || [];
        this.onPeriodic = options.onPeriodic || null;
    }

    /**
     * Called when effect is applied to an AttributeSet / AbilitySystem.
     * @param {import('./AttributeSet.js').AttributeSet} attributeSet 
     */
    onApply(attributeSet) {
        for (let i = 0; i < this.modifiers.length; i++) {
            const mod = { ...this.modifiers[i], source: `${this.id}_${Math.random()}` };
            this.modifiers[i] = mod;
            attributeSet.addModifier(mod);
        }
    }

    /**
     * Called when effect is removed.
     * @param {import('./AttributeSet.js').AttributeSet} attributeSet 
     */
    onRemove(attributeSet) {
        for (let i = 0; i < this.modifiers.length; i++) {
            attributeSet.removeModifier(this.modifiers[i].source);
        }
    }

    /**
     * Tick effect time and handle periodic triggers.
     * @param {number} dt Delta time in seconds
     * @param {import('./AttributeSet.js').AttributeSet} attributeSet 
     * @returns {boolean} Returns true if still active, false if expired.
     */
    tick(dt, attributeSet) {
        if (this.type === 'INFINITE') return true;

        this.remaining -= dt;
        if (this.period > 0) {
            this.periodTimer += dt;
            if (this.periodTimer >= this.period) {
                this.periodTimer %= this.period;
                if (this.onPeriodic) {
                    this.onPeriodic(this, attributeSet);
                }
            }
        }

        return this.remaining > 0;
    }

    /**
     * Handle stacking when a duplicate effect is applied.
     * @param {GameplayEffect} existingEffect 
     * @returns {boolean} True if stack handled successfully
     */
    stack(existingEffect) {
        if (existingEffect.id !== this.id) return false;

        if (this.stackPolicy === 'refresh') {
            existingEffect.remaining = existingEffect.duration;
            return true;
        } else if (this.stackPolicy === 'aggregate') {
            if (existingEffect.stackCount < existingEffect.maxStacks) {
                existingEffect.stackCount++;
                existingEffect.remaining = existingEffect.duration;
                // Scale modifiers magnitude
                for (let i = 0; i < existingEffect.modifiers.length; i++) {
                    existingEffect.modifiers[i].magnitude += (this.modifiers[i]?.magnitude || 0);
                }
            } else {
                existingEffect.remaining = existingEffect.duration;
            }
            return true;
        } else if (this.stackPolicy === 'independent') {
            // Independent means caller manages separate instances in array
            return false;
        }
        return false;
    }

    // --- Preset Factory Methods ---

    /**
     * Poison effect (periodic damage over time).
     * @param {number} dps 
     * @param {number} duration 
     * @returns {GameplayEffect}
     */
    static poison(dps, duration) {
        return new GameplayEffect({
            id: 'effect_poison',
            type: 'DURATION',
            duration,
            period: 1,
            onPeriodic: (effect, attributeSet) => {
                const currentHealth = attributeSet.get('health');
                attributeSet.modify('health', -dps * effect.stackCount, 'add');
            },
            grantedTags: ['status.debuff.poison']
        });
    }

    /**
     * Regeneration effect (periodic healing over time).
     * @param {number} hps 
     * @param {number} duration 
     * @returns {GameplayEffect}
     */
    static regen(hps, duration) {
        return new GameplayEffect({
            id: 'effect_regen',
            type: 'DURATION',
            duration,
            period: 1,
            onPeriodic: (effect, attributeSet) => {
                const maxH = attributeSet.get('maxHealth');
                const currentH = attributeSet.get('health');
                const healAmount = hps * effect.stackCount;
                attributeSet.modify('health', Math.min(maxH - currentH, healAmount), 'add');
            },
            grantedTags: ['status.buff.regen']
        });
    }

    /**
     * Speed boost effect.
     * @param {number} multiplier 
     * @param {number} duration 
     * @returns {GameplayEffect}
     */
    static speedBoost(multiplier, duration) {
        return new GameplayEffect({
            id: 'effect_speed_boost',
            type: 'DURATION',
            duration,
            modifiers: [
                { source: 'speed_boost', attribute: 'moveSpeed', operation: 'multiply', magnitude: multiplier }
            ],
            grantedTags: ['status.buff.speed']
        });
    }

    /**
     * Armor buff effect.
     * @param {number} amount 
     * @param {number} duration 
     * @returns {GameplayEffect}
     */
    static armorBuff(amount, duration) {
        return new GameplayEffect({
            id: 'effect_armor_buff',
            type: 'DURATION',
            duration,
            modifiers: [
                { source: 'armor_buff', attribute: 'armor', operation: 'add', magnitude: amount }
            ],
            grantedTags: ['status.buff.armor']
        });
    }

    /**
     * Burning effect (fire DOT).
     * @param {number} dps 
     * @param {number} duration 
     * @returns {GameplayEffect}
     */
    static burning(dps, duration) {
        return new GameplayEffect({
            id: 'effect_burning',
            type: 'DURATION',
            duration,
            period: 1,
            onPeriodic: (effect, attributeSet) => {
                attributeSet.modify('health', -dps * effect.stackCount, 'add');
            },
            grantedTags: ['status.debuff.burning', 'element.fire']
        });
    }

    /**
     * Frozen effect (slow movement and attack speed).
     * @param {number} slowMult 
     * @param {number} duration 
     * @returns {GameplayEffect}
     */
    static frozen(slowMult, duration) {
        return new GameplayEffect({
            id: 'effect_frozen',
            type: 'DURATION',
            duration,
            modifiers: [
                { source: 'frozen_speed', attribute: 'moveSpeed', operation: 'multiply', magnitude: slowMult },
                { source: 'frozen_as', attribute: 'attackSpeed', operation: 'multiply', magnitude: slowMult }
            ],
            grantedTags: ['status.debuff.frozen', 'element.ice']
        });
    }
}
