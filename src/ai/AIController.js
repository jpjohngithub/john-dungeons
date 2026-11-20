/**
 * @file AIController.js
 * @description Bot AI controller integrating Behavior Tree, EQS, and Perception.
 */

import { Blackboard, Sequence, Selector } from './BehaviorTree.js';
import { 
    HasTarget, IsLowHealth, IsInStormZone, HasAmmo, TargetInRange, HasHealItem,
    MoveToTarget, AttackTarget, UseHealItem, RotateToZone, PickupLoot, TakeCover, FlankTarget
} from './BTNodes.js';
import { findCoverPosition, findFlankPosition } from './EQS.js';
import EventBus from '../core/EventBus.js';

export const AIDifficulty = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD'
};

export class AIController {
    /**
     * @param {Object} entity 
     * @param {string} [difficulty=AIDifficulty.MEDIUM] 
     */
    constructor(entity, difficulty = AIDifficulty.MEDIUM) {
        this.entity = entity;
        this.difficulty = difficulty;
        this.blackboard = new Blackboard();
        this.blackboard.set('agent', entity);
        this.blackboard.set('health', 100);
        this.blackboard.set('ammo', 30);
        this.blackboard.set('healItems', 2);
        this.blackboard.set('materials', 50);

        this.tickAccumulator = 0;
        this.tickRate = 100; // 10Hz -> 100ms per tick

        this.behaviorTree = this.buildBehaviorTree();
        this.setupDifficultyParameters();
    }

    setupDifficultyParameters() {
        if (this.difficulty === AIDifficulty.EASY) {
            this.reactionDelay = 300;
            this.aimError = 5.0;
            this.useAbilities = false;
        } else if (this.difficulty === AIDifficulty.MEDIUM) {
            this.reactionDelay = 150;
            this.aimError = 2.0;
            this.useAbilities = true;
        } else {
            this.reactionDelay = 50;
            this.aimError = 0.5;
            this.useAbilities = true;
        }
    }

    buildBehaviorTree() {
        // Selector Root
        return new Selector([
            // 1. Heal if low health
            new Sequence([
                new IsLowHealth(35),
                new HasHealItem(),
                new UseHealItem()
            ]),
            // 2. Escape storm zone
            new Sequence([
                new IsInStormZone(),
                new RotateToZone()
            ]),
            // 3. Combat sequence
            new Sequence([
                new HasTarget(),
                new Selector([
                    // If target in range, attack
                    new Sequence([
                        new TargetInRange(15),
                        new AttackTarget()
                    ]),
                    // Otherwise move/flank target
                    new Sequence([
                        new MoveToTarget()
                    ])
                ])
            ]),
            // 4. Default patrol / loot
            new Sequence([
                new PickupLoot()
            ])
        ]);
    }

    /**
     * Update perception of environment.
     * @param {Array} entities 
     */
    updatePerception(entities) {
        const pos = this.entity.position || { x: 0, y: 0, z: 0 };
        this.blackboard.set('position', pos);

        let closestTarget = null;
        let minDist = Infinity;

        for (const other of entities) {
            if (other === this.entity) continue;
            const dx = other.position.x - pos.x;
            const dz = other.position.z - pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // 20 unit detection radius with 90 deg FOV check simplified
            if (dist < 20 && dist < minDist) {
                minDist = dist;
                closestTarget = other;
            }
        }

        if (closestTarget) {
            this.blackboard.set('target', closestTarget);
            this.blackboard.set('targetPosition', closestTarget.position);
            this.blackboard.set('distanceToTarget', minDist);
        } else {
            this.blackboard.delete('target');
            this.blackboard.delete('targetPosition');
            this.blackboard.set('distanceToTarget', Infinity);
        }
    }

    /**
     * Tick AI loop.
     * @param {number} deltaTime 
     * @param {Array} entities 
     */
    update(deltaTime, entities) {
        this.tickAccumulator += deltaTime * 1000;
        if (this.tickAccumulator < this.tickRate) return;
        this.tickAccumulator = 0;

        this.updatePerception(entities);

        // Run EQS for tactical cover / flank if target exists
        if (this.blackboard.get('target')) {
            const coverResults = findCoverPosition(this.blackboard.data.get('agent')).runQuery(this.blackboard.data);
            if (coverResults.length > 0) {
                this.blackboard.set('coverPosition', coverResults[0].position);
            }
        }

        this.behaviorTree.tick(this.blackboard);
    }
}
