/**
 * @file ClassSystem.js
 * @description RPG Class archetypes (Assault, Scout, Technomancer) with passives and ultimates.
 */

import EventBus from '../core/EventBus.js';

export class ClassSystem {
    constructor() {
        /** @type {Map<string, Object>} */
        this.classes = new Map();
        this.currentClass = null;

        this.registerDefaultClasses();
    }

    registerDefaultClasses() {
        const archetypes = [
            {
                id: 'ASSAULT',
                name: 'Assault',
                description: 'Frontline brawler with high damage and speed.',
                passives: [{ attribute: 'damage', value: 0.15 }, { attribute: 'moveSpeed', value: 0.10 }],
                startingAbilities: ['frag_grenade', 'adrenaline_rush'],
                ultimate: { id: 'berserker_rage', name: 'Berserker Rage', description: '3x attack speed for 8s', duration: 8 }
            },
            {
                id: 'SCOUT',
                name: 'Scout',
                description: 'Agile tracker with high movement and critical strike.',
                passives: [{ attribute: 'moveSpeed', value: 0.20 }, { attribute: 'critChance', value: 0.15 }],
                startingAbilities: ['smoke_bomb', 'sonar_pulse'],
                ultimate: { id: 'shadow_step', name: 'Shadow Step', description: 'Invisibility for 5s', duration: 5 }
            },
            {
                id: 'TECHNOMANCER',
                name: 'Technomancer',
                description: 'Master of abilities and technological gadgetry.',
                passives: [{ attribute: 'abilityDamage', value: 0.25 }, { attribute: 'cooldownReduction', value: 0.20 }],
                startingAbilities: ['turret_deploy', 'EMP_blast'],
                ultimate: { id: 'overload', name: 'Overload', description: 'Reset all cooldowns + AoE lightning', duration: 0 }
            }
        ];

        for (const cls of archetypes) {
            this.classes.set(cls.id, cls);
        }
    }

    /**
     * Select a character class archetype.
     * @param {string} classId 
     * @returns {Object|null}
     */
    selectClass(classId) {
        const cls = this.classes.get(classId);
        if (!cls) return null;

        this.currentClass = cls;
        EventBus.emit('class.selected', { class: cls });
        return cls;
    }
}

export default ClassSystem;
