import * as THREE from 'three';

/**
 * StylizedPBRMaterial - Custom cel-shaded PBR material with rim lighting,
 * subsurface scattering approximation, and multiple shading bands.
 */
export class StylizedPBRMaterial extends THREE.ShaderMaterial {
    /**
     * @param {Object} parameters - Material parameters
     */
    constructor(parameters = {}) {
        const uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            {
                baseColor: { value: new THREE.Color(parameters.baseColor || 0xffffff) },
                shadowColor: { value: new THREE.Color(parameters.shadowColor || 0x222244) },
                rimColor: { value: new THREE.Color(parameters.rimColor || 0xffffff) },
                rimPower: { value: parameters.rimPower !== undefined ? parameters.rimPower : 2.0 },
                rimIntensity: { value: parameters.rimIntensity !== undefined ? parameters.rimIntensity : 1.0 },
                outlineWidth: { value: parameters.outlineWidth !== undefined ? parameters.outlineWidth : 0.03 },
                celSteps: { value: parameters.celSteps !== undefined ? parameters.celSteps : 3.0 },
                lightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
                ambientIntensity: { value: parameters.ambientIntensity !== undefined ? parameters.ambientIntensity : 0.3 },
                subsurfaceColor: { value: new THREE.Color(parameters.subsurfaceColor || 0x00ff88) },
                subsurfaceIntensity: { value: parameters.subsurfaceIntensity !== undefined ? parameters.subsurfaceIntensity : 0.0 },
                time: { value: 0.0 }
            }
        ]);

        const vertexShader = `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewDirection;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                
                // Transform normal to world space
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewDirection = normalize(-mvPosition.xyz);

                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform vec3 baseColor;
            uniform vec3 shadowColor;
            uniform vec3 rimColor;
            uniform float rimPower;
            uniform float rimIntensity;
            uniform float celSteps;
            uniform vec3 lightDirection;
            uniform float ambientIntensity;
            uniform vec3 subsurfaceColor;
            uniform float subsurfaceIntensity;
            uniform float time;

            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewDirection;
            varying vec2 vUv;

            void main() {
                vec3 normal = normalize(vWorldNormal);
                vec3 lightDir = normalize(lightDirection);
                vec3 viewDir = normalize(vViewDirection);

                // Cel-shading calculation
                float NdotL = dot(normal, lightDir);
                float lightIntensity = NdotL * 0.5 + 0.5; // Remap to [0, 1]
                
                // Quantize into cel steps
                float celFactor = floor(lightIntensity * celSteps) / celSteps;
                
                // Base lighting interpolation
                vec3 finalColor = mix(shadowColor, baseColor, celFactor);

                // Ambient light contribution
                finalColor += baseColor * ambientIntensity;

                // Rim lighting
                float NdotV = dot(normal, viewDir);
                float rimFactor = 1.0 - max(NdotV, 0.0);
                rimFactor = pow(rimFactor, rimPower);
                vec3 rim = rimColor * rimFactor * rimIntensity * step(0.1, NdotV);
                finalColor += rim;

                // Subsurface scattering approximation (translucency)
                if (subsurfaceIntensity > 0.0) {
                    float viewLightDot = max(dot(-viewDir, lightDir), 0.0);
                    float subsurfaceFactor = pow(viewLightDot, 2.0) * subsurfaceIntensity;
                    finalColor += subsurfaceColor * subsurfaceFactor;
                }

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        super({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            lights: true
        });

        this.type = 'StylizedPBRMaterial';
    }

    /**
     * Creates a pre-configured instance for forest environments (foliage/trees).
     * @returns {StylizedPBRMaterial}
     */
    static createForest() {
        return new StylizedPBRMaterial({
            baseColor: 0x2e8b57,
            shadowColor: 0x0f3b20,
            rimColor: 0xadff2f,
            rimPower: 3.0,
            rimIntensity: 0.8,
            celSteps: 3.0,
            subsurfaceColor: 0x7fff00,
            subsurfaceIntensity: 0.5
        });
    }

    /**
     * Creates a pre-configured instance for characters.
     * @returns {StylizedPBRMaterial}
     */
    static createCharacter() {
        return new StylizedPBRMaterial({
            baseColor: 0x3399ff,
            shadowColor: 0x112244,
            rimColor: 0xffffff,
            rimPower: 2.0,
            rimIntensity: 1.2,
            celSteps: 4.0,
            subsurfaceColor: 0xff9999,
            subsurfaceIntensity: 0.2
        });
    }

    /**
     * Creates a pre-configured instance for terrain.
     * @returns {StylizedPBRMaterial}
     */
    static createTerrain() {
        return new StylizedPBRMaterial({
            baseColor: 0x8b7355,
            shadowColor: 0x3d3024,
            rimColor: 0xd2b48c,
            rimPower: 4.0,
            rimIntensity: 0.4,
            celSteps: 3.0,
            subsurfaceIntensity: 0.0
        });
    }
}
