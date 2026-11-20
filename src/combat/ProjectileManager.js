import * as THREE from 'three';

class Projectile {
    constructor() {
        this.active = false;
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.gravity = 9.8;
        this.lifetime = 5.0;
        this.maxLifetime = 5.0;
        this.damage = 10;
        this.radius = 0.2;
        this.splashRadius = 0;
        this.splashDamage = 0;
        this.owner = null;
        this.element = 'PHYSICAL';
        this.trailPositions = [];
        this.maxTrailLength = 10;
    }

    init(config) {
        this.active = true;
        this.position.copy(config.origin);
        this.velocity.copy(config.direction).multiplyScalar(config.speed);
        this.gravity = config.gravity !== undefined ? config.gravity : 9.8;
        this.maxLifetime = config.lifetime || 5.0;
        this.lifetime = this.maxLifetime;
        this.damage = config.damage || 10;
        this.radius = config.radius || 0.2;
        this.splashRadius = config.splashRadius || 0;
        this.splashDamage = config.splashDamage || 0;
        this.owner = config.owner || null;
        this.element = config.element || 'PHYSICAL';
        this.trailPositions = [this.position.clone()];
    }

    reset() {
        this.active = false;
        this.trailPositions = [];
    }
}

export class ProjectileManager {
    constructor(maxActive = 200) {
        this.maxActive = maxActive;
        this.pool = [];
        this.activeProjectiles = [];

        for (let i = 0; i < maxActive; i++) {
            this.pool.push(new Projectile());
        }

        this.raycaster = new THREE.Raycaster();
    }

    spawn(config) {
        if (this.pool.length === 0) return null;
        const proj = this.pool.pop();
        proj.init(config);
        this.activeProjectiles.push(proj);
        return proj;
    }

    update(dt, entities, onHitCallback) {
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const proj = this.activeProjectiles[i];
            if (!proj.active) continue;

            proj.lifetime -= dt;
            if (proj.lifetime <= 0) {
                this.recycle(i);
                continue;
            }

            // Apply gravity
            proj.velocity.y -= proj.gravity * dt;

            // Movement step
            const displacement = proj.velocity.clone().multiplyScalar(dt);
            const nextPosition = proj.position.clone().add(displacement);

            // Raycast segment collision
            const dir = displacement.clone();
            const len = dir.length();
            if (len > 0.0001) {
                dir.normalize();
                this.raycaster.set(proj.position, dir);
                this.raycaster.far = len;

                const intersects = this.raycaster.intersectObjects(entities, true);
                if (intersects.length > 0) {
                    const hit = intersects[0];
                    if (onHitCallback) {
                        onHitCallback(proj, hit);
                    }
                    this.recycle(i);
                    continue;
                }
            }

            proj.position.copy(nextPosition);

            // Update trail
            proj.trailPositions.push(proj.position.clone());
            if (proj.trailPositions.length > proj.maxTrailLength) {
                proj.trailPositions.shift();
            }
        }
    }

    recycle(index) {
        const proj = this.activeProjectiles.splice(index, 1)[0];
        proj.reset();
        this.pool.push(proj);
    }
}
