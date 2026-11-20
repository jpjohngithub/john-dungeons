import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

/**
 * DayNightCycle - Manages dynamic time of day, sun/moon rotation,
 * sky color interpolation, lighting updates, and environmental ambiance.
 */
export class DayNightCycle {
    /**
     * @param {Object} options - Configuration options
     * @param {THREE.DirectionalLight} options.sunLight - Main sun directional light
     * @param {THREE.DirectionalLight} [options.moonLight] - Secondary moon directional light
     * @param {THREE.AmbientLight} options.ambientLight - Scene ambient light
     * @param {number} [options.cycleDuration=120] - Duration of a full day/night cycle in seconds
     */
    constructor(options) {
        this.sunLight = options.sunLight;
        this.moonLight = options.moonLight || null;
        this.ambientLight = options.ambientLight;
        this.cycleDuration = options.cycleDuration || 120.0;

        this.timeOfDay = 0.25; // 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
        this.isDaytime = true;
        this.sunDirection = new THREE.Vector3();

        // Color palettes
        this.colors = {
            dawn: {
                sun: new THREE.Color(0xffaa55),
                ambient: new THREE.Color(0x443333),
                sky: new THREE.Color(0xff7744)
            },
            day: {
                sun: new THREE.Color(0xffffff),
                ambient: new THREE.Color(0x666666),
                sky: new THREE.Color(0x3388ff)
            },
            dusk: {
                sun: new THREE.Color(0xff4422),
                ambient: new THREE.Color(0x332244),
                sky: new THREE.Color(0x552266)
            },
            night: {
                sun: new THREE.Color(0x223366),
                ambient: new THREE.Color(0x111122),
                sky: new THREE.Color(0x050510)
            }
        };
    }

    /**
     * Updates the day/night cycle state based on delta time.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Advance time of day
        this.timeOfDay += dt / this.cycleDuration;
        if (this.timeOfDay >= 1.0) {
            this.timeOfDay -= 1.0;
        }

        this.isDaytime = this.timeOfDay >= 0.23 && this.timeOfDay <= 0.77;

        // Calculate sun angle (0 to 2 * PI)
        const sunAngle = this.timeOfDay * Math.PI * 2.0;

        // Position sun along an orbital arc
        const distance = 100.0;
        const sunX = Math.cos(sunAngle) * distance;
        const sunY = Math.sin(sunAngle) * distance;
        const sunZ = Math.cos(sunAngle * 0.5) * 20.0; // slight offset

        this.sunLight.position.set(sunX, sunY, sunZ);
        this.sunDirection.copy(this.sunLight.position).normalize();

        if (this.moonLight) {
            // Moon is opposite to sun
            this.moonLight.position.set(-sunX, -sunY, -sunZ);
        }

        // Interpolate colors based on timeOfDay intervals
        this._updateLightingColors();

        // Emit time update event
        EventBus.emit('time:update', {
            timeOfDay: this.timeOfDay,
            isDaytime: this.isDaytime,
            sunDirection: this.sunDirection
        });
    }

    /**
     * Internal helper to interpolate light colors and intensities.
     */
    _updateLightingColors() {
        let currentSunColor = new THREE.Color();
        let currentAmbientColor = new THREE.Color();
        let sunIntensity = 1.0;

        if (this.timeOfDay >= 0.20 && this.timeOfDay < 0.28) {
            // Dawn transition
            const t = (this.timeOfDay - 0.20) / 0.08;
            currentSunColor.lerpColors(this.colors.night.sun, this.colors.dawn.sun, t);
            currentAmbientColor.lerpColors(this.colors.night.ambient, this.colors.dawn.ambient, t);
            sunIntensity = THREE.MathUtils.lerp(0.1, 0.8, t);
        } else if (this.timeOfDay >= 0.28 && this.timeOfDay < 0.45) {
            // Morning to Noon
            const t = (this.timeOfDay - 0.28) / 0.17;
            currentSunColor.lerpColors(this.colors.dawn.sun, this.colors.day.sun, t);
            currentAmbientColor.lerpColors(this.colors.dawn.ambient, this.colors.day.ambient, t);
            sunIntensity = THREE.MathUtils.lerp(0.8, 1.2, t);
        } else if (this.timeOfDay >= 0.45 && this.timeOfDay < 0.72) {
            // Afternoon
            currentSunColor.copy(this.colors.day.sun);
            currentAmbientColor.copy(this.colors.day.ambient);
            sunIntensity = 1.2;
        } else if (this.timeOfDay >= 0.72 && this.timeOfDay < 0.78) {
            // Dusk transition
            const t = (this.timeOfDay - 0.72) / 0.06;
            currentSunColor.lerpColors(this.colors.day.sun, this.colors.dusk.sun, t);
            currentAmbientColor.lerpColors(this.colors.day.ambient, this.colors.dusk.ambient, t);
            sunIntensity = THREE.MathUtils.lerp(1.2, 0.4, t);
        } else if (this.timeOfDay >= 0.78 && this.timeOfDay < 0.82) {
            // Dusk to Night transition
            const t = (this.timeOfDay - 0.78) / 0.04;
            currentSunColor.lerpColors(this.colors.dusk.sun, this.colors.night.sun, t);
            currentAmbientColor.lerpColors(this.colors.dusk.ambient, this.colors.night.ambient, t);
            sunIntensity = THREE.MathUtils.lerp(0.4, 0.1, t);
        } else {
            // Deep Night
            currentSunColor.copy(this.colors.night.sun);
            currentAmbientColor.copy(this.colors.night.ambient);
            sunIntensity = 0.1;
        }

        this.sunLight.color.copy(currentSunColor);
        this.sunLight.intensity = sunIntensity;
        this.ambientLight.color.copy(currentAmbientColor);
        this.ambientLight.intensity = this.isDaytime ? 0.6 : 0.2;

        if (this.moonLight) {
            this.moonLight.intensity = this.isDaytime ? 0.0 : 0.3;
        }
    }

    /**
     * Sets time of day directly (0 to 1).
     * @param {number} time 
     */
    setTimeOfDay(time) {
        this.timeOfDay = THREE.MathUtils.clamp(time, 0, 1);
    }
}
