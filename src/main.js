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
import { CityBuilder } from './battleroyale/CityBuilder.js';
import { ProceduralTextures } from './rendering/ProceduralTextures.js';
import { AttributeSet } from './gas/AttributeSet.js';

// ─── AUDIO SYNTHESIZER (ZERO ASSET DEPENDENCY) ──────────────────────
class SoundFX {
    constructor() {
        this.ctx = null;
    }
    init() {
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            // Play 1-sample silent buffer to unlock iOS/Safari/Chrome AudioContext reliably
            if (this.ctx && !this._unlocked) {
                const buf = this.ctx.createBuffer(1, 1, 22050);
                const src = this.ctx.createBufferSource();
                src.buffer = buf;
                src.connect(this.ctx.destination);
                src.start(0);
                this._unlocked = true;
            }
        } catch (e) {
            // Audio unavailable on device; continue silently without crashing
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
    playLaser() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    playFlight() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(340, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }
    playMissile() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }
    playBlink() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
    }
    playSlam() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.55);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
    }
    playStealth() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
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
const enemies = [], bullets = [], damageNumbers = [], particles = [], placedStructures = [];
let allObstacles = [];
let hud = {};
let pointerLocked = false;
let gameStarted = false;
let selectedCharacter = 'CYBER_STRIKER';
let selectedClass = 'ASSAULT';
let kills = 0, materials = 150;
let lastShotTime = 0;

// Abilities State for all Characters
let isLaserActive = false;
let laserTimer = 0;
let laserCooldown = 0;
let laserMesh = null;
let laserLight = null;
let superFlightTimer = 0;
let superCooldown = 0;

// Titan Abilities
let activeMissiles = [];
let titanMissileCd = 0;
let titanSlamCd = 0;
let isTitanSlamming = false;

// Ghost Recon Abilities
let ghostBlinkCd = 0;
let ghostStealthCd = 0;
let isGhostStealth = false;
let ghostStealthTimer = 0;

// Lobby Pedestal & Camera
let lobbyPedestal = null;
let lobbySpotLight = null;

// Modular Building State
let isBuildMode = false;
let buildType = 'WALL'; // 'WALL', 'RAMP', 'FLOOR'
let ghostMesh = null;
let ghostMaterial = null;

