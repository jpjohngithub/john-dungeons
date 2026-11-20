import * as THREE from 'three';
import { ObjectPool } from '../core/ObjectPool.js';

/**
 * ParticleEmitter - Represents an active particle emission source or effect.
 */
export class ParticleEmitter {
    /**
     * @param {Object} options 
     */
    constructor(options = {}) {
        this.position = options.position ? options.position.clone() : new THREE.Vector3();
        this.rate = options.rate || 10; // particles per second
        this.lifetime = options.lifetime || 1.0;
        this.startSize = options.startSize !== undefined ? options.startSize : 1.0;
        this.endSize = options.endSize !== undefined ? options.endSize : 0.0;
        this.startColor = new THREE.Color(options.startColor || 0xffffff);
        this.endColor = new THREE.Color(options.endColor || 0xffffff);
        this.velocity = options.velocity ? options.velocity.clone() : new THREE.Vector3(0, 1, 0);
        this.gravity = options.gravity !== undefined ? options.gravity : -9.8;
        this.spread = options.spread !== undefined ? options.spread : 0.5;
        this.duration = options.duration !== undefined ? options.duration : -1; // -1 = infinite

        this.elapsed = 0;
        this.emissionAccumulator = 0;
        this.isDead = false;
    }
}

/**
 * VFXSystem - Manages particle systems and GPU instanced meshes for high performance.
 */
export class VFXSystem {
    /**
     * @param {THREE.Scene} scene 
     * @param {number} [maxParticles=1000] 
     */
    constructor(scene, maxParticles = 1000) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.emitters = [];

