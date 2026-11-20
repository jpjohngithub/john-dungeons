/**
 * @file CraftingSystem.js
 * @description Crafting system managing recipes, stations, queues, and inventory integration.
 */

import EventBus from '../core/EventBus.js';

export class CraftingSystem {
    constructor() {
        /** @type {Map<string, Object>} */
        this.recipes = new Map();
        /** @type {Array<{recipe: Object, progress: number, duration: number, callback: Function}>} */
        this.queue = [];
        
        // Register default quick craft & station recipes
        this.registerDefaultRecipes();
    }

    registerDefaultRecipes() {
        const defaultRecipes = [
            { id: 'bandage', name: 'Bandage', ingredients: [{ itemId: 'cloth', amount: 2 }], result: { itemId: 'bandage', amount: 1 }, craftTime: 2 },
            { id: 'ammo', name: 'Basic Ammo', ingredients: [{ itemId: 'scrap', amount: 3 }, { itemId: 'gunpowder', amount: 1 }], result: { itemId: 'ammo', amount: 30 }, craftTime: 1 },
            { id: 'basic_food', name: 'Cooked Rations', ingredients: [{ itemId: 'raw_meat', amount: 1 }], result: { itemId: 'cooked_meat', amount: 1 }, craftTime: 3 },
            { id: 'weapon_mod', name: 'Enhanced Sight', ingredients: [{ itemId: 'scrap', amount: 5 }, { itemId: 'glass', amount: 2 }], result: { itemId: 'weapon_mod_sight', amount: 1 }, craftTime: 5, requiredStation: 'WORKBENCH' },
            { id: 'armor', name: 'Reinforced Vest', ingredients: [{ itemId: 'leather', amount: 4 }, { itemId: 'scrap', amount: 10 }], result: { itemId: 'armor_vest', amount: 1 }, craftTime: 8, requiredStation: 'WORKBENCH' }
        ];

        for (const recipe of defaultRecipes) {
            this.recipes.set(recipe.id, recipe);
        }
    }

    /**
     * Register a new recipe.
     * @param {Object} recipe 
     */
    registerRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
    }

    /**
     * Check if inventory has required ingredients for a recipe.
     * @param {Object} recipe 
     * @param {Object} inventory InventorySystem instance
     * @returns {boolean}
     */
    canCraft(recipe, inventory) {
        if (!recipe || !inventory) return false;
        for (const ing of recipe.ingredients) {
            if (!inventory.hasItem(ing.itemId, ing.amount)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Start crafting a recipe.
     * @param {string} recipeId 
     * @param {Object} inventory InventorySystem instance
     * @param {boolean} [hasStation=false]
     * @returns {boolean}
     */
    craft(recipeId, inventory, hasStation = false) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;

        if (recipe.requiredStation && !hasStation) {
            EventBus.emit('craft.failed', { recipeId, reason: 'Missing required station: ' + recipe.requiredStation });
            return false;
        }

        if (!this.canCraft(recipe, inventory)) {
            EventBus.emit('craft.failed', { recipeId, reason: 'Insufficient ingredients' });
            return false;
        }

        // Consume ingredients immediately
        for (const ing of recipe.ingredients) {
            inventory.removeItem(ing.itemId, ing.amount);
        }

        // Add to queue
        this.queue.push({
            recipe,
            progress: 0,
            duration: recipe.craftTime,
            inventory
        });

        EventBus.emit('craft.started', { recipeId, duration: recipe.craftTime });
        return true;
    }

    /**
     * Update crafting queue timers.
     * @param {number} delta elapsed seconds
     */
    update(delta) {
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const item = this.queue[i];
            item.progress += delta;

            EventBus.emit('craft.progress', { recipeId: item.recipe.id, progress: item.progress / item.duration });

            if (item.progress >= item.duration) {
                // Complete crafting
                item.inventory.addItem(item.recipe.result.itemId, item.recipe.result.amount);
                EventBus.emit('craft.complete', { recipeId: item.recipe.id, result: item.recipe.result });
                this.queue.splice(i, 1);
            }
        }
    }
}

export default CraftingSystem;