// ─── INIT ───────────────────────────────────────────────────────────
function init() {
    clock = new THREE.Clock();

    // Setup Renderer with automatic fallback for low-end / mobile / WebGL-restricted devices
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    try {
        renderer = new THREE.WebGLRenderer({
            antialias: !isMobile,
            powerPreference: isMobile ? 'default' : 'high-performance',
            failIfMajorPerformanceCaveat: false
        });
    } catch (e1) {
        try {
            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'default' });
        } catch (e2) {
            const ls = document.getElementById('loading-screen');
            if (ls) ls.innerHTML = '<div style="color:#fff;padding:24px;text-align:center;">WebGL não suportado neste navegador. Ative aceleração de hardware nas configurações.</div>';
            return;
        }
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const canvasHost = document.getElementById('canvas-container') || document.body;
    canvasHost.appendChild(renderer.domElement);

    // Handle GPU context loss gracefully (prevents permanent black screen)
    renderer.domElement.addEventListener('webglcontextlost', (ev) => {
        ev.preventDefault();
        showNotification('Restaurando contexto gráfico...');
    }, false);
    renderer.domElement.addEventListener('webglcontextrestored', () => {
        showNotification('Gráficos restaurados!');
    }, false);

    // Unlock Web Audio on first user interaction anywhere
    const unlockAudioOnce = () => { sfx.init(); };
    window.addEventListener('pointerdown', unlockAudioOnce, { passive: true });
    window.addEventListener('keydown', unlockAudioOnce, { passive: true });
    window.addEventListener('touchstart', unlockAudioOnce, { passive: true });

    // Setup Scene, Sky Dome & Safe PBR Environment Map
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x93c5fd);
    scene.fog = new THREE.FogExp2(0xbbe1fa, 0.0022);
    try {
        scene.environment = ProceduralTextures.createEnvMap(renderer);
    } catch (envErr) {
        console.warn('EnvMap fallback:', envErr);
    }
    scene.add(ProceduralTextures.createSkyDome());
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);

    // Balanced AAA Daylight Lighting (Eliminates dark crushed shadows on buildings)
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    sunLight.position.set(85, 120, 65);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -110;
    sunLight.shadow.camera.right = 110;
    sunLight.shadow.camera.top = 110;
    sunLight.shadow.camera.bottom = -110;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 340;
    sunLight.shadow.bias = -0.0008;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x64748b, 1.05);
    scene.add(hemiLight);

    dayNight = new DayNightCycle({ sunLight, ambientLight, cycleDuration: 240 });

    // World Elements
    createTerrain();
    createWater();
    createTrees(140);
    createRocks(70);
    createVegetation(60, 140);
    createPickups(40);

    // Urban City Center
    const cityData = CityBuilder.buildCity(scene, getTerrainHeight);

    // Solid Physics Obstacles Colliders
    allObstacles = [...cityData.colliders];
    for (const r of rocks) {
        allObstacles.push({
            type: 'cylinder',
            center: r.position,
            radius: r.scale.x * 0.95,
            height: r.scale.y * 2.0
        });
    }
    for (const t of trees) {
        allObstacles.push({
            type: 'cylinder',
            center: t.position,
            radius: 0.55,
            height: 4.5
        });
    }

    // Gameplay Attributes (GAS)
    playerAttributes = new AttributeSet();

    // Input & Player
    inputManager = new InputManager();
    createPlayer();
    playerController = new PlayerController(camera, inputManager, scene);
    playerController.position.copy(playerGroup.position);
    playerController.setObstacles(allObstacles);
    playerController.setGroundHeightFn(getTerrainHeight);
    createLobbyPedestal();
    cameraController = new CameraController(camera, inputManager, scene);
    cameraController.attach(playerGroup);
    cameraController.setCollisionObjects([terrain, cityData.group, ...rocks, ...trees]);

    // Modular Building Preview Ghost
    initGhostMesh();

    // Storm
    stormManager = new StormManager(scene);
    stormManager.start();

    // Spawn AI Enemies
    spawnEnemies(10);

    // Setup HUD UI (hidden during lobby) & Lobby Menu
    createHUD();
    const hudLayer = document.getElementById('hud-layer');
    if (hudLayer) hudLayer.style.display = 'none';
    createLobbyUI();

    // Listeners
    setupKeyListeners();
    renderer.domElement.addEventListener('click', () => {
        if (!gameStarted) return;
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
        if (Math.hypot(x, z) < 106) continue;
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
        if (Math.hypot(x, z) < 106) continue;
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
    const dist = Math.sqrt(x * x + z * z);
    // Flat urban basin for city center (buildings & roads lie on y=0 with zero terrain clipping)
    if (dist < 95) return 0.0;

    let h = 0;
    h += Math.sin(x * 0.015) * Math.cos(z * 0.015) * 9;
    h += Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.05 + 2.1) * 3.5;
    h += Math.sin(x * 0.12 + 3.0) * Math.cos(z * 0.10) * 1.0;

    // Smooth transition from city perimeter (95m) to outer mountains (135m)
    if (dist < 135) {
        const factor = (dist - 95) / 40.0;
        return h * factor;
    }
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
        if (Math.hypot(x, z) < 106) continue;
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
        if (Math.hypot(x, z) < 106) continue;
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
        if (Math.hypot(x, z) < 106) continue;
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
function createPlayer(charType = selectedCharacter) {
    if (playerGroup) scene.remove(playerGroup);
    playerGroup = CharacterModel.createHero({ characterType: charType });
    playerGroup.position.set(0, getTerrainHeight(0, 0), 0);
    scene.add(playerGroup);
    if (cameraController) cameraController.attach(playerGroup);
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
        const prevPos = b.mesh.position.clone();
        b.mesh.position.addScaledVector(b.dir, b.speed * dt);
        const curPos = b.mesh.position;
        b.lifetime -= dt;

        // 1. Check solid collision against player-built structures & city buildings/obstacles
        let blocked = false;
        for (let oi = allObstacles.length - 1; oi >= 0; oi--) {
            const ob = allObstacles[oi];
            if (ob.type === 'cylinder') continue;
            if (ob.minX === undefined || ob.maxX === undefined) continue;
            // Sample midpoint + endpoint to prevent bullet tunneling through thin walls
            const mx = (prevPos.x + curPos.x) * 0.5;
            const my = (prevPos.y + curPos.y) * 0.5;
            const mz = (prevPos.z + curPos.z) * 0.5;
            const hitCur = (curPos.x >= ob.minX && curPos.x <= ob.maxX && curPos.y >= ob.minY && curPos.y <= ob.maxY && curPos.z >= ob.minZ && curPos.z <= ob.maxZ);
            const hitMid = (mx >= ob.minX && mx <= ob.maxX && my >= ob.minY && my <= ob.maxY && mz >= ob.minZ && mz <= ob.maxZ);
            if (hitCur || hitMid) {
                blocked = true;
                spawnExplosionParticles(curPos, 0x94a3b8);
                // If it's a player-built structure, absorb damage & break when HP reaches 0
                if (ob.structureMesh && ob.hp !== undefined) {
                    ob.hp -= 20;
                    ob.structureMesh.scale.multiplyScalar(0.985);
                    if (ob.hp <= 0) {
                        scene.remove(ob.structureMesh);
                        const sIdx = placedStructures.indexOf(ob.structureMesh);
                        if (sIdx !== -1) placedStructures.splice(sIdx, 1);
                        allObstacles.splice(oi, 1);
                        sfx.playExplosion();
                    }
                }
                break;
            }
        }
        if (blocked) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
            continue;
        }

        // 2. Check player hit if bullet is from enemy
        if (!b.isPlayer && curPos.distanceTo(playerController.position.clone().add(new THREE.Vector3(0, 1.0, 0))) < 0.95) {
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

// ─── CYBER ABILITY: HAND LASER BEAM (KEY [1]) ─────────────────────────
function triggerHandLaser() {
    if (laserCooldown > 0) {
        showNotification(`Laser Recharging... (${Math.ceil(laserCooldown)}s)`);
        return;
    }
    isLaserActive = true;
    laserTimer = 2.4;
    laserCooldown = 5.0;
    sfx.playLaser();
    showNotification('CYBER HAND LASER ACTIVATED!');
}

function updateLaser(dt) {
    if (laserCooldown > 0) {
        laserCooldown -= dt;
    }

    if (!isLaserActive) {
        if (laserMesh) laserMesh.visible = false;
        if (laserLight) laserLight.visible = false;
        return;
    }

    laserTimer -= dt;
    if (laserTimer <= 0) {
        isLaserActive = false;
        if (laserMesh) laserMesh.visible = false;
        if (laserLight) laserLight.visible = false;
        return;
    }

    const rig = playerGroup?.userData?.rig;
    const hand = rig?.leftHand;
    let handPos = new THREE.Vector3();
    if (hand) {
        hand.getWorldPosition(handPos);
    } else {
        handPos.copy(playerGroup.position).add(new THREE.Vector3(-0.35, 1.3, 0.3));
    }

    if (rig?.leftShoulder) rig.leftShoulder.rotation.x = -1.45;
    if (rig?.leftElbow) rig.leftElbow.rotation.x = 0;

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    const ray = new THREE.Raycaster(camera.position, camDir, 0.5, 100);
    const hitCandidates = [];
    for (const en of enemies) {
        if (!en.userData.isDead) hitCandidates.push(en);
    }
    const hits = ray.intersectObjects(hitCandidates, true);

    let targetPoint = camera.position.clone().add(camDir.clone().multiplyScalar(65));
    let hitBot = null;
    if (hits.length > 0) {
        targetPoint.copy(hits[0].point);
        let cur = hits[0].object;
        while (cur && !cur.userData?.id) cur = cur.parent;
        hitBot = cur;
    }

    const distance = Math.max(0.5, handPos.distanceTo(targetPoint));
    const midPoint = handPos.clone().add(targetPoint).multiplyScalar(0.5);

    if (!laserMesh) {
        laserMesh = new THREE.Group();
        const outerGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
        outerGeo.rotateX(Math.PI / 2);
        const outerMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.85 });
        laserMesh.add(new THREE.Mesh(outerGeo, outerMat));

        const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
        coreGeo.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        laserMesh.add(new THREE.Mesh(coreGeo, coreMat));

        scene.add(laserMesh);

        laserLight = new THREE.PointLight(0x00f5ff, 2.5, 12);
        scene.add(laserLight);
    }

    laserMesh.visible = true;
    laserLight.visible = true;
    laserMesh.position.copy(midPoint);
    laserMesh.scale.set(1, 1, distance);
    laserMesh.lookAt(targetPoint);
    laserLight.position.copy(targetPoint);

    cameraController.addShake(0.12, 0.05);

    if (hitBot && hitBot.userData && !hitBot.userData.isDead) {
        const dpsMultiplier = selectedClass === 'ASSAULT' ? 1.25 : 1.0;
        applyDamageToEnemy(hitBot, Math.round(180 * dpsMultiplier * dt), targetPoint);
    }
    spawnLaserSparks(targetPoint);
}

