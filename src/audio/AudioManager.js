/**
 * @file AudioManager.js
 * @description 3D spatial audio system using Web Audio API.
 */

import EventBus from '../core/EventBus.js';

export class AudioManager {
    constructor() {
        /** @type {AudioContext|null} */
        this.ctx = null;
        /** @type {PannerNode|null} */
        this.listenerPanner = null;
        this.sounds = new Map();
        this.soundBuffers = new Map();

        this.volumes = {
            master: 1.0,
            sfx: 1.0,
            music: 1.0,
            ui: 1.0
        };

        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.uiGain = null;

        this.currentMusicSource = null;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.uiGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.uiGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateVolumes();
    }

    updateVolumes() {
        if (!this.ctx) return;
        this.masterGain.gain.value = this.volumes.master;
        this.sfxGain.gain.value = this.volumes.sfx;
        this.musicGain.gain.value = this.volumes.music;
        this.uiGain.gain.value = this.volumes.ui;
    }

    setVolume(category, value) {
        if (this.volumes[category] !== undefined) {
            this.volumes[category] = Math.max(0, Math.min(1, value));
            this.updateVolumes();
        }
    }

    async loadSound(id, url) {
        if (!this.ctx) this.init();
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.soundBuffers.set(id, audioBuffer);
        } catch (e) {
            console.error(`Failed to load sound ${id}:`, e);
        }
    }

    playSound(id, position, options = {}) {
        if (!this.ctx) this.init();
        const buffer = this.soundBuffers.get(id);
        if (!buffer) return null;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;

        if (position) {
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;
        }

        source.connect(panner);
        panner.connect(this.sfxGain);
        source.start(0);
        return source;
    }

    playSoundAttached(id, object3D) {
        const source = this.playSound(id, object3D.position);
        // Tracking object position could be handled in update loop if needed
        return source;
    }

    playMusic(id, fadeIn = true) {
        if (!this.ctx) this.init();
        const buffer = this.soundBuffers.get(id);
        if (!buffer) return;

        if (this.currentMusicSource) {
            try { this.currentMusicSource.stop(); } catch(e){}
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        source.connect(this.musicGain);
        source.start(0);
        this.currentMusicSource = source;
    }
}

export default new AudioManager();
