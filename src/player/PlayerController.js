import * as THREE from 'three';
import EventBus from '../core/EventBus.js';

export const PlayerState = {
    IDLE: 'IDLE',
    WALKING: 'WALKING',
    SPRINTING: 'SPRINTING',
    SLIDING: 'SLIDING',
    FALLING: 'FALLING',
    GLIDING: 'GLIDING',
    MANTLING: 'MANTLING',
    AIMING: 'AIMING',
    SWIMMING: 'SWIMMING',
    FLYING: 'FLYING'
};

/**
 * PlayerController manages movement, state machine, collisions, and character physics.
 */
export class PlayerController {
    constructor(camera, inputManager, scene) {
        this.camera = camera;
        this.input = inputManager;
        this.scene = scene;

        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Quaternion();
        this.facingDirection = new THREE.Vector3(0, 0, 1);

        this.currentState = PlayerState.IDLE;
        this.isGrounded = false;
        this.waterLevel = -2.2;
        this.isSwimming = false;

        // Stats & Tuning
        this.walkSpeed = 4.2;
        this.sprintSpeed = 7.2;
        this.swimSpeed = 3.8;
        this.aimSpeed = 2.4;
        this.gravity = 25.0;
        this.jumpForce = 10.2;
        this.coyoteTime = 0.15;
        this.jumpBuffer = 0.1;

        this._coyoteTimer = 0;
        this._jumpBufferTimer = 0;
        this._slideTimer = 0;
        this._mantleTimer = 0;
        this._mantleStartPos = new THREE.Vector3();
        this._mantleTargetPos = new THREE.Vector3();

        this.stamina = 100;
        this.maxStamina = 100;

        // Capsule dimensions
        this.radius = 0.4;
        this.height = 1.8;
        this.crouchHeight = 1.0;

        this.obstacles = [];
        this.raycaster = new THREE.Raycaster();
        this._initStates();
        this.setState(PlayerState.IDLE);
    }

