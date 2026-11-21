/**
 * @file CharacterModel.js
 * @description AAA Stylized 3D Character Models:
 * 1. CYBER-STRIKER: High-tech Cyborg Commando with aerodynamic thruster wings and hand laser cannon.
 * 2. TITAN BRAWLER: Massive Heavy Exosuit Mech with dual shoulder missile pods, chest reactor, and reinforced hydraulic blast armor.
 * 3. GHOST RECON: Ultra-sleek Cyber Ninja with flowing stealth cape, dual crossed energy katanas, and demon-eye visor.
 * Fully articulated rigs for all models with procedural animations.
 */
import * as THREE from 'three';
import { StylizedPBRMaterial } from '../rendering/StylizedPBRMaterial.js';

export class CharacterModel {
    /**
     * Builds the requested character model with distinct 3D geometry and silhouette.
     * @param {Object} options
     * @returns {THREE.Group}
     */
    static createHero(options = {}) {
        const charType = options.characterType || 'CYBER_STRIKER';
        if (charType === 'TITAN_BRAWLER') {
            return this.createTitanBrawler();
        } else if (charType === 'GHOST_RECON') {
            return this.createGhostRecon();
        } else {
            return this.createCyberStriker();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. CYBER-STRIKER (CYBORG COMMANDO WITH THRUSTER WINGS & HAND LASER)
    // ─────────────────────────────────────────────────────────────────
    static createCyberStriker() {
        const root = new THREE.Group();
        root.userData.isHero = true;
        root.userData.characterType = 'CYBER_STRIKER';

        const armorMat = new StylizedPBRMaterial({
            baseColor: 0x0284c7, // Vibrant cyber blue
            shadowColor: 0x082f49,
            rimColor: 0x38bdf8,
            rimPower: 2.2,
            rimIntensity: 1.2,
            celSteps: 4.0
        });

        const darkCarbonMat = new StylizedPBRMaterial({
            baseColor: 0x0f172a, // Slate carbon
            shadowColor: 0x020617,
            rimColor: 0x38bdf8,
            rimPower: 2.5,
            rimIntensity: 0.8,
            celSteps: 3.0
        });

        const skinMat = new StylizedPBRMaterial({
            baseColor: 0xf6d3b3,
            shadowColor: 0x9c6644,
            rimColor: 0xffffff,
            rimPower: 2.0,
            rimIntensity: 0.6,
            celSteps: 3.0
        });

        const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
        const coreWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // Pelvis
        const pelvisGroup = new THREE.Group();
        pelvisGroup.position.set(0, 0.95, 0);
        root.add(pelvisGroup);

        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.16, 8), darkCarbonMat);
        pelvisGroup.add(belt);

        // Torso
        const torso = new THREE.Group();
        torso.position.set(0, 0.12, 0);
        pelvisGroup.add(torso);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.28), armorMat);
        chest.position.set(0, 0.28, 0);
        chest.castShadow = true;
        torso.add(chest);

        // Cyber energy conduit in chest
        const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.30), neonCyanMat);
        conduit.position.set(0, 0.28, 0.01);
        torso.add(conduit);

        // Back: Dual Aerodynamic Jump Wings & Thruster Pack
        const jetpack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.18), darkCarbonMat);
        jetpack.position.set(0, 0.28, -0.20);
        torso.add(jetpack);

        // Left Wing
        const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.24), armorMat);
        leftWing.position.set(-0.28, 0.38, -0.22);
        leftWing.rotation.set(0.2, 0.3, 0.3);
        torso.add(leftWing);

        // Right Wing
        const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.24), armorMat);
        rightWing.position.set(0.28, 0.38, -0.22);
        rightWing.rotation.set(0.2, -0.3, -0.3);
        torso.add(rightWing);

        // Jet Thruster Nozzles
        const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.14, 8);
        const leftNozzle = new THREE.Mesh(nozzleGeo, neonCyanMat);
        leftNozzle.position.set(-0.12, 0.10, -0.22);
        torso.add(leftNozzle);
        const rightNozzle = leftNozzle.clone();
        rightNozzle.position.x = 0.12;
        torso.add(rightNozzle);

        // Head & Visor
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.58, 0);
        torso.add(headPivot);

        const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.34), armorMat);
        helmet.position.set(0, 0.16, 0);
        helmet.castShadow = true;
        headPivot.add(helmet);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.10), neonCyanMat);
        visor.position.set(0, 0.16, 0.16);
        headPivot.add(visor);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), darkCarbonMat);
        antenna.position.set(-0.16, 0.32, -0.05);
        antenna.rotation.z = -0.2;
        headPivot.add(antenna);

        // Left Arm (Cybernetic Bionic Arm with Hand Laser Cannon)
        const leftShoulderPivot = new THREE.Group();
        leftShoulderPivot.position.set(-0.36, 0.46, 0);
        torso.add(leftShoulderPivot);

        const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.16, 0.22), armorMat);
        leftShoulderPivot.add(leftPauldron);

        const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.26, 6), darkCarbonMat);
        leftUpperArm.position.set(0, -0.15, 0);
        leftShoulderPivot.add(leftUpperArm);

        const leftElbowPivot = new THREE.Group();
        leftElbowPivot.position.set(0, -0.28, 0);
        leftShoulderPivot.add(leftElbowPivot);

        const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.26, 8), darkCarbonMat);
        leftForearm.position.set(0, -0.14, 0);
        leftElbowPivot.add(leftForearm);

        // Plasma Cannon Gauntlet on Hand
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.14), armorMat);
        leftHand.position.set(0, -0.30, 0);
        leftElbowPivot.add(leftHand);

        const laserCore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8), neonCyanMat);
        laserCore.rotation.x = Math.PI / 2;
        laserCore.position.set(0, 0, 0.08);
        leftHand.add(laserCore);
        leftHand.userData.laserEmitter = laserCore;

        // Right Arm (Assault Blaster)
        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.position.set(0.36, 0.46, 0);
        torso.add(rightShoulderPivot);

        const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.16, 0.22), armorMat);
        rightShoulderPivot.add(rightPauldron);

        const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.26, 6), darkCarbonMat);
        rightUpperArm.position.set(0, -0.15, 0);
        rightShoulderPivot.add(rightUpperArm);

        const rightElbowPivot = new THREE.Group();
        rightElbowPivot.position.set(0, -0.28, 0);
        rightShoulderPivot.add(rightElbowPivot);

        const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.26, 6), armorMat);
        rightForearm.position.set(0, -0.14, 0);
        rightElbowPivot.add(rightForearm);

        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.09), darkCarbonMat);
        rightHand.position.set(0, -0.30, 0);
        rightElbowPivot.add(rightHand);

        const weapon = this.createDetailedRifle();
        weapon.position.set(0, -0.05, 0.15);
        weapon.rotation.x = -Math.PI / 12;
        rightHand.add(weapon);

        // Legs
        const { leftHipPivot, leftKneePivot, rightHipPivot, rightKneePivot } = this._buildLegs(pelvisGroup, armorMat, darkCarbonMat);

        root.userData.rig = {
            pelvis: pelvisGroup,
            torso,
            head: headPivot,
            leftShoulder: leftShoulderPivot,
            leftElbow: leftElbowPivot,
            leftHand,
            rightShoulder: rightShoulderPivot,
            rightElbow: rightElbowPivot,
            rightHand,
            leftHip: leftHipPivot,
            leftKnee: leftKneePivot,
            rightHip: rightHipPivot,
            rightKnee: rightKneePivot,
            weapon,
            animTimer: 0,
            recoilTimer: 0
        };

        return root;
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. TITAN BRAWLER (MASSIVE HEAVY MECH WITH SHOULDER MISSILE PODS)
    // ─────────────────────────────────────────────────────────────────
    static createTitanBrawler() {
        const root = new THREE.Group();
        root.userData.isHero = true;
        root.userData.characterType = 'TITAN_BRAWLER';

        const heavyArmorMat = new StylizedPBRMaterial({
            baseColor: 0xd97706, // Hazard Industrial Amber
            shadowColor: 0x451a03,
            rimColor: 0xfbbf24,
            rimPower: 2.2,
            rimIntensity: 1.1,
            celSteps: 4.0
        });

        const ironSteelMat = new StylizedPBRMaterial({
            baseColor: 0x27272a, // Dark Matte Cast Iron
            shadowColor: 0x09090b,
            rimColor: 0x71717a,
            rimPower: 2.5,
            rimIntensity: 0.9,
            celSteps: 3.0
        });

        const orangeReactorMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
        const missileTipMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

        // Heavy Wide Pelvis
        const pelvisGroup = new THREE.Group();
        pelvisGroup.position.set(0, 0.92, 0);
        root.add(pelvisGroup);

        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.20, 0.32), ironSteelMat);
        pelvisGroup.add(belt);

        // Heavy Torso (Broadened 1.35x)
        const torso = new THREE.Group();
        torso.position.set(0, 0.14, 0);
        pelvisGroup.add(torso);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.50, 0.38), heavyArmorMat);
        chest.position.set(0, 0.30, 0);
        chest.castShadow = true;
        torso.add(chest);

        // Circular Glowing Chest Reactor Core
        const coreRing = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), ironSteelMat);
        coreRing.rotation.x = Math.PI / 2;
        coreRing.position.set(0, 0.32, 0.18);
        torso.add(coreRing);

        const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.09, 12), orangeReactorMat);
        reactorCore.rotation.x = Math.PI / 2;
        reactorCore.position.set(0, 0.32, 0.18);
        torso.add(reactorCore);

        // Heavy Blast Exhaust Vents on Back
        const backPlating = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.18), ironSteelMat);
        backPlating.position.set(0, 0.30, -0.22);
        torso.add(backPlating);

        // DUAL SHOULDER MISSILE LAUNCHER PODS
        const leftMissilePod = new THREE.Group();
        leftMissilePod.position.set(-0.48, 0.62, 0);
        torso.add(leftMissilePod);

        const podBoxL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.34), ironSteelMat);
        leftMissilePod.add(podBoxL);
        // 4 visible red missile tips
        for (let mx = -0.06; mx <= 0.06; mx += 0.12) {
            for (let my = -0.06; my <= 0.06; my += 0.12) {
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 6), missileTipMat);
                tip.rotation.x = Math.PI / 2;
                tip.position.set(mx, my, 0.18);
                leftMissilePod.add(tip);
            }
        }

        const rightMissilePod = new THREE.Group();
        rightMissilePod.position.set(0.48, 0.62, 0);
        torso.add(rightMissilePod);

        const podBoxR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.34), ironSteelMat);
        rightMissilePod.add(podBoxR);
        for (let mx = -0.06; mx <= 0.06; mx += 0.12) {
            for (let my = -0.06; my <= 0.06; my += 0.12) {
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 6), missileTipMat);
                tip.rotation.x = Math.PI / 2;
                tip.position.set(mx, my, 0.18);
                rightMissilePod.add(tip);
            }
        }

        // Heavy Reinforced Dome Head
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.60, 0);
        torso.add(headPivot);

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.32, 8), heavyArmorMat);
        helmet.position.set(0, 0.16, 0);
        helmet.castShadow = true;
        headPivot.add(helmet);

        const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.12), orangeReactorMat);
        visorSlit.position.set(0, 0.16, 0.16);
        headPivot.add(visorSlit);

        // Heavy Left Arm with Reinforced Pneumatic Fist
        const leftShoulderPivot = new THREE.Group();
        leftShoulderPivot.position.set(-0.46, 0.42, 0);
        torso.add(leftShoulderPivot);

        const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.28), heavyArmorMat);
        leftShoulderPivot.add(leftPauldron);

        const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.10, 0.28, 8), ironSteelMat);
        leftUpperArm.position.set(0, -0.16, 0);
        leftShoulderPivot.add(leftUpperArm);

        const leftElbowPivot = new THREE.Group();
        leftElbowPivot.position.set(0, -0.30, 0);
        leftShoulderPivot.add(leftElbowPivot);

        const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.26, 0.22), ironSteelMat);
        leftForearm.position.set(0, -0.14, 0);
        leftElbowPivot.add(leftForearm);

        // Giant Armored Power Fist
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.20), heavyArmorMat);
        leftHand.position.set(0, -0.32, 0);
        leftElbowPivot.add(leftHand);

        // Right Arm with Heavy Ballistic Autocannon
        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.position.set(0.46, 0.42, 0);
        torso.add(rightShoulderPivot);

        const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.28), heavyArmorMat);
        rightShoulderPivot.add(rightPauldron);

        const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.10, 0.28, 8), ironSteelMat);
        rightUpperArm.position.set(0, -0.16, 0);
        rightShoulderPivot.add(rightUpperArm);

        const rightElbowPivot = new THREE.Group();
        rightElbowPivot.position.set(0, -0.30, 0);
        rightShoulderPivot.add(rightElbowPivot);

        const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.26, 0.22), ironSteelMat);
        rightForearm.position.set(0, -0.14, 0);
        rightElbowPivot.add(rightForearm);

        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), heavyArmorMat);
        rightHand.position.set(0, -0.30, 0);
        rightElbowPivot.add(rightHand);

        const weapon = this.createHeavyCannon();
        weapon.position.set(0, -0.05, 0.18);
        rightHand.add(weapon);

        // Heavy Hydraulic Legs
        const { leftHipPivot, leftKneePivot, rightHipPivot, rightKneePivot } = this._buildLegs(pelvisGroup, heavyArmorMat, ironSteelMat, 1.25);

        root.userData.rig = {
            pelvis: pelvisGroup,
            torso,
            head: headPivot,
            leftShoulder: leftShoulderPivot,
            leftElbow: leftElbowPivot,
            leftHand,
            rightShoulder: rightShoulderPivot,
            rightElbow: rightElbowPivot,
            rightHand,
            leftHip: leftHipPivot,
            leftKnee: leftKneePivot,
            rightHip: rightHipPivot,
            rightKnee: rightKneePivot,
            weapon,
            leftMissilePod,
            rightMissilePod,
            animTimer: 0,
            recoilTimer: 0
        };

        return root;
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. GHOST RECON (CYBER NINJA ASSASSIN WITH TWIN ENERGY KATANAS)
    // ─────────────────────────────────────────────────────────────────
    static createGhostRecon() {
        const root = new THREE.Group();
        root.userData.isHero = true;
        root.userData.characterType = 'GHOST_RECON';

        const stealthMat = new StylizedPBRMaterial({
            baseColor: 0x18181b, // Midnight Obsidian
            shadowColor: 0x09090b,
            rimColor: 0xef4444, // Crimson stealth rim
            rimPower: 2.0,
            rimIntensity: 1.3,
            celSteps: 3.0
        });

        const carbonSuitMat = new StylizedPBRMaterial({
            baseColor: 0x27272a, // Flexible Nanofiber Weave
            shadowColor: 0x111113,
            rimColor: 0x71717a,
            rimPower: 2.5,
            rimIntensity: 0.7,
            celSteps: 3.0
        });

        const crimsonGlowMat = new THREE.MeshBasicMaterial({ color: 0xff1133 });
        const katanaBladeMat = new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.9 });

        // Sleek Pelvis
        const pelvisGroup = new THREE.Group();
        pelvisGroup.position.set(0, 0.95, 0);
        root.add(pelvisGroup);

        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.19, 0.14, 8), stealthMat);
        pelvisGroup.add(belt);

        // Sleek Torso
        const torso = new THREE.Group();
        torso.position.set(0, 0.12, 0);
        pelvisGroup.add(torso);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.40, 0.24), carbonSuitMat);
        chest.position.set(0, 0.28, 0);
        chest.castShadow = true;
        torso.add(chest);

        // High Collar
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.16, 6), stealthMat);
        collar.position.set(0, 0.48, 0);
        torso.add(collar);

        // BACK: DUAL CROSSED ENERGY KATANAS & STEALTH CAPE
        const scabbardGeo = new THREE.BoxGeometry(0.06, 0.85, 0.08);
        const bladeGeo = new THREE.BoxGeometry(0.04, 0.75, 0.03);

        const leftKatana = new THREE.Group();
        leftKatana.position.set(-0.10, 0.35, -0.16);
        leftKatana.rotation.set(0.1, 0, 0.45);
        const scabbardL = new THREE.Mesh(scabbardGeo, stealthMat);
        leftKatana.add(scabbardL);
        const bladeL = new THREE.Mesh(bladeGeo, katanaBladeMat);
        bladeL.position.y = 0.25;
        leftKatana.add(bladeL);
        torso.add(leftKatana);

        const rightKatana = new THREE.Group();
        rightKatana.position.set(0.10, 0.35, -0.16);
        rightKatana.rotation.set(0.1, 0, -0.45);
        const scabbardR = new THREE.Mesh(scabbardGeo, stealthMat);
        rightKatana.add(scabbardR);
        const bladeR = new THREE.Mesh(bladeGeo, katanaBladeMat);
        bladeR.position.y = 0.25;
        rightKatana.add(bladeR);
        torso.add(rightKatana);

        // Aerodynamic Stealth Scarf/Cape Fins
        const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.55), stealthMat);
        cape.position.set(0, 0.20, -0.18);
        cape.rotation.x = -0.25;
        torso.add(cape);

        // Head & Demon-Eye Visor
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.58, 0);
        torso.add(headPivot);

        const ninjaMask = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.34, 0.30), stealthMat);
        ninjaMask.position.set(0, 0.16, 0);
        ninjaMask.castShadow = true;
        headPivot.add(ninjaMask);

        // Demon Horn Crest
        const crest = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), stealthMat);
        crest.position.set(-0.10, 0.34, -0.02);
        crest.rotation.z = -0.3;
        headPivot.add(crest);
        const crestR = crest.clone();
        crestR.position.x = 0.10;
        crestR.rotation.z = 0.3;
        headPivot.add(crestR);

        // Dual Glowing Slanted Crimson Eyes
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.04), crimsonGlowMat);
        leftEye.position.set(-0.07, 0.17, 0.15);
        leftEye.rotation.z = -0.2;
        headPivot.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.04), crimsonGlowMat);
        rightEye.position.set(0.07, 0.17, 0.15);
        rightEye.rotation.z = 0.2;
        headPivot.add(rightEye);

        // Left Arm (Wrist Holographic Blade)
        const leftShoulderPivot = new THREE.Group();
        leftShoulderPivot.position.set(-0.32, 0.46, 0);
        torso.add(leftShoulderPivot);

        const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.18), stealthMat);
        leftShoulderPivot.add(leftPauldron);

        const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.26, 6), carbonSuitMat);
        leftUpperArm.position.set(0, -0.15, 0);
        leftShoulderPivot.add(leftUpperArm);

        const leftElbowPivot = new THREE.Group();
        leftElbowPivot.position.set(0, -0.28, 0);
        leftShoulderPivot.add(leftElbowPivot);

        const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.26, 6), stealthMat);
        leftForearm.position.set(0, -0.14, 0);
        leftElbowPivot.add(leftForearm);

        // Wrist Blade Emitter
        const wristBlade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.08), crimsonGlowMat);
        wristBlade.position.set(-0.06, -0.18, 0.06);
        leftElbowPivot.add(wristBlade);

        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.08), carbonSuitMat);
        leftHand.position.set(0, -0.28, 0);
        leftElbowPivot.add(leftHand);

        // Right Arm (Tactical Suppressed SMG)
        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.position.set(0.32, 0.46, 0);
        torso.add(rightShoulderPivot);

        const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.18), stealthMat);
        rightShoulderPivot.add(rightPauldron);

        const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.26, 6), carbonSuitMat);
        rightUpperArm.position.set(0, -0.15, 0);
        rightShoulderPivot.add(rightUpperArm);

        const rightElbowPivot = new THREE.Group();
        rightElbowPivot.position.set(0, -0.28, 0);
        rightShoulderPivot.add(rightElbowPivot);

        const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.26, 6), stealthMat);
        rightForearm.position.set(0, -0.14, 0);
        rightElbowPivot.add(rightForearm);

        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.08), carbonSuitMat);
        rightHand.position.set(0, -0.28, 0);
        rightElbowPivot.add(rightHand);

        const weapon = this.createStealthSMG();
        weapon.position.set(0, -0.05, 0.15);
        rightHand.add(weapon);

        // Lightweight Ninja Legs with Shin Blades
        const { leftHipPivot, leftKneePivot, rightHipPivot, rightKneePivot } = this._buildLegs(pelvisGroup, stealthMat, carbonSuitMat, 0.95);

        root.userData.rig = {
            pelvis: pelvisGroup,
            torso,
            head: headPivot,
            leftShoulder: leftShoulderPivot,
            leftElbow: leftElbowPivot,
            leftHand,
            rightShoulder: rightShoulderPivot,
            rightElbow: rightElbowPivot,
            rightHand,
            leftHip: leftHipPivot,
            leftKnee: leftKneePivot,
            rightHip: rightHipPivot,
            rightKnee: rightKneePivot,
            weapon,
            leftKatana,
            rightKatana,
            animTimer: 0,
            recoilTimer: 0
        };

        return root;
    }

    // ─────────────────────────────────────────────────────────────────
    // HELPER: BUILD ARTICULATED LEGS
    // ─────────────────────────────────────────────────────────────────
    static _buildLegs(pelvis, armorMat, darkMat, scale = 1.0) {
        // Left Leg
        const leftHipPivot = new THREE.Group();
        leftHipPivot.position.set(-0.16 * scale, -0.06, 0);
        pelvis.add(leftHipPivot);

        const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * scale, 0.08 * scale, 0.38, 8), darkMat);
        leftThigh.position.set(0, -0.20, 0);
        leftThigh.castShadow = true;
        leftHipPivot.add(leftThigh);

        const leftThighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.20, 0.06), armorMat);
        leftThighPlate.position.set(0, -0.18, 0.08);
        leftHipPivot.add(leftThighPlate);

        const leftKneePivot = new THREE.Group();
        leftKneePivot.position.set(0, -0.40, 0);
        leftHipPivot.add(leftKneePivot);

        const leftKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.10, 0.08), armorMat);
        leftKneePad.position.set(0, 0, 0.08);
        leftKneePivot.add(leftKneePad);

        const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.07 * scale, 0.36, 8), darkMat);
        leftShin.position.set(0, -0.20, 0);
        leftShin.castShadow = true;
        leftKneePivot.add(leftShin);

        const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.12, 0.26 * scale), armorMat);
        leftBoot.position.set(0, -0.40, 0.04);
        leftBoot.castShadow = true;
        leftKneePivot.add(leftBoot);

        // Right Leg
        const rightHipPivot = new THREE.Group();
        rightHipPivot.position.set(0.16 * scale, -0.06, 0);
        pelvis.add(rightHipPivot);

        const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * scale, 0.08 * scale, 0.38, 8), darkMat);
        rightThigh.position.set(0, -0.20, 0);
        rightThigh.castShadow = true;
        rightHipPivot.add(rightThigh);

        const rightThighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.20, 0.06), armorMat);
        rightThighPlate.position.set(0, -0.18, 0.08);
        rightHipPivot.add(rightThighPlate);

        const rightKneePivot = new THREE.Group();
        rightKneePivot.position.set(0, -0.40, 0);
        rightHipPivot.add(rightKneePivot);

        const rightKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.10, 0.08), armorMat);
        rightKneePad.position.set(0, 0, 0.08);
        rightKneePivot.add(rightKneePad);

        const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.07 * scale, 0.36, 8), darkMat);
        rightShin.position.set(0, -0.20, 0);
        rightShin.castShadow = true;
        rightKneePivot.add(rightShin);

        const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.12, 0.26 * scale), armorMat);
        rightBoot.position.set(0, -0.40, 0.04);
        rightBoot.castShadow = true;
        rightKneePivot.add(rightBoot);

        return { leftHipPivot, leftKneePivot, rightHipPivot, rightKneePivot };
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. COMBAT BOT / AI ENEMY
    // ─────────────────────────────────────────────────────────────────
    static createEnemyBot() {
        const root = new THREE.Group();
        root.userData.isEnemy = true;

        const chassisMat = new StylizedPBRMaterial({
            baseColor: 0x991b1b,
            shadowColor: 0x3f0606,
            rimColor: 0xf87171,
            rimPower: 2.0,
            rimIntensity: 1.2,
            celSteps: 3.0
        });

        const darkMetalMat = new StylizedPBRMaterial({
            baseColor: 0x1f2937,
            shadowColor: 0x0a0d14,
            rimColor: 0x4b5563,
            rimPower: 2.5,
            rimIntensity: 0.8,
            celSteps: 3.0
        });

        const redGlow = new THREE.MeshBasicMaterial({ color: 0xff0044 });

        const pelvis = new THREE.Group();
        pelvis.position.set(0, 0.95, 0);
        root.add(pelvis);

        const hipBlock = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.24), darkMetalMat);
        pelvis.add(hipBlock);

        const torso = new THREE.Group();
        torso.position.set(0, 0.12, 0);
        pelvis.add(torso);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.38, 0.32), chassisMat);
        chest.position.set(0, 0.35, 0);
        chest.castShadow = true;
        torso.add(chest);

        const coreLight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 6), redGlow);
        coreLight.rotation.x = Math.PI / 2;
        coreLight.position.set(0, 0.36, 0.17);
        torso.add(coreLight);

        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.65, 0);
        torso.add(headPivot);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.30), darkMetalMat);
        head.position.set(0, 0.15, 0);
        headPivot.add(head);

        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), redGlow);
        eye.position.set(0, 0.15, 0.14);
        headPivot.add(eye);

        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.position.set(0.35, 0.44, 0);
        torso.add(rightShoulderPivot);

        const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.50, 6), darkMetalMat);
        rightArm.position.set(0, -0.25, 0);
        rightShoulderPivot.add(rightArm);

        const weapon = this.createDetailedRifle(true);
        weapon.position.set(0, -0.50, 0.15);
        rightShoulderPivot.add(weapon);

        const leftShoulderPivot = new THREE.Group();
        leftShoulderPivot.position.set(-0.35, 0.44, 0);
        torso.add(leftShoulderPivot);

        const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.50, 6), darkMetalMat);
        leftArm.position.set(0, -0.25, 0);
        leftShoulderPivot.add(leftArm);

        const { leftHipPivot, leftKneePivot, rightHipPivot, rightKneePivot } = this._buildLegs(pelvis, chassisMat, darkMetalMat);

        root.userData.rig = {
            pelvis,
            torso,
            head: headPivot,
            leftShoulder: leftShoulderPivot,
            rightShoulder: rightShoulderPivot,
            leftHip: leftHipPivot,
            leftKnee: leftKneePivot,
            rightHip: rightHipPivot,
            rightKnee: rightKneePivot,
            weapon,
            animTimer: 0
        };

        return root;
    }

    // ─────────────────────────────────────────────────────────────────
    // WEAPONS
    // ─────────────────────────────────────────────────────────────────
    static createDetailedRifle(isEnemy = false) {
        const rifle = new THREE.Group();
        const gunMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0x222228 : 0x1e293b, metalness: 0.8, roughness: 0.25 });
        const accentMat = new THREE.MeshStandardMaterial({ color: isEnemy ? 0xdc2626 : 0x0284c7, metalness: 0.5, roughness: 0.3 });
        const holoMat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0xff0044 : 0x00f5ff, transparent: true, opacity: 0.8 });

        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.42), gunMat);
        rifle.add(receiver);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8), gunMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, 0.40);
        rifle.add(barrel);

        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.20, 0.10), gunMat);
        mag.position.set(0, -0.14, 0.10);
        mag.rotation.x = 0.2;
        rifle.add(mag);

        const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.10), holoMat);
        sight.position.set(0, 0.10, 0.02);
        rifle.add(sight);

        return rifle;
    }

    static createHeavyCannon() {
        const cannon = new THREE.Group();
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85, roughness: 0.2 });
        const hazardMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.55), ironMat);
        cannon.add(body);

        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.18, 12), hazardMat);
        drum.position.set(0, -0.12, 0.08);
        cannon.add(drum);

        const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), ironMat);
        barrel1.rotation.x = Math.PI / 2;
        barrel1.position.set(-0.035, 0.02, 0.50);
        cannon.add(barrel1);

        const barrel2 = barrel1.clone();
        barrel2.position.x = 0.035;
        cannon.add(barrel2);

        const core = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.14), glowMat);
        core.position.set(0, 0.08, 0.02);
        cannon.add(core);

        return cannon;
    }

    static createStealthSMG() {
        const smg = new THREE.Group();
        const matteMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.5, roughness: 0.5 });
        const silencerMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8, roughness: 0.2 });
        const redGlow = new THREE.MeshBasicMaterial({ color: 0xff1133 });

        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.32), matteMat);
        smg.add(receiver);

        const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), silencerMat);
        silencer.rotation.x = Math.PI / 2;
        silencer.position.set(0, 0.02, 0.30);
        smg.add(silencer);

        const laserSight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.08), redGlow);
        laserSight.position.set(0, -0.06, 0.18);
        smg.add(laserSight);

        return smg;
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. PROCEDURAL ANIMATIONS
    // ─────────────────────────────────────────────────────────────────
    static updateAnimation(model, state, dt, speed = 1.0) {
        const rig = model?.userData?.rig;
        if (!rig) return;

        rig.animTimer += dt * (state === 'SPRINTING' ? 12 : state === 'SWIMMING' ? 6 : state === 'SLIDING' ? 4 : 7);
        const t = rig.animTimer;
        const lerpFactor = dt * 10;

        if (state === 'SWIMMING') {
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, 1.15, lerpFactor);
            rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0.25, lerpFactor);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, -0.9, lerpFactor);

            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = Math.sin(t) * 0.8 + 0.3;
                rig.leftShoulder.rotation.z = -Math.cos(t) * 0.5 - 0.4;
            }
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = Math.sin(t) * 0.8 + 0.3;
                rig.rightShoulder.rotation.z = Math.cos(t) * 0.5 + 0.4;
            }
            if (rig.leftHip) rig.leftHip.rotation.x = Math.sin(t * 1.5) * 0.45;
            if (rig.rightHip) rig.rightHip.rotation.x = -Math.sin(t * 1.5) * 0.45;

        } else if (state === 'WALKING' || state === 'SPRINTING') {
            const stride = state === 'SPRINTING' ? 0.75 : 0.50;
            const tilt = state === 'SPRINTING' ? 0.22 : 0.08;

            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, tilt, lerpFactor);
            rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0, lerpFactor);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0, lerpFactor);

            const legSwing = Math.sin(t) * stride;
            if (rig.leftHip) rig.leftHip.rotation.x = legSwing;
            if (rig.rightHip) rig.rightHip.rotation.x = -legSwing;
            if (rig.leftKnee) rig.leftKnee.rotation.x = Math.max(0, -legSwing * 1.1);
            if (rig.rightKnee) rig.rightKnee.rotation.x = Math.max(0, legSwing * 1.1);

            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = -legSwing * 0.4 - 0.5;
                rig.leftShoulder.rotation.y = 0.2;
            }
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = legSwing * 0.3 - 0.6;
                rig.rightShoulder.rotation.y = -0.2;
            }

            rig.pelvis.position.y = 0.95 + Math.abs(Math.sin(t)) * 0.05;

        } else if (state === 'SLIDING') {
            // Low dynamic slide pose
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, -0.65, lerpFactor);
            rig.pelvis.position.y = 0.45;
            if (rig.leftHip) rig.leftHip.rotation.x = -1.25;
            if (rig.rightHip) rig.rightHip.rotation.x = 0.75;
            if (rig.rightKnee) rig.rightKnee.rotation.x = 1.35;
            if (rig.leftShoulder) rig.leftShoulder.rotation.x = -0.3;
            if (rig.rightShoulder) rig.rightShoulder.rotation.x = -0.8;

        } else if (state === 'FLYING') {
            // Superhero 3D flight pose
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, 1.25, lerpFactor);
            rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0.2, lerpFactor);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, -0.9, lerpFactor);
            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = -1.5;
                rig.leftShoulder.rotation.z = -0.25;
            }
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = -1.5;
                rig.rightShoulder.rotation.z = 0.25;
            }
            if (rig.leftHip) rig.leftHip.rotation.x = 0.1;
            if (rig.rightHip) rig.rightHip.rotation.x = 0.1;

        } else {
            // Idle breathing
            const breath = Math.sin(t * 0.4) * 0.025;
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, 0, lerpFactor);
            rig.torso.rotation.x = breath;
            rig.head.rotation.x = -breath * 0.5;

            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = -0.35 + breath;
                rig.leftShoulder.rotation.y = 0.2;
                rig.leftShoulder.rotation.z = -0.1;
            }
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = -0.65 + breath;
                rig.rightShoulder.rotation.y = -0.2;
                rig.rightShoulder.rotation.z = 0.1;
            }
            if (rig.leftHip) rig.leftHip.rotation.x = 0;
            if (rig.rightHip) rig.rightHip.rotation.x = 0;
            if (rig.leftKnee) rig.leftKnee.rotation.x = 0;
            if (rig.rightKnee) rig.rightKnee.rotation.x = 0;
        }
    }
}
