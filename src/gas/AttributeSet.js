/**
 * @file AttributeSet.js
 * @description Gameplay attributes container with modifier stacking, recalculation, and change callbacks.
 */

/**
 * @typedef {'add' | 'multiply' | 'override'} ModifierOperation
 */

/**
 * @typedef {Object} Modifier
 * @property {string} source
 * @property {string} attribute
 * @property {ModifierOperation} operation
 * @property {number} magnitude
 * @property {number} [order]
 */

/**
 * @class Attribute
 */
export class Attribute {
    /**
     * @param {string} name 
     * @param {number} baseValue 
     * @param {number} min 
     * @param {number} max 
     */
    constructor(name, baseValue, min = -Infinity, max = Infinity) {
        this.name = name;
        this.baseValue = baseValue;
        this.currentValue = baseValue;
        this.min = min;
        this.max = max;
        /** @type {Modifier[]} */
        this.modifiers = [];
    }
}

export class AttributeSet {
    /**
     * @param {import('../core/EventBus.js').EventBus} [eventBus] 
     */
    constructor(eventBus = null) {
        /** @private @type {Map<string, Attribute>} */
        this._attributes = new Map();
        /** @private @type {Map<string, Set<Function>>} */
        this._onChangeCallbacks = new Map();
        /** @private @type {import('../core/EventBus.js').EventBus|null} */
        this._eventBus = eventBus;

        this._initDefaultAttributes();
    }

    /**
     * Initialize default GAS attributes.
     * @private
     */
    _initDefaultAttributes() {
        const defaults = [
            ['health', 100, 0, 100],
            ['maxHealth', 100, 1, Infinity],
            ['shield', 50, 0, 100],
            ['maxShield', 50, 0, Infinity],
            ['stamina', 100, 0, 100],
            ['maxStamina', 100, 1, Infinity],
            ['hunger', 100, 0, 100],
            ['temperature', 50, 0, 100],
            ['moveSpeed', 5, 0, Infinity],
            ['attackDamage', 10, 0, Infinity],
            ['attackSpeed', 1, 0.1, Infinity],
            ['armor', 0, 0, Infinity],
            ['critChance', 0.05, 0, 1],
            ['critMultiplier', 1.5, 1, Infinity]
        ];

        for (const [name, val, min, max] of defaults) {
            this.registerAttribute(name, val, min, max);
        }
    }

    /**
     * Register a new attribute or overwrite existing.
     * @param {string} name 
     * @param {number} baseValue 
     * @param {number} [min=-Infinity] 
     * @param {number} [max=Infinity] 
     */
    registerAttribute(name, baseValue, min = -Infinity, max = Infinity) {
        const attr = new Attribute(name, baseValue, min, max);
        this._attributes.set(name, attr);
        this.recalculate(name);
    }

    /**
     * Get current attribute value after modifiers.
     * @param {string} name 
     * @returns {number}
     */
    get(name) {
        const attr = this._attributes.get(name);
        return attr ? attr.currentValue : 0;
    }

    /**
     * Get base attribute value.
     * @param {string} name 
     * @returns {number}
     */
    getBase(name) {
        const attr = this._attributes.get(name);
        return attr ? attr.baseValue : 0;
    }

    /**
     * Directly modify base value or add an instant modifier value.
     * @param {string} name 
     * @param {number} value 
     * @param {ModifierOperation} [op='add'] 
     */
    modify(name, value, op = 'add') {
        const attr = this._attributes.get(name);
        if (!attr) return;

        const oldValue = attr.currentValue;
        if (op === 'add') {
            attr.baseValue += value;
        } else if (op === 'multiply') {
            attr.baseValue *= value;
        } else if (op === 'override') {
            attr.baseValue = value;
        }
        this.recalculate(name);
    }

    /**
     * Add a modifier object.
     * @param {Modifier} modifier 
     */
    addModifier(modifier) {
        const attr = this._attributes.get(modifier.attribute);
        if (!attr) return;

        if (modifier.order === undefined) {
            modifier.order = 0;
        }

        // Remove existing from same source if present
        this.removeModifier(modifier.source, modifier.attribute);

        attr.modifiers.push(modifier);
        this.recalculate(modifier.attribute);
    }

    /**
     * Remove modifiers from a specific source.
     * @param {string} source 
     * @param {string} [attributeName] Optional specific attribute
     */
    removeModifier(source, attributeName) {
        if (attributeName) {
            const attr = this._attributes.get(attributeName);
            if (attr) {
                const initialLen = attr.modifiers.length;
                attr.modifiers = attr.modifiers.filter(m => m.source !== source);
                if (attr.modifiers.length !== initialLen) {
                    this.recalculate(attributeName);
                }
            }
        } else {
            for (const [name, attr] of this._attributes.entries()) {
                const initialLen = attr.modifiers.length;
                attr.modifiers = attr.modifiers.filter(m => m.source !== source);
                if (attr.modifiers.length !== initialLen) {
                    this.recalculate(name);
                }
            }
        }
    }

    /**
     * Recalculate attribute value applying modifiers sequentially: add first, then multiply, then override.
     * @param {string} name 
     */
    recalculate(name) {
        const attr = this._attributes.get(name);
        if (!attr) return;

        const oldValue = attr.currentValue;

        // Sort modifiers by order
        attr.modifiers.sort((a, b) => (a.order || 0) - (b.order || 0));

        let value = attr.baseValue;

        // 1. Additive
        for (let i = 0; i < attr.modifiers.length; i++) {
            const mod = attr.modifiers[i];
            if (mod.operation === 'add') {
                value += mod.magnitude;
            }
        }

        // 2. Multiplicative
        for (let i = 0; i < attr.modifiers.length; i++) {
            const mod = attr.modifiers[i];
            if (mod.operation === 'multiply') {
                value *= mod.magnitude;
            }
        }

        // 3. Override (last override takes precedence)
        for (let i = 0; i < attr.modifiers.length; i++) {
            const mod = attr.modifiers[i];
            if (mod.operation === 'override') {
                value = mod.magnitude;
            }
        }

        // Clamp to min/max
        value = Math.max(attr.min, Math.min(attr.max, value));
        attr.currentValue = value;

        if (value !== oldValue) {
            this._triggerChange(name, value, oldValue);
        }
    }

    /**
     * Register change callback for an attribute.
     * @param {string} name 
     * @param {Function} callback 
     */
    onChange(name, callback) {
        if (!this._onChangeCallbacks.has(name)) {
            this._onChangeCallbacks.set(name, new Set());
        }
        this._onChangeCallbacks.get(name).add(callback);
    }

    /**
     * Unregister change callback.
     * @param {string} name 
     * @param {Function} callback 
     */
    offChange(name, callback) {
        const set = this._onChangeCallbacks.get(name);
        if (set) {
            set.delete(callback);
        }
    }

    /**
     * @private
     * @param {string} name 
     * @param {number} newValue 
     * @param {number} oldValue 
     */
    _triggerChange(name, newValue, oldValue) {
        const set = this._onChangeCallbacks.get(name);
        if (set) {
            for (const cb of set) {
                cb(newValue, oldValue, name);
            }
        }
        if (this._eventBus) {
            this._eventBus.emit('attribute.changed', { attribute: name, currentValue: newValue, oldValue });
        }
    }

    /**
     * Snapshot all current attribute values.
     * @returns {Record<string, number>}
     */
    snapshot() {
        const snap = {};
        for (const [name, attr] of this._attributes.entries()) {
            snap[name] = attr.currentValue;
        }
        return snap;
    }
}
