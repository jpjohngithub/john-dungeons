/**
 * @file main.js — John Dungeons: AAA Stylized TPS Battle Royale & Survival Core Loop
 * Features:
 * - Real Combat (Left Click to Shoot hitscan/projectiles, recoil, muzzle flash, impact sparks)
 * - AI Opponents (Enemies roaming, detecting player, shooting back, taking damage, dying)
 * - GAS Integration (AttributeSet, Health/Shield/Stamina, Damage pipeline, Abilities)
 * - RPG Magic (Press '1' for Fireball skill with projectile & explosion VFX)
 * - Building System (Press 'F' to build a defensive Wooden Wall snapped in front of player)
 * - Procedural Synth Audio (Web Audio gunfire, hitmarkers, explosions, jump, step, level-up)
 * - Storm / Safe Zone mechanics ticking damage outside
 * - Floating Damage Numbers, Killfeed, Score, Loot pickups
 */
import * as THREE from 'three';
import EventBus from './core/EventBus.js';
import { InputManager } from './player/InputManager.js';
import { PlayerController } from './player/PlayerController.js';
import { CameraController } from './player/CameraController.js';
import { CharacterModel } from './player/CharacterModel.js';
import { StylizedPBRMaterial } from './rendering/StylizedPBRMaterial.js';
import { DayNightCycle } from './rendering/DayNightCycle.js';
import StormManager from './battleroyale/StormManager.js';
import { AttributeSet } from './gas/AttributeSet.js';

// ─── AUDIO SYNTHESIZER (ZERO ASSET DEPENDENCY) ──────────────────────
class SoundFX {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    playShoot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }
    playHit(isCrit = false) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isCrit ? 1200 : 750, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }
    playExplosion() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }
    playPickup() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    playBuild() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(350, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}
const sfx = new SoundFX();

// ─── GLOBALS ────────────────────────────────────────────────────────
let renderer, scene, camera, clock;
let inputManager, playerController, cameraController;
let playerGroup, playerAttributes;
let dayNight, stormManager;
let terrain, waterPlane;
const trees = [], rocks = [], pickups = [];
const enemies = [], bullets = [], fireballs = [], damageNumbers = [], particles = [], placedWalls = [];
let hud = {};
let pointerLocked = false;
let kills = 0, materials = 100, abilityCooldown = 0;
let lastShotTime = 0;

// ─── INIT ───────────────────────────────────────────────────────────
function init() {
    clock = new THREE.Clock();

    // Setup Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Setup Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.0035);
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2500);

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(70, 100, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x6688cc, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x445522, 0.6);
    scene.add(hemiLight);

    dayNight = new DayNightCycle({ sunLight, ambientLight, cycleDuration: 240 });

    // World Elements
    createTerrain();
    createWater();
    createTrees(140);
    createRocks(70);
    createVegetation(60, 140);
    createPickups(40);

    // Gameplay Attributes (GAS)
    playerAttributes = new AttributeSet();

    // Input & Player
    inputManager = new InputManager();
    createPlayer();
    playerController = new PlayerController(camera, inputManager, scene);
    playerController.position.copy(playerGroup.position);
    cameraController = new CameraController(camera, inputManager, scene);
    cameraController.attach(playerGroup);
    cameraController.setCollisionObjects([terrain, ...rocks]);

    // Storm
    stormManager = new StormManager(scene);
    stormManager.start();

    // Spawn AI Enemies
    spawnEnemies(10);

    // Setup HUD UI
    createHUD();

    // Listeners
    setupKeyListeners();
    renderer.domElement.addEventListener('click', () => {
        sfx.init();
        renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === renderer.domElement;
    });
    window.addEventListener('resize', onResize);

    const loadScreen = document.getElementById('loading-screen');
    if (loadScreen) loadScreen.style.display = 'none';

    animate();
}

// ─── TERRAIN GENERATION ─────────────────────────────────────────────
function createTerrain() {
    const size = 500, segments = 120;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = getTerrainHeight(x, z);
        pos.setY(i, h);

        if (h < -2) {
            colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.78; colors[i * 3 + 2] = 0.55;
        } else if (h < 5) {
            colors[i * 3] = 0.22; colors[i * 3 + 1] = 0.55; colors[i * 3 + 2] = 0.22;
        } else if (h < 9) {
            colors[i * 3] = 0.45; colors[i * 3 + 1] = 0.38; colors[i * 3 + 2] = 0.28;
        } else {
            colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.98;
        }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new StylizedPBRMaterial({
        baseColor: 0x4a8c3f,
        shadowColor: 0x163318,
        rimColor: 0x88cc88,
        rimPower: 3.5,
        rimIntensity: 0.3,
        celSteps: 4.0
    });
    mat.vertexColors = true;

    terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    scene.add(terrain);
}

