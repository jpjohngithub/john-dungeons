/**
 * @file EventBus.js
 * @description Pub/Sub event system with priority-ordered listeners and object pooling to avoid GC.
 */

export class EventBus {
    constructor() {
        /** @private @type {Map<string, Array<{callback: Function, context: any, priority: number}>>} */
        this._listeners = new Map();
        /** @private @type {Array<{callback: Function, context: any, priority: number}>} */
        this._listenerPool = [];
    }

    /**
     * @private
     * @param {Function} callback 
     * @param {any} context 
     * @param {number} priority 
     * @returns {{callback: Function, context: any, priority: number}}
     */
    _getListener(callback, context, priority) {
        let item = this._listenerPool.pop();
        if (!item) {
            item = { callback, context, priority };
        } else {
            item.callback = callback;
            item.context = context;
            item.priority = priority;
        }
        return item;
    }

    /**
     * @private
     * @param {{callback: Function, context: any, priority: number}} item 
     */
    _releaseListener(item) {
        item.callback = null;
        item.context = null;
        item.priority = 0;
        this._listenerPool.push(item);
    }

    /**
     * Register an event listener.
     * @param {string} event 
     * @param {Function} callback 
     * @param {any} [context=null] 
     * @param {number} [priority=0] Higher runs first
     */
    on(event, callback, context = null, priority = 0) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        const list = this._listeners.get(event);
        const item = this._getListener(callback, context, priority);
        
        list.push(item);
        // Sort descending by priority
        list.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Register a one-time event listener.
     * @param {string} event 
     * @param {Function} callback 
     * @param {any} [context=null] 
     * @param {number} [priority=0] 
     */
    once(event, callback, context = null, priority = 0) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback.apply(context, args);
        };
        // Store reference to original callback for proper removal if needed, or rely on wrapper
        wrapper._original = callback;
        this.on(event, wrapper, context, priority);
    }

    /**
     * Remove an event listener.
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this._listeners.has(event)) return;
        const list = this._listeners.get(event);
        for (let i = list.length - 1; i >= 0; i--) {
            const item = list[i];
            if (item.callback === callback || item.callback._original === callback) {
                list.splice(i, 1);
                this._releaseListener(item);
            }
        }
        if (list.length === 0) {
            this._listeners.delete(event);
        }
    }

    /**
     * Emit an event, notifying all listeners.
     * @param {string} event 
     * @param {any} [data] 
     * @returns {any} Data passed or modified
     */
    emit(event, data) {
        if (!this._listeners.has(event)) return data;
        const list = this._listeners.get(event);
        // Iterate over a shallow copy to prevent mutation issues during emission
        for (let i = 0, len = list.length; i < len; i++) {
            const item = list[i];
            if (item.context) {
                item.callback.call(item.context, data);
            } else {
                item.callback(data);
            }
        }
        return data;
    }

    /**
     * Clear listeners for an event or all events.
     * @param {string} [event] 
     */
    clear(event) {
        if (event) {
            const list = this._listeners.get(event);
            if (list) {
                for (let i = 0; i < list.length; i++) {
                    this._releaseListener(list[i]);
                }
                this._listeners.delete(event);
            }
        } else {
            for (const list of this._listeners.values()) {
                for (let i = 0; i < list.length; i++) {
                    this._releaseListener(list[i]);
                }
            }
            this._listeners.clear();
        }
    }
}

export default new EventBus();
