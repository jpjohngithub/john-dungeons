import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

/**
 * IKSystem handles procedural Inverse Kinematics for feet and hands.
 */
export class IKSystem {
    constructor(scene, characterMesh) {
        this.scene = scene;
        this.mesh = characterMesh;

        this.raycaster = new THREE.Raycaster();
        this.blendWeight = 1.0;
        this.maxFootOffset = 0.4;
    }

    /**
     * Analytical two-bone IK solver for limb positioning (e.g. arms/legs).
     * @returns {THREE.Quaternion[]} rotations for joint 1 and joint 2
     */
    solveTwoBone(rootPos, targetPos, polePos, length1, length2) {
        const direction = targetPos.clone().sub(rootPos);
        const totalLen = direction.length();
        const maxLen = length1 + length2;

        if (totalLen >= maxLen) {
            const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction.normalize());
            return [rot, rot];
        }

        // Law of cosines for joint angle
        const lSq1 = length1 * length1;
        const lSq2 = length2 * length2;
        const dirSq = totalLen * totalLen;

        const cosAngle = (dirSq + lSq1 - lSq2) / (2 * totalLen * length1);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

        // Basic analytical rotation approximation
        const rot1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle);
        const rot2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle * 0.5);

        return [rot1, rot2];
    }

    update(dt, playerPosition) {
        if (!this.mesh) return;

        // Foot IK Raycasting
        const leftHipRayPos = playerPosition.clone().add(new THREE.Vector3(-0.2, 1.0, 0));
        const rightHipRayPos = playerPosition.clone().add(new THREE.Vector3(0.2, 1.0, 0));

        const leftGroundOffset = this._getGroundOffset(leftHipRayPos);
        const rightGroundOffset = this._getGroundOffset(rightHipRayPos);

        // Hip adjustment based on lowest foot
        const maxOffset = Math.max(leftGroundOffset, rightGroundOffset);
        if (maxOffset > 0) {
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, playerPosition.y - maxOffset * 0.5, dt * 10);
        }
    }

    _getGroundOffset(origin) {
        this.raycaster.set(origin, new THREE.Vector3(0, -1, 0), 0, 1.5);
        const hits = this.raycaster.intersectObjects(this.scene.children, true);
        if (hits.length > 0) {
            const hitDistance = hits[0].distance;
            return Math.max(0, 1.0 - hitDistance);
        }
        return 0;
    }
}