// ─── SUPER ABILITY: FLIGHT MODE (KEY [E] / [4]) ───────────────────────
function triggerSuperFlight() {
    if (superCooldown > 0) {
        showNotification(`Super Recharging... (${Math.ceil(superCooldown)}s)`);
        return;
    }
    superFlightTimer = selectedClass === 'SCOUT' ? 14.0 : 10.0;
    superCooldown = 20.0;
    playerController.setState('FLYING');
    sfx.playFlight();
    showNotification('SUPER ACTIVATED: FLIGHT OVERDRIVE! [WASD] Fly | [SPACE] Up | [C] Down');
}

function updateSuperFlight(dt) {
    if (superCooldown > 0) {
        superCooldown -= dt;
    }

    if (playerController.currentState === 'FLYING') {
        superFlightTimer -= dt;

        const pp = playerController.position;
        for (let i = 0; i < 2; i++) {
            const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0x00f5ff : 0x38bdf8 });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.set(pp.x + (i === 0 ? -0.2 : 0.2), pp.y - 0.4, pp.z);
            scene.add(pMesh);
            particles.push({
                mesh: pMesh,
                vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, -Math.random() * 5 - 2, (Math.random() - 0.5) * 1.5),
                life: 0.25
            });
        }

        if (superFlightTimer <= 0) {
            playerController.setState('FALLING');
            showNotification('Flight Energy Depleted.');
        }
    }
}

// ─── LOBBY PEDESTAL & SPOTLIGHT ────────────────────────────────────
function createLobbyPedestal() {
    lobbyPedestal = new THREE.Group();
    
    // Cylindrical stage
    const baseGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.18, 32);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.9,
        roughness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.09;
    baseMesh.receiveShadow = true;
    lobbyPedestal.add(baseMesh);

    // Glowing Neon Ring
    const ringGeo = new THREE.TorusGeometry(2.1, 0.04, 16, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.19;
    lobbyPedestal.add(ringMesh);

    // Inner Grid Circle
    const innerGeo = new THREE.CircleGeometry(1.9, 32);
    innerGeo.rotateX(-Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true, transparent: true, opacity: 0.4 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.y = 0.195;
    lobbyPedestal.add(innerMesh);

    lobbyPedestal.position.set(0, 0, 0);
    scene.add(lobbyPedestal);

    // Overhead dramatic spotlight for lobby presentation
    lobbySpotLight = new THREE.SpotLight(0xffffff, 4.5, 18, Math.PI / 4, 0.4, 1.2);
    lobbySpotLight.position.set(0, 6.0, 2.5);
    lobbySpotLight.target.position.set(0, 1.0, 0);
    scene.add(lobbySpotLight);
    scene.add(lobbySpotLight.target);
}

// ─── TITAN BRAWLER ABILITIES ─────────────────────────────────────────
function triggerTitanMissiles() {
    if (titanMissileCd > 0) {
        showNotification(`Missiles Recharging... (${Math.ceil(titanMissileCd)}s)`);
        return;
    }
    titanMissileCd = 7.0;
    sfx.playMissile();
    showNotification('TITAN MICRO-MISSILES LAUNCHED!');

    const pp = playerGroup.position.clone();
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    // Target nearest bot or camera forward point
    let target = pp.clone().add(camDir.clone().multiplyScalar(45));
    let minDist = 75;
    for (const b of enemies) {
        if (b.userData.isDead) continue;
        const d = b.position.distanceTo(pp);
        if (d < minDist) {
            minDist = d;
            target = b.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        }
    }

    const missileGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8);
    missileGeo.rotateX(Math.PI / 2);
    const missileMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, roughness: 0.3 });

    for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(missileGeo, missileMat);
        const side = i % 2 === 0 ? -0.45 : 0.45;
        const up = 1.6 + Math.floor(i / 2) * 0.25;
        mesh.position.set(pp.x + side, pp.y + up, pp.z);
        scene.add(mesh);

        const launchDir = new THREE.Vector3(side * 0.6, 1.2 + Math.random() * 0.5, camDir.z * 0.5).normalize();
        activeMissiles.push({
            mesh,
            pos: mesh.position.clone(),
            vel: launchDir.multiplyScalar(14),
            target: target.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3)),
            life: 3.5,
            homingPower: 0.0
        });
    }
}

function updateMissiles(dt) {
    if (titanMissileCd > 0) titanMissileCd -= dt;

    for (let i = activeMissiles.length - 1; i >= 0; i--) {
        const m = activeMissiles[i];
        m.life -= dt;
        m.homingPower = Math.min(1.0, m.homingPower + dt * 2.0);

        // Homing turn towards target
        const toTarget = m.target.clone().sub(m.pos).normalize();
        m.vel.lerp(toTarget.multiplyScalar(28.0), m.homingPower * dt * 4.5);
        m.pos.add(m.vel.clone().multiplyScalar(dt));
        m.mesh.position.copy(m.pos);
        m.mesh.lookAt(m.pos.clone().add(m.vel));

        // Smoke & Spark Trail
        if (Math.random() < 0.6) {
            const pGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
            const pMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.copy(m.pos);
            scene.add(pMesh);
            particles.push({ mesh: pMesh, vel: new THREE.Vector3(0, 0.4, 0), life: 0.28 });
        }

        // Check Hit target or terrain or timeout
        const distToTarget = m.pos.distanceTo(m.target);
        const terrY = getTerrainHeight(m.pos.x, m.pos.z);
        if (distToTarget < 1.4 || m.pos.y <= terrY || m.life <= 0) {
            // Explode
            sfx.playExplosion();
            cameraController.addShake(0.18, 0.1);
            spawnExplosionParticles(m.pos, 0xf59e0b);

            // Area Damage
            for (const b of enemies) {
                if (b.userData.isDead) continue;
                if (b.position.distanceTo(m.pos) < 6.5) {
                    applyDamageToEnemy(b, 75, m.pos);
                }
            }

            scene.remove(m.mesh);
            activeMissiles.splice(i, 1);
        }
    }
}

