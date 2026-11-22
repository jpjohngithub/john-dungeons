import * as THREE from 'three';

/**
 * CharacterModel — Sculpted Stylized AAA Hero & Bot Models + Biomechanical Procedural Rig
 * Coordinate conventions:
 * - Feet soles rest at y = 0.0
 * - Forward direction is +Z
 */
export class CharacterModel {
    static createHero({ characterType = 'CYBER_STRIKER' } = {}) {
        if (characterType === 'TITAN_BRAWLER') return this.createTitanBrawler();
        if (characterType === 'GHOST_RECON') return this.createGhostRecon();
        return this.createCyberStriker();
    }

    static _mat(color, metalness = 0.55, roughness = 0.35, emissive = 0x000000, emissiveIntensity = 0) {
        return new THREE.MeshStandardMaterial({
            color,
            metalness,
            roughness,
            emissive,
            emissiveIntensity
        });
    }

    static _glowMat(color, intensity = 1.6) {
        return new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: intensity,
            roughness: 0.2,
            metalness: 0.1
        });
    }

    // ─── BASE SCULPTED HUMANOID RIG BUILDER ──────────────────────────
    static _buildBaseRig(config) {
        const root = new THREE.Group();
        const scale = config.scale || 1.0;

        const matPrimary = this._mat(config.primary, config.primaryMetal ?? 0.5, config.primaryRough ?? 0.32);
        const matSecondary = this._mat(config.secondary, 0.72, 0.28);
        const matSuit = this._mat(config.suit, 0.25, 0.65);
        const matAccent = this._glowMat(config.accent, 1.8);
        const matJoint = this._mat(0x1e293b, 0.85, 0.25);

        const bodyPivot = new THREE.Group();
        bodyPivot.scale.setScalar(scale);
        root.add(bodyPivot);

        // Hips / Pelvis (y = 0.94 so legs of length 0.94 touch y = 0.0 exactly)
        const hips = new THREE.Group();
        hips.position.set(0, 0.94, 0);
        bodyPivot.add(hips);

        const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * config.width, 0.14 * config.width, 0.18, 12), matSuit);
        pelvis.castShadow = true;
        hips.add(pelvis);

        // Tactical Belt
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.175 * config.width, 0.175 * config.width, 0.06, 12), matSecondary);
        belt.position.y = 0.06;
        hips.add(belt);
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 0.04), matAccent);
        buckle.position.set(0, 0.06, 0.165 * config.width);
        hips.add(buckle);

        // Spine & Torso
        const torso = new THREE.Group();
        torso.position.set(0, 0.1, 0);
        hips.add(torso);

        // Abdomen
        const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * config.width, 0.135 * config.width, 0.22, 12), matSuit);
        abdomen.position.y = 0.11;
        abdomen.castShadow = true;
        torso.add(abdomen);

        // Chest Armor (sculpted tapered cylinder + angled chest plate)
        const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * config.width, 0.16 * config.width, 0.32, 10), matPrimary);
        chest.scale.set(1.05, 1.0, 0.78);
        chest.position.y = 0.34;
        chest.castShadow = true;
        torso.add(chest);

        const chestFront = new THREE.Mesh(new THREE.BoxGeometry(0.32 * config.width, 0.24, 0.09), matPrimary);
        chestFront.position.set(0, 0.36, 0.14 * config.width);
        chestFront.rotation.x = -0.1;
        chestFront.castShadow = true;
        torso.add(chestFront);

        // Collar
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.115 * config.width, 0.032, 8, 16), matSecondary);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 0.51;
        torso.add(collar);

        // Head Group
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.53, 0);
        torso.add(headGroup);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.09, 10), matJoint);
        neck.position.y = 0.04;
        headGroup.add(neck);

        // Legs builder
        const buildLeg = (side) => {
            const hipX = side * 0.115 * config.width;
            const hipJoint = new THREE.Group();
            hipJoint.position.set(hipX, -0.05, 0);
            hips.add(hipJoint);

            const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), matJoint);
            hipJoint.add(hipBall);

            // Thigh
            const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.072 * config.legThick, 0.28, 6, 10), matSuit);
            thigh.position.y = -0.21;
            thigh.castShadow = true;
            hipJoint.add(thigh);

            // Thigh Armor Plate
            const thighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.13 * config.legThick, 0.24, 0.15 * config.legThick), matPrimary);
            thighPlate.position.set(side * 0.015, -0.2, 0.015);
            thighPlate.castShadow = true;
            hipJoint.add(thighPlate);

            // Knee Joint
            const kneeJoint = new THREE.Group();
            kneeJoint.position.set(0, -0.43, 0);
            hipJoint.add(kneeJoint);

            const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.068 * config.legThick, 10, 10), matSecondary);
            kneeCap.position.set(0, 0, 0.035);
            kneeJoint.add(kneeCap);

            // Shin / Greave
            const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.068 * config.legThick, 0.054 * config.legThick, 0.36, 10), matPrimary);
            shin.position.y = -0.2;
            shin.castShadow = true;
            kneeJoint.add(shin);

            const shinAccent = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.03), matAccent);
            shinAccent.position.set(0, -0.18, 0.065 * config.legThick);
            kneeJoint.add(shinAccent);

            // Tactical Boot (bottom at y = -0.46 relative to knee -> total y = 0.94 - 0.05 - 0.43 - 0.46 = 0.00!)
            const foot = new THREE.Group();
            foot.position.set(0, -0.4, 0);
            kneeJoint.add(foot);

            const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.125 * config.legThick, 0.06, 0.24), matSecondary);
            bootSole.position.set(0, -0.03, 0.045);
            bootSole.castShadow = true;
            foot.add(bootSole);

            const bootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.115 * config.legThick, 0.075, 0.18), matPrimary);
            bootUpper.position.set(0, 0.02, 0.025);
            foot.add(bootUpper);

            return { hip: hipJoint, knee: kneeJoint, foot };
        };

        const leftLeg = buildLeg(-1);
        const rightLeg = buildLeg(1);

        // Arms builder
        const buildArm = (side) => {
            const shX = side * 0.26 * config.width;
            const shoulder = new THREE.Group();
            shoulder.position.set(shX, 0.44, 0);
            torso.add(shoulder);

            const shBall = new THREE.Mesh(new THREE.SphereGeometry(0.07 * config.armThick, 10, 10), matJoint);
            shoulder.add(shBall);

            // Sculpted Pauldron
            const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.105 * config.armThick, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), matPrimary);
            pauldron.rotation.z = -side * 0.45;
            pauldron.position.set(side * 0.02, 0.03, 0);
            pauldron.castShadow = true;
            shoulder.add(pauldron);

            // Upper arm
            const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055 * config.armThick, 0.2, 6, 10), matSuit);
            upperArm.position.y = -0.15;
            upperArm.castShadow = true;
            shoulder.add(upperArm);

            // Elbow
            const elbow = new THREE.Group();
            elbow.position.set(0, -0.29, 0);
            shoulder.add(elbow);

            const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.052 * config.armThick, 8, 8), matJoint);
            elbow.add(elbowJoint);

            // Forearm gauntlet
            const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058 * config.armThick, 0.048 * config.armThick, 0.24, 10), matPrimary);
            forearm.position.y = -0.13;
            forearm.castShadow = true;
            elbow.add(forearm);

            // Hand
            const hand = new THREE.Group();
            hand.position.set(0, -0.27, 0);
            elbow.add(hand);

            const glove = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.085), matSecondary);
            glove.castShadow = true;
            hand.add(glove);

            return { shoulder, elbow, hand };
        };

        const leftArm = buildArm(-1);
        const rightArm = buildArm(1);

        root.userData.rig = {
            bodyPivot,
            hips,
            torso,
            head: headGroup,
            leftHip: leftLeg.hip,
            leftKnee: leftLeg.knee,
            rightHip: rightLeg.hip,
            rightKnee: rightLeg.knee,
            leftShoulder: leftArm.shoulder,
            leftElbow: leftArm.elbow,
            leftHand: leftArm.hand,
            rightShoulder: rightArm.shoulder,
            rightElbow: rightArm.elbow,
            rightHand: rightArm.hand,
            wings: null,
            weapon: null,
            recoilOffset: 0,
            animTime: 0,
            baseHipsY: 0.94
        };

        return { root, rig: root.userData.rig, mats: { matPrimary, matSecondary, matSuit, matAccent, matJoint } };
    }

    // ─── 1. CYBER-STRIKER (VALKYRIE TECH) ────────────────────────────
    static createCyberStriker() {
        const { root, rig, mats } = this._buildBaseRig({
            primary: 0xf1f5f9,
            secondary: 0x1e293b,
            suit: 0x0f172a,
            accent: 0x00f0ff,
            scale: 1.0,
            width: 1.0,
            legThick: 1.0,
            armThick: 1.0
        });

        // Aerodynamic Helmet
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), mats.matPrimary);
        helmet.scale.set(0.95, 1.08, 1.1);
        helmet.position.set(0, 0.16, 0.01);
        helmet.castShadow = true;
        rig.head.add(helmet);

        // Curved Glowing Visor
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.132, 0.085, 16, 1, true, -Math.PI * 0.36, Math.PI * 0.72), mats.matAccent);
        visor.position.set(0, 0.165, 0.025);
        rig.head.add(visor);

        // Side Fin Antennas
        for (const s of [-1, 1]) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.06), mats.matSecondary);
            fin.position.set(s * 0.145, 0.21, -0.02);
            fin.rotation.x = -0.35;
            rig.head.add(fin);
        }

        // Chest Energy Core
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), mats.matAccent);
        core.position.set(0, 0.36, 0.195);
        rig.torso.add(core);

        // Articulated Jet Wings Backpack
        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 0.38, -0.15);
        rig.torso.add(wingsGroup);

        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.12), mats.matSecondary);
        pack.castShadow = true;
        wingsGroup.add(pack);

        const leftWing = new THREE.Group();
        leftWing.position.set(-0.11, 0.06, -0.03);
        const rightWing = new THREE.Group();
        rightWing.position.set(0.11, 0.06, -0.03);

        for (const [wg, s] of [[leftWing, -1], [rightWing, 1]]) {
            const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.025), mats.matPrimary);
            blade1.position.set(s * 0.24, 0.06, -0.02);
            blade1.rotation.z = s * 0.25;
            blade1.castShadow = true;
            wg.add(blade1);

            const glowEdge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.03), mats.matAccent);
            glowEdge.position.set(s * 0.24, 0.015, -0.02);
            glowEdge.rotation.z = s * 0.25;
            wg.add(glowEdge);

            const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.065, 0.022), mats.matSecondary);
            blade2.position.set(s * 0.18, -0.05, -0.03);
            blade2.rotation.z = s * 0.1;
            wg.add(blade2);

            wingsGroup.add(wg);
        }
        rig.wings = { left: leftWing, right: rightWing };

        // Left Hand Plasma Emitter Ring
        const emitter = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.016, 8, 16), mats.matAccent);
        emitter.rotation.x = Math.PI / 2;
        emitter.position.set(0, 0.02, 0);
        rig.leftHand.add(emitter);

        // Tactical Assault Rifle
        const rifle = this._createAssaultRifle(0x00f0ff);
        rig.rightHand.add(rifle);
        rig.weapon = rifle;
        root.userData.characterType = 'CYBER_STRIKER';
        return root;
    }

    // ─── 2. TITAN BRAWLER (HEAVY EXO-MECH) ───────────────────────────
    static createTitanBrawler() {
        const { root, rig, mats } = this._buildBaseRig({
            primary: 0xea580c,
            secondary: 0x1e293b,
            suit: 0x334155,
            accent: 0xfbbf24,
            scale: 1.14,
            width: 1.24,
            legThick: 1.25,
            armThick: 1.28
        });

        // Juggernaut Armored Dome Helmet
        const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.24, 10), mats.matPrimary);
        helm.position.set(0, 0.15, 0);
        helm.castShadow = true;
        rig.head.add(helm);

        const helmTop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.matSecondary);
        helmTop.position.set(0, 0.27, 0);
        rig.head.add(helmTop);

        // T-Visor
        const visorH = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.04), mats.matAccent);
        visorH.position.set(0, 0.17, 0.145);
        rig.head.add(visorH);
        const visorV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.04), mats.matAccent);
        visorV.position.set(0, 0.125, 0.148);
        rig.head.add(visorV);

        // Heavy Arc Reactor Chest
        const reactorRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 18), mats.matSecondary);
        reactorRing.position.set(0, 0.36, 0.215);
        rig.torso.add(reactorRing);
        const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.03, 16), mats.matAccent);
        reactorCore.rotation.x = Math.PI / 2;
        reactorCore.position.set(0, 0.36, 0.21);
        rig.torso.add(reactorCore);

        // Dual Shoulder Micro-Missile Pods
        const warheadMat = this._glowMat(0xef4444, 1.4);
        for (const s of [-1, 1]) {
            const pod = new THREE.Group();
            pod.position.set(s * 0.34, 0.57, -0.02);
            const podBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), mats.matSecondary);
            podBox.castShadow = true;
            pod.add(podBox);

            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 2; c++) {
                    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.05, 8), warheadMat);
                    tip.rotation.x = Math.PI / 2;
                    tip.position.set((c - 0.5) * 0.07, (r - 0.5) * 0.065, 0.12);
                    pod.add(tip);
                }
            }
            rig.torso.add(pod);
        }

        // Back Hydraulic Reactor Pack
        const backPack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.18), mats.matSecondary);
        backPack.position.set(0, 0.34, -0.19);
        backPack.castShadow = true;
        rig.torso.add(backPack);

        // Heavy Rotary Autocannon
        const cannon = this._createHeavyCannon();
        rig.rightHand.add(cannon);
        rig.weapon = cannon;
        root.userData.characterType = 'TITAN_BRAWLER';
        return root;
    }

    // ─── 3. GHOST RECON (CYBER-SHINOBI) ──────────────────────────────
    static createGhostRecon() {
        const { root, rig, mats } = this._buildBaseRig({
            primary: 0x18181b,
            secondary: 0x27272a,
            suit: 0x09090b,
            accent: 0xef4444,
            scale: 0.98,
            width: 0.92,
            legThick: 0.92,
            armThick: 0.92
        });

        // Sleek Ninja Hood / Helmet
        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.142, 16, 14), mats.matPrimary);
        hood.scale.set(0.94, 1.06, 1.08);
        hood.position.set(0, 0.16, 0);
        hood.castShadow = true;
        rig.head.add(hood);

        // Cyber Oni Horns
        for (const s of [-1, 1]) {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.12, 6), mats.matAccent);
            horn.position.set(s * 0.08, 0.28, 0.05);
            horn.rotation.z = -s * 0.35;
            horn.rotation.x = 0.2;
            rig.head.add(horn);
        }

        // Glowing Red Tactical Eyes
        for (const s of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.018, 0.02), mats.matAccent);
            eye.position.set(s * 0.048, 0.175, 0.14);
            eye.rotation.z = -s * 0.22;
            rig.head.add(eye);
        }

        // Tactical Scarf
        const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.036, 8, 16), this._mat(0x991b1b, 0.2, 0.8));
        scarf.rotation.x = Math.PI / 2;
        scarf.position.y = 0.51;
        rig.torso.add(scarf);

        const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.025), this._mat(0x991b1b, 0.2, 0.8));
        scarfTail.position.set(0.06, 0.28, -0.17);
        scarfTail.rotation.x = 0.18;
        rig.torso.add(scarfTail);

        // Dual Crossed Energy Katanas on Back
        const bladeGlow = this._glowMat(0xef4444, 2.0);
        for (const s of [-1, 1]) {
            const katana = new THREE.Group();
            katana.position.set(0, 0.34, -0.15);
            katana.rotation.z = s * 0.62;

            const sheath = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.78, 0.018), mats.matSecondary);
            katana.add(sheath);
            const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.72, 0.022), bladeGlow);
            edge.position.x = s * 0.012;
            katana.add(edge);
            const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), mats.matPrimary);
            hilt.position.y = 0.48;
            katana.add(hilt);
            const guard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.04), mats.matAccent);
            guard.position.y = 0.38;
            katana.add(guard);

            rig.torso.add(katana);
        }

        // Stealth Silenced SMG
        const smg = this._createStealthSMG();
        rig.rightHand.add(smg);
        rig.weapon = smg;
        root.userData.characterType = 'GHOST_RECON';
        return root;
    }

    // ─── ENEMY COMBAT BOT ────────────────────────────────────────────
    static createEnemyBot() {
        const { root, rig, mats } = this._buildBaseRig({
            primary: 0x3f3f46,
            secondary: 0x18181b,
            suit: 0x27272a,
            accent: 0xff2a55,
            scale: 1.0,
            width: 0.98,
            legThick: 0.96,
            armThick: 0.96
        });

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.24), mats.matPrimary);
        head.position.set(0, 0.16, 0);
        head.castShadow = true;
        rig.head.add(head);

        const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.03), mats.matAccent);
        eyeBar.position.set(0, 0.17, 0.125);
        rig.head.add(eyeBar);

        const rifle = this._createAssaultRifle(0xff2a55);
        rig.rightHand.add(rifle);
        rig.weapon = rifle;
        root.userData.characterType = 'ENEMY_BOT';
        return root;
    }

    // ─── WEAPONS (ALIGNED FORWARD ALONG +Z WHEN ARM POINTS DOWN/FWD) ─
    static _createAssaultRifle(glowColor) {
        const g = new THREE.Group();
        // Oriented so when rightElbow bends forward (-PI/2), barrel points strictly along +Z
        g.position.set(0, -0.02, 0.05);
        g.rotation.x = Math.PI / 2;

        const dark = this._mat(0x1e293b, 0.85, 0.25);
        const bodyMat = this._mat(0x475569, 0.7, 0.35);
        const glow = this._glowMat(glowColor, 1.8);

        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.42), bodyMat);
        receiver.position.set(0, 0.03, 0.14);
        receiver.castShadow = true;
        g.add(receiver);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.34, 8), dark);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.045, 0.46);
        g.add(barrel);

        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.018, 0.28), glow);
        strip.position.set(0, 0.05, 0.18);
        g.add(strip);

        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.15, 0.07), dark);
        mag.position.set(0, -0.07, 0.18);
        mag.rotation.x = 0.2;
        g.add(mag);

        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.095, 0.18), dark);
        stock.position.set(0, 0.01, -0.12);
        g.add(stock);

        const scope = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.12), dark);
        scope.position.set(0, 0.11, 0.12);
        g.add(scope);

        return g;
    }

    static _createHeavyCannon() {
        const g = new THREE.Group();
        g.position.set(0, -0.02, 0.06);
        g.rotation.x = Math.PI / 2;

        const dark = this._mat(0x0f172a, 0.85, 0.25);
        const orange = this._mat(0xea580c, 0.6, 0.35);
        const glow = this._glowMat(0xfbbf24, 1.8);

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.44), orange);
        chassis.position.set(0, 0.03, 0.18);
        chassis.castShadow = true;
        g.add(chassis);

        // 3 Rotary Barrels
        for (let i = 0; i < 3; i++) {
            const ang = (i / 3) * Math.PI * 2;
            const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 8), dark);
            b.rotation.x = Math.PI / 2;
            b.position.set(Math.cos(ang) * 0.035, 0.04 + Math.sin(ang) * 0.035, 0.56);
            g.add(b);
        }

        const barrelClamp = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 12), glow);
        barrelClamp.rotation.x = Math.PI / 2;
        barrelClamp.position.set(0, 0.04, 0.66);
        g.add(barrelClamp);

        return g;
    }

    static _createStealthSMG() {
        const g = new THREE.Group();
        g.position.set(0, -0.02, 0.04);
        g.rotation.x = Math.PI / 2;

        const black = this._mat(0x18181b, 0.8, 0.3);
        const glow = this._glowMat(0xef4444, 1.8);

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.09, 0.32), black);
        body.position.set(0, 0.025, 0.12);
        g.add(body);

        const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.24, 10), black);
        suppressor.rotation.x = Math.PI / 2;
        suppressor.position.set(0, 0.035, 0.38);
        g.add(suppressor);

        const laser = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.09), glow);
        laser.position.set(0.032, 0.02, 0.22);
        g.add(laser);

        return g;
    }

    // ─── RECOIL & BIOMECHANICAL ANIMATION ENGINE ─────────────────────
    static triggerRecoil(model) {
        if (model?.userData?.rig) {
            model.userData.rig.recoilOffset = 0.18;
        }
    }

    static updateAnimation(model, state, dt, speedScale = 1.0) {
        const rig = model?.userData?.rig;
        if (!rig) return;

        rig.animTime += dt * speedScale;
        const t = rig.animTime;
        const lerp = Math.min(1, dt * 12);

        // Recoil recovery
        if (rig.recoilOffset > 0) {
            rig.recoilOffset = Math.max(0, rig.recoilOffset - dt * 1.4);
        }

        // Target transforms
        let hipsY = rig.baseHipsY;
        let hipsRotX = 0;
        let torsoRotX = 0;
        let torsoRotY = 0;
        let lHipX = 0, rHipX = 0, lKneeX = 0, rKneeX = 0;
        let lShX = 0, rShX = 0, lElbX = 0, rElbX = 0;
        let lShZ = 0.12, rShZ = -0.12;
        let wingSpread = 0.0;

        if (state === 'LOBBY_IDLE') {
            // Confident Heroic Stance
            hipsY = rig.baseHipsY + Math.sin(t * 2.2) * 0.012;
            torsoRotY = -0.12;
            torsoRotX = Math.sin(t * 2.2) * 0.02;
            lHipX = -0.06; rHipX = 0.08;
            lKneeX = 0.08; rKneeX = 0.06;
            // Right arm holding weapon in low-ready hero pose
            rShX = -0.55; rElbX = -0.75; rShZ = -0.15;
            lShX = 0.12; lElbX = -0.35; lShZ = 0.18;
            wingSpread = 0.2 + Math.sin(t * 1.8) * 0.05;
        } else if (state === 'WALKING' || state === 'SPRINTING') {
            const isSprint = state === 'SPRINTING';
            const freq = isSprint ? 11.5 : 7.5;
            const amp = isSprint ? 0.85 : 0.48;
            const s = Math.sin(t * freq);
            const c = Math.cos(t * freq);

            hipsY = rig.baseHipsY + Math.abs(c) * (isSprint ? 0.065 : 0.03) - (isSprint ? 0.04 : 0.01);
            torsoRotX = isSprint ? 0.24 : 0.08;
            torsoRotY = -s * 0.12;

            lHipX = s * amp;
            rHipX = -s * amp;
            lKneeX = Math.max(0, -c * amp * 1.15);
            rKneeX = Math.max(0, c * amp * 1.15);

            // Weapon ready aim while moving
            rShX = -1.15 + s * 0.08 - rig.recoilOffset;
            rElbX = -0.42;
            rShZ = -0.06;

            lShX = isSprint ? -s * 0.65 : -0.45 - s * 0.2;
            lElbX = -0.65;
            wingSpread = isSprint ? 0.35 : 0.12;
        } else if (state === 'JUMPING' || state === 'FALLING') {
            hipsY = rig.baseHipsY + 0.04;
            torsoRotX = 0.15;
            lHipX = -0.75; lKneeX = 1.15;
            rHipX = 0.35; rKneeX = 0.45;
            rShX = -1.15 - rig.recoilOffset; rElbX = -0.45;
            lShX = -0.6; lElbX = -0.5; lShZ = 0.45;
            wingSpread = 0.55;
        } else if (state === 'SLIDING') {
            // Low tactical baseball/apex slide
            hipsY = 0.44;
            hipsRotX = -0.82;
            torsoRotX = 0.35;
            lHipX = -0.45; lKneeX = 0.15; // extended front leg
            rHipX = 0.35; rKneeX = 1.45;  // tucked back leg
            rShX = -1.05 - rig.recoilOffset; rElbX = -0.45;
            lShX = 0.5; lElbX = -0.3; lShZ = 0.4;
        } else if (state === 'FLYING') {
            hipsY = rig.baseHipsY + Math.sin(t * 6) * 0.05;
            hipsRotX = 0.65;
            torsoRotX = 0.25;
            lHipX = 0.22; lKneeX = 0.25;
            rHipX = 0.15; rKneeX = 0.18;
            rShX = -1.25 - rig.recoilOffset; rElbX = -0.3;
            lShX = 0.45; lElbX = -0.2; lShZ = 0.5;
            wingSpread = 0.85;
        } else if (state === 'SWIMMING') {
            hipsY = 0.72;
            hipsRotX = 1.25;
            lHipX = Math.sin(t * 7) * 0.45;
            rHipX = -Math.sin(t * 7) * 0.45;
            lKneeX = 0.25; rKneeX = 0.25;
            lShX = -2.2 + Math.sin(t * 5) * 0.7;
            rShX = -2.2 - Math.sin(t * 5) * 0.7;
            lElbX = -0.4; rElbX = -0.4;
        } else {
            // Combat IDLE
            hipsY = rig.baseHipsY + Math.sin(t * 2.5) * 0.015;
            torsoRotX = 0.04;
            lHipX = -0.05; rHipX = 0.05;
            lKneeX = 0.08; rKneeX = 0.08;
            rShX = -1.22 - rig.recoilOffset;
            rElbX = -0.35;
            rShZ = -0.05;
            lShX = -0.55;
            lElbX = -0.75;
            lShZ = 0.12;
        }

        // Smooth interpolation
        rig.hips.position.y = THREE.MathUtils.lerp(rig.hips.position.y, hipsY, lerp);
        rig.hips.rotation.x = THREE.MathUtils.lerp(rig.hips.rotation.x, hipsRotX, lerp);
        rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, torsoRotX, lerp);
        rig.torso.rotation.y = THREE.MathUtils.lerp(rig.torso.rotation.y, torsoRotY, lerp);

        rig.leftHip.rotation.x = THREE.MathUtils.lerp(rig.leftHip.rotation.x, lHipX, lerp);
        rig.rightHip.rotation.x = THREE.MathUtils.lerp(rig.rightHip.rotation.x, rHipX, lerp);
        rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, lKneeX, lerp);
        rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, rKneeX, lerp);

        rig.leftShoulder.rotation.x = THREE.MathUtils.lerp(rig.leftShoulder.rotation.x, lShX, lerp);
        rig.rightShoulder.rotation.x = THREE.MathUtils.lerp(rig.rightShoulder.rotation.x, rShX, lerp);
        rig.leftShoulder.rotation.z = THREE.MathUtils.lerp(rig.leftShoulder.rotation.z, lShZ, lerp);
        rig.rightShoulder.rotation.z = THREE.MathUtils.lerp(rig.rightShoulder.rotation.z, rShZ, lerp);
        rig.leftElbow.rotation.x = THREE.MathUtils.lerp(rig.leftElbow.rotation.x, lElbX, lerp);
        rig.rightElbow.rotation.x = THREE.MathUtils.lerp(rig.rightElbow.rotation.x, rElbX, lerp);

        if (rig.wings) {
            rig.wings.left.rotation.y = THREE.MathUtils.lerp(rig.wings.left.rotation.y, -wingSpread, lerp);
            rig.wings.right.rotation.y = THREE.MathUtils.lerp(rig.wings.right.rotation.y, wingSpread, lerp);
        }
    }
}
