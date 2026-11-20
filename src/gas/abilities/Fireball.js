/**
 * @file Fireball.js
 * @description Fireball ability extending GameplayAbility. Creates projectile, explodes and applies burning.
 */

import { GameplayAbility } from '../GameplayAbility.js';
import { GameplayEffect } from '../GameplayEffect.js';

export class Fireball extends GameplayAbility {
    constructor() {
        super({
            id: 'ability_fireball',
            name: 'Fireball',
            description: 'Launches a blazing sphere of fire that explodes on impact, burning enemies.',
            iconKey: 'icon_fireball',
            cooldown: 3.0,
            cost: [{ attribute: 'stamina', amount: 20 }],
            abilityTags: ['ability.fire', 'ability.projectile', 'action.casting']
        });
    }

    /**
     * Activate Fireball ability.
     * @param {import('../AbilitySystem.js').AbilitySystem} owner 
     * @param {any} targets 
     */
    activate(owner, targets) {
        const scaledDamage = this.scaleMagnitude(25, 0.15);
        const radius = this.scaleMagnitude(3.0, 0.1);

        // Simulate fireball projectile creation & explosion on targets / area
        if (targets && typeof targets.onHit === 'function') {
            targets.onHit({
                damage: scaledDamage,
                radius,
                element: 'fire'
            });
        }

        // Apply burning effect to targets in radius if targets list/array provided
        if (targets && Array.isArray(targets.hitEntities)) {
            const burnEffect = GameplayEffect.burning(5, 4);
            for (let i = 0; i < targets.hitEntities.length; i++) {
                const entityAS = targets.hitEntities[i];
                if (entityAS && typeof entityAS.applyEffect === 'function') {
                    entityAS.applyEffect(burnEffect);
                }
            }
        }

        // End ability state immediately after cast
        super.endAbility(owner);
    }
}
