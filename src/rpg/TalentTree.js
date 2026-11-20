/**
 * @file TalentTree.js
 * @description Quick talent tree system with 3 branches per class, 5 tiers each, and point allocation.
 */

import EventBus from '../core/EventBus.js';

export class TalentTree {
    constructor() {
        /** @type {Map<string, Object>} */
        this.nodes = new Map();
        this.availablePoints = 0;
        this.allocatedPoints = new Set(); // nodeIds

        this.registerDefaultTalents();
    }

    registerDefaultTalents() {
        const defaultTalents = [
            // Offense branch
            { id: 'off_1', name: 'Raw Power', tier: 1, branch: 'Offense', effects: [{ stat: 'damage', value: 0.05 }], prerequisites: [], maxPoints: 1, currentPoints: 0 },
            { id: 'off_2', name: 'Critical Eye', tier: 2, branch: 'Offense', effects: [{ stat: 'critChance', value: 0.05 }], prerequisites: ['off_1'], maxPoints: 1, currentPoints: 0 },
            { id: 'off_3', name: 'Fervor', tier: 3, branch: 'Offense', effects: [{ stat: 'attackSpeed', value: 0.10 }], prerequisites: ['off_2'], maxPoints: 1, currentPoints: 0 },
            // Defense branch
            { id: 'def_1', name: 'Resilience', tier: 1, branch: 'Defense', effects: [{ stat: 'maxHp', value: 20 }], prerequisites: [], maxPoints: 1, currentPoints: 0 },
            { id: 'def_2', name: 'Iron Skin', tier: 2, branch: 'Defense', effects: [{ stat: 'armor', value: 10 }], prerequisites: ['def_1'], maxPoints: 1, currentPoints: 0 },
            // Utility branch
            { id: 'utl_1', name: 'Swift Foot', tier: 1, branch: 'Utility', effects: [{ stat: 'moveSpeed', value: 0.05 }], prerequisites: [], maxPoints: 1, currentPoints: 0 }
        ];

        for (const t of defaultTalents) {
            this.nodes.set(t.id, t);
        }
    }

    /**
     * Allocate a point to a talent node.
     * @param {string} nodeId 
     * @returns {boolean}
     */
    allocatePoint(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return false;
        if (this.availablePoints <= 0) return false;
        if (node.currentPoints >= node.maxPoints) return false;

        // Check prerequisites
        for (const prereqId of node.prerequisites) {
            const prereqNode = this.nodes.get(prereqId);
            if (!prereqNode || prereqNode.currentPoints <= 0) {
                EventBus.emit('talent.failed', { nodeId, reason: 'Prerequisites not met' });
                return false;
            }
        }

        node.currentPoints += 1;
        this.availablePoints -= 1;
        this.allocatedPoints.add(nodeId);

        EventBus.emit('talent.allocated', { node, availablePoints: this.availablePoints });
        return true;
    }

    /**
     * Reset talent tree, refunding all points.
     */
    resetTree() {
        let refunded = 0;
        for (const node of this.nodes.values()) {
            refunded += node.currentPoints;
            node.currentPoints = 0;
        }
        this.availablePoints += refunded;
        this.allocatedPoints.clear();

        EventBus.emit('talent.reset', { availablePoints: this.availablePoints });
    }

    /**
     * Serialize talent allocation as a compact array of unlocked node IDs.
     * @returns {Array<string>}
     */
    serialize() {
        return Array.from(this.allocatedPoints);
    }

    /**
     * Load serialized talent array.
     * @param {Array<string>} data 
     */
    deserialize(data) {
        this.resetTree();
        for (const nodeId of data) {
            const node = this.nodes.get(nodeId);
            if (node && this.availablePoints > 0) {
                node.currentPoints = 1;
                this.availablePoints -= 1;
                this.allocatedPoints.add(nodeId);
            }
        }
    }
}

export default TalentTree;
