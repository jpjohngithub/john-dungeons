/**
 * @file IceWall.js
 * @description IceWall ability extending GameplayAbility. Spawns an ice wall construct that applies frozen slow.
 */

import { GameplayAbility } from '../GameplayAbility.js';
import { GameplayEffect } from '../GameplayEffect.js';

export class IceWall extends GameplayAbility {
    constructor() {
        super({
            id: 'ability_icewall',
            name: 'Ice Wall',
            description: 'Spawns a solid wall of frost blocks in front of the caster, blocking paths and freezing touch.',
            iconKey: 'icon_icewall',
            cooldown: 8.0,
            cost: [{ attribute: 'stamina', amount: 30 }],
            abilityTags: ['ability.ice', 'ability.construct', 'action.casting']
        });
    }

    /**
     * Activate IceWall ability.
     * @param {import('../AbilitySystem.js').AbilitySystem} owner 
     * @param {any} targets 
     */
    activate(owner, targets) {
        const wallHp = this.scaleMagnitude(100, 0.2);
        const freezeDuration = this.scaleMagnitude(2.5, 0.1);

        // Spawn wall construct logic
        const wallConstruct = {
            hp: wallHp,
            maxHp: wallHp,
            blocksProjectiles: true,
            blocksMovement: true
        };

        // If targets contain entities touching the wall, apply frozen effect
        if (targets && Array.isArray(targets.touchingEntities)) {
            const frozenEffect = GameplayEffect.frozen(0.5, freezeDuration);
            for (let i = 0; i < targets.touchingEntities.length; i++) {
                const entityAS = targets.touchingEntities[i];
                if (entityAS && typeof entityAS.applyEffect === 'function') {
                    entityAS.applyEffect(frozenEffect);
                }
            }
        }

        super.endAbility(owner);
    }
}
