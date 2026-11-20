/**
 * StormManager.js — Multi-phase battle royale zone/storm
 */
import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

export default class StormManager {
    /**
     * @param {THREE.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.phases = [
            { waitTime: 60, shrinkTime: 90, endRadius: 800, damage: 1, damageInterval: 2.0 },
            { waitTime: 50, shrinkTime: 75, endRadius: 500, damage: 2, damageInterval: 2.0 },
            { waitTime: 40, shrinkTime: 60, endRadius: 300, damage: 5, damageInterval: 1.5 },
            { waitTime: 30, shrinkTime: 45, endRadius: 150, damage: 10, damageInterval: 1.0 },
            { waitTime: 20, shrinkTime: 30, endRadius: 50, damage: 15, damageInterval: 0.5 },
            { waitTime: 10, shrinkTime: 20, endRadius: 0, damage: 25, damageInterval: 0.5 }
        ];

        this.currentPhaseIndex = 0;
        this.state = 'WAITING'; // WAITING, SHRINKING, FINISHED
        this.timer = this.phases[0].waitTime;
        this.shrinkProgress = 0; // 0 to 1

        this.currentCenter = new THREE.Vector2(0, 0);
        this.currentRadius = 2000; // initial map storm radius
        this.targetCenter = new THREE.Vector2(0, 0);
        this.targetRadius = 2000;
        this.startCenter = new THREE.Vector2(0, 0);
        this.startRadius = 2000;

        this.damageTimer = 0;

        // Visual Mesh setup
        this.mesh = null;
        this.material = null;
        this._initVisuals();
    }

    _initVisuals() {
        const geometry = new THREE.RingGeometry(1, 1, 64, 1);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x8800ff) },
                radius: { value: this.currentRadius }
            },
            vertexShader: `
                uniform float time;
                uniform float radius;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    // Apply radial wave distortion
                    float dist = length(pos.xy);
                    pos.z += sin(dist * 0.05 + time * 3.0) * 5.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                void main() {
                    float alpha = 0.4 + 0.2 * sin(time * 5.0 + vUv.x * 20.0);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 1.0;
        this.scene.add(this.mesh);
        this._updateMeshGeometry();
    }

    _updateMeshGeometry() {
        if (!this.mesh) return;
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();

        const innerR = Math.max(0, this.currentRadius - 20);
        const outerR = this.currentRadius + 20;
        const geometry = new THREE.RingGeometry(innerR, outerR, 64, 1);
        this.mesh.geometry = geometry;
        this.mesh.position.set(this.currentCenter.x, 1.0, this.currentCenter.y);
        if (this.material) {
            this.material.uniforms.radius.value = this.currentRadius;
        }
        this.scene.add(this.mesh);
    }

    start() {
        this.currentPhaseIndex = 0;
        this._setupPhase(0);
        EventBus.emit('storm.phaseChange', { phase: 0, config: this.phases[0] });
    }

    _setupPhase(index) {
        if (index >= this.phases.length) {
            this.state = 'FINISHED';
            return;
        }
        const phase = this.phases[index];
        this.state = 'WAITING';
        this.timer = phase.waitTime;

        this.startCenter.copy(this.currentCenter);
        this.startRadius = this.currentRadius;
        this.targetRadius = phase.endRadius;

        // Choose next center randomly within current zone bounds (ensuring new zone is inside current)
        const maxOffset = Math.max(0, this.currentRadius - this.targetRadius);
        const r = Math.random() * maxOffset;
        const theta = Math.random() * Math.PI * 2;
        this.targetCenter.set(
            this.currentCenter.x + Math.cos(theta) * r,
            this.currentCenter.y + Math.sin(theta) * r
        );
    }

    update(dt) {
        if (this.state === 'FINISHED') return;

        const phase = this.phases[this.currentPhaseIndex];

        if (this.state === 'WAITING') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.state = 'SHRINKING';
                this.timer = phase.shrinkTime;
                this.shrinkProgress = 0;
                EventBus.emit('storm.shrinkStart', { phase: this.currentPhaseIndex });
            }
        } else if (this.state === 'SHRINKING') {
            this.timer -= dt;
            this.shrinkProgress = 1.0 - Math.max(0, this.timer) / phase.shrinkTime;
            this.shrinkProgress = Math.min(1.0, this.shrinkProgress);

            // Interpolate radius and center
            this.currentRadius = THREE.MathUtils.lerp(this.startRadius, this.targetRadius, this.shrinkProgress);
            this.currentCenter.lerpVectors(this.startCenter, this.targetCenter, this.shrinkProgress);

            this._updateMeshGeometry();

            if (this.timer <= 0) {
                EventBus.emit('storm.shrinkEnd', { phase: this.currentPhaseIndex });
                this.currentPhaseIndex++;
                if (this.currentPhaseIndex >= this.phases.length) {
                    this.state = 'FINISHED';
                } else {
                    this._setupPhase(this.currentPhaseIndex);
                    EventBus.emit('storm.phaseChange', { phase: this.currentPhaseIndex, config: this.phases[this.currentPhaseIndex] });
                }
            }
        }

        if (this.material && this.material.uniforms) {
            this.material.uniforms.time.value += dt;
        }
    }

    isInsideZone(position) {
        const p2d = new THREE.Vector2(position.x, position.z);
        return p2d.distanceTo(this.currentCenter) <= this.currentRadius;
    }

    getDistanceToEdge(position) {
        const p2d = new THREE.Vector2(position.x, position.z);
        const distToCenter = p2d.distanceTo(this.currentCenter);
        return this.currentRadius - distToCenter; // negative = outside
    }

    getDamageAtPosition(position) {
        if (this.isInsideZone(position)) return 0;
        const phase = this.phases[Math.min(this.currentPhaseIndex, this.phases.length - 1)];
        return phase.damage;
    }

    drawMinimap(ctx) {
        // ctx is 2D canvas context for minimap
        // draw current zone
        ctx.strokeStyle = '#8800ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.currentCenter.x, this.currentCenter.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // draw target zone if shrinking
        if (this.state === 'SHRINKING') {
            ctx.strokeStyle = '#ff0000';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(this.targetCenter.x, this.targetCenter.y, this.targetRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
