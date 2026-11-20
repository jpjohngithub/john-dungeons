/**
 * @file ComponentSystem.js
 * @description Lightweight Entity-Component-System (ECS) architecture.
 */

/**
 * Component base class.
 */
export class Component {
    constructor() {
        /** @type {Entity|null} */
        this.owner = null;
        /** @type {boolean} */
        this.enabled = true;
    }

    /**
     * Called when component is added to an entity.
     * @param {Entity} entity 
     */
    onAdd(entity) {
        this.owner = entity;
    }

    /**
     * Called when component is removed from an entity.
     */
    onRemove() {
        this.owner = null;
    }
}

/**
 * Entity class holding components and tags.
 */
export class Entity {
    /**
     * @param {string} [id] 
     */
    constructor(id = '') {
        /** @type {string} */
        this.id = id || `entity_${Math.random().toString(36).substr(2, 9)}`;
        /** @private @type {Map<Function, Component>} */
        this._components = new Map();
        /** @type {Set<string>} */
        this.tags = new Set();
        /** @type {boolean} */
        this.active = true;
    }

    /**
     * Add a component instance to the entity.
     * @template {Component} T
     * @param {T} component 
     * @returns {Entity}
     */
    addComponent(component) {
        const ctor = component.constructor;
        if (this._components.has(ctor)) {
            this.removeComponent(ctor);
        }
        this._components.set(ctor, component);
        component.onAdd(this);
        return this;
    }

    /**
     * Remove a component by its constructor class.
     * @param {Function} componentClass 
     * @returns {Entity}
     */
    removeComponent(componentClass) {
        const component = this._components.get(componentClass);
        if (component) {
            component.onRemove();
            this._components.delete(componentClass);
        }
        return this;
    }

    /**
     * Get a component by its constructor class.
     * @template {Component} T
     * @param {new (...args: any[]) => T} componentClass 
     * @returns {T|null}
     */
    getComponent(componentClass) {
        return /** @type {T} */ (this._components.get(componentClass) || null);
    }

    /**
     * Check if entity has a component.
     * @param {Function} componentClass 
     * @returns {boolean}
     */
    hasComponent(componentClass) {
        return this._components.has(componentClass);
    }
}

/**
 * System base class.
 */
export class System {
    constructor() {
        /** @type {Array<Function>} */
        this.requiredComponents = [];
        /** @type {boolean} */
        this.enabled = true;
    }

    /**
     * Update system logic.
     * @param {number} dt Delta time in seconds
     * @param {Array<Entity>} entities Filtered entities matching requirements
     */
    update(dt, entities) {
        // Override in subclass
    }
}

/**
 * World container for entities and systems.
 */
export class World {
    constructor() {
        /** @type {Array<Entity>} */
        this.entities = [];
        /** @type {Array<System>} */
        this.systems = [];
    }

    /**
     * Add an entity to the world.
     * @param {Entity} entity 
     * @returns {World}
     */
    addEntity(entity) {
        this.entities.push(entity);
        return this;
    }

    /**
     * Remove an entity from the world.
     * @param {Entity} entity 
     * @returns {World}
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        return this;
    }

    /**
     * Register a system.
     * @param {System} system 
     * @returns {World}
     */
    addSystem(system) {
        this.systems.push(system);
        return this;
    }

    /**
     * Unregister a system.
     * @param {System} system 
     * @returns {World}
     */
    removeSystem(system) {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
        return this;
    }

    /**
     * Query entities possessing all specified component types.
     * @param {Array<Function>} componentTypes 
     * @returns {Array<Entity>}
     */
    query(componentTypes) {
        const result = [];
        const entLen = this.entities.length;
        const reqLen = componentTypes.length;

        for (let i = 0; i < entLen; i++) {
            const entity = this.entities[i];
            if (!entity.active) continue;

            let matches = true;
            for (let j = 0; j < reqLen; j++) {
                if (!entity.hasComponent(componentTypes[j])) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                result.push(entity);
            }
        }
        return result;
    }

    /**
     * Update all active systems.
     * @param {number} dt 
     */
    update(dt) {
        const sysLen = this.systems.length;
        for (let i = 0; i < sysLen; i++) {
            const system = this.systems[i];
            if (!system.enabled) continue;
            const matchedEntities = this.query(system.requiredComponents);
            system.update(dt, matchedEntities);
        }
    }
}
