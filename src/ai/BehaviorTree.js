/**
 * @file BehaviorTree.js
 * @description Behavior Tree framework implementation.
 */

import EventBus from '../core/EventBus.js';

/**
 * @enum {string}
 */
export const Status = {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    RUNNING: 'RUNNING'
};

/**
 * @enum {string}
 */
export const NodeType = {
    SEQUENCE: 'SEQUENCE',
    SELECTOR: 'SELECTOR',
    PARALLEL_NODE: 'PARALLEL_NODE',
    DECORATOR: 'DECORATOR',
    ACTION: 'ACTION',
    CONDITION: 'CONDITION'
};

/**
 * Blackboard for sharing data across the behavior tree.
 */
export class Blackboard {
    constructor() {
        /** @private @type {Map<string, any>} */
        this.data = new Map();
    }

    /**
     * Set a value in the blackboard.
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        this.data.set(key, value);
    }

    /**
     * Get a value from the blackboard.
     * @param {string} key 
     * @returns {any}
     */
    get(key) {
        return this.data.get(key);
    }

    /**
     * Check if key exists.
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.data.has(key);
    }

    /**
     * Delete key.
     * @param {string} key 
     * @returns {boolean}
     */
    delete(key) {
        return this.data.delete(key);
    }
}

/**
 * Base class for all Behavior Tree nodes.
 */
export class BTNode {
    constructor() {
        /** @type {NodeType} */
        this.type = NodeType.ACTION;
    }

    /**
     * Tick the node.
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        return Status.SUCCESS;
    }
}

/**
 * Sequence node: ticks children left-to-right, fails on first FAILURE, runs on RUNNING.
 */
export class Sequence extends BTNode {
    /**
     * @param {BTNode[]} [children=[]] 
     */
    constructor(children = []) {
        super();
        this.type = NodeType.SEQUENCE;
        /** @type {BTNode[]} */
        this.children = children;
    }

    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        for (const child of this.children) {
            const status = child.tick(blackboard);
            if (status !== Status.SUCCESS) {
                return status;
            }
        }
        return Status.SUCCESS;
    }
}

/**
 * Selector node: ticks children left-to-right, succeeds on first SUCCESS, runs on RUNNING.
 */
export class Selector extends BTNode {
    /**
     * @param {BTNode[]} [children=[]] 
     */
    constructor(children = []) {
        super();
        this.type = NodeType.SELECTOR;
        /** @type {BTNode[]} */
        this.children = children;
    }

    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        for (const child of this.children) {
            const status = child.tick(blackboard);
            if (status !== Status.FAILURE) {
                return status;
            }
        }
        return Status.FAILURE;
    }
}

/**
 * Parallel node: ticks all children regardless of outcome.
 */
export class ParallelNode extends BTNode {
    /**
     * @param {BTNode[]} [children=[]] 
     */
    constructor(children = []) {
        super();
        this.type = NodeType.PARALLEL_NODE;
        /** @type {BTNode[]} */
        this.children = children;
    }

    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        let hasRunning = false;
        for (const child of this.children) {
            const status = child.tick(blackboard);
            if (status === Status.RUNNING) {
                hasRunning = true;
            } else if (status === Status.FAILURE) {
                return Status.FAILURE;
            }
        }
        return hasRunning ? Status.RUNNING : Status.SUCCESS;
    }
}

/**
 * Base Decorator node.
 */
export class Decorator extends BTNode {
    /**
     * @param {BTNode} child 
     */
    constructor(child) {
        super();
        this.type = NodeType.DECORATOR;
        /** @type {BTNode} */
        this.child = child;
    }
}

/**
 * Inverts the status of its child.
 */
export class Inverter extends Decorator {
    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        const status = this.child.tick(blackboard);
        if (status === Status.SUCCESS) return Status.FAILURE;
        if (status === Status.FAILURE) return Status.SUCCESS;
        return Status.RUNNING;
    }
}

/**
 * Repeats child node execution n times or indefinitely.
 */
export class Repeater extends Decorator {
    /**
     * @param {BTNode} child 
     * @param {number} [maxCount=-1] -1 for infinite
     */
    constructor(child, maxCount = -1) {
        super(child);
        this.maxCount = maxCount;
        this.count = 0;
    }

    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        let status = Status.SUCCESS;
        while (this.maxCount < 0 || this.count < this.maxCount) {
            status = this.child.tick(blackboard);
            if (status === Status.RUNNING || status === Status.FAILURE) {
                break;
            }
            this.count++;
        }
        return status;
    }
}

/**
 * Repeats until child fails.
 */
export class UntilFail extends Decorator {
    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        while (true) {
            const status = this.child.tick(blackboard);
            if (status === Status.FAILURE) {
                return Status.SUCCESS;
            }
            if (status === Status.RUNNING) {
                return Status.RUNNING;
            }
        }
    }
}

/**
 * Cooldown decorator: prevents child execution until cooldown period elapses.
 */
export class Cooldown extends Decorator {
    /**
     * @param {BTNode} child 
     * @param {number} cooldownSeconds 
     */
    constructor(child, cooldownSeconds) {
        super(child);
        this.cooldownTime = cooldownSeconds * 1000;
        this.lastExecutionTime = 0;
    }

    /**
     * @param {Blackboard} blackboard 
     * @returns {Status}
     */
    tick(blackboard) {
        const now = Date.now();
        if (now - this.lastExecutionTime < this.cooldownTime) {
            return Status.FAILURE;
        }
        const status = this.child.tick(blackboard);
        if (status === Status.SUCCESS || status === Status.FAILURE) {
            this.lastExecutionTime = now;
        }
        return status;
    }
}
