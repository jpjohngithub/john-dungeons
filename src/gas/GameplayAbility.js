/**
 * @file GameplayAbility.js
 * @description Base class for all gameplay abilities in the GAS system.
 */

export class GameplayAbility {
    /**
     * @param {Object} options 
     * @param {string} options.id 
     * @param {string} options.name 
     * @param {string} [options.description=''] 
     * @param {string} [options.iconKey=''] 
     * @param {number} [options.cooldown=0.0] 
     * @param {Array<{attribute: string, amount: number}>} [options.cost=[]] 
     * @param {string[]} [options.requiredTags=[]] 
     * @param {string[]} [options.blockedByTags=[]] 
     * @param {string[]} [options.abilityTags=[]] 
     * @param {string[]} [options.cancelAbilitiesWithTags=[]] 
     * @param {number} [options.level=1] 
     */
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.description = options.description || '';
        this.iconKey = options.iconKey || '';
        this.cooldown = options.cooldown || 0.0;
        this.cooldownRemaining = 0.0;
        this.isOnCooldown = false;
        /** @type {Array<{attribute: string, amount: number}>} */
        this.cost = options.cost || [];
        /** @type {string[]} */
        this.requiredTags = options.requiredTags || [];
        /** @type {string[]} */
        this.blockedByTags = options.blockedByTags || [];
        /** @type {string[]} */
        this.abilityTags = options.abilityTags || [];
        /** @type {string[]} */
        this.cancelAbilitiesWithTags = options.cancelAbilitiesWithTags || [];
        this.level = options.level || 1;
    }

    /**
     * Check if ability can be activated by owner.
     * @param {import('./AbilitySystem.js').AbilitySystem} abilitySystem 
     * @returns {boolean}
     */
    canActivate(abilitySystem) {
        if (this.isOnCooldown) return false;

        // Check required tags
        if (this.requiredTags.length > 0 && !abilitySystem.hasAll(this.requiredTags)) {
            return false;
        }

        // Check blocked tags
        if (this.blockedByTags.length > 0 && abilitySystem.hasAny(this.blockedByTags)) {
            return false;
        }

        // Check costs
        const attrSet = abilitySystem.attributeSet;
        if (attrSet) {
            for (let i = 0; i < this.cost.length; i++) {
                const c = this.cost[i];
                if (attrSet.get(c.attribute) < c.amount) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Commit the ability (deduct costs, start cooldown, add ability tags).
     * @param {import('./AbilitySystem.js').AbilitySystem} abilitySystem 
     */
    commitAbility(abilitySystem) {
        this.cooldownRemaining = this.cooldown;
        this.isOnCooldown = true;

        // Deduct costs
        const attrSet = abilitySystem.attributeSet;
        if (attrSet) {
            for (let i = 0; i < this.cost.length; i++) {
                const c = this.cost[i];
                attrSet.modify(c.attribute, -c.amount, 'add');
            }
        }

        // Add ability tags
        for (let i = 0; i < this.abilityTags.length; i++) {
            abilitySystem.addTag(this.abilityTags[i]);
        }
    }

    /**
     * End ability execution, removing ability tags.
     * @param {import('./AbilitySystem.js').AbilitySystem} abilitySystem 
     */
    endAbility(abilitySystem) {
        for (let i = 0; i < this.abilityTags.length; i++) {
            abilitySystem.removeTag(this.abilityTags[i]);
        }
    }

    /**
     * Tick ability cooldown.
     * @param {number} dt 
     */
    tick(dt) {
        if (this.isOnCooldown) {
            this.cooldownRemaining -= dt;
            if (this.cooldownRemaining <= 0) {
                this.cooldownRemaining = 0;
                this.isOnCooldown = false;
            }
        }
    }

    /**
     * Activate the ability. Subclasses override this.
     * @param {import('./AbilitySystem.js').AbilitySystem} owner 
     * @param {any} [targets] 
     */
    activate(owner, targets) {
        // Abstract method overridden by subclasses
    }

    /**
     * Scaling helper for magnitudes based on level.
     * @param {number} baseMagnitude 
     * @param {number} [scalePerLevel=0.1] 
     * @returns {number}
     */
    scaleMagnitude(baseMagnitude, scalePerLevel = 0.1) {
        return baseMagnitude * (1 + (this.level - 1) * scalePerLevel);
    }
}
