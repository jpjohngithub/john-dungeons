/**
 * @file BuildingSystem.js
 * @description Snap-to-grid building system supporting walls, floors, ramps, barricades, campfires, and workbenches.
 */

import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

export class BuildingSystem {
    constructor() {
        this.gridSize = 2.0; // 2m cells
        this.snapThreshold = 1.0;
        
        /** @type {Map<string, Object>} */
        this.buildableTypes = new Map();
        
        /** @type {Array<Object>} */
        this.placedStructures = [];

        this.registerDefaultTypes();
    }

    registerDefaultTypes() {
        const types = [
            { id: 'WALL', name: 'Wall', cost: [{ itemId: 'wood', amount: 10 }], health: 100 },
            { id: 'FLOOR', name: 'Floor', cost: [{ itemId: 'wood', amount: 8 }], health: 80 },
            { id: 'RAMP', name: 'Ramp', cost: [{ itemId: 'wood', amount: 10 }], health: 90 },
            { id: 'BARRICADE', name: 'Barricade', cost: [{ itemId: 'scrap', amount: 15 }], health: 150 },
            { id: 'CAMPFIRE', name: 'Campfire', cost: [{ itemId: 'stone', amount: 5 }, { itemId: 'wood', amount: 5 }], health: 50, isCampfire: true },
            { id: 'WORKBENCH', name: 'Workbench', cost: [{ itemId: 'wood', amount: 20 }, { itemId: 'scrap', amount: 10 }], health: 200, isWorkbench: true }
        ];

        for (const t of types) {
            this.buildableTypes.set(t.id, t);
        }
    }

    /**
     * Snap a world position to the nearest 2m grid cell.
     * @param {THREE.Vector3} position 
     * @returns {THREE.Vector3}
     */
    snapPosition(position) {
        const x = Math.round(position.x / this.gridSize) * this.gridSize;
        const y = Math.round(position.y / this.gridSize) * this.gridSize;
        const z = Math.round(position.z / this.gridSize) * this.gridSize;
        return new THREE.Vector3(x, y, z);
    }

    /**
     * Validate if placement location is valid (no overlap).
     * @param {THREE.Vector3} position 
     * @returns {boolean}
     */
    isValidPlacement(position) {
        for (const struct of this.placedStructures) {
            if (struct.position.distanceTo(position) < 0.5) {
                return false; // too close/overlapping
            }
        }
        return true;
    }

    /**
     * Place a structure in the world.
     * @param {string} typeId 
     * @param {THREE.Vector3} position 
     * @param {Object} inventory InventorySystem instance
     * @returns {Object|null}
     */
    placeStructure(typeId, position, inventory) {
        const def = this.buildableTypes.get(typeId);
        if (!def) return null;

        // Check costs
        for (const cost of def.cost) {
            if (!inventory.hasItem(cost.itemId, cost.amount)) {
                EventBus.emit('build.failed', { typeId, reason: 'Insufficient materials' });
                return null;
            }
        }

        const snappedPos = this.snapPosition(position);
        if (!this.isValidPlacement(snappedPos)) {
            EventBus.emit('build.failed', { typeId, reason: 'Invalid placement location' });
            return null;
        }

        // Consume items
        for (const cost of def.cost) {
            inventory.removeItem(cost.itemId, cost.amount);
        }

        const structure = {
            id: Math.random().toString(36).substring(2, 9),
            typeId: def.id,
            position: snappedPos,
            health: def.health,
            maxHealth: def.health,
            isCampfire: !!def.isCampfire,
            isWorkbench: !!def.isWorkbench
        };

        this.placedStructures.push(structure);
        EventBus.emit('build.complete', { structure });
        return structure;
    }

    /**
     * Damage a structure. If health drops to 0, destroy and drop partial materials.
     * @param {Object} structure 
     * @param {number} amount 
     */
    damageStructure(structure, amount) {
        structure.health = Math.max(0, structure.health - amount);
        EventBus.emit('building.damaged', { structure, health: structure.health });

        if (structure.health <= 0) {
            this.destroyStructure(structure);
        }
    }

    /**
     * Destroy structure and drop partial materials.
     * @param {Object} structure 
     */
    destroyStructure(structure) {
        const index = this.placedStructures.indexOf(structure);
        if (index !== -1) {
            this.placedStructures.splice(index, 1);
            const def = this.buildableTypes.get(structure.typeId);
            const drops = def ? def.cost.map(c => ({ itemId: c.itemId, amount: Math.max(1, Math.floor(c.amount * 0.5)) })) : [];
            EventBus.emit('building.destroyed', { structure, drops });
        }
    }
}

export default BuildingSystem;