function createWater() {
    const geo = new THREE.PlaneGeometry(800, 800, 32, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Vibrant tropical ocean
        metalness: 0.85,
        roughness: 0.15,
        transparent: true,
        opacity: 0.82,
        flatShading: true
    });
    waterPlane = new THREE.Mesh(geo, mat);
    waterPlane.position.y = -2.2;
    waterPlane.receiveShadow = true;
    scene.add(waterPlane);
}

function spawnWaterRipples(pos) {
    const geo = new THREE.RingGeometry(0.2, 0.45, 16);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, -2.15, pos.z);
    scene.add(mesh);
    particles.push({
        mesh,
        vel: new THREE.Vector3(0, 0, 0),
        life: 0.8,
        update: (dt, p) => {
            mesh.scale.addScalar(dt * 2.2);
            mat.opacity = (p.life / 0.8) * 0.7;
        }
    });
}

const bushes = [], grassClumps = [];
function createVegetation(bushCount, grassCount) {
    const bushMat = StylizedPBRMaterial.createForest();
    const bushGeo = new THREE.IcosahedronGeometry(0.9, 1);

    for (let i = 0; i < bushCount; i++) {
        const x = (Math.random() - 0.5) * 380;
        const z = (Math.random() - 0.5) * 380;
        const y = getTerrainHeight(x, z);
        if (y < -1 || y > 9) continue;

        const group = new THREE.Group();
        const main = new THREE.Mesh(bushGeo, bushMat);
        main.scale.set(1.2, 0.85, 1.2);
        main.position.y = 0.5;
        main.castShadow = true;
        group.add(main);

        const sub = new THREE.Mesh(bushGeo, bushMat);
        sub.scale.set(0.7, 0.6, 0.7);
        sub.position.set(0.5, 0.4, 0.2);
        group.add(sub);

        group.position.set(x, y, z);
        scene.add(group);
        bushes.push(group);
    }

    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        roughness: 0.85,
        flatShading: true
    });
    const bladeGeo = new THREE.ConeGeometry(0.12, 0.6, 3);
    for (let i = 0; i < grassCount; i++) {
        const x = (Math.random() - 0.5) * 360;
        const z = (Math.random() - 0.5) * 360;
        const y = getTerrainHeight(x, z);
        if (y < -1 || y > 8) continue;

        const clump = new THREE.Group();
        for (let b = 0; b < 4; b++) {
            const blade = new THREE.Mesh(bladeGeo, grassMat);
            blade.position.set((Math.random() - 0.5) * 0.3, 0.25, (Math.random() - 0.5) * 0.3);
            blade.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
            clump.add(blade);
        }
        clump.position.set(x, y, z);
        scene.add(clump);
        grassClumps.push(clump);
    }
}

function getTerrainHeight(x, z) {
    let h = 0;
    h += Math.sin(x * 0.015) * Math.cos(z * 0.015) * 9;
    h += Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.05 + 2.1) * 3.5;
    h += Math.sin(x * 0.12 + 3.0) * Math.cos(z * 0.10) * 1.0;
    const dist = Math.sqrt(x * x + z * z);
    if (dist < 40) h *= dist / 40;
    return h;
}

// ─── PROPS & NATURE ─────────────────────────────────────────────────
function createTrees(count) {
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 3.2, 6);
    const trunkMat = new StylizedPBRMaterial({ baseColor: 0x5c3a21, shadowColor: 0x221308, celSteps: 3 });
    const leafGeo = new THREE.IcosahedronGeometry(2.0, 1);
    const leafMat = StylizedPBRMaterial.createForest();

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 420;
        const z = (Math.random() - 0.5) * 420;
        const y = getTerrainHeight(x, z);
        if (y < -1 || y > 10) continue;

        const group = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.6;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(leafGeo, leafMat);
        leaves.position.y = 4.0;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, y, z);
        scene.add(group);
        trees.push(group);
    }
}

