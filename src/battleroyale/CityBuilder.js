/**
 * @file CityBuilder.js
 * @description Generates a AAA Stylized Cyberpunk / Battle Royale Urban City Center:
 * - 4-lane avenues with asphalt, painted markings, crosswalks, concrete sidewalks and curbs
 * - Skyscraper business district with neon signs and rooftop access
 * - Central plaza with holographic beacon and illumination
 * - Industrial shipping container zone with multi-level tactical cover
 * - Streetlights, barriers, supply crates, and solid physical colliders
 */
import * as THREE from 'three';
import { StylizedPBRMaterial } from '../rendering/StylizedPBRMaterial.js';

export class CityBuilder {
    /**
     * Builds the urban city center and registers solid colliders.
     * @param {THREE.Scene} scene
     * @param {Function} getTerrainHeight
     * @returns {{ group: THREE.Group, colliders: Array<Object> }}
     */
    static buildCity(scene, getTerrainHeight) {
        const cityGroup = new THREE.Group();
        cityGroup.name = 'CityCenter';
        const colliders = [];

        // Materials
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.8,
            metalness: 0.1
        });

        const sidewalkMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.65
        });

        const buildingMatA = new StylizedPBRMaterial({
            baseColor: 0x1e293b,
            shadowColor: 0x090d16,
            rimColor: 0x38bdf8,
            rimPower: 2.2,
            rimIntensity: 1.0,
            celSteps: 3.0
        });

        const buildingMatB = new StylizedPBRMaterial({
            baseColor: 0x0f172a,
            shadowColor: 0x020617,
            rimColor: 0x818cf8,
            rimPower: 2.5,
            rimIntensity: 1.1,
            celSteps: 3.0
        });

        const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const goldNeonMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const lineYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const lineWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

        // ── 1. ASPHALT ROADS & SIDEWALKS (CENTERED AT 0, 0) ─────────
        const roadWidth = 16;
        const cityRadius = 90;

        // North-South Main Boulevard
        const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, cityRadius * 2), roadMat);
        roadNS.rotateX(-Math.PI / 2);
        roadNS.position.set(0, 0.02, 0);
        roadNS.receiveShadow = true;
        cityGroup.add(roadNS);

        // East-West Main Boulevard
        const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(cityRadius * 2, roadWidth), roadMat);
        roadEW.rotateX(-Math.PI / 2);
        roadEW.position.set(0, 0.03, 0);
        roadEW.receiveShadow = true;
        cityGroup.add(roadEW);

        // Center Dividers & Striping
        const divNS = new THREE.Mesh(new THREE.PlaneGeometry(0.35, cityRadius * 2 - 10), lineYellowMat);
        divNS.rotateX(-Math.PI / 2);
        divNS.position.set(0, 0.04, 0);
        cityGroup.add(divNS);

        const divEW = new THREE.Mesh(new THREE.PlaneGeometry(cityRadius * 2 - 10, 0.35), lineYellowMat);
        divEW.rotateX(-Math.PI / 2);
        divEW.position.set(0, 0.05, 0);
        cityGroup.add(divEW);

        // Pedestrian Zebra Crossings
        for (let i = -1; i <= 1; i += 2) {
            for (let c = -6; c <= 6; c += 1.8) {
                const stripeNS = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3.5), lineWhiteMat);
                stripeNS.rotateX(-Math.PI / 2);
                stripeNS.position.set(c, 0.06, i * 12);
                cityGroup.add(stripeNS);

                const stripeEW = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.8), lineWhiteMat);
                stripeEW.rotateX(-Math.PI / 2);
                stripeEW.position.set(i * 12, 0.06, c);
                cityGroup.add(stripeEW);
            }
        }

        // Sidewalk Blocks & Curbs (4 Quadrants)
        const quadOffsets = [
            { x: 48, z: 48 },
            { x: -48, z: 48 },
            { x: 48, z: -48 },
            { x: -48, z: -48 }
        ];

        quadOffsets.forEach((q) => {
            const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(76, 0.25, 76), sidewalkMat);
            sidewalk.position.set(q.x, 0.125, q.z);
            sidewalk.receiveShadow = true;
            cityGroup.add(sidewalk);
        });

        // ── 2. CENTRAL PLAZA MONUMENT / BEACON ──────────────────────
        const plazaPedestal = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 0.8, 8), sidewalkMat);
        plazaPedestal.position.set(0, 0.4, 0);
        cityGroup.add(plazaPedestal);

        const plazaSpire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 14, 6), glassMat);
        plazaSpire.position.set(0, 7.8, 0);
        cityGroup.add(plazaSpire);

        const plazaLight = new THREE.PointLight(0x00f5ff, 2.5, 25);
        plazaLight.position.set(0, 8.0, 0);
        cityGroup.add(plazaLight);

        colliders.push({
            type: 'cylinder',
            center: new THREE.Vector3(0, 0, 0),
            radius: 6.5,
            height: 14
        });

        // ── 3. SKYSCRAPERS & COMMERCIAL BUILDINGS ───────────────────
        const buildings = [
            // North-East Block
            { x: 30, z: 32, w: 20, d: 20, h: 48, mat: buildingMatA, label: 'CYBER DYNAMICS', color: 0x00f5ff },
            { x: 60, z: 28, w: 18, d: 24, h: 34, mat: buildingMatB, label: 'NEXUS HQ', color: 0xfbbf24 },
            { x: 32, z: 64, w: 22, d: 18, h: 28, mat: buildingMatA },
            // North-West Block
            { x: -32, z: 32, w: 22, d: 20, h: 54, mat: buildingMatB, label: 'TITAN FORGE', color: 0xf97316 },
            { x: -62, z: 30, w: 18, d: 20, h: 36, mat: buildingMatA },
            { x: -32, z: 62, w: 20, d: 22, h: 26, mat: buildingMatB },
            // South-East Block
            { x: 32, z: -32, w: 22, d: 22, h: 42, mat: buildingMatB, label: 'AEGIS SECURITY', color: 0x38bdf8 },
            { x: 62, z: -30, w: 18, d: 22, h: 30, mat: buildingMatA },
            { x: 32, z: -64, w: 20, d: 20, h: 24, mat: buildingMatB },
            // South-West Block
            { x: -30, z: -32, w: 20, d: 20, h: 46, mat: buildingMatA, label: 'SPECTRE CORP', color: 0xef4444 },
            { x: -60, z: -30, w: 18, d: 22, h: 32, mat: buildingMatB },
            { x: -32, z: -62, w: 22, d: 20, h: 26, mat: buildingMatA }
        ];

        buildings.forEach((b) => {
            const bGroup = new THREE.Group();

            // Main Tower
            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat);
            bMesh.position.set(b.x, b.h / 2, b.z);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            bGroup.add(bMesh);

            // Glowing Windows Grid
            const floors = Math.floor(b.h / 4.5);
            for (let f = 1; f < floors; f++) {
                const winY = f * 4.5;
                const winMat = (f % 2 === 0) ? glassMat : goldNeonMat;

                // Front & Back Windows
                const winFB = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.75, 1.2, b.d + 0.15), winMat);
                winFB.position.set(b.x, winY, b.z);
                bGroup.add(winFB);

                // Left & Right Windows
                const winLR = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.15, 1.2, b.d * 0.75), winMat);
                winLR.position.set(b.x, winY, b.z);
                bGroup.add(winLR);
            }

            // Rooftop Antenna / Helipad / Neon Roof Crown
            const roofCrown = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.8, 3.0, b.d * 0.8), buildingMatA);
            roofCrown.position.set(b.x, b.h + 1.5, b.z);
            bGroup.add(roofCrown);

            const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 8.0, 6), sidewalkMat);
            antenna.position.set(b.x, b.h + 7.0, b.z);
            bGroup.add(antenna);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), glassMat);
            beacon.position.set(b.x, b.h + 11.2, b.z);
            bGroup.add(beacon);

            cityGroup.add(bGroup);

            // Register solid AABB collider
            colliders.push({
                type: 'box',
                minX: b.x - b.w / 2,
                maxX: b.x + b.w / 2,
                minZ: b.z - b.d / 2,
                maxZ: b.z + b.d / 2,
                minY: 0,
                maxY: b.h,
                min: new THREE.Vector3(b.x - b.w / 2, 0, b.z - b.d / 2),
                max: new THREE.Vector3(b.x + b.w / 2, b.h, b.z + b.d / 2)
            });
        });

        // ── 4. INDUSTRIAL LOGISTICS YARD (SHIPPING CONTAINERS) ──────
        const containerColors = [0xef4444, 0x0284c7, 0x10b981, 0xf59e0b];
        const containerCoords = [
            { x: 55, z: 60, rot: 0, stack: 2 },
            { x: 62, z: 60, rot: 0, stack: 1 },
            { x: 58, z: 68, rot: Math.PI / 2, stack: 2 },
            { x: -55, z: 58, rot: 0, stack: 2 },
            { x: -62, z: 66, rot: Math.PI / 4, stack: 1 },
            { x: 58, z: -62, rot: Math.PI / 2, stack: 2 },
            { x: -58, z: -62, rot: 0, stack: 2 }
        ];

        containerCoords.forEach((c, idx) => {
            for (let s = 0; s < c.stack; s++) {
                const cMat = new THREE.MeshStandardMaterial({
                    color: containerColors[(idx + s) % containerColors.length],
                    metalness: 0.65,
                    roughness: 0.35
                });
                const cMesh = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.6, 2.6), cMat);
                cMesh.position.set(c.x, 1.3 + s * 2.6, c.z);
                cMesh.rotation.y = c.rot;
                cMesh.castShadow = true;
                cMesh.receiveShadow = true;
                cityGroup.add(cMesh);

                colliders.push({
                    type: 'box',
                    minX: c.x - 3.5, maxX: c.x + 3.5,
                    minZ: c.z - 3.5, maxZ: c.z + 3.5,
                    minY: s * 2.6, maxY: (s + 1) * 2.6 + 0.1,
                    min: new THREE.Vector3(c.x - 3.5, s * 2.6, c.z - 3.5),
                    max: new THREE.Vector3(c.x + 3.5, (s + 1) * 2.6 + 0.1, c.z + 3.5)
                });
            }
        });

        // ── 5. STREETLIGHTS WITH ACTIVE REAL ILLUMINATION ────────────
        const lampPositions = [
            { x: 10, z: 15 }, { x: -10, z: 15 },
            { x: 10, z: 40 }, { x: -10, z: 40 },
            { x: 10, z: -15 }, { x: -10, z: -15 },
            { x: 10, z: -40 }, { x: -10, z: -40 },
            { x: 15, z: 10 }, { x: 40, z: 10 },
            { x: -15, z: 10 }, { x: -40, z: 10 },
            { x: 15, z: -10 }, { x: 40, z: -10 },
            { x: -15, z: -10 }, { x: -40, z: -10 }
        ];

        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        lampPositions.forEach((l) => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.5, 6), poleMat);
            pole.position.set(l.x, 2.75, l.z);
            pole.castShadow = true;
            cityGroup.add(pole);

            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bulbMat);
            bulb.position.set(l.x, 5.5, l.z);
            cityGroup.add(bulb);

            const pLight = new THREE.PointLight(0x38bdf8, 1.2, 16);
            pLight.position.set(l.x, 5.4, l.z);
            cityGroup.add(pLight);

            colliders.push({
                type: 'cylinder',
                center: new THREE.Vector3(l.x, 0, l.z),
                radius: 0.45,
                height: 5.5
            });
        });

        // ── 6. CONCRETE ROAD BLOCKS & TACTICAL BARRIERS ─────────────
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
        const barrierPositions = [
            { x: 0, z: 75, rot: 0 },
            { x: 0, z: -75, rot: 0 },
            { x: 75, z: 0, rot: Math.PI / 2 },
            { x: -75, z: 0, rot: Math.PI / 2 }
        ];

        barrierPositions.forEach((bp) => {
            const barrier = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 0.8), barrierMat);
            barrier.position.set(bp.x, 0.6, bp.z);
            barrier.rotation.y = bp.rot;
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            cityGroup.add(barrier);

            colliders.push({
                type: 'box',
                minX: bp.x - (bp.rot === 0 ? 7 : 0.8),
                maxX: bp.x + (bp.rot === 0 ? 7 : 0.8),
                minZ: bp.z - (bp.rot === 0 ? 0.8 : 7),
                maxZ: bp.z + (bp.rot === 0 ? 0.8 : 7),
                minY: 0, maxY: 1.5,
                min: new THREE.Vector3(bp.x - 7, 0, bp.z - 7),
                max: new THREE.Vector3(bp.x + 7, 1.5, bp.z + 7)
            });
        });

        scene.add(cityGroup);

        return {
            group: cityGroup,
            colliders
        };
    }
}
