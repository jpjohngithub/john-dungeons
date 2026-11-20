/**
 * @file Player.js
 * @description Player character (John) representation with procedural stylized mesh, animation states, and movement controller.
 */

import * as THREE from 'three';

export class Player {
    constructor() {
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.speed = 6.0;
        this.sprintMultiplier = 1.6;
        this.mesh = null;
        this.health = 100;
        this.maxHealth = 100;
        this.isRolling = false;
        this.rollTimer = 0;
    }

    init(engine) {
        this.engine = engine;
        this.buildMesh();
    }

    buildMesh() {
        this.group = new THREE.Group();

        // Stylized AAA Low-poly Knight/Warrior Mesh representation
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333b4d, roughness: 0.4, metalness: 0.8 });
        const armorMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c8, roughness: 0.3, metalness: 0.9 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.8, 1.1, 0.5);
        const torso = new THREE.Mesh(torsoGeo, bodyMat);
        torso.position.y = 1.3;
        torso.castShadow = true;
        this.group.add(torso);

        // Chestplate
        const chestGeo = new THREE.BoxGeometry(0.85, 0.7, 0.55);
        const chest = new THREE.Mesh(chestGeo, armorMat);
        chest.position.y = 1.4;
        chest.castShadow = true;
        this.group.add(chest);

        // Head / Helmet
        const headGeo = new THREE.BoxGeometry(0.45, 0.5, 0.45);
        const head = new THREE.Mesh(headGeo, armorMat);
        head.position.y = 2.05;
        head.castShadow = true;
        this.group.add(head);

        // Visor gold accent
        const visorGeo = new THREE.BoxGeometry(0.4, 0.1, 0.48);
        const visor = new THREE.Mesh(visorGeo, goldMat);
        visor.position.set(0, 2.05, 0);
        this.group.add(visor);

        // Shoulders / Pauldrons
        const pauldronsGeo = new THREE.BoxGeometry(1.2, 0.3, 0.7);
        const pauldrons = new THREE.Mesh(pauldronsGeo, goldMat);
        pauldrons.position.y = 1.75;
        pauldrons.castShadow = true;
        this.group.add(pauldrons);

        this.engine.scene.add(this.group);
    }

    /**
     * Update player position and inputs.
     * @param {number} dt 
     * @param {Object} input 
     * @param {Object} cameraSystem 
     * @param {Object} physicsSystem 
     */
    updatePlayer(dt, input, cameraSystem, physicsSystem) {
        let moveX = 0;
        let moveZ = 0;

        if (input.isDown('KeyW')) moveZ -= 1;
        if (input.isDown('KeyS')) moveZ += 1;
        if (input.isDown('KeyA')) moveX -= 1;
        if (input.isDown('KeyD')) moveX += 1;

        const isSprinting = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
        const currentSpeed = this.speed * (isSprinting ? this.sprintMultiplier : 1.0);

        if (moveX !== 0 || moveZ !== 0) {
            const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();

            // Align movement with camera yaw
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraSystem.yaw);

            const nextPos = this.position.clone().addScaledVector(moveDir, currentSpeed * dt);
            
            // Simple bounding box check
            const playerBox = new THREE.Box3(
                new THREE.Vector3(nextPos.x - 0.4, nextPos.y, nextPos.z - 0.4),
                new THREE.Vector3(nextPos.x + 0.4, nextPos.y + 2.2, nextPos.z + 0.4)
            );

            if (!physicsSystem.checkCollision(playerBox)) {
                this.position.copy(nextPos);
            }

            // Smooth face towards movement direction
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            this.rotation = targetRotation;
        }

        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        // Subtle breathing idle animation
        const time = performance.now() * 0.005;
        this.group.position.y = this.position.y + Math.sin(time * 2) * 0.03;
    }

    update(dt) {
        // Core update loop handled in main.js coordinator
    }
}