function createRocks(count) {
    const geo = new THREE.DodecahedronGeometry(1.2, 0);
    const mat = new StylizedPBRMaterial({ baseColor: 0x777777, shadowColor: 0x2b2b2b, celSteps: 3 });
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const y = getTerrainHeight(x, z);
        if (y < -1) continue;

        const rock = new THREE.Mesh(geo, mat);
        const s = 0.8 + Math.random() * 1.6;
        rock.scale.set(s, s * 0.7, s);
        rock.position.set(x, y + s * 0.3, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
        rocks.push(rock);
    }
}

function createPickups(count) {
    const colors = [0xbbbbbb, 0x33dd55, 0x3388ff, 0xaa33ff, 0xffaa00];
    const geo = new THREE.OctahedronGeometry(0.5, 0);

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 360;
        const z = (Math.random() - 0.5) * 360;
        const y = getTerrainHeight(x, z);
        if (y < -1) continue;

        const rarity = Math.floor(Math.random() * 5);
        const color = colors[rarity];
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, metalness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 1.2, z);
        mesh.castShadow = true;
        mesh.userData = { rarity, collected: false };
        scene.add(mesh);
        pickups.push(mesh);
    }
}

// ─── PLAYER CHARACTER ───────────────────────────────────────────────
function createPlayer() {
    playerGroup = CharacterModel.createHero();
    playerGroup.position.set(0, getTerrainHeight(0, 0) + 0.1, 0);
    scene.add(playerGroup);
}

// ─── AI ENEMIES (BOTS) ──────────────────────────────────────────────
function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 350 + (Math.random() > 0.5 ? 40 : -40);
        const z = (Math.random() - 0.5) * 350 + (Math.random() > 0.5 ? 40 : -40);
        const y = getTerrainHeight(x, z);

        const group = CharacterModel.createEnemyBot();
        group.position.set(x, y, z);
        group.userData = {
            id: `Bot_${i + 1}`,
            health: 80,
            maxHealth: 80,
            lastAttackTime: 0,
            moveDir: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),
            isDead: false
        };

        scene.add(group);
        enemies.push(group);
    }
}

function updateEnemies(dt) {
    const playerPos = playerController.position;
    const now = performance.now();

    for (let i = enemies.length - 1; i >= 0; i--) {
        const bot = enemies[i];
        if (bot.userData.isDead) continue;

        const dist = bot.position.distanceTo(playerPos);

        // Turn towards player or patrol
        if (dist < 60) {
            // Aggro
            bot.lookAt(playerPos.x, bot.position.y, playerPos.z);

            // Move towards if too far, keep distance
            if (dist > 15) {
                const dir = playerPos.clone().sub(bot.position).normalize();
                bot.position.x += dir.x * 4.5 * dt;
                bot.position.z += dir.z * 4.5 * dt;
            }

            // Shoot at player every 1.2s
            if (now - bot.userData.lastAttackTime > 1200) {
                bot.userData.lastAttackTime = now;
                sfx.playShoot();
                CharacterModel.triggerRecoil(bot);
                createBullet(bot.position.clone().add(new THREE.Vector3(0, 1.2, 0)), playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)), false);
            }
            CharacterModel.updateAnimation(bot, 'WALKING', dt, 1.2);
        } else {
            // Patrol wander
            bot.position.x += bot.userData.moveDir.x * 2.5 * dt;
            bot.position.z += bot.userData.moveDir.z * 2.5 * dt;
            bot.lookAt(bot.position.x + bot.userData.moveDir.x, bot.position.y, bot.position.z + bot.userData.moveDir.z);

            if (Math.random() < 0.01) {
                bot.userData.moveDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            }
            CharacterModel.updateAnimation(bot, 'WALKING', dt, 0.7);
        }

        // Stick bot to terrain
        const ty = getTerrainHeight(bot.position.x, bot.position.z);
        bot.position.y = ty;
    }
}

