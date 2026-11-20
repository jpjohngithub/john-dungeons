/**
 * @file PhysicsSystem.js
 * @description Handles collision detection, bounding boxes, and rigid body movement for John and monsters.
 */

import * as THREE from 'three';

export class PhysicsSystem {
    constructor() {
        this.colliders = [];
    }

    init(engine) {
        this.engine = engine;
        this.buildDungeonColliders();
    }

    buildDungeonColliders() {
        // Simple procedural boundary walls and pillars
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.9 });
        
        // Floor
        const floorGeo = new THREE.PlaneGeometry(60, 60);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.engine.scene.add(floor);

        // Add some dungeon pillars as colliders
        const pillarGeo = new THREE.BoxGeometry(2, 6, 2);
        const positions = [[-8, 3, -8], [8, 3, -8], [-8, 3, 8], [8, 3, 8], [0, 3, -15]];
        
        positions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, wallMaterial);
            pillar.position.set(...pos);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.engine.scene.add(pillar);

            const box = new THREE.Box3().setFromObject(pillar);
            this.colliders.push(box);
        });
    }

    /**
     * Check if a bounding box collides with any static level geometry.
     * @param {THREE.Box3} box 
     * @returns {boolean}
     */
    checkCollision(box) {
        for (const collider of this.colliders) {
            if (collider.intersectsBox(box)) {
                return true;
            }
        }
        return false;
    }

    update(dt) {
        // Physics integration passes
    }
}
