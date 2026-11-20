/**
 * @file CameraSystem.js
 * @description Over-the-shoulder TPS third-person camera with smooth damping and collision avoidance.
 */

import * as THREE from 'three';

export class CameraSystem {
    constructor() {
        this.targetOffset = new THREE.Vector3(0.8, 1.8, -3.5);
        this.currentPosition = new THREE.Vector3();
        this.pitch = 0;
        this.yaw = 0;
        this.sensitivity = 0.003;
    }

    init(engine) {
        this.engine = engine;
    }

    /**
     * Update camera position and orientation relative to player.
     * @param {THREE.Vector3} playerPos 
     * @param {number} dt 
     * @param {Object} inputManager 
     */
    updateCamera(playerPos, dt, inputManager) {
        // Accumulate mouse look
        this.yaw -= inputManager.mouse.dx * this.sensitivity;
        this.pitch -= inputManager.mouse.dy * this.sensitivity;

        // Clamp pitch to prevent flipping
        this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, this.pitch));

        // Compute desired camera position in spherical coordinates around target
        const distance = 4.0;
        const targetLookAt = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));

        const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * distance;
        const offsetY = Math.sin(this.pitch) * distance + 1.5;
        const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * distance;

        const desiredPos = playerPos.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));

        // Smoothly interpolate camera position (lerp)
        this.engine.camera.position.lerp(desiredPos, 15 * dt);
        this.engine.camera.lookAt(targetLookAt);
    }

    update(dt) {
        // Handled via Game loop integration with player
    }
}