// ─── COMBAT & WEAPON SHOOTING ───────────────────────────────────────
function shootWeapon() {
    const now = performance.now();
    if (now - lastShotTime < 140) return; // Fire rate limit (~7 shots/sec)
    lastShotTime = now;

    sfx.playShoot();
    CharacterModel.triggerRecoil(playerGroup);

    // Camera recoil punch
    cameraController.addShake(0.3, 0.12);

    // Raycast from camera center into world
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Shoot start position (player gun tip)
    const gunTip = playerGroup.position.clone().add(new THREE.Vector3(0.35, 1.3, 0)).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.8));

    // Check hit against enemies
    const enemyMeshes = enemies.filter(e => !e.userData.isDead);
    let targetHitPoint = null;

    for (const enemy of enemyMeshes) {
        const hits = raycaster.intersectObjects(enemy.children, true);
        if (hits.length > 0 && hits[0].distance < 120) {
            targetHitPoint = hits[0].point;
            applyDamageToEnemy(enemy, 24, targetHitPoint);
            break;
        }
    }

    // If no enemy hit, raycast against terrain / rocks
    if (!targetHitPoint) {
        const hits = raycaster.intersectObjects([terrain, ...rocks, ...placedWalls], true);
        if (hits.length > 0) {
            targetHitPoint = hits[0].point;
            spawnSparks(targetHitPoint);
        } else {
            targetHitPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(150));
        }
    }

    // Bullet tracer visual
    createBullet(gunTip, targetHitPoint, true);
}

function createBullet(from, to, isPlayer = true) {
    const geo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0xffff00 : 0xff4422 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    mesh.lookAt(to);

    const dir = to.clone().sub(from).normalize();
    const speed = isPlayer ? 140 : 80;

    bullets.push({
        mesh,
        dir,
        speed,
        lifetime: 1.2,
        isPlayer,
        target: to
    });
    scene.add(mesh);
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.mesh.position.addScaledVector(b.dir, b.speed * dt);
        b.lifetime -= dt;

        // Check player hit if bullet is from enemy
        if (!b.isPlayer && b.mesh.position.distanceTo(playerController.position.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.0) {
            applyDamageToPlayer(12);
            scene.remove(b.mesh);
            bullets.splice(i, 1);
            continue;
        }

        if (b.lifetime <= 0) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
        }
    }
}

// ─── RPG ABILITY: FIREBALL (PRESS '1') ───────────────────────────────
function castFireball() {
    if (abilityCooldown > 0) return;
    abilityCooldown = 4.0; // 4s cooldown

    sfx.playExplosion();

    const spawnPos = playerGroup.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    const geo = new THREE.SphereGeometry(0.4, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(spawnPos);
    scene.add(mesh);

    fireballs.push({
        mesh,
        dir,
        speed: 35,
        lifetime: 3.0
    });

    showNotification('Plasma Burst Discharged!');
}

function updateFireballs(dt) {
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fb = fireballs[i];
        fb.mesh.position.addScaledVector(fb.dir, fb.speed * dt);
        fb.lifetime -= dt;

        // Check explosion against enemies or ground
        let explode = false;
        const blastPos = fb.mesh.position.clone();

        for (const enemy of enemies) {
            if (!enemy.userData.isDead && blastPos.distanceTo(enemy.position) < 2.5) {
                explode = true;
                break;
            }
        }
        if (blastPos.y < getTerrainHeight(blastPos.x, blastPos.z) + 0.5) {
            explode = true;
        }

        if (explode || fb.lifetime <= 0) {
            triggerExplosion(blastPos, 6.0, 60);
            scene.remove(fb.mesh);
            fireballs.splice(i, 1);
        }
    }
}

function triggerExplosion(pos, radius, damage) {
    sfx.playExplosion();
    cameraController.addShake(0.8, 0.3);

    // Blast damage to enemies
    for (const enemy of enemies) {
        if (enemy.userData.isDead) continue;
        const d = enemy.position.distanceTo(pos);
        if (d < radius) {
            const scaledDmg = Math.round(damage * (1 - d / radius));
            applyDamageToEnemy(enemy, scaledDmg, enemy.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
        }
    }

    // Explosion particles
    for (let i = 0; i < 20; i++) {
        const pGeo = new THREE.DodecahedronGeometry(0.25, 0);
        const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff3300 : 0xffbb00 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);
        particles.push({
            mesh: pMesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 15, Math.random() * 12 + 2, (Math.random() - 0.5) * 15),
            life: 0.6
        });
    }
}

