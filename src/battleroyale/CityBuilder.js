/**
 * @file CityBuilder.js
 * @description Generates a stylized cyberpunk / battle royale urban city with skyscrapers, streets, plazas, containers, streetlights, and rigid colliders for physics.
 */
import * as THREE from 'three';
import { StylizedPBRMaterial } from '../rendering/StylizedPBRMaterial.js';

export class CityBuilder {
    /**
     * Builds the urban city center and registers solid colliders.
     * @param {THREE.Scene} scene
     * @param {Function} getTerrainHeight
     * @returns {{ meshes: THREE.Group, colliders: Array<{type:string, min:THREE.Vector3, max:THREE.Vector3, center:THREE.Vector3, radius:number}> }}
     */
    static buildCity(scene, getTerrainHeight) {
        const cityGroup = new THREE.Group();
        cityGroup.name = 'CityCenter';
        const colliders = [];

        // Materials
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.85,
            metalness: 0.1
        });

        const sidewalkMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.7
        });

        const buildingMatA = new StylizedPBRMaterial({
            baseColor: 0x334155,
            shadowColor: 0x0f172a,
            rimColor: 0x38bdf8,
            rimPower: 2.5,
            rimIntensity: 0.9,
            celSteps: 3.0
        });

        const buildingMatB = new StylizedPBRMaterial({
            baseColor: 0x1e1b4b,
            shadowColor: 0x0a0924,
            rimColor: 0x818cf8,
            rimPower: 2.2,
            rimIntensity: 1.0,
            celSteps: 3.0
        });

        const windowGlowMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8
        });

        const orangeGlowMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b
        });

        const containerColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];

        // City Layout: centered around (x: 20, z: -20)
        const cityOriginX = 20;
        const cityOriginZ = -20;

        // ── 1. MAIN PLAZA & ASPHALT ROADS ───────────────────────────
        const roadWidth = 14;
        const roadLength = 160;

        // North-South Avenue
        const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadLength), roadMat);
        roadNS.rotateX(-Math.PI / 2);
        const groundY_NS = getTerrainHeight(cityOriginX, cityOriginZ) + 0.05;
        roadNS.position.set(cityOriginX, groundY_NS, cityOriginZ);
        cityGroup.add(roadNS);

        // East-West Avenue
        const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, roadWidth), roadMat);
        roadEW.rotateX(-Math.PI / 2);
        roadEW.position.set(cityOriginX, groundY_NS + 0.01, cityOriginZ);
        cityGroup.add(roadEW);

        // Road divider lines
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const dividerNS = new THREE.Mesh(new THREE.PlaneGeometry(0.4, roadLength - 10), lineMat);
        dividerNS.rotateX(-Math.PI / 2);
        dividerNS.position.set(cityOriginX, groundY_NS + 0.06, cityOriginZ);
        cityGroup.add(dividerNS);

        const dividerEW = new THREE.Mesh(new THREE.PlaneGeometry(roadLength - 10, 0.4), lineMat);
        dividerEW.rotateX(-Math.PI / 2);
        dividerEW.position.set(cityOriginX, groundY_NS + 0.07, cityOriginZ);
        cityGroup.add(dividerEW);

        // ── 2. SKYSCRAPERS & BUILDINGS ──────────────────────────────
        const buildingConfigs = [
            // Quadrant 1 (North-East)
            { x: cityOriginX + 22, z: cityOriginZ + 24, w: 16, d: 16, h: 36, mat: buildingMatA },
            { x: cityOriginX + 44, z: cityOriginZ + 22, w: 14, d: 18, h: 26, mat: buildingMatB },
            { x: cityOriginX + 24, z: cityOriginZ + 48, w: 18, d: 14, h: 22, mat: buildingMatA },
            // Quadrant 2 (North-West)
            { x: cityOriginX - 24, z: cityOriginZ + 24, w: 18, d: 16, h: 42, mat: buildingMatB },
            { x: cityOriginX - 46, z: cityOriginZ + 22, w: 14, d: 14, h: 28, mat: buildingMatA },
            { x: cityOriginX - 26, z: cityOriginZ + 48, w: 16, d: 18, h: 20, mat: buildingMatB },
            // Quadrant 3 (South-East)
            { x: cityOriginX + 24, z: cityOriginZ - 24, w: 18, d: 18, h: 32, mat: buildingMatB },
            { x: cityOriginX + 46, z: cityOriginZ - 24, w: 14, d: 16, h: 24, mat: buildingMatA },
            { x: cityOriginX + 24, z: cityOriginZ - 48, w: 16, d: 14, h: 20, mat: buildingMatB },
            // Quadrant 4 (South-West)
            { x: cityOriginX - 22, z: cityOriginZ - 24, w: 16, d: 16, h: 38, mat: buildingMatA },
            { x: cityOriginX - 44, z: cityOriginZ - 22, w: 14, d: 18, h: 26, mat: buildingMatB },
            { x: cityOriginX - 24, z: cityOriginZ - 48, w: 18, d: 14, h: 22, mat: buildingMatA }
        ];

        buildingConfigs.forEach((b, idx) => {
            const baseY = getTerrainHeight(b.x, b.z);
            const bGroup = new THREE.Group();

            // Main Building Mass
            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat);
            bMesh.position.set(b.x, baseY + b.h / 2, b.z);
            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            cityGroup.add(bMesh);

            // Rooftop Helipad / Access Structure
            const roofHut = new THREE.Mesh(
                new THREE.BoxGeometry(b.w * 0.4, 3.5, b.d * 0.4),
                b.mat
            );
            roofHut.position.set(b.x, baseY + b.h + 1.75, b.z);
            cityGroup.add(roofHut);

            // Windows Grid (Emissive panels)
            const floors = Math.floor(b.h / 4);
            for (let f = 1; f < floors; f++) {
                const winY = baseY + f * 4;
                // Front / Back window strips
                const winFront = new THREE.Mesh(
                    new THREE.PlaneGeometry(b.w * 0.7, 1.2),
                    (idx % 2 === 0) ? windowGlowMat : orangeGlowMat
                );
                winFront.position.set(b.x, winY, b.z + b.d / 2 + 0.05);
                cityGroup.add(winFront);

                const winBack = winFront.clone();
                winBack.rotateY(Math.PI);
                winBack.position.set(b.x, winY, b.z - b.d / 2 - 0.05);
                cityGroup.add(winBack);
            }

            // Register Solid Box Collider
            colliders.push({
                type: 'box',
                min: new THREE.Vector3(b.x - b.w / 2, baseY, b.z - b.d / 2),
                max: new THREE.Vector3(b.x + b.w / 2, baseY + b.h, b.z + b.d / 2),
                center: new THREE.Vector3(b.x, baseY + b.h / 2, b.z),
                size: new THREE.Vector3(b.w, b.h, b.d)
            });
        });

        // ── 3. SHIPPING CONTAINERS & TACTICAL CRATES ─────────────────
        const containerCoords = [
            { x: cityOriginX + 6, z: cityOriginZ + 8, rot: 0.1 },
            { x: cityOriginX - 7, z: cityOriginZ + 12, rot: -0.4 },
            { x: cityOriginX + 8, z: cityOriginZ - 10, rot: 0.5 },
            { x: cityOriginX - 8, z: cityOriginZ - 8, rot: 0.0 },
            { x: cityOriginX + 15, z: cityOriginZ - 2, rot: 1.57 },
            { x: cityOriginX - 14, z: cityOriginZ + 4, rot: 1.57 }
        ];

        containerCoords.forEach((c, idx) => {
            const baseY = getTerrainHeight(c.x, c.z);
            const cMat = new THREE.MeshStandardMaterial({
                color: containerColors[idx % containerColors.length],
                metalness: 0.6,
                roughness: 0.3
            });

            const cw = 3.2, ch = 2.6, cd = 6.5;
            const containerMesh = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), cMat);
            containerMesh.position.set(c.x, baseY + ch / 2, c.z);
            containerMesh.rotation.y = c.rot;
            containerMesh.castShadow = true;
            containerMesh.receiveShadow = true;
            cityGroup.add(containerMesh);

            colliders.push({
                type: 'box',
                min: new THREE.Vector3(c.x - cw / 2 - 0.2, baseY, c.z - cd / 2 - 0.2),
                max: new THREE.Vector3(c.x + cw / 2 + 0.2, baseY + ch, c.z + cd / 2 + 0.2),
                center: new THREE.Vector3(c.x, baseY + ch / 2, c.z),
                size: new THREE.Vector3(cw, ch, cd)
            });
        });

        // ── 4. STREETLIGHTS & ILLUMINATION ──────────────────────────
        const lampCoords = [
            { x: cityOriginX + 8, z: cityOriginZ + 20 },
            { x: cityOriginX - 8, z: cityOriginZ + 20 },
            { x: cityOriginX + 8, z: cityOriginZ - 20 },
            { x: cityOriginX - 8, z: cityOriginZ - 20 },
            { x: cityOriginX + 30, z: cityOriginZ + 8 },
            { x: cityOriginX - 30, z: cityOriginZ + 8 }
        ];

        const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
        const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        lampCoords.forEach((l) => {
            const baseY = getTerrainHeight(l.x, l.z);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.5, 6), poleMat);
            pole.position.set(l.x, baseY + 2.75, l.z);
            pole.castShadow = true;
            cityGroup.add(pole);

            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lampBulbMat);
            bulb.position.set(l.x, baseY + 5.6, l.z);
            cityGroup.add(bulb);

            const light = new THREE.PointLight(0x38bdf8, 1.2, 18);
            light.position.set(l.x, baseY + 5.5, l.z);
            cityGroup.add(light);

            colliders.push({
                type: 'cylinder',
                center: new THREE.Vector3(l.x, baseY, l.z),
                radius: 0.4,
                height: 5.5
            });
        });

        scene.add(cityGroup);

        return {
            group: cityGroup,
            colliders
        };
    }
}
