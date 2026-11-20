/**
 * @file EQS.js
 * @description Environment Query System for AI decision making.
 */

export class EQSQuery {
    constructor() {
        /** @type {Function[]} */
        this.generators = [];
        /** @type {Function[]} */
        this.tests = [];
        /** @type {Object.<string, number>} */
        this.scoreWeights = {};
    }

    /**
     * Add a generator function.
     * @param {Function} generator 
     */
    addGenerator(generator) {
        this.generators.push(generator);
        return this;
    }

    /**
     * Add a scoring test function with weight.
     * @param {Function} testFn 
     * @param {number} [weight=1.0] 
     */
    addTest(testFn, weight = 1.0) {
        this.tests.push({ test: testFn, weight });
        return this;
    }

    /**
     * Run the EQS query against context.
     * @param {Object} context 
     * @returns {Array<{position: Object, score: number}>}
     */
    runQuery(context) {
        let candidates = [];
        for (const gen of this.generators) {
            const generated = gen(context);
            candidates = candidates.concat(generated);
        }

        const scoredCandidates = candidates.map(pos => {
            let totalScore = 1.0;
            for (const { test, weight } of this.tests) {
                const score = Math.max(0, Math.min(1, test(pos, context)));
                totalScore *= Math.pow(score, weight);
            }
            return { position: pos, score: totalScore };
        });

        scoredCandidates.sort((a, b) => b.score - a.score);
        return scoredCandidates;
    }
}

// --- PRESET EQS GENERATORS ---

export function generateGridPoints(center, radius, step) {
    const points = [];
    for (let x = -radius; x <= radius; x += step) {
        for (let z = -radius; z <= radius; z += step) {
            points.push({ x: center.x + x, y: center.y, z: center.z + z });
        }
    }
    return points;
}

export function generateRingPoints(center, radius, count) {
    const points = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        points.push({
            x: center.x + Math.cos(angle) * radius,
            y: center.y,
            z: center.z + Math.sin(angle) * radius
        });
    }
    return points;
}


// --- PRESET EQS SCORING TESTS ---

export function distanceToTarget(pos, context) {
    const target = context.targetPosition;
    if (!target) return 0;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Normalize assuming max 50 units distance
    return Math.max(0, 1 - dist / 50);
}

export function distanceToCover(pos, context) {
    const covers = context.knownCovers || [];
    if (covers.length === 0) return 0.5;
    let minDist = Infinity;
    for (const c of covers) {
        const dx = c.x - pos.x;
        const dz = c.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) minDist = dist;
    }
    return Math.max(0, 1 - minDist / 20);
}

export function distanceToStorm(pos, context) {
    const safeCenter = context.safeZoneCenter || { x: 0, z: 0 };
    const safeRadius = context.safeZoneRadius || 100;
    const dx = safeCenter.x - pos.x;
    const dz = safeCenter.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist <= safeRadius ? 1.0 : Math.max(0, 1 - (dist - safeRadius) / 50);
}

export function lineOfSightToTarget(pos, context) {
    // Simulated LOS check function in context
    if (typeof context.hasLineOfSight === 'function') {
        return context.hasLineOfSight(pos, context.targetPosition) ? 1.0 : 0.1;
    }
    return 0.5;
}

export function heightAdvantage(pos, context) {
    const baseHeight = context.position ? context.position.y : 0;
    const diff = pos.y - baseHeight;
    return Math.max(0, Math.min(1, 0.5 + diff * 0.1));
}


// --- PRESET QUERY BUILDERS ---

export function findCoverPosition(context) {
    const query = new EQSQuery();
    query.addGenerator(ctx => generateRingPoints(ctx.position, 15, 8));
    query.addTest(distanceToCover, 2.0);
    query.addTest(distanceToStorm, 1.5);
    return query;
}

export function findFlankPosition(context) {
    const query = new EQSQuery();
    query.addGenerator(ctx => generateRingPoints(ctx.targetPosition || ctx.position, 12, 10));
    query.addTest(lineOfSightToTarget, 1.5);
    query.addTest(heightAdvantage, 1.0);
    return query;
}

export function findLootPosition(context) {
    const query = new EQSQuery();
    query.addGenerator(ctx => ctx.nearbyLootPositions || []);
    query.addTest((pos, ctx) => {
        const dx = ctx.position.x - pos.x;
        const dz = ctx.position.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return Math.max(0, 1 - dist / 30);
    }, 1.0);
    return query;
}

export function findSafeZonePosition(context) {
    const query = new EQSQuery();
    query.addGenerator(ctx => generateRingPoints(ctx.safeZoneCenter || { x: 0, z: 0 }, ctx.safeZoneRadius || 50, 12));
    query.addTest(distanceToStorm, 2.5);
    return query;
}