// ─── SURVIVAL BUILDING: WOODEN WALL (PRESS 'F') ──────────────────────
function buildWall() {
    if (materials < 20) {
        showNotification('❌ Need 20 Wood to Build!');
        return;
    }
    materials -= 20;
    sfx.playBuild();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const wallPos = playerGroup.position.clone().add(forward.multiplyScalar(3.0));
    const snappedX = Math.round(wallPos.x / 2) * 2;
    const snappedZ = Math.round(wallPos.z / 2) * 2;
    const groundY = getTerrainHeight(snappedX, snappedZ);

    const geo = new THREE.BoxGeometry(3.0, 2.5, 0.4);
    const mat = new StylizedPBRMaterial({ baseColor: 0x8b5a2b, shadowColor: 0x3d230f, celSteps: 3 });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(snappedX, groundY + 1.25, snappedZ);
    wall.rotation.y = Math.atan2(forward.x, forward.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    placedWalls.push(wall);
    cameraController.setCollisionObjects([terrain, ...rocks, ...placedWalls]);

    showNotification('Tactical Barrier Deployed (-20 Materials)');
}

// ─── DAMAGE & FLOATING NUMBERS ──────────────────────────────────────
function applyDamageToEnemy(enemy, amount, hitPoint) {
    enemy.userData.health -= amount;
    sfx.playHit(amount >= 40);
    spawnDamageNumber(hitPoint, amount, amount >= 40);

    // Hit flash
    enemy.traverse((child) => {
        if (child.isMesh && child.material.color) {
            child.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (child.material && child.material.color) child.material.color.setHex(0xee3333);
            }, 80);
        }
    });

    if (enemy.userData.health <= 0 && !enemy.userData.isDead) {
        enemy.userData.isDead = true;
        kills++;
        materials += 30;
        showNotification(`Target Neutralized: ${enemy.userData.id} (+30 Materials)`);
        sfx.playPickup();

        // Death collapse animation
        enemy.rotation.x = Math.PI / 2;
        enemy.position.y -= 0.5;
        setTimeout(() => scene.remove(enemy), 2000);
    }
}

function applyDamageToPlayer(amount) {
    let shield = playerAttributes.get('shield');
    let hp = playerAttributes.get('health');

    if (shield > 0) {
        if (shield >= amount) {
            playerAttributes.modify('shield', -amount, 'add');
        } else {
            const remainder = amount - shield;
            playerAttributes.modify('shield', -shield, 'add');
            playerAttributes.modify('health', -remainder, 'add');
        }
    } else {
        playerAttributes.modify('health', -amount, 'add');
    }

    sfx.playHit();
    cameraController.addShake(0.5, 0.2);

    // Screen red flash
    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
        vignette.style.opacity = '0.7';
        setTimeout(() => vignette.style.opacity = '0', 200);
    }

    if (playerAttributes.get('health') <= 0) {
        showNotification('ELIMINATED — PRESS [R] TO RE-DEPLOY');
    }
}

function spawnDamageNumber(pos, amount, isCrit = false) {
    damageNumbers.push({
        pos: pos.clone(),
        text: amount.toString(),
        isCrit,
        life: 0.8
    });
}

function spawnSparks(pos) {
    for (let i = 0; i < 6; i++) {
        const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const mesh = new THREE.Mesh(pGeo, pMat);
        mesh.position.copy(pos);
        scene.add(mesh);
        particles.push({
            mesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 8 + 2, (Math.random() - 0.5) * 8),
            life: 0.3
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.update) {
            p.update(dt, p);
        } else {
            p.mesh.position.addScaledVector(p.vel, dt);
            p.vel.y -= 20 * dt; // gravity
        }
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }
}

