/**
 * @file AbilitySystem.js
 * @description Central Gameplay Ability System (GAS) manager integrating attributes, effects, tags, and abilities.
 */

import { AttributeSet } from './AttributeSet.js';
import { TagSystem } from './TagSystem.js';
import EventBus from '../core/EventBus.js';

export class AbilitySystem {
    constructor() {
        this.attributeSet = new AttributeSet(EventBus);
        this.tagSystem = new TagSystem();
        /** @type {Map<string, import('./GameplayAbility.js').GameplayAbility>} */
        this._abilities = new Map();
        /** @type {import('./GameplayEffect.js').GameplayEffect[]} */
        this._activeEffects = [];
    }

    /**
     * Grant and register an ability.
     * @param {import('./GameplayAbility.js').GameplayAbility} ability 
     */
    grantAbility(ability) {
        this._abilities.set(ability.id, ability);
    }

    /**
     * Remove an ability.
     * @param {string} id 
     */
    removeAbility(id) {
        const ability = this._abilities.get(id);
        if (ability) {
            ability.endAbility(this);
            this._abilities.delete(id);
        }
    }

    /**
     * Activate an ability by ID.
     * @param {string} id 
     * @param {any} [targets] 
     * @returns {boolean} True if successfully activated
     */
    activateAbility(id, targets) {
        const ability = this._abilities.get(id);
        if (!ability) return false;

        if (!ability.canActivate(this)) {
            return false;
        }

        ability.commitAbility(this);
        ability.activate(this, targets);

        EventBus.emit('ability.activated', { abilityId: id, ability });
        return true;
    }

    /**
     * Apply a GameplayEffect, handling stacking and tags.
     * @param {import('./GameplayEffect.js').GameplayEffect} effect 
     */
    applyEffect(effect) {
        // Check removedOnTags
        if (effect.removedOnTags && effect.removedOnTags.length > 0) {
            if (this.tagSystem.hasAny(effect.removedOnTags)) {
                return; // Do not apply if blocking tags are present
            }
        }

        // Check if stackable effect already exists
        const existing = this._activeEffects.find(e => e.id === effect.id);
        if (existing) {
            const stacked = effect.stack(existing);
            if (stacked) {
                EventBus.emit('effect.applied', { effectId: effect.id, stacked: true, effect: existing });
                return;
            }
        }

        if (effect.type === 'INSTANT') {
            effect.onApply(this.attributeSet);
            EventBus.emit('effect.applied', { effectId: effect.id, instant: true, effect });
            return;
        }

        // Add active effect
        this._activeEffects.push(effect);
        effect.onApply(this.attributeSet);

        // Add granted tags
        for (let i = 0; i < effect.grantedTags.length; i++) {
            this.tagSystem.addTag(effect.grantedTags[i]);
        }

        EventBus.emit('effect.applied', { effectId: effect.id, effect });
    }

    /**
     * Remove an effect by ID.
     * @param {string} id 
     */
    removeEffect(id) {
        for (let i = this._activeEffects.length - 1; i >= 0; i--) {
            const effect = this._activeEffects[i];
            if (effect.id === id) {
                effect.onRemove(this.attributeSet);
                // Remove granted tags
                for (let j = 0; j < effect.grantedTags.length; j++) {
                    this.tagSystem.removeTag(effect.grantedTags[j]);
                }
                this._activeEffects.splice(i, 1);
                EventBus.emit('effect.removed', { effectId: id, effect });
            }
        }
    }

    /**
     * Tick all active effects and ability cooldowns.
     * @param {number} dt 
     */
    tick(dt) {
        // Tick effects
        for (let i = this._activeEffects.length - 1; i >= 0; i--) {
            const effect = this._activeEffects[i];
            const active = effect.tick(dt, this.attributeSet);
            if (!active) {
                effect.onRemove(this.attributeSet);
                for (let j = 0; j < effect.grantedTags.length; j++) {
                    this.tagSystem.removeTag(effect.grantedTags[j]);
                }
                this._activeEffects.splice(i, 1);
                EventBus.emit('effect.removed', { effectId: effect.id, effect });
            }
        }

        // Tick abilities
        for (const ability of this._abilities.values()) {
            ability.tick(dt);
        }
    }

    /**
     * Get list of abilities currently on cooldown.
     * @returns {import('./GameplayAbility.js').GameplayAbility[]}
     */
    getAbilitiesOnCooldown() {
        const list = [];
        for (const ability of this._abilities.values()) {
            if (ability.isOnCooldown) {
                list.push(ability);
            }
        }
        return list;
    }

    /**
     * Get active effects list.
     * @returns {import('./GameplayEffect.js').GameplayEffect[]}
     */
    getActiveEffects() {
        return this._activeEffects;
    }

    /**
     * Tag system wrappers.
     * @param {string} tag 
     * @returns {boolean}
     */
    hasTag(tag) {
        return this.tagSystem.hasTag(tag);
    }

    /**
     * @param {string} tag 
     */
    addTag(tag) {
        this.tagSystem.addTag(tag);
    }

    /**
     * @param {string} tag 
     */
    removeTag(tag) {
        this.tagSystem.removeTag(tag);
    }
}