    _initStates() {
        this.states = {
            [PlayerState.IDLE]: {
                enter: () => {},
                update: (dt) => {
                    if (this._checkJump()) return;
                    if (this.input.getAction('aim')) return this.setState(PlayerState.AIMING);
                    if (this.input.getAction('crouch') && this.isGrounded) return this.setState(PlayerState.SLIDING);
                    
                    const moveInput = this._getMovementInput();
                    if (moveInput.lengthSq() > 0) {
                        if (this.input.getAction('sprint')) {
                            this.setState(PlayerState.SPRINTING);
                        } else {
                            this.setState(PlayerState.WALKING);
                        }
                    }
                },
                exit: () => {}
            },
            [PlayerState.WALKING]: {
                enter: () => {},
                update: (dt) => {
                    if (this._checkJump()) return;
                    if (this.input.getAction('aim')) return this.setState(PlayerState.AIMING);
                    
                    const moveInput = this._getMovementInput();
                    if (moveInput.lengthSq() === 0) {
                        return this.setState(PlayerState.IDLE);
                    }
                    if (this.input.getAction('sprint')) {
                        return this.setState(PlayerState.SPRINTING);
                    }
                    this._applyMovement(moveInput, this.walkSpeed, dt);
                },
                exit: () => {}
            },
            [PlayerState.SPRINTING]: {
                enter: () => {},
                update: (dt) => {
                    if (this._checkJump()) return;
                    if (this.input.getAction('crouch')) return this.setState(PlayerState.SLIDING);
                    
                    const moveInput = this._getMovementInput();
                    if (moveInput.lengthSq() === 0) {
                        return this.setState(PlayerState.IDLE);
                    }
                    if (!this.input.getAction('sprint') || this.stamina <= 0) {
                        return this.setState(PlayerState.WALKING);
                    }

                    this.stamina = Math.max(0, this.stamina - 15 * dt);
                    this._applyMovement(moveInput, this.sprintSpeed, dt);
                },
                exit: () => {}
            },
            [PlayerState.SLIDING]: {
                enter: () => {
                    this._slideTimer = 1.0;
                    this.height = this.crouchHeight;
                    const fwd = this.facingDirection.clone().normalize();
                    this.velocity.x = fwd.x * this.sprintSpeed * 1.6;
                    this.velocity.z = fwd.z * this.sprintSpeed * 1.6;
                },
                update: (dt) => {
                    this._slideTimer -= dt;
                    this.velocity.x *= 0.95;
                    this.velocity.z *= 0.95;
                    this._applyMovement(new THREE.Vector3(), 0, dt);

                    if (this.input.getActionJustPressed('jump') && this.isGrounded) {
                        this.height = 1.8;
                        this.velocity.y = this.jumpForce * 1.1;
                        return this.setState(PlayerState.FALLING);
                    }

                    if (this._slideTimer <= 0 || (this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z) < 1.0) {
                        this.height = 1.8;
                        this.setState(PlayerState.IDLE);
                    }
                },
                exit: () => {
                    this.height = 1.8;
                }
            },
            [PlayerState.FALLING]: {
                enter: () => {},
                update: (dt) => {
                    this.velocity.y -= this.gravity * dt;
                    const moveInput = this._getMovementInput();
                    this._applyMovement(moveInput, this.walkSpeed * 0.8, dt);

                    if (this.input.getActionJustPressed('jump') && this.stamina > 20) {
                        this.stamina -= 20;
                        return this.setState(PlayerState.GLIDING);
                    }

                    if (this._checkMantle()) return;

                    if (this.isGrounded) {
                        this.velocity.y = 0;
                        this.setState(PlayerState.IDLE);
                    }
                },
                exit: () => {}
            },
            [PlayerState.GLIDING]: {
                enter: () => {},
                update: (dt) => {
                    this.velocity.y = -2.0; // gentle float
                    const moveInput = this._getMovementInput();
                    this._applyMovement(moveInput, this.walkSpeed * 1.2, dt);

                    if (this.input.getActionJustPressed('jump') || this.isGrounded) {
                        this.setState(this.isGrounded ? PlayerState.IDLE : PlayerState.FALLING);
                    }
                },
                exit: () => {}
            },
            [PlayerState.MANTLING]: {
                enter: () => {
                    this._mantleTimer = 0.4;
                    this._mantleStartPos.copy(this.position);
                    this.velocity.set(0, 0, 0);
                },
                update: (dt) => {
                    this._mantleTimer -= dt;
                    const alpha = 1.0 - Math.max(0, this._mantleTimer / 0.4);
                    this.position.lerpVectors(this._mantleStartPos, this._mantleTargetPos, alpha);

                    if (this._mantleTimer <= 0) {
                        this.setState(PlayerState.IDLE);
                    }
                },
                exit: () => {}
            },
            [PlayerState.AIMING]: {
                enter: () => {},
                update: (dt) => {
                    if (!this.input.getAction('aim')) {
                        return this.setState(PlayerState.IDLE);
                    }
                    if (this._checkJump()) return;

                    const moveInput = this._getMovementInput();
                    this._applyMovement(moveInput, this.aimSpeed, dt);
                    
                    // Face camera forward during aim
                    const camDir = new THREE.Vector3();
                    this.camera.getWorldDirection(camDir);
                    camDir.y = 0;
                    camDir.normalize();
                    this.facingDirection.copy(camDir);
                    this.rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.facingDirection);
                },
                exit: () => {}
            },
            [PlayerState.SWIMMING]: {
                enter: () => {
                    this.isSwimming = true;
                    this.velocity.y = 0;
                },
                update: (dt) => {
                    // Buoyancy float on surface
                    const targetWaterY = this.waterLevel + 0.1;
                    this.position.y = THREE.MathUtils.lerp(this.position.y, targetWaterY, dt * 4.0);

                    const moveInput = this._getMovementInput();
                    this._applyMovement(moveInput, this.swimSpeed, dt);

                    // Swim jump / propel upward
                    if (this.input.getActionJustPressed('jump')) {
                        this.velocity.y = 5.5;
                        this.position.y += 0.3;
                    }

                    // Check if walked out of water onto land
                    if (this.isGrounded && this.position.y > this.waterLevel + 0.3) {
                        this.isSwimming = false;
                        this.setState(moveInput.lengthSq() > 0 ? PlayerState.WALKING : PlayerState.IDLE);
                    }
                },
                exit: () => {
                    this.isSwimming = false;
                }
            },
            [PlayerState.FLYING]: {
                enter: () => {
                    this.velocity.set(0, 0, 0);
                    EventBus.emit('player:flightStarted');
                },
                update: (dt) => {
                    const h = this.input.getAxis('horizontal');
                    const v = this.input.getAxis('vertical');
                    const camDir = new THREE.Vector3();
                    this.camera.getWorldDirection(camDir);
                    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);

                    const flyDir = new THREE.Vector3();
                    flyDir.addScaledVector(camDir, v);
                    flyDir.addScaledVector(camRight, h);

                    if (this.input.getAction('jump')) flyDir.y += 1.0;
                    if (this.input.getAction('crouch')) flyDir.y -= 1.0;

                    if (flyDir.lengthSq() > 0.01) {
                        flyDir.normalize();
                        const flySpeed = 16.0;
                        this.velocity.copy(flyDir).multiplyScalar(flySpeed);
                        const step = this.velocity.clone().multiplyScalar(dt);
                        this._resolveCollisions(step);
                        this.position.add(step);

                        const horiz = new THREE.Vector3(flyDir.x, 0, flyDir.z);
                        if (horiz.lengthSq() > 0.05) {
                            horiz.normalize();
                            this.facingDirection.lerp(horiz, 0.2);
                            this.rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.facingDirection);
                        }
                    } else {
                        this.velocity.set(0, 0, 0);
                    }

                    if (this.position.y < this.waterLevel + 1.0) {
                        this.position.y = this.waterLevel + 1.0;
                    }
                },
                exit: () => {
                    EventBus.emit('player:flightEnded');
                }
            }
        };
    }

    setState(newState) {
        if (this.currentState === newState) return;
        if (this.states[this.currentState]?.exit) {
            this.states[this.currentState].exit();
        }
        this.currentState = newState;
        if (this.states[this.currentState]?.enter) {
            this.states[this.currentState].enter();
        }
        EventBus.emit('player:stateChanged', { state: newState });
    }

    _getMovementInput() {
        const h = this.input.getAxis('horizontal');
        const v = this.input.getAxis('vertical');
        
        const camForward = new THREE.Vector3();
        this.camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        camRight.y = 0;
        camRight.normalize();

        const moveDir = new THREE.Vector3();
        moveDir.addScaledVector(camForward, v);
        moveDir.addScaledVector(camRight, h);

        if (moveDir.lengthSq() > 1) moveDir.normalize();
        return moveDir;
    }

    setObstacles(colliders) {
        this.obstacles = colliders || [];
    }

    _resolveCollisions(step) {
        if (!this.obstacles || this.obstacles.length === 0) return;

        const pr = this.radius;
        const nextX = this.position.x + step.x;
        const nextZ = this.position.z + step.z;
        const py = this.position.y;

        for (let i = 0; i < this.obstacles.length; i++) {
            const ob = this.obstacles[i];
            const minY = ob.minY ?? (ob.min?.y ?? (ob.center ? ob.center.y - 1.0 : -999));
            const maxY = ob.maxY ?? (ob.max?.y ?? (ob.center ? ob.center.y + (ob.height ?? 30.0) : 999));
            if (py < minY - 0.5 || py > maxY + 2.0) continue;

            if (ob.type === 'cylinder') {
                const ox = ob.x ?? ob.position?.x ?? ob.center?.x ?? 0;
                const oz = ob.z ?? ob.position?.z ?? ob.center?.z ?? 0;
                const r = (ob.radius || 1.0) + pr;
                const dx = nextX - ox;
                const dz = nextZ - oz;
                const distSq = dx * dx + dz * dz;
                if (distSq < r * r && distSq > 0.0001) {
                    const dist = Math.sqrt(distSq);
                    const push = (r - dist);
                    step.x += (dx / dist) * push;
                    step.z += (dz / dist) * push;
                }
            } else {
                const minX = (ob.minX ?? ob.min?.x ?? -1) - pr;
                const maxX = (ob.maxX ?? ob.max?.x ?? 1) + pr;
                const minZ = (ob.minZ ?? ob.min?.z ?? -1) - pr;
                const maxZ = (ob.maxZ ?? ob.max?.z ?? 1) + pr;

                if (nextX > minX && nextX < maxX && nextZ > minZ && nextZ < maxZ) {
                    const dLeft = Math.abs(nextX - minX);
                    const dRight = Math.abs(maxX - nextX);
                    const dTop = Math.abs(nextZ - minZ);
                    const dBottom = Math.abs(maxZ - nextZ);
                    const minPush = Math.min(dLeft, dRight, dTop, dBottom);

                    if (minPush === dLeft) step.x -= dLeft;
                    else if (minPush === dRight) step.x += dRight;
                    else if (minPush === dTop) step.z -= dTop;
                    else step.z += dBottom;
                }
            }
        }
    }

    _applyMovement(moveDir, speed, dt) {
        if (moveDir.lengthSq() > 0) {
            this.velocity.x = moveDir.x * speed;
            this.velocity.z = moveDir.z * speed;

            this.facingDirection.lerp(moveDir, 0.15).normalize();
            this.rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.facingDirection);
        } else {
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
        }

        const step = new THREE.Vector3(this.velocity.x * dt, 0, this.velocity.z * dt);
        this._resolveCollisions(step);
        this.position.x += step.x;
        this.position.z += step.z;
    }

    _checkJump() {
        if (this.input.getActionJustPressed('jump') && (this.isGrounded || this._coyoteTimer > 0)) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this._coyoteTimer = 0;
            this.setState(PlayerState.FALLING);
            return true;
        }
        return false;
    }

    _checkMantle() {
        if (this.currentState === PlayerState.MANTLING) return false;
        
        this.raycaster.set(this.position, this.facingDirection, 0, 1.0);
        const hits = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (hits.length > 0 && !this.isGrounded) {
            const hit = hits[0];
            if (hit.point.y > this.position.y && hit.point.y - this.position.y < 1.5) {
                this._mantleTargetPos.copy(hit.point).add(new THREE.Vector3(0, 1.8, 0));
                this.setState(PlayerState.MANTLING);
                return true;
            }
        }
        return false;
    }

    _checkGround(dt) {
        if (this.currentState === PlayerState.FLYING) return;
        this.raycaster.set(this.position, new THREE.Vector3(0, -1, 0), 0, this.height * 0.5 + 0.1);
        const hits = this.raycaster.intersectObjects(this.scene.children, true);

        if (hits.length > 0) {
            this.isGrounded = true;
            this._coyoteTimer = this.coyoteTime;
            this.velocity.y = 0;
            this.position.y = hits[0].point.y + this.height * 0.5;
            if (this.currentState === PlayerState.FALLING || this.currentState === PlayerState.GLIDING) {
                this.setState(PlayerState.IDLE);
            }
        } else {
            this.isGrounded = false;
            this._coyoteTimer -= dt;
            if (this.currentState !== PlayerState.FALLING && this.currentState !== PlayerState.GLIDING && this.currentState !== PlayerState.MANTLING) {
                this.setState(PlayerState.FALLING);
            }
        }
    }

    update(dt) {
        this._checkGround(dt);

        // Water entry check
        if (this.position.y <= this.waterLevel + 0.25) {
            if (this.currentState !== PlayerState.SWIMMING) {
                this.setState(PlayerState.SWIMMING);
            }
        }

        if (this.states[this.currentState]) {
            this.states[this.currentState].update(dt);
        }

        if (!this.isGrounded && this.currentState !== PlayerState.MANTLING && this.currentState !== PlayerState.GLIDING && this.currentState !== PlayerState.SWIMMING && this.currentState !== PlayerState.FLYING) {
            this.velocity.y -= this.gravity * dt;
            this.position.y += this.velocity.y * dt;
        }

        // Stamina regen
        if (this.currentState !== PlayerState.SPRINTING && this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
        }
    }
}