        // Setup instanced mesh for particles
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxParticles);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instancedMesh);

        // Particle internal state array
        this.particles = [];
        for (let i = 0; i < maxParticles; i++) {
            this.particles.push({
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                color: new THREE.Color(),
                startColor: new THREE.Color(),
                endColor: new THREE.Color(),
                size: 1.0,
                startSize: 1.0,
                endSize: 0.0,
                life: 0,
                maxLife: 1,
                gravity: -9.8
            });
        }

        this.dummy = new THREE.Object3D();
    }

    /**
     * Adds an emitter to the VFX system.
     * @param {ParticleEmitter} emitter 
     */
    addEmitter(emitter) {
        this.emitters.push(emitter);
    }

    /**
     * Removes an emitter.
     * @param {ParticleEmitter} emitter 
     */
    removeEmitter(emitter) {
        const index = this.emitters.indexOf(emitter);
        if (index !== -1) {
            this.emitters.splice(index, 1);
        }
    }

    /**
     * Updates all active emitters and active particles.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Update emitters and spawn new particles
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.elapsed += dt;

            if (emitter.duration > 0 && emitter.elapsed >= emitter.duration) {
                this.emitters.splice(i, 1);
                continue;
            }

            emitter.emissionAccumulator += dt * emitter.rate;
            const spawnCount = Math.floor(emitter.emissionAccumulator);
            emitter.emissionAccumulator -= spawnCount;

            for (let s = 0; s < spawnCount; s++) {
                this._spawnParticle(emitter);
            }
        }

        // Update active particles
        let activeCount = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.active) continue;

            p.life += dt;
            if (p.life >= p.maxLife) {
                p.active = false;
                continue;
            }

            // Physics update
            p.velocity.y += p.gravity * dt;
            p.position.addScaledVector(p.velocity, dt);

            // Interpolate size & color
            const t = p.life / p.maxLife;
            p.size = THREE.MathUtils.lerp(p.startSize, p.endSize, t);
            p.color.lerpColors(p.startColor, p.endColor, t);

            // Update instanced mesh matrix
            this.dummy.position.copy(p.position);
            this.dummy.scale.set(p.size, p.size, p.size);
            // Face camera or identity rotation
            this.dummy.updateMatrix();

            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            this.instancedMesh.setColorAt(i, p.color);

            activeCount++;
        }

        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
        }
    }

    /**
     * Internal helper to spawn a single particle from an emitter.
     * @param {ParticleEmitter} emitter 
     */
    _spawnParticle(emitter) {
        // Find an inactive particle slot
        let particle = null;
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                particle = this.particles[i];
                break;
            }
        }

        if (!particle) return; // Pool exhausted

        particle.active = true;
        particle.life = 0;
        particle.maxLife = emitter.lifetime;
        particle.position.copy(emitter.position);
        
        // Add random spread to velocity
        particle.velocity.copy(emitter.velocity);
        particle.velocity.x += (Math.random() - 0.5) * emitter.spread;
        particle.velocity.y += (Math.random() - 0.5) * emitter.spread;
        particle.velocity.z += (Math.random() - 0.5) * emitter.spread;

        particle.startSize = emitter.startSize;
        particle.endSize = emitter.endSize;
        particle.size = emitter.startSize;
        particle.startColor.copy(emitter.startColor);
        particle.endColor.copy(emitter.endColor);
        particle.color.copy(emitter.startColor);
        particle.gravity = emitter.gravity;
    }

    // --- Preset Emitters ---

    /**
     * Creates a muzzle flash preset.
     * @param {THREE.Vector3} position 
     * @returns {ParticleEmitter}
     */
    static muzzleFlash(position) {
        return new ParticleEmitter({
            position: position,
            rate: 50,
            lifetime: 0.1,
            startSize: 0.5,
            endSize: 0.1,
            startColor: 0xffffaa,
            endColor: 0xff4400,
            velocity: new THREE.Vector3(0, 0, 5),
            gravity: 0,
            spread: 0.2,
            duration: 0.15
        });
    }

    /**
     * Creates a bullet trail preset.
     * @param {THREE.Vector3} position 
     * @returns {ParticleEmitter}
     */
    static bulletTrail(position) {
        return new ParticleEmitter({
            position: position,
            rate: 30,
            lifetime: 0.3,
            startSize: 0.2,
            endSize: 0.05,
            startColor: 0x88ccff,
            endColor: 0x224488,
            velocity: new THREE.Vector3(0, 0, 0),
            gravity: 0,
            spread: 0.1,
            duration: 0.5
        });
    }

    /**
     * Creates an explosion preset.
     * @param {THREE.Vector3} position 
     * @returns {ParticleEmitter}
     */
    static explosion(position) {
        return new ParticleEmitter({
            position: position,
            rate: 200,
            lifetime: 0.8,
            startSize: 1.0,
            endSize: 3.0,
            startColor: 0xffaa00,
            endColor: 0x333333,
            velocity: new THREE.Vector3(0, 3, 0),
            gravity: -2.0,
            spread: 4.0,
            duration: 0.2
        });
    }

    /**
     * Creates an item pickup preset.
     * @param {THREE.Vector3} position 
     * @returns {ParticleEmitter}
     */
    static itemPickup(position) {
        return new ParticleEmitter({
            position: position,
            rate: 20,
            lifetime: 1.0,
            startSize: 0.4,
            endSize: 0.0,
            startColor: 0x00ffcc,
            endColor: 0xffffff,
            velocity: new THREE.Vector3(0, 2, 0),
            gravity: 1.0,
            spread: 0.8,
            duration: 1.0
        });
    }

    /**
     * Creates an ability aura preset.
     * @param {THREE.Vector3} position 
     * @returns {ParticleEmitter}
     */
    static abilityAura(position) {
        return new ParticleEmitter({
            position: position,
            rate: 15,
            lifetime: 1.5,
            startSize: 0.6,
            endSize: 0.2,
            startColor: 0x9900ff,
            endColor: 0x00ffff,
            velocity: new THREE.Vector3(0, 1.5, 0),
            gravity: 0.5,
            spread: 1.0,
            duration: -1
        });
    }
}
