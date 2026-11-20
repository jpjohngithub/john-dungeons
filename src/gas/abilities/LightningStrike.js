/**
 * @file LightningStrike.js
 * @description LightningStrike ability extending GameplayAbility. Area strike with chain lightning and shocked effect.
 */

import { GameplayAbility } from '../GameplayAbility.js';
import { GameplayEffect } from '../GameplayEffect.js';

export class LightningStrike extends GameplayAbility {
    constructor() {
        super({
            id: 'ability_lightningstrike',
            name: 'Lightning Strike',
            description: 'Calls down a thunderbolt on an area after a brief delay, chaining to nearby enemies.',
            iconKey: 'icon_lightning',
            cooldown: 12.0,
            cost: [{ attribute: 'stamina', amount: 40 }],
            abilityTags: ['ability.lightning', 'ability.area', 'action.casting']
        });
    }

    /**
     * Activate LightningStrike ability.
     * @param {import('../AbilitySystem.js').AbilitySystem} owner 
     * @param {any} targets 
     */
    activate(owner, targets) {
        const baseDamage = this.scaleMagnitude(45, 0.2);
        const maxBounces = 3;
        const bounceDmgMultiplier = 0.7;

        // Shocked effect increasing crit chance taken
        const shockedEffect = new GameplayEffect({
            id: 'effect_shocked',
            type: 'DURATION',
            duration: 5.0,
            modifiers: [
                { source: 'shocked_crit', attribute: 'critChance', operation: 'add', magnitude: 0.15 }
            ],
            grantedTags: ['status.debuff.shocked', 'element.lightning']
        });

        if (targets && Array.isArray(targets.enemies)) {
            let currentDamage = baseDamage;
            const hitCount = Math.min(targets.enemies.length, maxBounces + 1);

            for (let i = 0; i < hitCount; i++) {
                const enemy = targets.enemies[i];
                if (enemy && enemy.attributeSet) {
                    enemy.attributeSet.modify('health', -currentDamage, 'add');
                    enemy.applyEffect(shockedEffect);
                }
                currentDamage *= bounceDmgMultiplier;
            }
        }

        super.endAbility(owner);
    }
}