// ─── KEYS & LISTENERS ───────────────────────────────────────────────
function setupKeyListeners() {
    window.addEventListener('mousedown', (e) => {
        if (pointerLocked && e.button === 0) {
            shootWeapon();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Digit1') castFireball();
        if (e.code === 'KeyF') buildWall();
        if (e.code === 'KeyR' && playerAttributes.get('health') <= 0) {
            // Respawn
            playerAttributes.modify('health', 100, 'override');
            playerAttributes.modify('shield', 50, 'override');
            playerController.position.set(0, getTerrainHeight(0, 0) + 1, 0);
            showNotification('Re-deployed to Combat Zone');
        }
    });
}

// ─── HUD UI ─────────────────────────────────────────────────────────
function createHUD() {
    const container = document.getElementById('hud-layer');
    container.innerHTML = `
        <div id="damage-vignette" style="position:fixed;top:0;left:0;width:100vw;height:100vh;box-shadow:inset 0 0 120px rgba(239,68,68,0.7);pointer-events:none;opacity:0;transition:opacity 0.2s;"></div>
        
        <!-- Top Tactical Bar: Compass, Kills, Materials -->
        <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;font-family:system-ui,-apple-system,sans-serif;">
            <div id="compass" style="background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);padding:6px 18px;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:2px;border:1px solid rgba(255,255,255,0.12);color:#94a3b8;box-shadow:0 4px 12px rgba(0,0,0,0.3);">N 0°</div>
            <div style="background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;border:1px solid rgba(239,68,68,0.3);color:#fca5a5;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
                <span>KILLS:</span>
                <span id="hud-kills" style="color:#ffffff;font-size:13px;">0</span>
            </div>
            <div style="background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;border:1px solid rgba(34,197,94,0.3);color:#86efac;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span>WOOD:</span>
                <span id="hud-mats" style="color:#ffffff;font-size:13px;">100</span>
            </div>
        </div>

        <!-- Tactical Crosshair -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">
            <svg width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="2.5" fill="#38bdf8"/>
                <circle cx="14" cy="14" r="8" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-dasharray="2 3"/>
                <line x1="14" y1="1" x2="14" y2="7" stroke="#ffffff" stroke-width="1.8"/>
                <line x1="14" y1="21" x2="14" y2="27" stroke="#ffffff" stroke-width="1.8"/>
                <line x1="1" y1="14" x2="7" y2="14" stroke="#ffffff" stroke-width="1.8"/>
                <line x1="21" y1="14" x2="27" y2="14" stroke="#ffffff" stroke-width="1.8"/>
            </svg>
        </div>

        <!-- Left Tactical Status Gauges (Health, Shield, Stamina) -->
        <div style="position:absolute;bottom:24px;left:24px;display:flex;flex-direction:column;gap:8px;background:rgba(15,23,42,0.85);backdrop-filter:blur(16px);padding:14px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.4);min-width:260px;font-family:system-ui,-apple-system,sans-serif;">
            <!-- Health Bar -->
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <div style="background:rgba(30,41,59,0.9);border-radius:4px;flex:1;height:12px;overflow:hidden;border:1px solid rgba(239,68,68,0.3);">
                    <div id="hud-hp" style="background:linear-gradient(90deg,#dc2626,#ef4444);height:100%;width:100%;border-radius:3px;box-shadow:0 0 8px rgba(239,68,68,0.6);"></div>
                </div>
                <span id="hud-hp-text" style="font-size:12px;font-weight:800;color:#f87171;min-width:32px;text-align:right;">100</span>
            </div>
            <!-- Shield Bar -->
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div style="background:rgba(30,41,59,0.9);border-radius:4px;flex:1;height:12px;overflow:hidden;border:1px solid rgba(56,189,248,0.3);">
                    <div id="hud-shield" style="background:linear-gradient(90deg,#0284c7,#38bdf8);height:100%;width:50%;border-radius:3px;box-shadow:0 0 8px rgba(56,189,248,0.6);"></div>
                </div>
                <span id="hud-shield-text" style="font-size:12px;font-weight:800;color:#7dd3fc;min-width:32px;text-align:right;">50</span>
            </div>
            <!-- Stamina Bar -->
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <div style="background:rgba(30,41,59,0.9);border-radius:4px;flex:1;height:8px;overflow:hidden;">
                    <div id="hud-stamina" style="background:linear-gradient(90deg,#ca8a04,#facc15);height:100%;width:100%;border-radius:3px;"></div>
                </div>
                <span style="font-size:10px;font-weight:700;color:#94a3b8;min-width:32px;text-align:right;">ENERGY</span>
            </div>
        </div>

        <!-- Bottom Action Bar / Hotbar -->
        <div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:10px;font-family:system-ui,-apple-system,sans-serif;">
            <div style="background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);padding:8px 16px;border-radius:8px;border:1px solid rgba(245,158,11,0.5);display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M2 13h4l2-3h7l1-2h6v4h-4l-2 3h-4l-1 2H2v-4z"/><circle cx="17" cy="11" r="1" fill="#f59e0b"/></svg>
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:1px;">L-CLICK</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">RIFLE</div>
                </div>
            </div>
            <div id="slot-ability" style="background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);padding:8px 16px;border-radius:8px;border:1px solid rgba(249,115,22,0.5);display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:1px;">KEY [1]</div>
                    <div id="ability-cd-text" style="font-size:13px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">READY</div>
                </div>
            </div>
            <div style="background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);padding:8px 16px;border-radius:8px;border:1px solid rgba(16,185,129,0.5);display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/></svg>
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:1px;">KEY [F]</div>
                    <div style="font-size:13px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">WALL (20)</div>
                </div>
            </div>
        </div>

        <!-- Top Right Tactical Radar & Storm Indicator -->
        <div style="position:absolute;top:16px;right:16px;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:system-ui,-apple-system,sans-serif;">
            <div id="hud-storm-status" style="background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);padding:6px 14px;border-radius:6px;font-size:11px;font-weight:700;color:#d8b4fe;border:1px solid rgba(192,132,252,0.3);display:flex;align-items:center;gap:6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>STORM PHASE 1</span>
            </div>
            <div style="width:140px;height:140px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.2);background:rgba(15,23,42,0.9);backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,0.5);">
                <canvas id="minimap-canvas" width="140" height="140"></canvas>
            </div>
            <div id="hud-fps" style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:1px;">60 FPS</div>
        </div>

        <div id="hud-notif" style="position:absolute;top:80px;left:50%;transform:translateX(-50%);font-size:16px;font-weight:bold;color:#ffd700;display:none;text-shadow:0 0 10px rgba(0,0,0,0.8);"></div>
        <div id="damage-container" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>
    `;

    hud = {
        hp: document.getElementById('hud-hp'),
        hpText: document.getElementById('hud-hp-text'),
        shield: document.getElementById('hud-shield'),
        shieldText: document.getElementById('hud-shield-text'),
        stamina: document.getElementById('hud-stamina'),
        kills: document.getElementById('hud-kills'),
        mats: document.getElementById('hud-mats'),
        compass: document.getElementById('compass'),
        fps: document.getElementById('hud-fps'),
        minimap: document.getElementById('minimap-canvas'),
        notif: document.getElementById('hud-notif'),
        abilityCd: document.getElementById('ability-cd-text'),
        dmgContainer: document.getElementById('damage-container')
    };
}

let notifTimer;
function showNotification(txt) {
    if (!hud.notif) return;
    hud.notif.textContent = txt;
    hud.notif.style.display = 'block';
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => hud.notif.style.display = 'none', 2500);
}