function triggerTitanSlam() {
    if (titanSlamCd > 0) {
        showNotification(`Slam Recharging... (${Math.ceil(titanSlamCd)}s)`);
        return;
    }
    titanSlamCd = 16.0;
    isTitanSlamming = true;
    sfx.playFlight();
    showNotification('SUPER ACTIVATED: TITAN SEISMIC SLAM!');

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    // Powerful leap upwards and forward
    playerController.velocity.set(camDir.x * 12.0, 16.5, camDir.z * 12.0);
    playerController.isGrounded = false;
}

function updateTitanSlam(dt) {
    if (titanSlamCd > 0) titanSlamCd -= dt;

    if (isTitanSlamming) {
        // Rocket exhaust while in air
        const pp = playerController.position;
        const pGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(pp.x, pp.y - 0.2, pp.z);
        scene.add(pMesh);
        particles.push({ mesh: pMesh, vel: new THREE.Vector3((Math.random() - 0.5) * 2, -6, (Math.random() - 0.5) * 2), life: 0.3 });

        // Check landing impact
        const ty = getTerrainHeight(pp.x, pp.z);
        if (playerController.velocity.y <= 0 && pp.y <= ty + 1.1) {
            isTitanSlamming = false;
            sfx.playSlam();
            cameraController.addShake(0.55, 0.45);

            // Shockwave Expanding Ring VFX
            const shockGeo = new THREE.RingGeometry(0.4, 1.8, 32);
            shockGeo.rotateX(-Math.PI / 2);
            const shockMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
            const shockMesh = new THREE.Mesh(shockGeo, shockMat);
            shockMesh.position.set(pp.x, ty + 0.1, pp.z);
            scene.add(shockMesh);

            particles.push({
                mesh: shockMesh,
                vel: new THREE.Vector3(0, 0, 0),
                life: 0.7,
                update: (d, p) => {
                    shockMesh.scale.addScalar(d * 22.0);
                    shockMat.opacity = (p.life / 0.7) * 0.9;
                }
            });

            // Heavy Area Damage (140 damage in 16m radius)
            for (const b of enemies) {
                if (b.userData.isDead) continue;
                const dist = b.position.distanceTo(pp);
                if (dist < 16.0) {
                    const dmg = Math.round(140 * (1 - dist / 16.0) + 30);
                    applyDamageToEnemy(b, dmg, b.position);
                }
            }
            showNotification('SEISMIC SHOCKWAVE DETONATED!');
        }
    }
}

// ─── GHOST RECON ABILITIES ──────────────────────────────────────────
function triggerGhostBlink() {
    if (ghostBlinkCd > 0) {
        showNotification(`Blink Recharging... (${Math.ceil(ghostBlinkCd)}s)`);
        return;
    }
    ghostBlinkCd = 5.0;
    sfx.playBlink();

    const startPos = playerController.position.clone();
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    // 14m instant teleport forward
    const targetPos = startPos.clone().add(camDir.multiplyScalar(14.0));
    const targetY = getTerrainHeight(targetPos.x, targetPos.z);
    targetPos.y = targetY + 0.9;

    // Leave Hologram After-Images along the path
    for (let step = 1; step <= 3; step++) {
        const fraction = step / 4;
        const holoPos = startPos.clone().lerp(targetPos, fraction);
        const holoGeo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
        const holoMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.8 });
        const holoMesh = new THREE.Mesh(holoGeo, holoMat);
        holoMesh.position.copy(holoPos).add(new THREE.Vector3(0, 0.8, 0));
        scene.add(holoMesh);
        particles.push({
            mesh: holoMesh,
            vel: new THREE.Vector3(0, 0.2, 0),
            life: 0.45,
            update: (d, p) => { holoMat.opacity = (p.life / 0.45) * 0.8; }
        });
    }

    playerController.position.copy(targetPos);
    cameraController.addShake(0.15, 0.1);
    showNotification('GHOST SHADOW BLINK!');
}

function triggerGhostStealth() {
    if (ghostStealthCd > 0) {
        showNotification(`Stealth Recharging... (${Math.ceil(ghostStealthCd)}s)`);
        return;
    }
    ghostStealthCd = 18.0;
    isGhostStealth = true;
    ghostStealthTimer = 8.0;
    sfx.playStealth();

    // Set character materials transparent
    playerGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.22;
        }
    });

    // Speed boost during stealth
    playerController.sprintSpeed = 13.5;
    playerController.walkSpeed = 7.5;
    showNotification('CHRONO STEALTH ENGAGED! (+100% Speed & Invisibility)');
}

function updateGhostStealth(dt) {
    if (ghostStealthCd > 0) ghostStealthCd -= dt;

    if (isGhostStealth) {
        ghostStealthTimer -= dt;

        // Dark Shadow Smoke Puffs
        if (Math.random() < 0.4) {
            const pp = playerController.position;
            const pGeo = new THREE.SphereGeometry(0.25, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true, opacity: 0.6 });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.set(pp.x + (Math.random() - 0.5) * 0.4, pp.y + 0.3, pp.z + (Math.random() - 0.5) * 0.4);
            scene.add(pMesh);
            particles.push({
                mesh: pMesh,
                vel: new THREE.Vector3(0, 0.6, 0),
                life: 0.4,
                update: (d, p) => { pMesh.scale.addScalar(d * 1.5); pMat.opacity = (p.life / 0.4) * 0.6; }
            });
        }

        if (ghostStealthTimer <= 0) {
            isGhostStealth = false;
            // Restore normal opacity
            playerGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = 1.0;
                }
            });
            playerController.sprintSpeed = 7.8;
            playerController.walkSpeed = 4.2;
            showNotification('Stealth Cloak Deactivated.');
        }
    }
}

