/**
 * @file ElementalSystem.js
 * @description Elemental synergies (Fire, Ice, Lightning, Physical) and combo reactions.
 */

import EventBus from '../core/EventBus.js';

export class ElementalSystem {
    constructor() {
        /** @type {Map<Object, string>} Target active element */
        this.targetElements = new Map();
    }

    /**
     * Apply an element to a target, triggering reaction if an element is already active.
     * @param {Object} target 
     * @param {string} element 'FIRE', 'ICE', 'LIGHTNING', 'PHYSICAL'
     */
    applyElement(target, element) {
        const current = this.targetElements.get(target);

        if (!current) {
            this.targetElements.set(target, element);
            EventBus.emit('elemental.applied', { target, element });
            return;
        }

        // Check reaction combo table
        let reaction = null;
        if ((current === 'FIRE' && element === 'ICE') || (current === 'ICE' && element === 'FIRE')) {
            reaction = 'MELT'; // 2x damage burst
        } else if ((current === 'FIRE' && element === 'LIGHTNING') || (current === 'LIGHTNING' && element === 'FIRE')) {
            reaction = 'OVERLOAD'; // AoE explosion
        } else if ((current === 'ICE' && element === 'LIGHTNING') || (current === 'LIGHTNING' && element === 'ICE')) {
            reaction = 'SUPERCONDUCT'; // armor shred -50% for 5s
        }

        if (reaction) {
            this.targetElements.delete(target); // clear active element after reaction
            EventBus.emit('elemental.reaction', { target, reaction, elements: [current, element] });
        } else {
            // Overwrite with new element if no combo
            this.targetElements.set(target, element);
            EventBus.emit('elemental.applied', { target, element });
        }
    }
}

export default ElementalSystem;