// ─── MINIMAP UPDATE ─────────────────────────────────────────────────
function updateMinimap() {
    if (!hud.minimap) return;
    const ctx = hud.minimap.getContext('2d');
    const w = hud.minimap.width, h = hud.minimap.height;
    ctx.clearRect(0, 0, w, h);

    const scale = 0.35;
    const px = playerController.position.x;
    const pz = playerController.position.z;

    // Draw Bots (Red dots)
    ctx.fillStyle = '#ff2222';
    for (const b of enemies) {
        if (b.userData.isDead) continue;
        const dx = (b.position.x - px) * scale + w / 2;
        const dz = (b.position.z - pz) * scale + h / 2;
        if (dx > 0 && dx < w && dz > 0 && dz < h) {
            ctx.beginPath();
            ctx.arc(dx, dz, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw Pickups (Gold dots)
    ctx.fillStyle = '#ffd700';
    for (const p of pickups) {
        if (p.userData.collected) continue;
        const dx = (p.position.x - px) * scale + w / 2;
        const dz = (p.position.z - pz) * scale + h / 2;
        if (dx > 0 && dx < w && dz > 0 && dz < h) {
            ctx.beginPath();
            ctx.arc(dx, dz, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Player Direction Arrow
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-cameraController.yaw + Math.PI);
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ─── FLOATING DAMAGE NUMBERS RENDER ──────────────────────────────────
function updateDamageNumbers(dt) {
    if (!hud.dmgContainer) return;
    hud.dmgContainer.innerHTML = '';

    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.life -= dt;
        dn.pos.y += 2.0 * dt;

        if (dn.life <= 0) {
            damageNumbers.splice(i, 1);
            continue;
        }

        // Project 3D to 2D Screen
        const screenPos = dn.pos.clone().project(camera);
        if (screenPos.z > 1) continue;

        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        const el = document.createElement('div');
        el.style.cssText = `
            position:absolute;left:${x}px;top:${y}px;
            color:${dn.isCrit ? '#ff3300' : '#ffffff'};
            font-size:${dn.isCrit ? '24px' : '18px'};
            font-weight:900;
            text-shadow:0 0 6px #000;
            transform:translate(-50%,-50%);
            opacity:${dn.life / 0.8};
        `;
        el.textContent = dn.text;
        hud.dmgContainer.appendChild(el);
    }
}

// ─── PICKUP LOOT ────────────────────────────────────────────────────
function checkPickups() {
    const pp = playerController.position;
    for (const p of pickups) {
        if (p.userData.collected) continue;
        if (pp.distanceTo(p.position) < 2.2) {
            p.userData.collected = true;
            p.visible = false;
            materials += 25;
            playerAttributes.modify('shield', 25, 'add');
            sfx.playPickup();
            showNotification('Supply Cache Recovered (+25 Shield, +25 Materials)');
        }
    }
}

// ─── MAIN ANIMATION LOOP ────────────────────────────────────────────
let frameCount = 0, lastFpsTime = 0;
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const time = clock.elapsedTime;

    if (!pointerLocked) inputManager.mouse.delta.set(0, 0);

    // Player Update
    playerController.update(dt);
    const ty = getTerrainHeight(playerController.position.x, playerController.position.z);

    if (playerController.currentState === 'SWIMMING') {
        // Natural swimming buoyancy on water plane (-2.2 + 0.08)
        playerController.position.y = THREE.MathUtils.lerp(playerController.position.y, -2.12, dt * 5.0);
        playerController.velocity.y = 0;
        playerController.isGrounded = false;
        if (Math.random() < 0.28) {
            spawnWaterRipples(playerController.position);
        }
    } else {
        if (playerController.position.y < ty + 0.9) {
            playerController.position.y = ty + 0.9;
            playerController.velocity.y = 0;
            playerController.isGrounded = true;
        }
    }

    playerGroup.position.copy(playerController.position);
    playerGroup.quaternion.copy(playerController.rotation);

    // Animate articulated 3D character (walk, sprint, swim, idle)
    CharacterModel.updateAnimation(playerGroup, playerController.currentState, dt);

    // Animate water ocean waves
    if (waterPlane) {
        waterPlane.position.y = -2.2 + Math.sin(time * 1.5) * 0.06;
    }

    // Camera
    cameraController.update(dt, playerController.currentState);

    // Day/Night & Lighting
    dayNight.update(dt);

    // Storm Tick
    if (stormManager) {
        stormManager.update(dt);
        // Apply storm damage if player is outside safe radius
        const p2d = new THREE.Vector2(playerController.position.x, playerController.position.z);
        if (p2d.distanceTo(stormManager.currentCenter) > stormManager.currentRadius) {
            applyDamageToPlayer(10 * dt);
        }
    }

    // AI & Projectiles
    updateEnemies(dt);
    updateBullets(dt);
    updateFireballs(dt);
    updateParticles(dt);
    checkPickups();

    // Ability Cooldown
    if (abilityCooldown > 0) {
        abilityCooldown = Math.max(0, abilityCooldown - dt);
        if (hud.abilityCd) hud.abilityCd.textContent = `${abilityCooldown.toFixed(1)}s`;
    } else {
        if (hud.abilityCd) hud.abilityCd.textContent = 'READY';
    }

    // Pickups bobbing
    for (const p of pickups) {
        if (p.userData.collected) continue;
        p.rotation.y += dt * 2.5;
        p.position.y = getTerrainHeight(p.position.x, p.position.z) + 1.2 + Math.sin(time * 3 + p.position.x) * 0.2;
    }

    // Update HUD Stats
    if (hud.hp) {
        const hpVal = Math.max(0, Math.round(playerAttributes.get('health')));
        const shVal = Math.max(0, Math.round(playerAttributes.get('shield')));
        hud.hp.style.width = `${hpVal}%`;
        hud.hpText.textContent = hpVal;
        hud.shield.style.width = `${shVal * 2}%`;
        hud.shieldText.textContent = shVal;
        hud.stamina.style.width = `${playerController.stamina}%`;
        hud.kills.textContent = kills;
        hud.mats.textContent = materials;
    }

    // Compass
    if (hud.compass) {
        let deg = Math.round(THREE.MathUtils.radToDeg(cameraController.yaw)) % 360;
        if (deg < 0) deg += 360;
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        hud.compass.textContent = `${dirs[Math.round(deg / 45) % 8]} ${deg}°`;
    }

    updateMinimap();
    updateDamageNumbers(dt);

    // FPS
    frameCount++;
    if (performance.now() - lastFpsTime >= 1000) {
        if (hud.fps) hud.fps.textContent = `${frameCount} FPS`;
        frameCount = 0;
        lastFpsTime = performance.now();
    }

    inputManager.update();
    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', init);
