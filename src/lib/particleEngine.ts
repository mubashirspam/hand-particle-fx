import * as THREE from "three";
import { GestureType, ColorPalette } from "@/types";
import { ParticleShape } from "@/types";
import { generateShapePositions } from "./shapeGenerator";
import { getActionForGesture, PALETTES } from "./palettes";
import { particleVertexShader, particleFragmentShader } from "@/shaders/particle";

const PARTICLE_COUNT = 30000;
const PARTICLE_STRIDE = PARTICLE_COUNT * 3;
const SCALE = 28;
const LERP_SPEED = 0.05;
const COLOR_LERP = 0.08;
const PARTICLE_SIZE = 0.9;

export class ParticleEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private material!: THREE.ShaderMaterial;
  private geometry!: THREE.BufferGeometry;
  private clock: THREE.Clock;
  private animationId: number = 0;

  // CPU buffers
  private targetPositions!: Float32Array;
  private basePositions!: Float32Array;
  private targetColors!: Float32Array;

  // Gesture state — pure, no locks or timers
  private currentGesture: GestureType = GestureType.NONE;
  private currentPalette: ColorPalette = PALETTES.aurora;

  // Face tracking state
  private isFaceVisible = false;
  private faceTargetX = 0; // [-1, 1], positive = right, negative = left
  private faceTargetY = 0; // [-1, 1], positive = up, negative = down
  private faceSmoothX = 0;
  private faceSmoothY = 0;

  // Idle-settle optimization: skip sphere update when not animating
  private _sphereSettled = false;
  private _idleFrames = 0;

  public onFPS?: (fps: number) => void;

  constructor(container: HTMLElement) {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030008, 1);
    container.appendChild(this.renderer.domElement);

    this.initParticles();
    this.addStars();

    window.addEventListener("resize", () => this.handleResize(container));
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  private initParticles(): void {
    const spherePos = generateShapePositions(ParticleShape.SPHERE, PARTICLE_COUNT, SCALE);

    this.targetPositions = new Float32Array(PARTICLE_STRIDE);
    this.basePositions = new Float32Array(PARTICLE_STRIDE);
    this.targetColors = new Float32Array(PARTICLE_STRIDE);

    const positions = new Float32Array(PARTICLE_STRIDE);
    const colors = new Float32Array(PARTICLE_STRIDE);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      positions[bi] = spherePos[bi];
      positions[bi + 1] = spherePos[bi + 1];
      positions[bi + 2] = spherePos[bi + 2];

      this.basePositions[bi] = spherePos[bi];
      this.basePositions[bi + 1] = spherePos[bi + 1];
      this.basePositions[bi + 2] = spherePos[bi + 2];

      const col = this.currentPalette.colors[i % this.currentPalette.colors.length];
      colors[bi] = col.r;
      colors[bi + 1] = col.g;
      colors[bi + 2] = col.b;
    }

    this.targetPositions.set(positions);
    this.targetColors.set(colors);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: PARTICLE_SIZE },
      },
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  private addStars(): void {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.scene.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({ size: 0.3, color: 0x445566, transparent: true, opacity: 0.5 })
      )
    );
  }

  // ─── Sphere target update (face animation or static) ─────────────────────

  private updateSphereTargets(elapsed: number): void {
    const hasFace = this.isFaceVisible;

    // Settle optimization: when no face and sphere has converged, skip the loop
    if (!hasFace) {
      if (this._sphereSettled) return;
      if (++this._idleFrames > 120) {
        this._sphereSettled = true;
        return;
      }
    } else {
      // Face visible — always recompute
      this._sphereSettled = false;
      this._idleFrames = 0;
    }

    const base = this.basePositions;
    const targets = this.targetPositions;
    const tColors = this.targetColors;
    const palette = this.currentPalette;

    const fx = this.faceSmoothX;
    const fy = this.faceSmoothY;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      const bx = base[bi];
      const by = base[bi + 1];
      const bz = base[bi + 2];

      if (hasFace) {
        const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
        const nx = bx / len;
        const ny = by / len;
        const nz = bz / len;

        // Project face direction onto sphere surface for directional bulge
        const dot = nx * fx + ny * fy;

        // Azimuthal + polar angles for spatially varied waves
        const theta = Math.atan2(by, bx);
        const phi = Math.acos(Math.max(-1, Math.min(1, nz)));

        // Primary wave: slow, large — driven by face direction
        const wave1 = Math.sin(elapsed * 0.55 + theta * 1.5 + dot * Math.PI) * 0.045;
        // Secondary wave: faster, smaller — adds shimmer
        const wave2 = Math.sin(elapsed * 1.3 + phi * 2.0 - theta * 0.8) * 0.022;
        // Breathing pulse: global very-slow radius oscillation
        const breath = Math.sin(elapsed * 0.35) * 0.018;

        // Directional bulge (stronger: ±18%) + organic waves + breath
        const r = len * (1 + 0.18 * dot + wave1 + wave2 + breath);

        targets[bi] = nx * r;
        targets[bi + 1] = ny * r;
        targets[bi + 2] = nz * r;

        // Color: brighten toward the face direction; cool-tint opposite side
        const col = palette.colors[i % palette.colors.length];
        const bright = 1 + 0.40 * Math.max(0, dot);
        const dim   = 1 - 0.20 * Math.max(0, -dot);
        const scale = dot >= 0 ? bright : dim;
        tColors[bi]     = Math.min(1, col.r * scale);
        tColors[bi + 1] = Math.min(1, col.g * scale);
        tColors[bi + 2] = Math.min(1, col.b * scale);
      } else {
        // No face — restore static base sphere
        targets[bi] = bx;
        targets[bi + 1] = by;
        targets[bi + 2] = bz;

        const col = palette.colors[i % palette.colors.length];
        tColors[bi] = col.r;
        tColors[bi + 1] = col.g;
        tColors[bi + 2] = col.b;
      }
    }
  }

  // ─── Shape trigger — called once when gesture changes ────────────────────

  private triggerShape(gesture: GestureType): void {
    const action = getActionForGesture(gesture);
    if (!action) return;

    const shapePos = generateShapePositions(action.shape, PARTICLE_COUNT, SCALE);
    const palette = action.palette;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      this.targetPositions[bi] = shapePos[bi];
      this.targetPositions[bi + 1] = shapePos[bi + 1];
      this.targetPositions[bi + 2] = shapePos[bi + 2];

      const col = palette.colors[i % palette.colors.length];
      this.targetColors[bi] = col.r;
      this.targetColors[bi + 1] = col.g;
      this.targetColors[bi + 2] = col.b;
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Called every frame with the current gesture.
   * - NONE   → return to sphere (face animation applies if face visible)
   * - Other  → switch to that shape immediately; hold until gesture changes
   * No timers, no locks — purely driven by live gesture state.
   */
  public setGesture(gesture: GestureType): void {
    if (gesture === GestureType.NONE) {
      if (this.currentGesture !== GestureType.NONE) {
        this.currentGesture = GestureType.NONE;
        this.currentPalette = PALETTES.aurora;
        this._resetSettle();
      }
      return;
    }

    // Same gesture already active — nothing to change
    if (gesture === this.currentGesture) return;

    const action = getActionForGesture(gesture);
    if (!action) return;

    this.currentGesture = gesture;
    this.currentPalette = action.palette;
    this._resetSettle();
    this.triggerShape(gesture);
  }

  /**
   * Face center in normalized image coords (0-1).
   * x=0 is left edge, x=1 is right; y=0 is top, y=1 is bottom.
   * This is called in the fallback mode to drive the sphere animation.
   */
  public setFacePosition(x: number, y: number): void {
    // Mirror x (webcam is horizontally mirrored), center & scale to [-1, 1]
    this.faceTargetX = -(x - 0.5) * 2;
    // Flip y (image y increases downward; we want up = positive)
    this.faceTargetY = -(y - 0.5) * 2;
  }

  public setFaceVisible(visible: boolean): void {
    if (visible !== this.isFaceVisible) {
      this._resetSettle();
    }
    this.isFaceVisible = visible;
  }

  private _resetSettle(): void {
    this._sphereSettled = false;
    this._idleFrames = 0;
  }

  // ─── Animation loop ───────────────────────────────────────────────────────

  public start(): void {
    let lastFpsTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const elapsed = this.clock.getElapsedTime();

      // FPS counter
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        this.onFPS?.(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }

      // Smooth face position toward target
      if (this.isFaceVisible) {
        this.faceSmoothX += (this.faceTargetX - this.faceSmoothX) * 0.08;
        this.faceSmoothY += (this.faceTargetY - this.faceSmoothY) * 0.08;
      }

      const isSphere = this.currentGesture === GestureType.NONE;

      if (isSphere) {
        this.updateSphereTargets(elapsed);
      }

      // ── CPU lerp ────────────────────────────────────────────────────────
      const pos = this.geometry.attributes.position.array as Float32Array;
      const col = this.geometry.attributes.color.array as Float32Array;
      const tpos = this.targetPositions;
      const tcol = this.targetColors;
      const lerpPos = isSphere ? LERP_SPEED : 0.06;

      for (let i = 0; i < PARTICLE_STRIDE; i++) {
        pos[i] += (tpos[i] - pos[i]) * lerpPos;
      }
      for (let i = 0; i < PARTICLE_STRIDE; i++) {
        col[i] += (tcol[i] - col[i]) * COLOR_LERP;
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;

      // Rotation:
      // - Gesture mode  → damp rotation to zero (shape is static)
      // - Face mode     → very slow rotation while the organic animation plays
      // - Idle (no face, no gesture) → normal gentle rotation
      if (!isSphere) {
        this.particles.rotation.y *= 0.97;
        this.particles.rotation.x *= 0.97;
      } else if (this.isFaceVisible) {
        this.particles.rotation.y += 0.0006;
        this.particles.rotation.x += 0.0003;
      } else {
        this.particles.rotation.y += 0.002;
        this.particles.rotation.x += 0.001;
      }

      // Subtle camera drift
      this.camera.position.x = Math.sin(elapsed * 0.1) * 0.5;
      this.camera.position.y = Math.cos(elapsed * 0.15) * 0.3;

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  private handleResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  public dispose(): void {
    this.stop();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  public getParticleCount(): number {
    return PARTICLE_COUNT;
  }
}
