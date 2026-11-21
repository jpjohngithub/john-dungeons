/**
 * @file CharacterModel.js
 * @description Professional stylized 3D character models for Hero and AI Bots with articulated skeletal hierarchy and procedural animations (walk, run, swim, idle, shoot).
 */
import * as THREE from 'three';
import { StylizedPBRMaterial } from '../rendering/StylizedPBRMaterial.js';

export class CharacterModel {
    /**
     * Builds a detailed stylized tactical hero with articulated limbs.
     * @returns {THREE.Group}
     */
    static createHero() {
        const root = new THREE.Group();
        root.userData.isHero = true;

        // Color palettes
        const armorMat = new StylizedPBRMaterial({
            baseColor: 0x2563eb,     // Vibrant royal blue
            shadowColor: 0x0f2042,   // Deep navy shadow
            rimColor: 0x93c5fd,
            rimPower: 2.2,
            rimIntensity: 1.1,
            celSteps: 4.0
        });

        const darkArmorMat = new StylizedPBRMaterial({
            baseColor: 0x1e293b,     // Slate dark carbon
            shadowColor: 0x090d16,
            rimColor: 0x64748b,
            rimPower: 2.5,
            rimIntensity: 0.8,
            celSteps: 3.0
        });

        const skinMat = new StylizedPBRMaterial({
            baseColor: 0xf6d3b3,     // Stylized skin
            shadowColor: 0x9c6644,
            rimColor: 0xffffff,
            rimPower: 2.0,
            rimIntensity: 0.7,
            celSteps: 3.0
        });

        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.7,
            roughness: 0.2
        });

        // ── PELVIS & TORSO ──────────────────────────────────────────
        const pelvisGroup = new THREE.Group();
        pelvisGroup.position.set(0, 0.95, 0);
        root.add(pelvisGroup);

        // Pelvis / Belt
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.16, 8), darkArmorMat);
        belt.castShadow = true;
        pelvisGroup.add(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), goldMat);
        buckle.position.set(0, 0, 0.23);
        pelvisGroup.add(buckle);

        // Torso group (rotates from waist)
        const torso = new THREE.Group();
        torso.position.set(0, 0.1, 0);
        pelvisGroup.add(torso);

        // Abdomen / Lower Chest
        const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.24, 8), darkArmorMat);
        abdomen.position.set(0, 0.12, 0);
        abdomen.castShadow = true;
        torso.add(abdomen);

        // Chest Armor
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.36, 0.34), armorMat);
        chest.position.set(0, 0.38, 0);
        chest.castShadow = true;
        torso.add(chest);

        // Chest Plate Overlay
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.08), darkArmorMat);
        chestPlate.position.set(0, 0.40, 0.16);
        torso.add(chestPlate);

        // Arc Core / Energy reactor in chest
        const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), glowMat);
        chestCore.rotation.x = Math.PI / 2;
        chestCore.position.set(0, 0.40, 0.20);
        torso.add(chestCore);

        // Backpack / Tactical Jump Booster
        const backpack = new THREE.Group();
        backpack.position.set(0, 0.38, -0.22);
        const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), darkArmorMat);
        packBody.castShadow = true;
        backpack.add(packBody);

        const leftThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6), armorMat);
        leftThruster.position.set(-0.12, -0.15, 0);
        backpack.add(leftThruster);
        const rightThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6), armorMat);
        rightThruster.position.set(0.12, -0.15, 0);
        backpack.add(rightThruster);

        const leftGlow = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), glowMat);
        leftGlow.rotation.x = Math.PI / 2;
        leftGlow.position.set(-0.12, -0.26, 0);
        backpack.add(leftGlow);
        const rightGlow = leftGlow.clone();
        rightGlow.position.x = 0.12;
        backpack.add(rightGlow);

        torso.add(backpack);

        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 8), skinMat);
        neck.position.set(0, 0.60, 0);
        torso.add(neck);

        // ── HEAD & HELMET ───────────────────────────────────────────
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.68, 0);
        torso.add(headPivot);

        // Stylized Tactical Helmet
        const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.38), armorMat);
        helmet.position.set(0, 0.15, 0);
        helmet.castShadow = true;
        headPivot.add(helmet);

        // Top crest on helmet
        const helmetCrest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.40), darkArmorMat);
        helmetCrest.position.set(0, 0.34, 0);
        headPivot.add(helmetCrest);

        // High-Tech Cyber Visor (Curved horizontal visor with glowing cyan strip)
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.10), glowMat);
        visor.position.set(0, 0.15, 0.18);
        headPivot.add(visor);

        // Tactical earpieces / communicator
        const leftEar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 6), darkArmorMat);
        leftEar.rotation.z = Math.PI / 2;
        leftEar.position.set(-0.19, 0.15, 0);
        headPivot.add(leftEar);
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.19;
        headPivot.add(rightEar);

        // ── LEFT ARM ────────────────────────────────────────────────
        const leftShoulderPivot = new THREE.Group();
        leftShoulderPivot.position.set(-0.35, 0.48, 0);
        torso.add(leftShoulderPivot);

        // Pauldron (Shoulder pad)
        const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), armorMat);
        leftPauldron.position.set(-0.02, 0, 0);
        leftShoulderPivot.add(leftPauldron);

        // Upper Arm
        const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.28, 6), darkArmorMat);
        leftUpperArm.position.set(0, -0.16, 0);
        leftUpperArm.castShadow = true;
        leftShoulderPivot.add(leftUpperArm);

        // Elbow Pivot
        const leftElbowPivot = new THREE.Group();
        leftElbowPivot.position.set(0, -0.30, 0);
        leftShoulderPivot.add(leftElbowPivot);

        // Forearm with Gauntlet
        const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.26, 6), armorMat);
        leftForearm.position.set(0, -0.14, 0);
        leftForearm.castShadow = true;
        leftElbowPivot.add(leftForearm);

        // Glove/Hand
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.09), darkArmorMat);
        leftHand.position.set(0, -0.30, 0);
        leftElbowPivot.add(leftHand);

        // ── RIGHT ARM ───────────────────────────────────────────────
        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.position.set(0.35, 0.48, 0);
        torso.add(rightShoulderPivot);

        const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), armorMat);
        rightPauldron.position.set(0.02, 0, 0);
        rightShoulderPivot.add(rightPauldron);

        const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.28, 6), darkArmorMat);
        rightUpperArm.position.set(0, -0.16, 0);
        rightUpperArm.castShadow = true;
        rightShoulderPivot.add(rightUpperArm);

        const rightElbowPivot = new THREE.Group();
        rightElbowPivot.position.set(0, -0.30, 0);
        rightShoulderPivot.add(rightElbowPivot);

        const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.26, 6), armorMat);
        rightForearm.position.set(0, -0.14, 0);
        rightForearm.castShadow = true;
        rightElbowPivot.add(rightForearm);

        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.09), darkArmorMat);
        rightHand.position.set(0, -0.30, 0);
        rightElbowPivot.add(rightHand);

        // ── WEAPON (TACTICAL ASSAULT RIFLE) ─────────────────────────
        const weapon = this.createDetailedRifle();
        weapon.position.set(0, -0.05, 0.15);
        weapon.rotation.x = -Math.PI / 12;
        rightHand.add(weapon);

        // ── LEFT LEG ────────────────────────────────────────────────
        const leftHipPivot = new THREE.Group();
        leftHipPivot.position.set(-0.16, -0.06, 0);
        pelvisGroup.add(leftHipPivot);

        const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.38, 8), darkArmorMat);
        leftThigh.position.set(0, -0.20, 0);
        leftThigh.castShadow = true;
        leftHipPivot.add(leftThigh);

        // Thigh armor plate
        const leftThighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.06), armorMat);
        leftThighPlate.position.set(0, -0.18, 0.09);
        leftHipPivot.add(leftThighPlate);

        const leftKneePivot = new THREE.Group();
        leftKneePivot.position.set(0, -0.40, 0);
        leftHipPivot.add(leftKneePivot);

        // Knee Pad
        const leftKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.08), armorMat);
        leftKneePad.position.set(0, 0, 0.08);
        leftKneePivot.add(leftKneePad);

        const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 8), darkArmorMat);
        leftShin.position.set(0, -0.20, 0);
        leftShin.castShadow = true;
        leftKneePivot.add(leftShin);

        const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.26), armorMat);
        leftBoot.position.set(0, -0.40, 0.04);
        leftBoot.castShadow = true;
        leftKneePivot.add(leftBoot);

        // ── RIGHT LEG ───────────────────────────────────────────────
        const rightHipPivot = new THREE.Group();
        rightHipPivot.position.set(0.16, -0.06, 0);
        pelvisGroup.add(rightHipPivot);

        const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.38, 8), darkArmorMat);
        rightThigh.position.set(0, -0.20, 0);
        rightThigh.castShadow = true;
        rightHipPivot.add(rightThigh);

        const rightThighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.06), armorMat);
        rightThighPlate.position.set(0, -0.18, 0.09);
        rightHipPivot.add(rightThighPlate);

        const rightKneePivot = new THREE.Group();
        rightKneePivot.position.set(0, -0.40, 0);
        rightHipPivot.add(rightKneePivot);

        const rightKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.08), armorMat);
        rightKneePad.position.set(0, 0, 0.08);
        rightKneePivot.add(rightKneePad);

        const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 8), darkArmorMat);
        rightShin.position.set(0, -0.20, 0);
        rightShin.castShadow = true;
        rightKneePivot.add(rightShin);

        const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.26), armorMat);
        rightBoot.position.set(0, -0.40, 0.04);
        rightBoot.castShadow = true;
        rightKneePivot.add(rightBoot);

        // Store rig references for procedural animator
        root.userData.rig = {
            pelvis: pelvisGroup,
            torso,
            head: headPivot,
            leftShoulder: leftShoulderPivot,
            leftElbow: leftElbowPivot,
            rightShoulder: rightShoulderPivot,
            rightElbow: rightElbowPivot,
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

    /**
     * Builds a detailed stylized combat enemy bot / cyborg.
     * @returns {THREE.Group}
     */
    static createEnemyBot() {
        const root = new THREE.Group();
        root.userData.isEnemy = true;

        const chassisMat = new StylizedPBRMaterial({
            baseColor: 0x991b1b,     // Menacing crimson red
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

        // Pelvis
        const pelvis = new THREE.Group();
        pelvis.position.set(0, 0.95, 0);
        root.add(pelvis);

        const hipBlock = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.24), darkMetalMat);
        pelvis.add(hipBlock);

        // Torso
        const torso = new THREE.Group();
        torso.position.set(0, 0.12, 0);
        pelvis.add(torso);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.38, 0.32), chassisMat);
        chest.position.set(0, 0.35, 0);
        chest.castShadow = true;
        torso.add(chest);

        // Core power glow in chest
        const coreLight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 6), redGlow);
        coreLight.rotation.x = Math.PI / 2;
        coreLight.position.set(0, 0.36, 0.18);
        torso.add(coreLight);

        // Head (Angular combat drone skull)
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.65, 0);
        torso.add(headPivot);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.34), darkMetalMat);
        head.position.set(0, 0.15, 0);
        head.castShadow = true;
        headPivot.add(head);

        // Red slit ocular sensor
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.06), redGlow);
        eye.position.set(0, 0.16, 0.18);
        headPivot.add(eye);

        // Arms & Weapon
        const leftArm = new THREE.Group();
        leftArm.position.set(-0.35, 0.44, 0);
        torso.add(leftArm);
        const lMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.14), darkMetalMat);
        lMesh.position.set(0, -0.24, 0);
        leftArm.add(lMesh);

        const rightArm = new THREE.Group();
        rightArm.position.set(0.35, 0.44, 0);
        torso.add(rightArm);
        const rMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.14), darkMetalMat);
        rMesh.position.set(0, -0.24, 0);
        rightArm.add(rMesh);

        const enemyGun = this.createDetailedRifle(true);
        enemyGun.position.set(0, -0.42, 0.15);
        rightArm.add(enemyGun);

        // Legs
        const leftHip = new THREE.Group();
        leftHip.position.set(-0.15, -0.06, 0);
        pelvis.add(leftHip);
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.16), chassisMat);
        lLeg.position.set(0, -0.40, 0);
        lLeg.castShadow = true;
        leftHip.add(lLeg);

        const rightHip = new THREE.Group();
        rightHip.position.set(0.15, -0.06, 0);
        pelvis.add(rightHip);
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.16), chassisMat);
        rLeg.position.set(0, -0.40, 0);
        rLeg.castShadow = true;
        rightHip.add(rLeg);

        root.userData.rig = {
            pelvis,
            torso,
            head: headPivot,
            leftShoulder: leftArm,
            rightShoulder: rightArm,
            leftHip,
            rightHip,
            weapon: enemyGun,
            animTimer: Math.random() * 10
        };

        return root;
    }

    /**
     * Builds a detailed 3D assault rifle with holographic sight, magazine, and muzzle.
     * @param {boolean} isEnemy
     * @returns {THREE.Group}
     */
    static createDetailedRifle(isEnemy = false) {
        const rifle = new THREE.Group();

        const gunMat = new THREE.MeshStandardMaterial({
            color: isEnemy ? 0x242428 : 0x1e293b,
            metalness: 0.85,
            roughness: 0.25
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: isEnemy ? 0xef4444 : 0x3b82f6,
            metalness: 0.4,
            roughness: 0.4
        });

        const holoMat = new THREE.MeshBasicMaterial({
            color: isEnemy ? 0xff2222 : 0x10b981,
            transparent: true,
            opacity: 0.85
        });

        // Receiver (Main body)
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.46), gunMat);
        rifle.add(receiver);

        // Handguard (Front barrel shroud)
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.32), accentMat);
        handguard.position.set(0, 0.01, 0.35);
        rifle.add(handguard);

        // Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), gunMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, 0.60);
        rifle.add(barrel);

        // Flash Hider / Muzzle
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.08, 6), gunMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.02, 0.78);
        rifle.add(muzzle);

        // Curved Magazine
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.12), gunMat);
        mag.position.set(0, -0.15, 0.12);
        mag.rotation.x = 0.2;
        rifle.add(mag);

        // Pistol Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), accentMat);
        grip.position.set(0, -0.12, -0.10);
        grip.rotation.x = -0.3;
        rifle.add(grip);

        // Stock (Coronha tática)
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.28), darkGunMat(isEnemy));
        stock.position.set(0, 0.02, -0.32);
        rifle.add(stock);

        // Holographic Sight (Mira holográfica)
        const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.12), gunMat);
        sightBase.position.set(0, 0.09, 0.05);
        rifle.add(sightBase);

        const sightLens = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), holoMat);
        sightLens.position.set(0, 0.12, 0.05);
        rifle.add(sightLens);

        return rifle;

        function darkGunMat(enemy) {
            return new THREE.MeshStandardMaterial({
                color: enemy ? 0x111115 : 0x0f172a,
                roughness: 0.6
            });
        }
    }

    /**
     * Updates procedural animations for locomotion, swimming, idle, and combat.
     * @param {THREE.Group} model
     * @param {string} state
     * @param {number} dt
     * @param {number} speed
     */
    static updateAnimation(model, state, dt, speed = 1.0) {
        const rig = model?.userData?.rig;
        if (!rig) return;

        rig.animTimer += dt * (state === 'SPRINTING' ? 12 : state === 'SWIMMING' ? 6 : 7);
        const t = rig.animTimer;

        // Reset poses smoothly
        const lerpFactor = dt * 10;

        if (state === 'SWIMMING') {
            // ── SWIMMING POSE & MOTION ──────────────────────────────
            // Body tilted forward floating on water surface
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, 1.15, lerpFactor);
            rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0.25, lerpFactor);
            // Head lifted up out of water
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, -0.9, lerpFactor);

            // Breaststroke arm circles
            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = Math.sin(t) * 0.8 + 0.3;
                rig.leftShoulder.rotation.z = -Math.cos(t) * 0.5 - 0.4;
            }
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = Math.sin(t) * 0.8 + 0.3;
                rig.rightShoulder.rotation.z = Math.cos(t) * 0.5 + 0.4;
            }

            // Flutter kicking legs
            if (rig.leftHip) {
                rig.leftHip.rotation.x = Math.sin(t * 1.5) * 0.45;
            }
            if (rig.rightHip) {
                rig.rightHip.rotation.x = -Math.sin(t * 1.5) * 0.45;
            }
            if (rig.leftKnee) rig.leftKnee.rotation.x = Math.max(0, -Math.sin(t * 1.5)) * 0.4;
            if (rig.rightKnee) rig.rightKnee.rotation.x = Math.max(0, Math.sin(t * 1.5)) * 0.4;

        } else if (state === 'WALKING' || state === 'SPRINTING') {
            // ── WALKING & SPRINTING CYCLE ───────────────────────────
            const stride = state === 'SPRINTING' ? 0.75 : 0.50;
            const tilt = state === 'SPRINTING' ? 0.22 : 0.08;

            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, tilt, lerpFactor);
            rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0, lerpFactor);
            rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, 0, lerpFactor);

            // Alternating legs with natural knee bending
            const legSwing = Math.sin(t) * stride;
            if (rig.leftHip) rig.leftHip.rotation.x = legSwing;
            if (rig.rightHip) rig.rightHip.rotation.x = -legSwing;

            if (rig.leftKnee) rig.leftKnee.rotation.x = Math.max(0, -legSwing * 1.1);
            if (rig.rightKnee) rig.rightKnee.rotation.x = Math.max(0, legSwing * 1.1);

            // Counter arm motion with gun held at ready
            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = -legSwing * 0.4 - 0.5;
                rig.leftShoulder.rotation.y = 0.2;
            }
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = legSwing * 0.3 - 0.6;
                rig.rightShoulder.rotation.y = -0.2;
            }

            // Slight torso bob
            rig.pelvis.position.y = 0.95 + Math.abs(Math.sin(t)) * 0.05;

        } else if (state === 'SLIDING') {
            // ── SLIDING POSE ────────────────────────────────────────
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, -0.7, lerpFactor);
            rig.pelvis.position.y = 0.55;
            if (rig.leftHip) rig.leftHip.rotation.x = -1.1;
            if (rig.rightHip) rig.rightHip.rotation.x = 0.6;
            if (rig.rightKnee) rig.rightKnee.rotation.x = 1.2;

        } else {
            // ── IDLE POSE ───────────────────────────────────────────
            const breath = Math.sin(t * 0.3) * 0.03;
            rig.pelvis.rotation.x = THREE.MathUtils.lerp(rig.pelvis.rotation.x, 0, lerpFactor);
            rig.pelvis.position.y = THREE.MathUtils.lerp(rig.pelvis.position.y, 0.95, lerpFactor);
            rig.torso.rotation.x = breath;
            rig.head.rotation.x = -breath * 0.5;

            // Natural weapon ready posture
            if (rig.rightShoulder) {
                rig.rightShoulder.rotation.x = THREE.MathUtils.lerp(rig.rightShoulder.rotation.x, -0.65, lerpFactor);
                rig.rightShoulder.rotation.y = THREE.MathUtils.lerp(rig.rightShoulder.rotation.y, -0.25, lerpFactor);
                rig.rightShoulder.rotation.z = THREE.MathUtils.lerp(rig.rightShoulder.rotation.z, 0.08, lerpFactor);
            }
            if (rig.leftShoulder) {
                rig.leftShoulder.rotation.x = THREE.MathUtils.lerp(rig.leftShoulder.rotation.x, -0.55, lerpFactor);
                rig.leftShoulder.rotation.y = THREE.MathUtils.lerp(rig.leftShoulder.rotation.y, 0.35, lerpFactor);
                rig.leftShoulder.rotation.z = THREE.MathUtils.lerp(rig.leftShoulder.rotation.z, -0.1, lerpFactor);
            }

            if (rig.leftHip) rig.leftHip.rotation.x = THREE.MathUtils.lerp(rig.leftHip.rotation.x, 0, lerpFactor);
            if (rig.rightHip) rig.rightHip.rotation.x = THREE.MathUtils.lerp(rig.rightHip.rotation.x, 0, lerpFactor);
            if (rig.leftKnee) rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, 0, lerpFactor);
            if (rig.rightKnee) rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, 0, lerpFactor);
        }

        // Weapon recoil kickback recovery
        if (rig.weapon) {
            rig.weapon.position.z = THREE.MathUtils.lerp(rig.weapon.position.z, 0.15, dt * 15);
        }
    }

    /**
     * Triggers a momentary recoil impulse on the weapon.
     * @param {THREE.Group} model
     */
    static triggerRecoil(model) {
        const rig = model?.userData?.rig;
        if (rig?.weapon) {
            rig.weapon.position.z -= 0.14;
        }
    }
}
