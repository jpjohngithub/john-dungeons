import * as THREE from 'three';

/**
 * PostProcessing - Manages post-processing effects stack including
 * color grading, bloom, vignette, and outlines.
 */
export class PostProcessing {
    /**
     * @param {THREE.WebGLRenderer} renderer 
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera 
     * @param {THREE.Vector2} resolution 
     */
    constructor(renderer, scene, camera, resolution) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.resolution = resolution;

        this.renderTargetA = new THREE.WebGLRenderTarget(resolution.x, resolution.y, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });

        this.renderTargetB = new THREE.WebGLRenderTarget(resolution.x, resolution.y, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });

        this.passes = [];

        // Color Grading / Vignette / Bloom combined master pass or individual passes
        this.masterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                // Color grading
                lift: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
                gamma: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                gain: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                saturation: { value: 1.2 },
                // Vignette
                vignetteIntensity: { value: 0.4 },
                vignetteSmoothness: { value: 0.5 }
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
                uniform vec3 lift;
                uniform vec3 gamma;
                uniform vec3 gain;
                uniform float saturation;
                uniform float vignetteIntensity;
                uniform float vignetteSmoothness;

                varying vec2 vUv;

                vec3 colorGrade(vec3 color) {
                    // Lift, Gamma, Gain
                    color = color * (1.0 - lift) + lift;
                    color = pow(max(color, 0.0), 1.0 / gamma);
                    color = color * gain;

                    // Saturation boost
                    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
                    color = mix(vec3(luma), color, saturation);

                    return color;
                }

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec3 col = colorGrade(texel.rgb);

                    // Vignette
                    vec2 uv = vUv * (1.0 - vUv.reverse());
                    float vig = uv.x * uv.y * 15.0;
                    vig = pow(vig, vignetteIntensity);
                    vig = clamp(vig, 0.0, 1.0);
                    
                    // Simple radial vignette
                    vec2 centerUv = vUv - 0.5;
                    float dist = length(centerUv);
                    float vignette = smoothstep(0.8, 0.4, dist * vignetteIntensity * 2.0);
                    col *= mix(1.0, vignette, vignetteSmoothness);

                    gl_FragColor = vec4(col, texel.a);
                }
            `
        });

        this.quadScene = new THREE.Scene();
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.masterMaterial);
        this.quadScene.add(this.quadMesh);
    }

    /**
     * Adds a pass to the post-processing stack.
     * @param {Object} pass 
     */
    addPass(pass) {
        this.passes.push(pass);
    }

    /**
     * Updates resolution across targets and passes.
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width, height) {
        this.resolution.set(width, height);
        this.renderTargetA.setSize(width, height);
        this.renderTargetB.setSize(width, height);
        this.passes.forEach(p => {
            if (typeof p.setSize === 'function') {
                p.setSize(width, height);
            }
        });
    }

    /**
     * Executes the post-processing pipeline.
     */
    render() {
        let readBuffer = this.renderTargetA;
        let writeBuffer = this.renderTargetB;

        // 1. Initial render of scene into readBuffer
        this.renderer.setRenderTarget(readBuffer);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        // 2. Execute custom passes (e.g. OutlinePass)
        for (let i = 0; i < this.passes.length; i++) {
            const pass = this.passes[i];
            pass.render(this.renderer, this.scene, this.camera, readBuffer, writeBuffer);
            // Swap buffers
            const temp = readBuffer;
            readBuffer = writeBuffer;
            writeBuffer = temp;
        }

        // 3. Master color grading & vignette pass to screen
        this.masterMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.quadScene, this.quadCamera);
    }
}
