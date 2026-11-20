/**
 * @file ResourceGathering.js
 * @description Destructible environment resources (trees, rocks, bushes, crystals, crates) with progressive visual damage and tool multipliers.
 */

import EventBus from '../core/EventBus.js';

export class ResourceGatheringSystem {
    constructor() {
        /** @type {Map<string, Object>} */
        this.nodeTypes = new Map();
        /** @type {Array<Object>} */
        this.activeNodes = [];

        this.registerDefaultNodeTypes();
    }

    registerDefaultNodeTypes() {
        const types = [
            { id: 'TREE', name: 'Pine Tree', hp: 100, drops: [{ itemId: 'wood', amount: 15, chance: 1.0 }], preferredTool: 'axe' },
            { id: 'ROCK', name: 'Iron Rock', hp: 120, drops: [{ itemId: 'stone', amount: 10, chance: 1.0 }, { itemId: 'scrap', amount: 3, chance: 0.5 }], preferredTool: 'pickaxe' },
            { id: 'BUSH', name: 'Berry Bush', hp: 40, drops: [{ itemId: 'berries', amount: 3, chance: 1.0 }], preferredTool: null },
            { id: 'CRYSTAL', name: 'Energy Crystal', hp: 150, drops: [{ itemId: 'crystal', amount: 2, chance: 1.0 }], preferredTool: 'pickaxe' },
            { id: 'CRATE', name: 'Supply Crate', hp: 50, drops: [{ itemId: 'scrap', amount: 5, chance: 1.0 }, { itemId: 'ammo', amount: 20, chance: 0.8 }], preferredTool: null }
        ];

        for (const t of types) {
            this.nodeTypes.set(t.id, t);
        }
    }

    /**
     * Spawn a gatherable node in the world.
     * @param {string} typeId 
     * @param {Object} position 
     * @returns {Object}
     */
    spawnNode(typeId, position) {
        const def = this.nodeTypes.get(typeId);
        if (!def) return null;

        const node = {
            id: Math.random().toString(36).substring(2, 9),
            typeId: def.id,
            hp: def.hp,
            maxHp: def.hp,
            position,
            drops: def.drops,
            preferredTool: def.preferredTool,
            stage: 1.0 // 1.0, 0.75, 0.5, 0.25
        };

        this.activeNodes.push(node);
        return node;
    }

    /**
     * Hit a resource node with a tool.
     * @param {Object} node 
     * @param {number} rawDamage 
     * @param {string} [toolType=null] 
     * @param {Object} inventory InventorySystem instance
     */
    hitNode(node, rawDamage, toolType = null, inventory) {
        let damage = rawDamage;
        if (node.preferredTool && node.preferredTool === toolType) {
            damage *= 2.0; // Tool multiplier 2x
        }

        node.hp = Math.max(0, node.hp - damage);
        const healthPercent = node.hp / node.maxHp;

        // Progressive visual damage thresholds
        if (healthPercent <= 0.25) node.stage = 0.25;
        else if (healthPercent <= 0.50) node.stage = 0.50;
        else if (healthPercent <= 0.75) node.stage = 0.75;

        EventBus.emit('resource.hit', { node, damage, stage: node.stage });

        if (node.hp <= 0) {
            this.destroyNode(node, inventory);
        }
    }

    /**
     * Destroy node, drop items, and remove from active list.
     * @param {Object} node 
     * @param {Object} inventory InventorySystem instance
     */
    destroyNode(node, inventory) {
        const index = this.activeNodes.indexOf(node);
        if (index !== -1) {
            this.activeNodes.splice(index, 1);

            const grantedDrops = [];
            for (const drop of node.drops) {
                if (Math.random() <= drop.chance) {
                    inventory.addItem(drop.itemId, drop.amount);
                    grantedDrops.push({ itemId: drop.itemId, amount: drop.amount });
                }
            }

            EventBus.emit('resource.destroyed', { node, drops: grantedDrops });
        }
    }
}

export default ResourceGatheringSystem;
