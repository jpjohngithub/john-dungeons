/**
 * @file TagSystem.js
 * @description Hierarchical string tag management system for Gameplay Ability System.
 */

export class TagSystem {
    constructor() {
        /** @private @type {Set<string>} */
        this._tags = new Set();
    }

    /**
     * Add a tag to the system.
     * @param {string} tag 
     */
    addTag(tag) {
        if (!tag) return;
        this._tags.add(tag);
    }

    /**
     * Remove a tag from the system.
     * @param {string} tag 
     */
    removeTag(tag) {
        if (!tag) return;
        this._tags.delete(tag);
    }

    /**
     * Check if a tag exists. Supports hierarchical matching (e.g. 'status.debuff' matches 'status.debuff.frozen').
     * @param {string} tag 
     * @returns {boolean}
     */
    hasTag(tag) {
        if (!tag) return false;
        if (this._tags.has(tag)) return true;

        // Check hierarchical prefix matches
        for (const existingTag of this._tags) {
            if (existingTag.startsWith(tag + '.')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if all specified tags are present.
     * @param {string[]} tags 
     * @returns {boolean}
     */
    hasAll(tags) {
        if (!tags || tags.length === 0) return true;
        for (let i = 0; i < tags.length; i++) {
            if (!this.hasTag(tags[i])) return false;
        }
        return true;
    }

    /**
     * Check if any of the specified tags are present.
     * @param {string[]} tags 
     * @returns {boolean}
     */
    hasAny(tags) {
        if (!tags || tags.length === 0) return false;
        for (let i = 0; i < tags.length; i++) {
            if (this.hasTag(tags[i])) return true;
        }
        return false;
    }

    /**
     * Get an array copy of all current tags.
     * @returns {string[]}
     */
    getTags() {
        return Array.from(this._tags);
    }

    /**
     * Clear all tags.
     */
    clear() {
        this._tags.clear();
    }
}
