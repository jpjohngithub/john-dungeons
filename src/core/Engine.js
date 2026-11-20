/**
 * @file Engine.js
 * @description Core Game Engine Singleton managing Three.js renderer, scene, systems, and fixed timestep loop.
 */

import * as THREE from 'three';
import EventBus from './EventBus.js';

export class Engine {
    constructor() {
        if (Engine._instance) {
            return Engine._instance;
        }
        Engine._instance = this;

        /** @type {THREE.WebGLRenderer|null} */
        this.renderer = null;
        /** @type {THREE.Scene|null} */
        this.scene = null;
        /** @type {THREE.PerspectiveCamera|null} */
        this.camera = null;

        /** @type {Map<string, any>} */
        this.systems = new Map();

        /** @type {number} */
        this.deltaTime = 0;
        /** @type {number} */
        this.elapsed = 0;
        /** @type {number} */
        this.frameCount = 0;

        /** @private @type {number} */
        this._lastTime = 0;
        /** @private @type {number} */
        this._accumulator = 0;
        /** @private @type {number} */
        this._fixedTimeStep = 1 / 60;
        /** @private @type {boolean} */
        this._isRunning = false;
        /** @private @type {number} */
        this._rafId = 0;

        // Bind methods
        this._onWindowResize = this._onWindowResize.bind(this);
        this._loop = this._loop.bind(this);
    }

    /**
     * Initialize the engine renderer, scene, camera, and listeners.
     * @param {HTMLElement} [container=document.body] 
     */
    init(container = document.body) {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Scene & Fog
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0b0b12, 0.03);

        // Default Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

        // Event Listeners
        window.addEventListener('resize', this._onWindowResize);

        EventBus.emit('engine:init', this);
    }

    /**
     * Register a subsystem.
     * @param {string} name 
     * @param {any} system 
     * @returns {Engine}
     */
    registerSystem(name, system) {
        this.systems.set(name, system);
        if (typeof system.init === 'function') {
            system.init(this);
        }
        return this;
    }

    /**
     * Unregister a subsystem.
     * @param {string} name 
     * @returns {Engine}
     */
    unregisterSystem(name) {
        const system = this.systems.get(name);
        if (system) {
            if (typeof system.dispose === 'function') {
                system.dispose();
            }
            this.systems.delete(name);
        }
        return this;
    }

    /**
     * Get a registered system.
     * @template T
     * @param {string} name 
     * @returns {T|undefined}
     */
    getSystem(name) {
        return /** @type {T} */ (this.systems.get(name));
    }

    /**
     * Start the game loop.
     */
    start() {
        if (this._isRunning) return;
        this._isRunning = true;
        this._lastTime = performance.now();
        this._accumulator = 0;
        this._rafId = requestAnimationFrame(this._loop);
        EventBus.emit('engine:start', this);
    }

    /**
     * Stop the game loop.
     */
    stop() {
        if (!this._isRunning) return;
        this._isRunning = false;
        cancelAnimationFrame(this._rafId);
        EventBus.emit('engine:stop', this);
    }

    /**
     * Main engine loop with fixed timestep accumulator.
     * @private
     * @param {number} currentTime 
     */
    _loop(currentTime) {
        if (!this._isRunning) return;

        const rawDt = (currentTime - this._lastTime) / 1000;
        this._lastTime = currentTime;

        // Clamp dt to avoid spiral of death on lag spikes
        this.deltaTime = Math.min(rawDt, 0.1);
        this.elapsed += this.deltaTime;
        this.frameCount++;

        // Accumulate fixed updates
        this._accumulator += this.deltaTime;
        while (this._accumulator >= this._fixedTimeStep) {
            this._fixedUpdate(this._fixedTimeStep);
            this._accumulator -= this._fixedTimeStep;
        }

        // Uncapped render / frame update
        this._update(this.deltaTime);
        this._render();

        this._rafId = requestAnimationFrame(this._loop);
    }

    /**
     * Fixed update step (60Hz default).
     * @private
     * @param {number} dt 
     */
    _fixedUpdate(dt) {
        EventBus.emit('engine:fixedUpdate', dt);
        for (const system of this.systems.values()) {
            if (typeof system.fixedUpdate === 'function') {
                system.fixedUpdate(dt);
            }
        }
    }

    /**
     * Per-frame update step.
     * @private
     * @param {number} dt 
     */
    _update(dt) {
        EventBus.emit('engine:update', dt);
        for (const system of this.systems.values()) {
            if (typeof system.update === 'function') {
                system.update(dt);
            }
        }
    }

    /**
     * Render step.
     * @private
     */
    _render() {
        EventBus.emit('engine:render', this);
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize.
     * @private
     */
    _onWindowResize() {
        if (!this.renderer || !this.camera) return;
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        EventBus.emit('engine:resize', { width, height });
    }

    /**
     * Dispose of renderer, systems, and listeners.
     */
    dispose() {
        this.stop();
        window.removeEventListener('resize', this._onWindowResize);

        for (const [name, system] of this.systems.entries()) {
            if (typeof system.dispose === 'function') {
                system.dispose();
            }
        }
        this.systems.clear();

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }

        this.scene = null;
        this.camera = null;
        Engine._instance = null;

        EventBus.emit('engine:dispose', this);
        EventBus.clear();
    }
}

/** @type {Engine|null} */
Engine._instance = null;

export default new Engine();
