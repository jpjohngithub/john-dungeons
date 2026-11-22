import * as THREE from 'three';
import { ProceduralTextures } from '../rendering/ProceduralTextures.js';

/**
 * CityBuilder — Modern Stylized AAA Urban Metropolis (60 FPS, Zero PointLight Bottleneck)
 * Flat urban basin centered at (0, 0) with radius 95m at y = 0.0
 */
export class CityBuilder {
    static buildCity(scene, getTerrainHeight) {
        const group = new THREE.Group();
        const colliders = [];

        // Procedural Textures
        const asphaltTex = ProceduralTextures.createAsphaltTexture();
        asphaltTex.repeat.set(4, 24);
        const asphaltH = asphaltTex.clone();
        asphaltH.needsUpdate = true;
        asphaltH.repeat.set(24, 4);

        const sidewalkTex = ProceduralTextures.createSidewalkTexture();
        sidewalkTex.repeat.set(28, 28);

        const plazaTex = ProceduralTextures.createPlazaTexture();
        plazaTex.repeat.set(6, 6);

        const matRoadNS = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.85, metalness: 0.08 });
        const matRoadEW = new THREE.MeshStandardMaterial({ map: asphaltH, roughness: 0.85, metalness: 0.08 });
        const matSidewalk = new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.78, metalness: 0.05 });
        const matPlaza = new THREE.MeshStandardMaterial({ map: plazaTex, roughness: 0.45, metalness: 0.15 });
        const matCurb = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
        const matLineYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
        const matLineWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const matMetalDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 });
        const matMetalLight = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.65, roughness: 0.35 });
        const matGlassLobby = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.12 });

        // 1. URBAN BASE PLATFORM (SIDEWALK DECK)
        const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(178, 0.2, 178), matSidewalk);
        baseDeck.position.set(0, -0.08, 0);
        baseDeck.receiveShadow = true;
        group.add(baseDeck);

        // 2. MAIN CROSSING AVENUES (N-S and E-W, 18m wide)
        const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(18, 178), matRoadNS);
        roadNS.rotation.x = -Math.PI / 2;
        roadNS.position.set(0, 0.035, 0);
        roadNS.receiveShadow = true;
        group.add(roadNS);

        const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(178, 18), matRoadEW);
        roadEW.rotation.x = -Math.PI / 2;
        roadEW.position.set(0, 0.038, 0);
        roadEW.receiveShadow = true;
        group.add(roadEW);

        // Center double yellow lines & crosswalks
        for (const s of [-0.28, 0.28]) {
            const lineNS = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 174), matLineYellow);
            lineNS.rotation.x = -Math.PI / 2;
            lineNS.position.set(s, 0.045, 0);
            group.add(lineNS);

            const lineEW = new THREE.Mesh(new THREE.PlaneGeometry(174, 0.18), matLineYellow);
            lineEW.rotation.x = -Math.PI / 2;
            lineEW.position.set(0, 0.045, s);
            group.add(lineEW);
        }

        // Crosswalk stripes around central plaza
        const crosswalkOffsets = [-16, 16];
        for (const off of crosswalkOffsets) {
            for (let i = -6; i <= 6; i += 2) {
                const stripeNS = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2), matLineWhite);
                stripeNS.rotation.x = -Math.PI / 2;
                stripeNS.position.set(i, 0.048, off);
                group.add(stripeNS);

                const stripeEW = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), matLineWhite);
                stripeEW.rotation.x = -Math.PI / 2;
                stripeEW.position.set(off, 0.048, i);
                group.add(stripeEW);
            }
        }

        // 3. CENTRAL PLAZA (Clean open combat & lobby space around 0,0)
        const plaza = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 15.0, 0.12, 32), matPlaza);
        plaza.position.set(0, 0.02, 0);
        plaza.receiveShadow = true;
        group.add(plaza);

        const plazaRing = new THREE.Mesh(
            new THREE.RingGeometry(13.6, 14.3, 48),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        plazaRing.rotation.x = -Math.PI / 2;
        plazaRing.position.y = 0.09;
        group.add(plazaRing);

        // 4. ARCHITECTURAL SKYSCRAPERS & MID-RISES (4 Quadrants, 16 varied buildings)
        const buildingSpecs = [
            // NE Quadrant
            { x: 26, z: -26, w: 18, d: 18, h: 42, v: 0, roof: 'spire' },
            { x: 52, z: -24, w: 20, d: 16, h: 30, v: 1, roof: 'helipad' },
            { x: 26, z: -54, w: 18, d: 20, h: 52, v: 3, roof: 'spire' },
            { x: 56, z: -56, w: 22, d: 20, h: 24, v: 2, roof: 'ac' },
            // NW Quadrant
            { x: -26, z: -26, w: 18, d: 18, h: 38, v: 3, roof: 'helipad' },
            { x: -54, z: -26, w: 20, d: 18, h: 28, v: 0, roof: 'ac' },
            { x: -26, z: -56, w: 18, d: 22, h: 48, v: 1, roof: 'spire' },
            { x: -56, z: -56, w: 22, d: 20, h: 34, v: 2, roof: 'ac' },
            // SE Quadrant
            { x: 26, z: 26, w: 18, d: 18, h: 34, v: 2, roof: 'ac' },
            { x: 54, z: 26, w: 22, d: 18, h: 44, v: 0, roof: 'spire' },
            { x: 26, z: 56, w: 18, d: 20, h: 26, v: 1, roof: 'helipad' },
            { x: 56, z: 56, w: 20, d: 20, h: 36, v: 3, roof: 'ac' },
            // SW Quadrant
            { x: -26, z: 26, w: 18, d: 18, h: 46, v: 1, roof: 'spire' },
            { x: -54, z: 26, w: 20, d: 18, h: 24, v: 2, roof: 'ac' },
            { x: -26, z: 56, w: 18, d: 20, h: 36, v: 0, roof: 'helipad' },
            { x: -56, z: 56, w: 22, d: 22, h: 30, v: 3, roof: 'ac' }
        ];

        const facadeMats = [0, 1, 2, 3].map((v) => {
            const tex = ProceduralTextures.createBuildingFacade(v);
            tex.repeat.set(2, 3);
            return new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.25,
                metalness: 0.45
            });
        });

        for (const b of buildingSpecs) {
            const bGroup = new THREE.Group();
            bGroup.position.set(b.x, 0, b.z);

            // Ground floor commercial podium (glass lobby + overhang)
            const lobbyH = 4.5;
            const podium = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, lobbyH, b.d + 0.6), matGlassLobby);
            podium.position.y = lobbyH / 2;
            podium.castShadow = true;
            podium.receiveShadow = true;
            bGroup.add(podium);

            const canopy = new THREE.Mesh(new THREE.BoxGeometry(b.w + 2.0, 0.5, b.d + 2.0), matMetalDark);
            canopy.position.y = lobbyH + 0.2;
            canopy.castShadow = true;
            bGroup.add(canopy);

            // Main tower shaft
            const towerH = b.h - lobbyH;
            const tower = new THREE.Mesh(new THREE.BoxGeometry(b.w, towerH, b.d), facadeMats[b.v]);
            tower.position.y = lobbyH + towerH / 2;
            tower.castShadow = true;
            tower.receiveShadow = true;
            bGroup.add(tower);

            // Upper architectural setback (stepped top)
            const topW = b.w * 0.72;
            const topD = b.d * 0.72;
            const topH = 4.5;
            const setback = new THREE.Mesh(new THREE.BoxGeometry(topW, topH, topD), matMetalLight);
            setback.position.y = b.h + topH / 2;
            setback.castShadow = true;
            bGroup.add(setback);

            // Roof parapet trim
            const parapet = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.4, 0.8, b.d + 0.4), matMetalDark);
            parapet.position.y = b.h + 0.3;
            bGroup.add(parapet);

            // Roof details
            if (b.roof === 'spire') {
                const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, 11, 8), matMetalLight);
                spire.position.y = b.h + topH + 5.5;
                bGroup.add(spire);
                const beacon = new THREE.Mesh(
                    new THREE.SphereGeometry(0.35, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
                );
                beacon.position.y = b.h + topH + 11.2;
                bGroup.add(beacon);
            } else if (b.roof === 'helipad') {
                const pad = new THREE.Mesh(new THREE.CylinderGeometry(topW * 0.42, topW * 0.42, 0.2, 20), matMetalDark);
                pad.position.y = b.h + topH + 0.1;
                bGroup.add(pad);
                const padRing = new THREE.Mesh(
                    new THREE.RingGeometry(topW * 0.3, topW * 0.35, 24),
                    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
                );
                padRing.rotation.x = -Math.PI / 2;
                padRing.position.y = b.h + topH + 0.22;
                bGroup.add(padRing);
            } else {
                const acUnit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 2.4), matCurb);
                acUnit.position.set(1.5, b.h + topH + 0.9, -1.0);
                bGroup.add(acUnit);
            }

            group.add(bGroup);

            colliders.push({
                type: 'box',
                minX: b.x - b.w / 2 - 0.5,
                maxX: b.x + b.w / 2 + 0.5,
                minZ: b.z - b.d / 2 - 0.5,
                maxZ: b.z + b.d / 2 + 0.5,
                minY: 0,
                maxY: b.h + topH
            });
        }

        // 5. STYLIZED STREET LAMPS (Emissive Only — 0 PointLights for 60 FPS!)
        const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
        const lampCoords = [-70, -45, -22, 22, 45, 70];
        for (const c of lampCoords) {
            for (const s of [-10.5, 10.5]) {
                this._addStreetLamp(group, s, c, s < 0 ? 1 : -1, 0, matMetalDark, lampGlowMat);
                this._addStreetLamp(group, c, s, 0, s < 0 ? 1 : -1, matMetalDark, lampGlowMat);
            }
        }

        // 6. TACTICAL COVER PROPS: FUTURISTIC CARS & BARRICADES
        const carSpots = [
            { x: 5.5, z: -28, rot: 0, col: 0x0284c7 },
            { x: -5.5, z: 32, rot: Math.PI, col: 0xea580c },
            { x: 30, z: 5.5, rot: Math.PI / 2, col: 0xf8fafc },
            { x: -34, z: -5.5, rot: -Math.PI / 2, col: 0xef4444 },
            { x: 5.5, z: 52, rot: 0, col: 0x10b981 },
            { x: -5.5, z: -52, rot: Math.PI, col: 0x6366f1 }
        ];
        for (const car of carSpots) {
            this._addFuturisticCar(group, colliders, car.x, car.z, car.rot, car.col, matMetalDark, matGlassLobby);
        }

        // Concrete tactical cover barriers around plaza perimeter
        const barrierAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
        for (const ang of barrierAngles) {
            const bx = Math.cos(ang) * 13.0;
            const bz = Math.sin(ang) * 13.0;
            const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.15, 0.7), matCurb);
            barrier.position.set(bx, 0.58, bz);
            barrier.rotation.y = -ang + Math.PI / 2;
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            group.add(barrier);

            colliders.push({
                type: 'box',
                minX: bx - 1.5,
                maxX: bx + 1.5,
                minZ: bz - 1.5,
                maxZ: bz + 1.5,
                minY: 0,
                maxY: 1.2
            });
        }

        scene.add(group);
        return { group, colliders };
    }

    static _addStreetLamp(group, x, z, dirX, dirZ, poleMat, glowMat) {
        const lamp = new THREE.Group();
        lamp.position.set(x, 0, z);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 6.2, 8), poleMat);
        pole.position.y = 3.1;
        lamp.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(dirX ? 1.8 : 0.18, 0.16, dirZ ? 1.8 : 0.18), poleMat);
        arm.position.set(dirX * 0.85, 6.1, dirZ * 0.85);
        lamp.add(arm);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.35), glowMat);
        head.position.set(dirX * 1.5, 5.98, dirZ * 1.5);
        lamp.add(head);

        group.add(lamp);
    }

    static _addFuturisticCar(group, colliders, x, z, rotY, colorHex, darkMat, glassMat) {
        const car = new THREE.Group();
        car.position.set(x, 0, z);
        car.rotation.y = rotY;

        const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.7, roughness: 0.25 });
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.4), bodyMat);
        chassis.position.y = 0.65;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        car.add(chassis);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 2.2), glassMat);
        cabin.position.set(0, 1.28, -0.2);
        cabin.castShadow = true;
        car.add(cabin);

        // Headlights & Taillights
        const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const hl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.08), headMat);
        hl.position.set(0, 0.72, 2.21);
        car.add(hl);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.08), tailMat);
        tl.position.set(0, 0.72, -2.21);
        car.add(tl);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        for (const wx of [-1.05, 1.05]) {
            for (const wz of [-1.35, 1.35]) {
                const w = new THREE.Mesh(wheelGeo, darkMat);
                w.position.set(wx, 0.36, wz);
                car.add(w);
            }
        }

        group.add(car);

        const halfX = Math.abs(Math.cos(rotY)) * 1.15 + Math.abs(Math.sin(rotY)) * 2.25;
        const halfZ = Math.abs(Math.sin(rotY)) * 1.15 + Math.abs(Math.cos(rotY)) * 2.25;
        colliders.push({
            type: 'box',
            minX: x - halfX,
            maxX: x + halfX,
            minZ: z - halfZ,
            maxZ: z + halfZ,
            minY: 0,
            maxY: 1.65
        });
    }
}
