/**
 * BiomeManager.js — Multi-biome island manager
 */
import * as THREE from 'three';

export const BiomeType = {
    GRASSLAND: { id: 'GRASSLAND', name: 'Grassland', temp: 20, humidity: 0.6, surface: 'grass', foliage: 0.3, color: 0x44aa44 },
    FOREST: { id: 'FOREST', name: 'Forest', temp: 18, humidity: 0.8, surface: 'dirt', foliage: 0.9, color: 0x228822 },
    DESERT: { id: 'DESERT', name: 'Desert', temp: 35, humidity: 0.1, surface: 'sand', foliage: 0.05, color: 0xddaa55 },
    SNOW: { id: 'SNOW', name: 'Snow', temp: -10, humidity: 0.4, surface: 'ice', foliage: 0.1, color: 0xeeeeee },
    SWAMP: { id: 'SWAMP', name: 'Swamp', temp: 25, humidity: 0.95, surface: 'mud', foliage: 0.7, color: 0x445533 },
    VOLCANIC: { id: 'VOLCANIC', name: 'Volcanic', temp: 50, humidity: 0.05, surface: 'rock', foliage: 0.02, color: 0x332222 }
};

export default class BiomeManager {
    constructor() {
        this.worldSize = 4000;
    }

    _pseudoNoise(x, z) {
        return Math.sin(x * 0.001) * Math.cos(z * 0.001) + Math.sin(x * 0.003) * 0.5;
    }

    getBiomeAtPosition(position) {
        const nx = position.x;
        const nz = position.z;
        const distFromCenter = Math.sqrt(nx * nx + nz * nz);

        const noiseVal = this._pseudoNoise(nx, nz);

        if (distFromCenter > 1500) return BiomeType.VOLCANIC;
        if (noiseVal > 0.6) return BiomeType.FOREST;
        if (noiseVal > 0.2) return BiomeType.GRASSLAND;
        if (noiseVal > -0.2) return BiomeType.SWAMP;
        if (noiseVal > -0.6) return BiomeType.DESERT;
        return BiomeType.SNOW;
    }

    applyEnvironmentEffects(position, scene, renderer) {
        const biome = this.getBiomeAtPosition(position);

        // Modify fog or scene background based on biome
        scene.background = new THREE.Color(biome.color);
        scene.fog = new THREE.FogExp2(biome.color, 0.0005);

        return biome;
    }
}
