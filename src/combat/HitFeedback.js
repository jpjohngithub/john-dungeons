export class HitFeedback {
    constructor(camera, uiManager, audioManager) {
        this.camera = camera;
        this.uiManager = uiManager;
        this.audioManager = audioManager;

        // Hitstop
        this.isHitstopped = false;
        this.hitstopTimer = 0;
        this.originalTimeScale = 1.0;

        // Camera shake
        this.shakes = [];
    }

    triggerHitstop(damage) {
        // 30-50ms scale with damage (cap at 100 dmg)
        const duration = Math.min(0.05, Math.max(0.03, (damage / 100) * 0.05));
        this.isHitstopped = true;
        this.hitstopTimer = duration;
    }

    addCameraShake(intensity, duration) {
        this.shakes.push({
            intensity,
            duration,
            maxDuration: duration,
            seed: Math.random() * 100
        });
    }

    onDamageDealt(details) {
        const { target, attacker, amount, hitPoint, isCrit, isHead, killed, type } = details;

        // Hitstop trigger
        this.triggerHitstop(amount);

        // Shake on heavy hits or crits
        if (isCrit || amount > 30) {
            this.addCameraShake(0.15, 0.2);
        }

        // Hitmarkers & Audio
        if (isCrit) {
            this.audioManager?.play('crit_hit');
            this.uiManager?.showHitmarker('crit');
            this.uiManager?.triggerScreenFlash('white', 0.1);
        } else if (target && target.shield > 0) {
            this.audioManager?.play('shield_hit');
            this.uiManager?.showHitmarker('shield');
        } else {
            this.audioManager?.play('hit');
            this.uiManager?.showHitmarker('normal');
        }

        if (killed) {
            this.audioManager?.play('kill');
            this.uiManager?.showHitmarker('kill');
            this.uiManager?.addKillFeedEntry(attacker?.name || 'Player', target?.name || 'Enemy', type);
        }

        // Damage numbers UI
        if (hitPoint && this.uiManager) {
            this.uiManager.spawnDamageNumber(hitPoint, amount, isCrit);
        }
    }

    update(dt) {
        // Hitstop logic
        if (this.isHitstopped) {
            this.hitstopTimer -= dt;
            if (this.hitstopTimer <= 0) {
                this.isHitstopped = false;
            }
        }

        // Camera shake logic
        if (this.shakes.length > 0 && this.camera) {
            let totalOffsetX = 0;
            let totalOffsetY = 0;
            let totalOffsetZ = 0;

            for (let i = this.shakes.length - 1; i >= 0; i--) {
                const shake = this.shakes[i];
                shake.duration -= dt;

                if (shake.duration <= 0) {
                    this.shakes.splice(i, 1);
                    continue;
                }

                const progress = shake.duration / shake.maxDuration;
                const currentIntensity = shake.intensity * progress;

                totalOffsetX += (Math.random() - 0.5) * 2 * currentIntensity;
                totalOffsetY += (Math.random() - 0.5) * 2 * currentIntensity;
                totalOffsetZ += (Math.random() - 0.5) * 2 * currentIntensity;
            }

            this.camera.position.x += totalOffsetX;
            this.camera.position.y += totalOffsetY;
            this.camera.position.z += totalOffsetZ;
        }
    }

    getTimeScale(baseTimeScale) {
        if (this.isHitstopped) return 0.0001; // nearly frozen
        return baseTimeScale;
    }
}