// Universal Ability Routers
function triggerAbility1() {
    if (selectedCharacter === 'CYBER_STRIKER') triggerHandLaser();
    else if (selectedCharacter === 'TITAN_BRAWLER') triggerTitanMissiles();
    else if (selectedCharacter === 'GHOST_RECON') triggerGhostBlink();
}

function triggerSuperAbility() {
    if (selectedCharacter === 'CYBER_STRIKER') triggerSuperFlight();
    else if (selectedCharacter === 'TITAN_BRAWLER') triggerTitanSlam();
    else if (selectedCharacter === 'GHOST_RECON') triggerGhostStealth();
}


// ─── MODULAR BUILDING SYSTEM (KEY [F], [Q]=WALL, [E]=RAMP, [C]=FLOOR) ───
function initGhostMesh() {
    ghostMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.75
    });

    ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.8, 0.35), ghostMaterial);
    ghostMesh.visible = false;
    scene.add(ghostMesh);
}

function toggleBuildMode() {
    isBuildMode = !isBuildMode;
    if (ghostMesh) ghostMesh.visible = isBuildMode;
    if (isBuildMode) {
        showNotification('BUILD MODE: [Q] Wall | [E] Ramp | [C] Floor | [L-Click] Place | [F] Cancel');
        setBuildType(buildType);
    } else {
        showNotification('Combat Mode Resumed');
    }
}

function setBuildType(type) {
    buildType = type;
    if (!ghostMesh) return;
    scene.remove(ghostMesh);

    if (buildType === 'WALL') {
        ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 0.35), ghostMaterial);
    } else if (buildType === 'RAMP') {
        ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 4.0), ghostMaterial);
        ghostMesh.rotation.x = Math.PI / 5;
    } else if (buildType === 'FLOOR') {
        ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 3.2), ghostMaterial);
    }
    ghostMesh.visible = isBuildMode;
    scene.add(ghostMesh);
}

function updateGhostBuilding() {
    if (!isBuildMode || !ghostMesh) return;

    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();

    const pp = playerController.position;
    const targetPos = pp.clone().add(fwd.clone().multiplyScalar(3.8));

    const snapGrid = 3.0;
    const sx = Math.round(targetPos.x / snapGrid) * snapGrid;
    const sz = Math.round(targetPos.z / snapGrid) * snapGrid;
    const groundY = getTerrainHeight(sx, sz);
    const sy = Math.max(groundY + (buildType === 'FLOOR' ? 1.4 : 1.4), Math.round(targetPos.y / 2.5) * 2.5);

    ghostMesh.position.set(sx, sy, sz);

    const yaw = Math.atan2(fwd.x, fwd.z);
    const snapYaw = Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2);
    ghostMesh.rotation.y = snapYaw;
    if (buildType === 'RAMP') {
        ghostMesh.rotation.x = 0.55;
    } else {
        ghostMesh.rotation.x = 0;
    }
}

function placeStructure() {
    if (materials < 15) {
        showNotification('Need 15 Materials to Build!');
        return;
    }
    materials -= 15;
    sfx.playBuild();

    const pos = ghostMesh.position.clone();
    const rotY = ghostMesh.rotation.y;
    const rotX = ghostMesh.rotation.x;

    let geo, collider;
    const mat = new StylizedPBRMaterial({
        baseColor: 0x475569,
        shadowColor: 0x1e293b,
        rimColor: 0x94a3b8,
        rimPower: 2.5,
        rimIntensity: 0.6,
        celSteps: 3.0
    });

    if (buildType === 'WALL') {
        geo = new THREE.BoxGeometry(3.4, 2.8, 0.45);
    } else if (buildType === 'RAMP') {
        geo = new THREE.BoxGeometry(3.4, 0.3, 4.0);
    } else {
        geo = new THREE.BoxGeometry(3.4, 0.3, 3.4);
    }

    const structureMesh = new THREE.Mesh(geo, mat);
    structureMesh.position.copy(pos);
    structureMesh.rotation.y = rotY;
    structureMesh.rotation.x = rotX;
    structureMesh.castShadow = true;
    structureMesh.updateMatrixWorld(true);

    // Exact world-space AABB collider matching rotated wall/ramp/floor + HP to block bullets
    const bbox = new THREE.Box3().setFromObject(structureMesh);
    collider = {
        type: 'box',
        minX: bbox.min.x, maxX: bbox.max.x,
        minY: bbox.min.y, maxY: bbox.max.y,
        minZ: bbox.min.z, maxZ: bbox.max.z,
        hp: 150,
        structureMesh
    };
    structureMesh.receiveShadow = true;
    scene.add(structureMesh);

    placedStructures.push(structureMesh);
    allObstacles.push(collider);
    playerController.setObstacles(allObstacles);
    cameraController.setCollisionObjects([terrain, ...rocks, ...trees, ...placedStructures]);

    showNotification(`${buildType} Placed (-15 Materials)`);
}

