/**
 * @file EntityManager.js
 * @description Manages active monsters, loot drops, combat interactions, and spawning logic.
 */

import * as THREE from 'three';

export class EntityManager {
    constructor() {
        this.monsters = [];
        this.soulsCount = 0;
    }

    init(engine) {
        this.engine = engine;
        this.spawnMonsters();
    }

    spawnMonsters() {
        const monsterGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
        const monsterMat = new THREE.MeshStandardMaterial({ color: 0x5a1818, roughness: 0.6, metalness: 0.4 });

        const spawnPoints = [
            [-5, 0, -10],
            [6, 0, -12],
            [-10, 0, 5],
            [12, 0, 8]
        ];

        spawnPoints.forEach(pos => {
            const mesh = new THREE.Mesh(monsterGeo, monsterMat);
            mesh.position.set(...pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.engine.scene.add(mesh);

            this.monsters.push({
                mesh: mesh,
                position: mesh.position,
                health: 50,
                speed: 2.5
            });
        });
    }

    /**
     * Update AI behavior and monster tracking towards player.
     * @param {THREE.Vector3} playerPos 
     * @param {number} dt 
     */
    updateMonsters(playerPos, dt) {
        this.monsters.forEach(monster => {
            const dir = playerPos.clone().sub(monster.position);
            dir.y = 0;
            const dist = dir.length();

            if (dist < 15 && dist > 1.2) {
                dir.normalize();
                monster.position.addScaledVector(dir, monster.speed * dt);
                monster.mesh.position.copy(monster.position);
                monster.mesh.lookAt(playerPos.x, monster.position.y, playerPos.z);
            }
        });
    }

    update(dt) {
        // General entity system update ticks
    }
}
