/**
 * @file BTNodes.js
 * @description Concrete Behavior Tree conditions and actions for game bots.
 */

import { BTNode, Status, NodeType } from './BehaviorTree.js';
import EventBus from '../core/EventBus.js';

// --- CONDITIONS ---

export class HasTarget extends BTNode {
    constructor() {
        super();
        this.type = NodeType.CONDITION;
    }
    tick(blackboard) {
        const target = blackboard.get('target');
        return target ? Status.SUCCESS : Status.FAILURE;
    }
}

export class IsLowHealth extends BTNode {
    constructor(threshold = 30) {
        super();
        this.type = NodeType.CONDITION;
        this.threshold = threshold;
    }
    tick(blackboard) {
        const health = blackboard.get('health') ?? 100;
        return health <= this.threshold ? Status.SUCCESS : Status.FAILURE;
    }
}

export class IsInStormZone extends BTNode {
    constructor() {
        super();
        this.type = NodeType.CONDITION;
    }
    tick(blackboard) {
        const inStorm = blackboard.get('inStorm') ?? false;
        return inStorm ? Status.SUCCESS : Status.FAILURE;
    }
}

export class HasAmmo extends BTNode {
    constructor() {
        super();
        this.type = NodeType.CONDITION;
    }
    tick(blackboard) {
        const ammo = blackboard.get('ammo') ?? 0;
        return ammo > 0 ? Status.SUCCESS : Status.FAILURE;
    }
}

export class TargetInRange extends BTNode {
    constructor(range = 10) {
        super();
        this.type = NodeType.CONDITION;
        this.range = range;
    }
    tick(blackboard) {
        const distance = blackboard.get('distanceToTarget') ?? Infinity;
        return distance <= this.range ? Status.SUCCESS : Status.FAILURE;
    }
}

export class HasHealItem extends BTNode {
    constructor() {
        super();
        this.type = NodeType.CONDITION;
    }
    tick(blackboard) {
        const healItems = blackboard.get('healItems') ?? 0;
        return healItems > 0 ? Status.SUCCESS : Status.FAILURE;
    }
}


// --- ACTIONS ---

export class MoveToTarget extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const targetPos = blackboard.get('targetPosition');
        if (!targetPos) return Status.FAILURE;
        
        // Simulating movement progress
        const agent = blackboard.get('agent');
        if (agent && typeof agent.moveTo === 'function') {
            const arrived = agent.moveTo(targetPos);
            return arrived ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class MoveToPosition extends BTNode {
    /** @param {string} blackboardKey */
    constructor(blackboardKey = 'destination') {
        super();
        this.type = NodeType.ACTION;
        this.blackboardKey = blackboardKey;
    }
    tick(blackboard) {
        const pos = blackboard.get(this.blackboardKey);
        if (!pos) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.moveTo === 'function') {
            const arrived = agent.moveTo(pos);
            return arrived ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class AttackTarget extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const target = blackboard.get('target');
        if (!target) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.attack === 'function') {
            agent.attack(target);
            return Status.SUCCESS;
        }
        return Status.SUCCESS;
    }
}

export class UseHealItem extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
        this.healing = false;
        this.startTime = 0;
    }
    tick(blackboard) {
        const now = Date.now();
        if (!this.healing) {
            const healItems = blackboard.get('healItems') ?? 0;
            if (healItems <= 0) return Status.FAILURE;
            blackboard.set('healItems', healItems - 1);
            this.healing = true;
            this.startTime = now;
            return Status.RUNNING;
        }

        // 3 seconds heal duration
        if (now - this.startTime >= 3000) {
            const health = blackboard.get('health') ?? 0;
            blackboard.set('health', Math.min(100, health + 50));
            this.healing = false;
            return Status.SUCCESS;
        }

        return Status.RUNNING;
    }
}

export class TakeCover extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const coverPos = blackboard.get('coverPosition');
        if (!coverPos) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.moveTo === 'function') {
            const arrived = agent.moveTo(coverPos);
            return arrived ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class FlankTarget extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const flankPos = blackboard.get('flankPosition');
        if (!flankPos) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.moveTo === 'function') {
            const arrived = agent.moveTo(flankPos);
            return arrived ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class UseAbility extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const agent = blackboard.get('agent');
        if (agent && typeof agent.useAbility === 'function') {
            agent.useAbility();
            return Status.SUCCESS;
        }
        return Status.FAILURE;
    }
}

export class RotateToZone extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const safeZone = blackboard.get('safeZoneCenter');
        if (!safeZone) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.moveTo === 'function') {
            const arrived = agent.moveTo(safeZone);
            return arrived ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class GatherResource extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const resource = blackboard.get('nearestResource');
        if (!resource) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.gather === 'function') {
            const done = agent.gather(resource);
            return done ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class PickupLoot extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const loot = blackboard.get('nearestLoot');
        if (!loot) return Status.FAILURE;

        const agent = blackboard.get('agent');
        if (agent && typeof agent.pickup === 'function') {
            const done = agent.pickup(loot);
            return done ? Status.SUCCESS : Status.RUNNING;
        }
        return Status.SUCCESS;
    }
}

export class BuildCover extends BTNode {
    constructor() {
        super();
        this.type = NodeType.ACTION;
    }
    tick(blackboard) {
        const materials = blackboard.get('materials') ?? 0;
        if (materials < 10) return Status.FAILURE;

        blackboard.set('materials', materials - 10);
        const agent = blackboard.get('agent');
        if (agent && typeof agent.build === 'function') {
            agent.build();
            return Status.SUCCESS;
        }
        return Status.SUCCESS;
    }
}
