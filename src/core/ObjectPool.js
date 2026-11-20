/**
 * @file ObjectPool.js
 * @description Generic object pool to minimize garbage collection overhead.
 */

export class ObjectPool {
    /**
     * @param {Function} factoryFn Function to create new objects when pool is empty
     * @param {Function} resetFn Function to reset an object before returning to pool or reusing
     * @param {number} [initialSize=10] Initial number of prewarmed objects
     */
    constructor(factoryFn, resetFn, initialSize = 10) {
        /** @private @type {Function} */
        this._factoryFn = factoryFn;
        /** @private @type {Function} */
        this._resetFn = resetFn;
        /** @private @type {Array<any>} */
        this._pool = [];
        /** @private @type {number} */
        this._activeCount = 0;

        if (initialSize > 0) {
            this.prewarm(initialSize);
        }
    }

    /**
     * Prewarm the pool with instances.
     * @param {number} count 
     */
    prewarm(count) {
        for (let i = 0; i < count; i++) {
            this._pool.push(this._factoryFn());
        }
    }

    /**
     * Get an object from the pool, or create a new one if empty.
     * @returns {any}
     */
    get() {
        this._activeCount++;
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        return this._factoryFn();
    }

    /**
     * Release an object back to the pool.
     * @param {any} obj 
     */
    release(obj) {
        if (!obj) return;
        if (this._resetFn) {
            this._resetFn(obj);
        }
        this._activeCount = Math.max(0, this._activeCount - 1);
        this._pool.push(obj);
    }

    /**
     * Get pool statistics.
     * @returns {{active: number, pooled: number, total: number}}
     */
    get stats() {
        return {
            active: this._activeCount,
            pooled: this._pool.length,
            total: this._activeCount + this._pool.length
        };
    }
}

export default ObjectPool;
