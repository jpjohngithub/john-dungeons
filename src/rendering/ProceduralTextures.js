import * as THREE from 'three';

/**
 * Procedural PBR Texture & Environment Map Generator (Zero external assets, 60 FPS)
 */
export class ProceduralTextures {
    static cache = {};

    static createEnvMap(renderer) {
        if (this.cache.envMap) return this.cache.envMap;
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();

        const envScene = new THREE.Scene();
        // Sky dome for reflections
        const skyGeo = new THREE.SphereGeometry(50, 16, 12);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                topColor: { value: new THREE.Color(0x2563eb) },
                midColor: { value: new THREE.Color(0x93c5fd) },
                botColor: { value: new THREE.Color(0x334155) }
            },
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 midColor;
                uniform vec3 botColor;
                varying vec3 vPos;
                void main() {
                    float h = normalize(vPos).y;
                    vec3 col = h > 0.0
                        ? mix(midColor, topColor, pow(h, 0.6))
                        : mix(midColor, botColor, pow(-h, 0.4));
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        envScene.add(new THREE.Mesh(skyGeo, skyMat));

        // Bright sun disc in reflection
        const sunDisc = new THREE.Mesh(
            new THREE.SphereGeometry(5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xfffbeb })
        );
        sunDisc.position.set(25, 30, 18);
        envScene.add(sunDisc);

        const rt = pmrem.fromScene(envScene, 0.04);
        pmrem.dispose();
        this.cache.envMap = rt.texture;
        return this.cache.envMap;
    }

    static createSkyDome() {
        const geo = new THREE.SphereGeometry(900, 32, 20);
        const mat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: {
                topColor: { value: new THREE.Color(0x1d4ed8) },
                horizonColor: { value: new THREE.Color(0xbae6fd) },
                groundColor: { value: new THREE.Color(0x64748b) },
                sunDir: { value: new THREE.Vector3(0.55, 0.65, 0.35).normalize() }
            },
            vertexShader: `
                varying vec3 vWorldPos;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 horizonColor;
                uniform vec3 groundColor;
                uniform vec3 sunDir;
                varying vec3 vWorldPos;
                void main() {
                    vec3 dir = normalize(vWorldPos);
                    float h = dir.y;
                    vec3 col = h >= 0.0
                        ? mix(horizonColor, topColor, pow(h, 0.55))
                        : mix(horizonColor, groundColor, min(1.0, -h * 4.0));
                    float sunAmt = max(dot(dir, sunDir), 0.0);
                    col += vec3(1.0, 0.95, 0.85) * pow(sunAmt, 64.0) * 1.4;
                    col += vec3(1.0, 0.85, 0.6) * pow(sunAmt, 8.0) * 0.25;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        return new THREE.Mesh(geo, mat);
    }

    static createAsphaltTexture() {
        if (this.cache.asphalt) return this.cache.asphalt;
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 256, 256);

        // Fine asphalt grain
        for (let i = 0; i < 4500; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const v = 38 + Math.floor(Math.random() * 34);
            ctx.fillStyle = `rgb(${v},${v + 5},${v + 12})`;
            ctx.fillRect(x, y, 2, 2);
        }
        // Subtle wear tracks
        ctx.fillStyle = 'rgba(15,23,42,0.18)';
        ctx.fillRect(45, 0, 32, 256);
        ctx.fillRect(178, 0, 32, 256);

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.cache.asphalt = tex;
        return tex;
    }

    static createSidewalkTexture() {
        if (this.cache.sidewalk) return this.cache.sidewalk;
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, 256, 256);

        // Concrete paving slabs
        const step = 64;
        for (let x = 0; x < 256; x += step) {
            for (let y = 0; y < 256; y += step) {
                const shade = 195 + Math.floor(Math.random() * 20);
                ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
                ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
            }
        }
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 256; i += step) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.cache.sidewalk = tex;
        return tex;
    }

    static createBuildingFacade(variant = 0) {
        const key = `facade_${variant}`;
        if (this.cache[key]) return this.cache[key];

        const c = document.createElement('canvas');
        c.width = 256; c.height = 512;
        const ctx = c.getContext('2d');

        const palettes = [
            { wall: '#e2e8f0', trim: '#94a3b8', winDark: '#1e3a5f', winMid: '#38bdf8', winLit: '#bae6fd' },
            { wall: '#334155', trim: '#1e293b', winDark: '#0f172a', winMid: '#0284c7', winLit: '#7dd3fc' },
            { wall: '#d6d3d1', trim: '#78716c', winDark: '#1e293b', winMid: '#475569', winLit: '#fef08a' },
            { wall: '#1e293b', trim: '#0f172a', winDark: '#0c4a6e', winMid: '#0ea5e9', winLit: '#e0f2fe' }
        ];
        const pal = palettes[variant % palettes.length];

        ctx.fillStyle = pal.wall;
        ctx.fillRect(0, 0, 256, 512);

        const cols = 4;
        const rows = 8;
        const padX = 12, padY = 12;
        const cellW = 256 / cols;
        const cellH = 512 / rows;

        for (let r = 0; r < rows; r++) {
            // Floor concrete ledge
            ctx.fillStyle = pal.trim;
            ctx.fillRect(0, r * cellH, 256, 6);

            for (let col = 0; col < cols; col++) {
                const wx = col * cellW + padX * 0.5;
                const wy = r * cellH + padY;
                const ww = cellW - padX;
                const wh = cellH - padY * 1.4;

                // Window frame
                ctx.fillStyle = pal.trim;
                ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);

                // Glass gradient
                const grad = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
                const rnd = Math.sin(r * 13.7 + col * 7.3 + variant * 5.1);
                if (rnd > 0.55) {
                    grad.addColorStop(0, pal.winLit);
                    grad.addColorStop(1, pal.winMid);
                } else {
                    grad.addColorStop(0, pal.winMid);
                    grad.addColorStop(1, pal.winDark);
                }
                ctx.fillStyle = grad;
                ctx.fillRect(wx, wy, ww, wh);

                // Diagonal sky reflection streak
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx + ww * 0.55, wy);
                ctx.lineTo(wx, wy + wh * 0.65);
                ctx.closePath();
                ctx.fill();
            }
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.cache[key] = tex;
        return tex;
    }

    static createPlazaTexture() {
        if (this.cache.plaza) return this.cache.plaza;
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 256; i += 32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(56,189,248,0.12)';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillRect(128, 128, 32, 32);

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.cache.plaza = tex;
        return tex;
    }
}
