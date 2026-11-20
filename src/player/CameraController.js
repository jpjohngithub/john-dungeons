import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

/**
 * CameraController handles over-the-shoulder TPS camera, mouse look, spring arm collision, and shakes.
 */
export class CameraController {
    constructor(camera, inputManager, scene) {
        this.camera = camera;
        this.input = inputManager;
        this.scene = scene;

        this.target = null; // Target object or vector to follow
        this.distance = 3.5;
        this.minDistance = 1.0;
        this.maxDistance = 6.0;

        this.yaw = 0;
        this.pitch = 0;
        this.minPitch = -40 * THREE.MathUtils.DEG2RAD;
        this.maxPitch = 60 * THREE.MathUtils.DEG2RAD;

        this.sensitivity = 0.002;
        this.damping = 0.1;

        this.shoulderOffset = new THREE.Vector3(0.6, 1.6, 0);
        this.isRightShoulder = true;

        this.baseFov = 70;
        this.sprintFov = 80;
        this.aimFov = 50;
        this.currentFov = 70;

        this.shakes = [];
        this.raycaster = new THREE.Raycaster();
    }

    attach(target) {
        this.target = target;
    }

    addShake(intensity, duration, frequency = 20) {
        this.shakes.push({
            intensity,
            duration,
            elapsed: 0,
            frequency
        });
    }

    swapShoulder() {
        this.isRightShoulder = !this.isRightShoulder;
        this.shoulderOffset.x *= -1;
    }

    update(dt, playerState) {
        if (!this.target) return;

        // Handle shoulder swap input
        if (this.input.getActionJustPressed('swapShoulder')) {
            this.swapShoulder();
        }

        // Mouse look
        const mouseDelta = this.input.mouse.delta;
        this.yaw -= mouseDelta.x * this.sensitivity;
        this.pitch -= mouseDelta.y * this.sensitivity;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

        // Controller look axes
        const lookX = this.input.getAxis('lookX');
        const lookY = this.input.getAxis('lookY');
        this.yaw -= lookX * 2.5 * dt;
        this.pitch -= lookY * 2.5 * dt;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

        // Desired FOV based on state
        let targetFov = this.baseFov;
        if (playerState === 'SPRINTING') targetFov = this.sprintFov;
        if (playerState === 'AIMING') targetFov = this.aimFov;
        this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, dt * 10);
        this.camera.fov = this.currentFov;
        this.camera.updateProjectionMatrix();

        // Calculate target camera position via spherical coordinates
        const targetPos = this.target.position ? this.target.position : this.target;
        const focusPoint = targetPos.clone().add(this.shoulderOffset);

        const offset = new THREE.Vector3(
            Math.sin(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.pitch),
            Math.cos(this.yaw) * Math.cos(this.pitch)
        ).multiplyScalar(this.distance);

        const desiredCamPos = focusPoint.clone().add(offset);

        // Spring arm collision resolution
        this.raycaster.set(focusPoint, desiredCamPos.clone().sub(focusPoint).normalize());
        const maxDist = focusPoint.distanceTo(desiredCamPos);
        const hits = this.raycaster.intersectObjects(this.scene.children, true);

        let finalCamPos = desiredCamPos;
        if (hits.length > 0 && hits[0].distance < maxDist) {
            finalCamPos = hits[0].point.clone().add(hits[0].face.normal.clone().multiplyScalar(0.2));
        }

        // Camera Shake calculation
        let shakeOffset = new THREE.Vector3();
        for (let i = this.shakes.length - 1; i >= 0; i--) {
            const s = this.shakes[i];
            s.elapsed += dt;
            if (s.elapsed >= s.duration) {
                this.shakes.splice(i, 1);
            } else {
                const dampingFactor = 1.0 - (s.elapsed / s.duration);
                shakeOffset.set(
                    (Math.random() - 0.5) * s.intensity * dampingFactor,
                    (Math.random() - 0.5) * s.intensity * dampingFactor,
                    0
                );
            }
        }

        finalCamPos.add(shakeOffset);

        // Smooth follow
        this.camera.position.lerp(finalCamPos, 1.0 - Math.pow(this.damping, dt * 60));
        this.camera.lookAt(focusPoint);
    }
}
