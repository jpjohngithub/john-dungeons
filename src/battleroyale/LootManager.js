/**
 * LootManager.js — Loot spawning, affixes, and management
 */
import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

export const Rarity = {
    COMMON: { name: 'COMMON', weight: 60, color: 0x888888, affixCount: 0 },
    UNCOMMON: { name: 'UNCOMMON', weight: 25, color: 0x00ff00, affixCount: 1 },
    RARE: { name: 'RARE', weight: 10, color: 0x0088ff, affixCount: 2 },
    EPIC: { name: 'EPIC', weight: 4, color: 0xaa00ff, affixCount: 3 },
    MYTHIC: { name: 'MYTHIC', weight: 1, color: 0xffaa00, affixCount: 3 }
};

export const ItemType = {
    WEAPON: 'WEAPON',
    ARMOR: 'ARMOR',
    CONSUMABLE: 'CONSUMABLE',
    MATERIAL: 'MATERIAL',
    ABILITY_SCROLL: 'ABILITY_SCROLL'
};

const AFFIX_POOL = [
    { name: 'Vampiric', stat: 'lifesteal', value: 0.05, description: '+5% lifesteal on hit' },
    { name: 'Explosive Reload', stat: 'aoeReload', value: 20, description: 'AoE explosion on reload' },
    { name: 'Frost Touch', stat: 'slow', value: 0.2, description: 'Slows target by 20% on hit' },
    { name: 'Swift', stat: 'moveSpeed', value: 0.1, description: '+10% movement speed while held' },
    { name: 'Heavy Impact', stat: 'knockback', value: 1.5, description: 'Increased knockback force' }
];

export class LootTable {
    static rollRarity() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const key of Object.keys(Rarity)) {
            cumulative += Rarity[key].weight;
            if (rand <= cumulative) return Rarity[key];
        }
        return Rarity.COMMON;
    }

    static generateAffixes(rarity) {
        const count = rarity.affixCount;
        const affixes = [];
        const pool = [...AFFIX_POOL];
        for (let i = 0; i < count && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            affixes.push(pool.splice(idx, 1)[0]);
        }
        return affixes;
    }
}

export default class LootManager {
    /**
     * @param {THREE.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.groundItems = [];
        this.despawnTime = 180; // seconds
    }

    spawnLoot(position, tier = 1) {
        const rarity = LootTable.rollRarity();
        const affixes = LootTable.generateAffixes(rarity);

        const item = {
            id: 'item_' + Math.random().toString(36.substring(2, 9)),
            type: ItemType.WEAPON,
            name: `${rarity.name} Assault Rifle`,
            rarity: rarity,
            damage: 25 * (1 + Object.keys(Rarity).indexOf(rarity.name) * 0.2),
            fireRate: 10,
            range: 100,
            magazineSize: 30,
            reloadTime: 2.0,
            affixes: affixes,
            position: position.clone()
        };

        // Create visual mesh
        const geometry = new THREE.BoxGeometry(0.8, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({
            color: rarity.color,
            emissive: rarity.color,
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.position.y += 0.2;
        this.scene.add(mesh);

        // Point light for glow
        const light = new THREE.PointLight(rarity.color, 1, 5);
        light.position.copy(mesh.position);
        this.scene.add(light);

        const groundEntry = {
            item,
            mesh,
            light,
            age: 0
        };

        this.groundItems.push(groundEntry);
        EventBus.emit('loot.spawned', { item, position });
        return item;
    }

    pickupLoot(entity, groundItemEntry) {
        const idx = this.groundItems.indexOf(groundItemEntry);
        if (idx === -1) return false;

        // Remove visuals
        this.scene.remove(groundItemEntry.mesh);
        groundItemEntry.mesh.geometry.dispose();
        groundItemEntry.mesh.material.dispose();
        this.scene.remove(groundItemEntry.light);

        this.groundItems.splice(idx, 1);

        EventBus.emit('item.pickup', { entity, item: groundItemEntry.item });
        return true;
    }

    update(dt) {
        for (let i = this.groundItems.length - 1; i >= 0; i--) {
            const entry = this.groundItems[i];
            entry.age += dt;

            // Bob and rotate animation
            entry.mesh.rotation.y += dt * 1.5;
            entry.mesh.position.y = entry.item.position.y + 0.2 + Math.sin(entry.age * 3) * 0.1;
            entry.light.position.copy(entry.mesh.position);

            // Despawn check
            if (entry.age >= this.despawnTime) {
                this.scene.remove(entry.mesh);
                entry.mesh.geometry.dispose();
                entry.mesh.material.dispose();
                this.scene.remove(entry.light);
                this.groundItems.splice(i, 1);
            }
        }
    }
}
