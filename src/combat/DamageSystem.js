export const DamageType = {
    PHYSICAL: 'PHYSICAL',
    FIRE: 'FIRE',
    ICE: 'ICE',
    LIGHTNING: 'LIGHTNING',
    STORM: 'STORM',
    FALL: 'FALL'
};

export class DamageSystem {
    constructor(eventBus, hitFeedback) {
        this.eventBus = eventBus;
        this.hitFeedback = hitFeedback;
    }

    calculateDamage(attacker, target, baseDamage, element = DamageType.PHYSICAL, isHead = false, isCritOverride = null) {
        let dmg = baseDamage;

        // Attacker modifiers
        if (attacker && attacker.stats && attacker.stats.attackDamage !== undefined) {
            dmg *= attacker.stats.attackDamage;
        }

        // Elemental bonus or resistance
        if (target && target.elementalSystem) {
            dmg = target.elementalSystem.applyResistance(dmg, element);
        }

        // Armor reduction: finalDmg = baseDmg * (100 / (100 + armor))
        const armor = (target && target.stats && target.stats.armor) ? target.stats.armor : 0;
        dmg *= (100 / (100 + armor));

        // Headshot multiplier (2x)
        if (isHead) {
            dmg *= 2.0;
        }

        // Crit check
        const critChance = (attacker && attacker.stats && attacker.stats.critChance) !== undefined ? attacker.stats.critChance : 0.05;
        const critMultiplier = (attacker && attacker.stats && attacker.stats.critMultiplier) !== undefined ? attacker.stats.critMultiplier : 1.5;
        
        let isCrit = isCritOverride !== null ? isCritOverride : (Math.random() < critChance);
        if (isCrit) {
            dmg *= critMultiplier;
        }

        return {
            damage: Math.max(1, Math.round(dmg)),
            isCrit,
            isHead,
            element
        };
    }

    applyDamage(target, amount, type = DamageType.PHYSICAL, attacker = null, hitPoint = null, isCrit = false, isHead = false) {
        if (!target) return;

        let finalAmount = amount;

        // Shield absorption first
        if (target.shield !== undefined && target.shield > 0) {
            if (target.shield >= finalAmount) {
                target.shield -= finalAmount;
                finalAmount = 0;
            } else {
                finalAmount -= target.shield;
                target.shield = 0;
            }
        }

        // Health damage
        if (target.health !== undefined) {
            target.health = Math.max(0, target.health - finalAmount);
        }

        // Trigger hit feedback
        if (this.hitFeedback) {
            this.hitFeedback.onDamageDealt({
                target,
                attacker,
                amount: finalAmount,
                type,
                hitPoint,
                isCrit,
                isHead,
                killed: target.health <= 0
            });
        }

        // Emit events
        if (target.health <= 0) {
            if (this.eventBus) {
                this.eventBus.emit('entity.killed', { target, attacker, type });
            }
        }

        if (this.eventBus) {
            this.eventBus.emit('damage.dealt', { target, attacker, amount: finalAmount, type, isCrit, isHead });
        }

        return finalAmount;
    }
}