function spawnLaserSparks(pos) {
    for (let i = 0; i < 4; i++) {
        const pGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
        const mesh = new THREE.Mesh(pGeo, pMat);
        mesh.position.copy(pos);
        scene.add(mesh);
        particles.push({
            mesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 8 + 2, (Math.random() - 0.5) * 8),
            life: 0.25
        });
    }
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
        if (!gameStarted || !pointerLocked) return;
        if (e.button === 0) {
            if (isBuildMode) {
                placeStructure();
            } else {
                shootWeapon();
            }
        } else if (e.button === 2) {
            if (isBuildMode) {
                toggleBuildMode();
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!gameStarted) return;
        if (e.code === 'Digit1' || e.code === 'KeyQ') {
            if (isBuildMode) {
                setBuildType('WALL');
                showNotification('Build Selection: WALL');
            } else {
                triggerAbility1();
            }
        }
        if (e.code === 'Digit2' || e.code === 'KeyE') {
            if (isBuildMode) {
                setBuildType('RAMP');
                showNotification('Build Selection: RAMP');
            } else {
                triggerSuperAbility();
            }
        }
        if (e.code === 'Digit3' || e.code === 'KeyC') {
            if (isBuildMode) {
                setBuildType('FLOOR');
                showNotification('Build Selection: FLOOR');
            }
        }
        if (e.code === 'Digit4' || e.code === 'KeyV') {
            triggerSuperAbility();
        }
        if (e.code === 'KeyF') {
            toggleBuildMode();
        }
        if (e.code === 'KeyR' && playerAttributes.get('health') <= 0) {
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
            <div id="slot-laser" style="background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);padding:8px 16px;border-radius:8px;border:1px solid rgba(56,189,248,0.5);display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:1px;">[1] / [Q]</div>
                    <div id="laser-cd-text" style="font-size:13px;font-weight:800;color:#38bdf8;letter-spacing:0.5px;">HAND LASER</div>
                </div>
            </div>
            <div id="slot-flight" style="background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);padding:8px 16px;border-radius:8px;border:1px solid rgba(168,85,247,0.5);display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z"/></svg>
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:1px;">[E] / [4]</div>
                    <div id="flight-cd-text" style="font-size:13px;font-weight:800;color:#c084fc;letter-spacing:0.5px;">SUPER VOO</div>
                </div>
            </div>
            <div id="slot-build" style="background:rgba(15,23,42,0.88);backdrop-filter:blur(14px);padding:8px 16px;border-radius:8px;border:1px solid rgba(16,185,129,0.5);display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
                <div>
                    <div style="font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:1px;">KEY [F]</div>
                    <div id="build-mode-text" style="font-size:13px;font-weight:800;color:#10b981;letter-spacing:0.5px;">CONSTRUIR</div>
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
        laserCd: document.getElementById('laser-cd-text'),
        flightCd: document.getElementById('flight-cd-text'),
        buildText: document.getElementById('build-mode-text'),
        dmgContainer: document.getElementById('damage-container')
    };
}

let lobbyYawOffset = 0.25;
let isDraggingLobby = false;
let lobbyLastX = 0;

