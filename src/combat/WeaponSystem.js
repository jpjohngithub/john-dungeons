import * as THREE from 'three';

export class WeaponInstance {
    constructor(weaponData) {
        this.data = Object.assign({
            name: 'Weapon',
            isHitscan: true,
            damage: 10,
            element: 'PHYSICAL',
            fireRate: 10, // rounds per second
            magazineSize: 30,
            reloadTime: 1.5,
            spread: 0.02,
            maxSpread: 0.08,
            spreadRecovery: 0.1,
            spreadIncrease: 0.01,
            recoilPitch: 0.05,
            recoilYaw: 0.02,
            range: 1000,
            projectileSpeed: 50,
            projectileGravity: 9.8,
            projectileRadius: 0.2,
            splashRadius: 0,
            splashDamage: 0
        }, weaponData);

        this.ammo = this.data.magazineSize;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.lastFireTime = 0;
        this.currentSpread = this.data.spread;
    }

    canFire(time) {
        if (this.isReloading) return false;
        if (this.ammo <= 0) {
            this.reload();
            return false;
        }
        const interval = 1000 / this.data.fireRate;
        return (time - this.lastFireTime) >= interval;
    }

    fire(origin, direction, camera, raycaster, entities, time) {
        if (!this.canFire(time)) return null;

        this.lastFireTime = time;
        this.ammo--;

        // Increase spread (bloom)
        this.currentSpread = Math.min(this.data.maxSpread, this.currentSpread + this.data.spreadIncrease);

        // Apply spread deviation
        const spreadDir = direction.clone();
        const u = Math.random() * this.currentSpread;
        const theta = Math.random() * Math.PI * 2;
        
        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        
        spreadDir.addScaledVector(cameraRight, Math.cos(theta) * u);
        spreadDir.addScaledVector(cameraUp, Math.sin(theta) * u);
        spreadDir.normalize();

        // Calculate recoil
        const recoil = {
            pitch: (Math.random() * 0.5 + 0.5) * this.data.recoilPitch,
            yaw: (Math.random() - 0.5) * 2 * this.data.recoilYaw
        };

        let result = {
            weapon: this,
            recoil,
            hit: null
        };

        if (this.data.isHitscan) {
            raycaster.set(origin, spreadDir);
            raycaster.far = this.data.range;
            const intersects = raycaster.intersectObjects(entities, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                result.hit = {
                    point: hit.point,
                    normal: hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0),
                    distance: hit.distance,
                    object: hit.object,
                    bone: hit.bone || null,
                    isHead: hit.bone && hit.bone.name && hit.bone.name.toLowerCase().includes('head')
                };
            }
        } else {
            result.projectileConfig = {
                origin: origin.clone(),
                direction: spreadDir,
                speed: this.data.projectileSpeed,
                gravity: this.data.projectileGravity,
                damage: this.data.damage,
                radius: this.data.projectileRadius,
                splashRadius: this.data.splashRadius,
                splashDamage: this.data.splashDamage,
                element: this.data.element
            };
        }

        if (this.ammo === 0) {
            this.reload();
        }

        return result;
    }

    update(dt) {
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.isReloading = false;
                this.ammo = this.data.magazineSize;
            }
        } else {
            // Recover spread
            this.currentSpread = Math.max(this.data.spread, this.currentSpread - this.data.spreadRecovery * dt);
        }
    }

    reload() {
        if (this.isReloading || this.ammo === this.data.magazineSize) return;
        this.isReloading = true;
        this.reloadTimer = this.data.reloadTime;
    }
}
