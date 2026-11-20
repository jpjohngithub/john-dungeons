/**
 * @file InventorySystem.js
 * @description Fixed 24-slot inventory management with equipment slots, stacking, and weight calculation.
 */

import EventBus from '../core/EventBus.js';

export class InventorySystem {
    constructor(maxSlots = 24, maxCarryWeight = 100) {
        this.maxSlots = maxSlots;
        this.maxCarryWeight = maxCarryWeight;

        /** @type {Array<{item: Object|null, quantity: number, maxStack: number}>} */
        this.slots = new Array(maxSlots).fill(null).map(() => ({ item: null, quantity: 0, maxStack: 64 }));

        this.equipment = {
            weapon1: null,
            weapon2: null,
            armor: null,
            helmet: null,
            backpack: null,
            ability1: null,
            ability2: null,
            ability3: null
        };
    }

    /**
     * Calculate total current inventory weight.
     * @returns {number}
     */
    getTotalWeight() {
        let total = 0;
        for (const slot of this.slots) {
            if (slot.item && slot.quantity > 0) {
                const weightPerUnit = slot.item.weight || 0.1;
                total += slot.quantity * weightPerUnit;
            }
        }
        return total;
    }

    /**
     * Add item to inventory.
     * @param {string|Object} item 
     * @param {number} qty 
     * @returns {boolean} success
     */
    addItem(item, qty) {
        const itemObj = typeof item === 'string' ? { id: item, name: item, weight: 0.1, maxStack: 64 } : item;
        const maxStack = itemObj.maxStack || 64;

        // 1. Try stacking into existing slots
        let remainingQty = qty;
        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemObj.id && slot.quantity < slot.maxStack) {
                const spaceInStack = slot.maxStack - slot.quantity;
                const addAmount = Math.min(remainingQty, spaceInStack);
                slot.quantity += addAmount;
                remainingQty -= addAmount;
                if (remainingQty <= 0) break;
            }
        }

        // 2. Try placing into empty slots
        if (remainingQty > 0) {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (!slot.item || slot.quantity === 0) {
                    const addAmount = Math.min(remainingQty, maxStack);
                    slot.item = itemObj;
                    slot.quantity = addAmount;
                    remainingQty -= addAmount;
                    if (remainingQty <= 0) break;
                }
            }
        }

        if (remainingQty > 0) {
            EventBus.emit('inventory.full', { item: itemObj, uncollected: remainingQty });
            return false;
        }

        EventBus.emit('inventory.changed', { slots: this.slots });
        return true;
    }

    /**
     * Remove item quantity by itemId.
     * @param {string} itemId 
     * @param {number} qty 
     * @returns {boolean}
     */
    removeItem(itemId, qty) {
        let remaining = qty;
        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemId) {
                const removeAmount = Math.min(remaining, slot.quantity);
                slot.quantity -= removeAmount;
                remaining -= removeAmount;
                if (slot.quantity <= 0) {
                    slot.item = null;
                    slot.quantity = 0;
                }
                if (remaining <= 0) break;
            }
        }

        if (remaining > 0) return false;

        EventBus.emit('inventory.changed', { slots: this.slots });
        return true;
    }

    /**
     * Check if inventory has sufficient item quantity.
     * @param {string} itemId 
     * @param {number} qty 
     * @returns {boolean}
     */
    hasItem(itemId, qty) {
        let count = 0;
        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemId) {
                count += slot.quantity;
                if (count >= qty) return true;
            }
        }
        return count >= qty;
    }

    /**
     * Get slot data by index.
     * @param {number} index 
     * @returns {Object|null}
     */
    getItem(index) {
        return this.slots[index] || null;
    }

    /**
     * Swap two inventory slots.
     * @param {number} indexA 
     * @param {number} indexB 
     */
    swapSlots(indexA, indexB) {
        if (indexA < 0 || indexA >= this.maxSlots || indexB < 0 || indexB >= this.maxSlots) return;
        const temp = this.slots[indexA];
        this.slots[indexA] = this.slots[indexB];
        this.slots[indexB] = temp;
        EventBus.emit('inventory.changed', { slots: this.slots });
    }

    /**
     * Split a stack into a new empty slot.
     * @param {number} slotIndex 
     * @param {number} amount 
     */
    splitStack(slotIndex, amount) {
        const sourceSlot = this.slots[slotIndex];
        if (!sourceSlot || !sourceSlot.item || sourceSlot.quantity <= amount) return;

        // Find empty slot
        const emptyIndex = this.slots.findIndex(s => !s.item || s.quantity === 0);
        if (emptyIndex === -1) return;

        sourceSlot.quantity -= amount;
        this.slots[emptyIndex] = {
            item: sourceSlot.item,
            quantity: amount,
            maxStack: sourceSlot.maxStack
        };

        EventBus.emit('inventory.changed', { slots: this.slots });
    }
}

export default InventorySystem;