function createLobbyUI() {
    const lobby = document.createElement('div');
    lobby.id = 'start-lobby-menu';

    const heroMeta = {
        CYBER_STRIKER: {
            title: 'CYBER-STRIKER',
            role: 'ASSALTO AÉREO',
            color: '#38bdf8',
            hp: 75, spd: 85, pwr: 90,
            ab1: 'PLASMA LASER', ab1Desc: 'Feixe contínuo de alta energia pela mão esquerda',
            ab2: 'SUPER VOO', ab2Desc: 'Propulsão a jato com asas articuladas',
            lore: 'Unidade Valquíria equipada com asas propulsoras e emissor de plasma integrado.'
        },
        TITAN_BRAWLER: {
            title: 'TITAN BRAWLER',
            role: 'TANQUE PESADO',
            color: '#f59e0b',
            hp: 100, spd: 60, pwr: 95,
            ab1: 'MICRO-MÍSSEIS', ab1Desc: 'Salva de 4 mísseis teleguiados dos ombros',
            ab2: 'IMPACTO SÍSMICO', ab2Desc: 'Salto propulsado com onda de choque em área',
            lore: 'Exoesqueleto blindado Juggernaut com autocannon rotativo e reator central.'
        },
        GHOST_RECON: {
            title: 'GHOST RECON',
            role: 'FURTIVO / VELOZ',
            color: '#ef4444',
            hp: 65, spd: 100, pwr: 85,
            ab1: 'SHADOW BLINK', ab1Desc: 'Teleporte tático instantâneo de 14m',
            ab2: 'CHRONO STEALTH', ab2Desc: 'Camuflagem óptica + velocidade dobrada',
            lore: 'Cyber-Shinobi de infiltração armada com katanas de energia e SMG silenciada.'
        }
    };

    lobby.innerHTML = `
        <style>
            #start-lobby-menu * { box-sizing: border-box; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
            .aaa-cut { clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); }
            .aaa-hero-btn {
                cursor: pointer; background: rgba(15,23,42,0.72); border: 1px solid rgba(255,255,255,0.12);
                border-left: 4px solid rgba(255,255,255,0.2); padding: 12px 16px; transition: all 0.2s ease;
                display: flex; justify-content: space-between; align-items: center;
            }
            .aaa-hero-btn:hover { background: rgba(30,41,59,0.88); transform: translateX(4px); }
            .aaa-hero-btn.active { background: rgba(15,23,42,0.95); border-color: rgba(255,255,255,0.28); transform: translateX(6px); }
            .aaa-class-pill {
                cursor: pointer; flex: 1; padding: 10px 8px; text-align: center;
                background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.12);
                transition: all 0.18s;
            }
            .aaa-class-pill.active { background: rgba(56,189,248,0.2); border-color: #38bdf8; }
            .aaa-play-btn {
                cursor: pointer; border: none; padding: 18px 46px; font-size: 16px; font-weight: 900;
                letter-spacing: 3px; color: #020617; background: linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%);
                box-shadow: 0 0 32px rgba(56,189,248,0.45); transition: all 0.2s;
            }
            .aaa-play-btn:hover { transform: scale(1.03); box-shadow: 0 0 46px rgba(56,189,248,0.7); }
        </style>
        <div id="lobby-backdrop" style="position:fixed;inset:0;z-index:99;pointer-events:auto;background:linear-gradient(90deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.72) 40%, rgba(2,6,23,0.08) 68%, rgba(2,6,23,0.25) 100%);display:flex;justify-content:space-between;padding:32px 44px;color:#f8fafc;">
            <!-- LEFT COMMAND PANEL -->
            <div style="width:430px;max-width:46vw;display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="width:8px;height:8px;background:#38bdf8;box-shadow:0 0 10px #38bdf8;display:inline-block;"></span>
                        <span style="font-size:11px;font-weight:800;letter-spacing:3px;color:#38bdf8;">SEASON 01 // METRO ARENA</span>
                    </div>
                    <div style="font-size:38px;font-weight:900;letter-spacing:4px;line-height:1;color:#ffffff;text-shadow:0 4px 24px rgba(56,189,248,0.35);">JOHN DUNGEONS</div>
                    <div style="font-size:12px;color:#94a3b8;letter-spacing:1.5px;margin-top:6px;">ESCOLHA SEU OPERADOR PARA O COMBATE</div>
                </div>

                <!-- HERO SELECTOR -->
                <div style="display:flex;flex-direction:column;gap:8px;" id="char-selector-grid">
                    <div class="aaa-hero-btn aaa-cut active" data-char="CYBER_STRIKER" style="border-left-color:#38bdf8;">
                        <div>
                            <div style="font-size:15px;font-weight:900;letter-spacing:1.5px;color:#38bdf8;">CYBER-STRIKER</div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">ASSALTO AÉREO • LASER + VOO</div>
                        </div>
                        <span style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:1px;">01</span>
                    </div>
                    <div class="aaa-hero-btn aaa-cut" data-char="TITAN_BRAWLER" style="border-left-color:#f59e0b;">
                        <div>
                            <div style="font-size:15px;font-weight:900;letter-spacing:1.5px;color:#f59e0b;">TITAN BRAWLER</div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">MECH PESADO • MÍSSEIS + SLAM</div>
                        </div>
                        <span style="font-size:10px;font-weight:800;color:#f59e0b;letter-spacing:1px;">02</span>
                    </div>
                    <div class="aaa-hero-btn aaa-cut" data-char="GHOST_RECON" style="border-left-color:#ef4444;">
                        <div>
                            <div style="font-size:15px;font-weight:900;letter-spacing:1.5px;color:#ef4444;">GHOST RECON</div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">CYBER-NINJA • BLINK + STEALTH</div>
                        </div>
                        <span style="font-size:10px;font-weight:800;color:#ef4444;letter-spacing:1px;">03</span>
                    </div>
                </div>

                <!-- LIVE HERO DOSSIER & STATS -->
                <div class="aaa-cut" style="background:rgba(15,23,42,0.82);border:1px solid rgba(255,255,255,0.1);padding:16px 18px;">
                    <div id="lobby-hero-lore" style="font-size:12px;color:#cbd5e1;line-height:1.45;margin-bottom:12px;"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                        <div style="background:rgba(2,6,23,0.6);padding:8px 10px;border-left:2px solid #38bdf8;" id="lobby-ab1-box">
                            <div style="font-size:10px;color:#94a3b8;font-weight:700;">[1 / Q] HABILIDADE</div>
                            <div id="lobby-ab1-name" style="font-size:12px;font-weight:800;color:#fff;margin-top:2px;"></div>
                        </div>
                        <div style="background:rgba(2,6,23,0.6);padding:8px 10px;border-left:2px solid #a855f7;" id="lobby-ab2-box">
                            <div style="font-size:10px;color:#94a3b8;font-weight:700;">[E / 4] SUPER</div>
                            <div id="lobby-ab2-name" style="font-size:12px;font-weight:800;color:#fff;margin-top:2px;"></div>
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;font-size:10px;font-weight:800;letter-spacing:1px;color:#94a3b8;">
                        <div style="display:flex;align-items:center;gap:8px;"><span style="width:70px;">BLINDAGEM</span><div style="flex:1;height:5px;background:#1e293b;"><div id="stat-hp" style="height:100%;background:#10b981;transition:width 0.3s;"></div></div></div>
                        <div style="display:flex;align-items:center;gap:8px;"><span style="width:70px;">AGILIDADE</span><div style="flex:1;height:5px;background:#1e293b;"><div id="stat-spd" style="height:100%;background:#38bdf8;transition:width 0.3s;"></div></div></div>
                        <div style="display:flex;align-items:center;gap:8px;"><span style="width:70px;">PODER</span><div style="flex:1;height:5px;background:#1e293b;"><div id="stat-pwr" style="height:100%;background:#f59e0b;transition:width 0.3s;"></div></div></div>
                    </div>
                </div>

                <!-- TACTICAL CLASS -->
                <div>
                    <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#94a3b8;margin-bottom:6px;">PERK DE CLASSE</div>
                    <div style="display:flex;gap:8px;" id="class-selector-grid">
                        <div class="aaa-class-pill aaa-cut active" data-class="ASSAULT"><div style="font-size:12px;font-weight:800;color:#38bdf8;">ASSAULT</div><div style="font-size:10px;color:#94a3b8;">+25% Dano</div></div>
                        <div class="aaa-class-pill aaa-cut" data-class="VANGUARD"><div style="font-size:12px;font-weight:800;color:#10b981;">VANGUARD</div><div style="font-size:10px;color:#94a3b8;">+75 Escudo</div></div>
                        <div class="aaa-class-pill aaa-cut" data-class="SCOUT"><div style="font-size:12px;font-weight:800;color:#facc15;">SCOUT</div><div style="font-size:10px;color:#94a3b8;">+30% Vel.</div></div>
                    </div>
                </div>
            </div>

            <!-- RIGHT BOTTOM CTA & ROTATE HINT -->
            <div style="display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;pointer-events:none;">
                <div style="background:rgba(15,23,42,0.72);border:1px solid rgba(255,255,255,0.12);padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#cbd5e1;" class="aaa-cut">
                    ARRASTE PARA GIRAR O PERSONAGEM
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:auto;margin-bottom:28px;">
                    <div style="font-size:11px;color:#cbd5e1;letter-spacing:1px;background:rgba(2,6,23,0.7);padding:6px 12px;border-radius:4px;">
                        [WASD] MOVER • [ESPAÇO] PULAR • [C / CTRL] DESLIZAR • [F] CONSTRUIR
                    </div>
                    <button id="btn-start-game" class="aaa-play-btn aaa-cut">INICIAR PARTIDA</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(lobby);

    const updateDossier = (charType) => {
        const m = heroMeta[charType] || heroMeta.CYBER_STRIKER;
        document.getElementById('lobby-hero-lore').textContent = m.lore;
        document.getElementById('lobby-ab1-name').textContent = m.ab1;
        document.getElementById('lobby-ab2-name').textContent = m.ab2;
        document.getElementById('lobby-ab1-box').style.borderLeftColor = m.color;
        document.getElementById('stat-hp').style.width = m.hp + '%';
        document.getElementById('stat-spd').style.width = m.spd + '%';
        document.getElementById('stat-pwr').style.width = m.pwr + '%';
    };
    updateDossier(selectedCharacter);

    // Drag to rotate hero in lobby
    const backdrop = document.getElementById('lobby-backdrop');
    backdrop.addEventListener('mousedown', (e) => {
        if (e.target === backdrop) {
            isDraggingLobby = true;
            lobbyLastX = e.clientX;
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (!gameStarted && isDraggingLobby) {
            lobbyYawOffset += (e.clientX - lobbyLastX) * 0.01;
            lobbyLastX = e.clientX;
        }
    });
    window.addEventListener('mouseup', () => { isDraggingLobby = false; });

    const charColors = { CYBER_STRIKER: 0x38bdf8, TITAN_BRAWLER: 0xf59e0b, GHOST_RECON: 0xef4444 };
    const charCards = lobby.querySelectorAll('.aaa-hero-btn');
    charCards.forEach((card) => {
        card.addEventListener('click', () => {
            const charType = card.getAttribute('data-char');
            selectedCharacter = charType;
            charCards.forEach((c) => c.classList.remove('active'));
            card.classList.add('active');
            createPlayer(selectedCharacter);
            updateDossier(selectedCharacter);
            if (lobbyPedestal && lobbyPedestal.children[1]) {
                lobbyPedestal.children[1].material.color.setHex(charColors[charType] || 0x38bdf8);
            }
            sfx.init();
            sfx.playPickup();
        });
    });

    const classCards = lobby.querySelectorAll('.aaa-class-pill');
    classCards.forEach((card) => {
        card.addEventListener('click', () => {
            classCards.forEach((c) => c.classList.remove('active'));
            card.classList.add('active');
            selectedClass = card.getAttribute('data-class');
            sfx.init();
            sfx.playPickup();
        });
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        sfx.init();
        sfx.playFlight();
        gameStarted = true;
        lobby.style.display = 'none';
        const hudEl = document.getElementById('hud-layer');
        if (hudEl) hudEl.style.display = 'block';

        if (lobbyPedestal) lobbyPedestal.visible = false;
        if (lobbySpotLight) lobbySpotLight.visible = false;

        // Place feet cleanly on ground at (0, 0, 0) facing forward (-Z, back to camera)
        playerController.position.set(0, getTerrainHeight(0, 0), 0);
        playerController.velocity.set(0, 0, 0);
        playerController.rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        playerController.facingDirection.set(0, 0, -1);
        cameraController.yaw = 0;
        cameraController.pitch = 0.14;

        if (selectedClass === 'VANGUARD') {
            playerAttributes.modify('shield', 100, 'override');
        } else if (selectedClass === 'SCOUT') {
            playerController.walkSpeed = 5.4;
            playerController.sprintSpeed = 9.4;
        }

        renderer.domElement.requestPointerLock();
        showNotification('PARTIDA INICIADA — ZONA DE COMBATE LIBERADA!');
    });
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

    // Lobby Presentation Mode (Hero framed on right side, full body from boots to helmet)
    if (!gameStarted) {
        playerGroup.position.set(0, 0.19, 0);
        if (!isDraggingLobby) lobbyYawOffset += dt * 0.28;
        playerGroup.rotation.set(0, lobbyYawOffset, 0);
        CharacterModel.updateAnimation(playerGroup, 'LOBBY_IDLE', dt);
        camera.position.set(-0.95, 1.32, 3.55);
        camera.lookAt(-0.55, 1.02, 0);
        inputManager.update();
        renderer.render(scene, camera);
        return;
    }

    // Player Update
    playerController.update(dt);
    const ty = getTerrainHeight(playerController.position.x, playerController.position.z);

    if (playerController.currentState === 'SWIMMING') {
        playerController.position.y = THREE.MathUtils.lerp(playerController.position.y, -2.12, dt * 5.0);
        playerController.velocity.y = 0;
        playerController.isGrounded = false;
        if (Math.random() < 0.28) {
            spawnWaterRipples(playerController.position);
        }
    } else if (playerController.currentState !== 'FLYING') {
        // Feet rest cleanly at ty (0.0m offset, zero floating!)
        if (playerController.velocity.y <= 0 && playerController.position.y < ty) {
            playerController.position.y = ty;
            playerController.velocity.y = 0;
            playerController.isGrounded = true;
        }
    }

    playerGroup.position.copy(playerController.position);
    playerGroup.quaternion.copy(playerController.rotation);

    // Animate articulated 3D character (walk, sprint, swim, idle, flight)
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
        const p2d = new THREE.Vector2(playerController.position.x, playerController.position.z);
        if (p2d.distanceTo(stormManager.currentCenter) > stormManager.currentRadius) {
            applyDamageToPlayer(10 * dt);
        }
    }

    // AI, Abilities & Building
    updateEnemies(dt);
    updateBullets(dt);
    updateLaser(dt);
    updateSuperFlight(dt);
    updateMissiles(dt);
    updateTitanSlam(dt);
    updateGhostStealth(dt);
    updateGhostBuilding();
    updateParticles(dt);
    checkPickups();

    // Dynamic Ability Cooldown Display for each hero
    if (selectedCharacter === 'CYBER_STRIKER') {
        if (hud.laserCd) hud.laserCd.textContent = laserCooldown > 0 ? `${laserCooldown.toFixed(1)}s` : 'READY';
        if (hud.flightCd) {
            if (playerController.currentState === 'FLYING') hud.flightCd.textContent = `VOANDO (${Math.ceil(superFlightTimer)}s)`;
            else hud.flightCd.textContent = superCooldown > 0 ? `${superCooldown.toFixed(1)}s` : 'READY';
        }
    } else if (selectedCharacter === 'TITAN_BRAWLER') {
        if (hud.laserCd) hud.laserCd.textContent = titanMissileCd > 0 ? `${titanMissileCd.toFixed(1)}s` : 'READY';
        if (hud.flightCd) {
            if (isTitanSlamming) hud.flightCd.textContent = 'SLAM!';
            else hud.flightCd.textContent = titanSlamCd > 0 ? `${titanSlamCd.toFixed(1)}s` : 'READY';
        }
    } else if (selectedCharacter === 'GHOST_RECON') {
        if (hud.laserCd) hud.laserCd.textContent = ghostBlinkCd > 0 ? `${ghostBlinkCd.toFixed(1)}s` : 'READY';
        if (hud.flightCd) {
            if (isGhostStealth) hud.flightCd.textContent = `STEALTH (${Math.ceil(ghostStealthTimer)}s)`;
            else hud.flightCd.textContent = ghostStealthCd > 0 ? `${ghostStealthCd.toFixed(1)}s` : 'READY';
        }
    }

    if (hud.buildText) {
        hud.buildText.textContent = isBuildMode ? `[${buildType}]` : 'CONSTRUIR';
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
