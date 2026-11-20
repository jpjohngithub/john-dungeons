import * as THREE from 'three';

/**
 * OutlinePass - Post-processing pass for normal-buffer based edge detection outlines.
 */
export class OutlinePass {
    /**
     * @param {THREE.Vector2} resolution - Screen resolution
     * @param {Object} [options] - Configuration options
     */
    constructor(resolution, options = {}) {
        this.resolution = resolution;
        this.outlineColor = new THREE.Color(options.outlineColor || 0x000000);
        this.thickness = options.thickness !== undefined ? options.thickness : 1.0;
        this.threshold = options.threshold !== undefined ? options.threshold : 0.2;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Normal render target setup
        this.normalRenderTarget = new THREE.WebGLRenderTarget(resolution.x, resolution.y, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });

        this.normalMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
                }
            `
        });

        // Outline composite material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tNormal: { value: this.normalRenderTarget.texture },
                resolution: { value: new THREE.Vector2(resolution.x, resolution.y) },
                outlineColor: { value: this.outlineColor },
                thickness: { value: this.thickness },
                threshold: { value: this.threshold }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform sampler2D tNormal;
                uniform vec2 resolution;
                uniform vec3 outlineColor;
                uniform float thickness;
                uniform float threshold;

                varying vec2 vUv;

                void main() {
                    vec4 baseColor = texture2D(tDiffuse, vUv);
                    vec2 texelSize = thickness / resolution;

                    // Sobel filter on normals
                    vec3 n00 = texture2D(tNormal, vUv + vec2(-texelSize.x, -texelSize.y)).rgb;
                    vec3 n10 = texture2D(tNormal, vUv + vec2(0.0, -texelSize.y)).rgb;
                    vec3 n20 = texture2D(tNormal, vUv + vec2(texelSize.x, -texelSize.y)).rgb;
                    vec3 n01 = texture2D(tNormal, vUv + vec2(-texelSize.x, 0.0)).rgb;
                    vec3 n21 = texture2D(tNormal, vUv + vec2(texelSize.x, 0.0)).rgb;
                    vec3 n02 = texture2D(tNormal, vUv + vec2(-texelSize.x, texelSize.y)).rgb;
                    vec3 n12 = texture2D(tNormal, vUv + vec2(0.0, texelSize.y)).rgb;
                    vec3 n22 = texture2D(tNormal, vUv + vec2(texelSize.x, texelSize.y)).rgb;

                    vec3 sobelX = n02 + 2.0*n12 + n22 - (n00 + 2.0*n10 + n20);
                    vec3 sobelY = n20 + 2.1*n21 + n22 - (n00 + 2.0*n01 + n02);

                    float edge = length(sobelX) + length(sobelY);

                    if (edge > threshold) {
                        gl_FragColor = vec4(outlineColor, 1.0);
                    } else {
                        gl_FragColor = baseColor;
                    }
                }
            `
        });

        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
        this.scene.add(this.quad);
    }

    /**
     * Updates resolution uniform.
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width, height) {
        this.resolution.set(width, height);
        this.normalRenderTarget.setSize(width, height);
        this.material.uniforms.resolution.value.set(width, height);
    }

    /**
     * Renders the outline pass.
     * @param {THREE.WebGLRenderer} renderer 
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera 
     * @param {THREE.WebGLRenderTarget} readBuffer 
     * @param {THREE.WebGLRenderTarget} writeBuffer 
     */
    render(renderer, scene, camera, readBuffer, writeBuffer) {
        // 1. Render normals of the scene
        const oldOverride = scene.overrideMaterial;
        scene.overrideMaterial = this.normalMaterial;
        renderer.setRenderTarget(this.normalRenderTarget);
        renderer.clear();
        renderer.render(scene, camera);
        scene.overrideMaterial = oldOverride;

        // 2. Composite outline onto screen / buffer
        this.material.uniforms.tDiffuse.value = readBuffer.texture;
        this.material.uniforms.tNormal.value = this.normalRenderTarget.texture;

        if (writeBuffer) {
            renderer.setRenderTarget(writeBuffer);
            renderer.clear();
            renderer.render(this.scene, this.camera);
        } else {
            renderer.setRenderTarget(null);
            renderer.render(this.scene, this.camera);
        }
    }
}
