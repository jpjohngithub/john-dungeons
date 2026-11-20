/**
 * DropSystem.js — Freefall and glider deployment
 */
import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

export default class DropSystem {
    /**
     * @param {Object} playerController 
     * @param {THREE.PerspectiveCamera} camera 
     */
    constructor(playerController, camera) {
        this.playerController = playerController;
        this.camera = camera;
        this.state = 'IN_AIRCRAFT'; // IN_AIRCRAFT, FREEFALL, GLIDER, LANDED

        this.aircraftPosition = new THREE.Vector3(0, 500, -2000);
        this.aircraftVelocity = new THREE.Vector3();
        this.flightAngle = Math.random() * Math.PI * 2;
        this.flightSpeed = 150;

        this.freefallVelocity = new THREE.Vector3();
        this.terminalVelocity = 50;
        this.gravity = 9.8;
        this.minAltitudeForGlider = 50;
        this.groundLevel = 0;

        this._setupAircraftPath();
    }

    _setupAircraftPath() {
        const startDist = 3000;
        this.aircraftPosition.set(
            Math.cos(this.flightAngle) * startDist,
            500,
            Math.sin(this.flightAngle) * startDist
        );
        const endPos = new THREE.Vector3(
            -Math.cos(this.flightAngle) * startDist,
            500,
            -Math.sin(this.flightAngle) * startDist
        );
        this.aircraftVelocity.subVectors(endPos, this.aircraftPosition).normalize().multiplyScalar(this.flightSpeed);
    }

    jump() {
        if (this.state !== 'IN_AIRCRAFT') return;
        this.state = 'FREEFALL';
        this.playerController.position.copy(this.aircraftPosition);
        this.freefallVelocity.set(
            this.aircraftVelocity.x * 0.5,
            0,
            this.aircraftVelocity.z * 0.5
        );
        this.camera.fov = 90;
        this.camera.updateProjectionMatrix();
        EventBus.emit('drop.jump', { position: this.playerController.position });
    }

    deployGlider() {
        if (this.state !== 'FREEFALL') return;
        const altitude = this.playerController.position.y - this.groundLevel;
        if (altitude < this.minAltitudeForGlider) return;

        this.state = 'GLIDER';
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();
        EventBus.emit('drop.gliderDeploy', { position: this.playerController.position });
    }

    update(dt, inputState) {
        if (this.state === 'IN_AIRCRAFT') {
            this.aircraftPosition.addScaledVector(this.aircraftVelocity, dt);
            this.playerController.position.copy(this.aircraftPosition);
            return;
        }

        if (this.state === 'FREEFALL') {
            // Accelerate downward
            this.freefallVelocity.y -= this.gravity * dt * 3.0;
            if (Math.abs(this.freefallVelocity.y) > this.terminalVelocity) {
                this.freefallVelocity.y = -this.terminalVelocity;
            }

            // Horizontal drift from input
            const driftSpeed = 30;
            if (inputState.forward) this.freefallVelocity.z -= driftSpeed * dt;
            if (inputState.backward) this.freefallVelocity.z += driftSpeed * dt;
            if (inputState.left) this.freefallVelocity.x -= driftSpeed * dt;
            if (inputState.right) this.freefallVelocity.x += driftSpeed * dt;

            this.playerController.position.addScaledVector(this.freefallVelocity, dt);

            // Auto or manual glider deploy check
            const altitude = this.playerController.position.y - this.groundLevel;
            if (altitude <= this.minAltitudeForGlider || inputState.deployGlider) {
                this.deployGlider();
            }

            if (altitude <= this.groundLevel) {
                this._land();
            }
        } else if (this.state === 'GLIDER') {
            // Glider physics: low fall speed, high horizontal glide
            const fallSpeed = 3;
            const glideSpeed = 40;

            let moveDir = new THREE.Vector3(0, 0, -1);
            moveDir.applyQuaternion(this.camera.quaternion);
            moveDir.y = 0;
            moveDir.normalize();

            this.playerController.position.addScaledVector(moveDir, glideSpeed * dt);
            this.playerController.position.y -= fallSpeed * dt;

            const altitude = this.playerController.position.y - this.groundLevel;
            if (altitude <= this.groundLevel || inputState.land) {
                this._land();
            }
        }
    }

    _land() {
        this.state = 'LANDED';
        this.playerController.position.y = this.groundLevel;
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
        this.playerController.setState('IDLE');
        EventBus.emit('drop.landed', { position: this.playerController.position });
    }

    getSpeedIndicator() {
        if (this.state === 'FREEFALL') return Math.abs(this.freefallVelocity.y);
        if (this.state === 'GLIDER') return 40;
        return 0;
    }
}
