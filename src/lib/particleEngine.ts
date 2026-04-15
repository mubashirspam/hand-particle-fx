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
  private basePositions!: Float32Array; // permanent sphere, never mutated
  private targetColors!: Float32Array;

  // Gesture state
  private currentGesture: GestureType = GestureType.NONE;
  private currentPalette: ColorPalette = PALETTES.aurora;

  // Face tracking
  private isFaceVisible = false;
  private faceTargetX = 0;
  private faceTargetY = 0;
  private faceSmoothX = 0;
  private faceSmoothY = 0;

  // Face velocity — drives ripple intensity when head moves fast
  private facePrevX = 0;
  private facePrevY = 0;
  private faceVelX  = 0;
  private faceVelY  = 0;

  // Settle optimisation for idle sphere (no face, no gesture)
  private _settled    = false;
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
    this.basePositions   = new Float32Array(PARTICLE_STRIDE);
    this.targetColors    = new Float32Array(PARTICLE_STRIDE);

    const positions = new Float32Array(PARTICLE_STRIDE);
    const colors    = new Float32Array(PARTICLE_STRIDE);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      positions[bi]     = spherePos[bi];
      positions[bi + 1] = spherePos[bi + 1];
      positions[bi + 2] = spherePos[bi + 2];

      this.basePositions[bi]     = spherePos[bi];
      this.basePositions[bi + 1] = spherePos[bi + 1];
      this.basePositions[bi + 2] = spherePos[bi + 2];

      const col = this.currentPalette.colors[i % this.currentPalette.colors.length];
      colors[bi]     = col.r;
      colors[bi + 1] = col.g;
      colors[bi + 2] = col.b;
    }

    this.targetPositions.set(positions);
    this.targetColors.set(colors);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

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
      pos[i * 3]     = (Math.random() - 0.5) * 200;
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

  // ─── Fluid globe update (runs every frame in sphere mode) ─────────────────
  //
  // Without face: particles settle back to the base sphere positions (settled
  // flag skips the loop once converged for performance).
  //
  // With face: five overlapping sinusoidal waves are combined per-particle.
  // Each wave is parameterised by the sphere-surface angles (theta/phi) and
  // driven by face position (fx/fy) and face velocity.  The result looks like
  // a liquid ball that sloshes and ripples as the head moves.

  private updateFluidTargets(elapsed: number): void {
    const hasFace = this.isFaceVisible;

    // When no face and already converged, skip the 30 k-iteration loop
    if (!hasFace) {
      if (this._settled) return;
      if (++this._idleFrames > 90) { this._settled = true; return; }
    } else {
      this._settled    = false;
      this._idleFrames = 0;
    }

    const base    = this.basePositions;
    const targets = this.targetPositions;
    const tColors = this.targetColors;
    const palette = this.currentPalette;

    const fx  = this.faceSmoothX;
    const fy  = this.faceSmoothY;
    const vx  = this.faceVelX;
    const vy  = this.faceVelY;
    // velMag: 0 when still, ~0.5-1.5 during brisk movement (per-frame units × 60)
    const velMag = Math.sqrt(vx * vx + vy * vy);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      const bx = base[bi];
      const by = base[bi + 1];
      const bz = base[bi + 2];

      if (!hasFace) {
        targets[bi]     = bx;
        targets[bi + 1] = by;
        targets[bi + 2] = bz;
        const col = palette.colors[i % palette.colors.length];
        tColors[bi]     = col.r;
        tColors[bi + 1] = col.g;
        tColors[bi + 2] = col.b;
        continue;
      }

      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      const nx = bx / len;
      const ny = by / len;
      const nz = bz / len;

      // Surface-parameterisation angles
      const theta = Math.atan2(by, bx);
      const phi   = Math.acos(Math.max(-1, Math.min(1, nz)));

      // Dot product: +1 when particle faces the head direction, -1 opposite
      const dot = nx * fx + ny * fy;

      // ── Five fluid waves ──────────────────────────────────────────────
      // W1 — large slow wave, phase steered by horizontal face position.
      //      Amplitude grows when face is off-centre horizontally.
      const w1 = Math.sin(elapsed * 0.65 + theta * 2.0 + fx * 3.0)
               * (0.07 + Math.abs(fx) * 0.18);

      // W2 — medium wave, steered by vertical face position.
      const w2 = Math.sin(elapsed * 0.90 + phi * 1.8 + fy * 2.8)
               * (0.05 + Math.abs(fy) * 0.15);

      // W3 — velocity ripple: small high-frequency burst when head moves fast.
      const w3 = Math.sin(elapsed * 2.20 + theta * 4.0 - phi * 1.5)
               * (0.018 + velMag * 0.22);

      // W4 — slow global churn: base fluid motion always present with face.
      const w4 = Math.sin(elapsed * 0.38 + theta * 1.2 + phi * 3.1) * 0.042;

      // W5 — secondary cross-churn in a different spatial direction.
      const w5 = Math.cos(elapsed * 0.55 + theta * 2.8 - phi * 1.9) * 0.028;

      // Directional push: blob bulges toward where the head is looking.
      // Velocity adds extra push during fast movement (sloshing effect).
      const push = dot * (0.18 + velMag * 0.45);

      const r = len * (1.0 + push + w1 + w2 + w3 + w4 + w5);

      targets[bi]     = nx * r;
      targets[bi + 1] = ny * r;
      targets[bi + 2] = nz * r;

      // Colour: face-facing hemisphere glows brighter;
      //         opposite side dims slightly for depth contrast.
      const col    = palette.colors[i % palette.colors.length];
      const bright = 1.0 + 0.55 * Math.max(0, dot) + velMag * 0.50;
      const dim    = 1.0 - 0.20 * Math.max(0, -dot);
      const scale  = dot >= 0 ? bright : dim;
      tColors[bi]     = Math.min(1, col.r * scale);
      tColors[bi + 1] = Math.min(1, col.g * scale);
      tColors[bi + 2] = Math.min(1, col.b * scale);
    }
  }

  // ─── Gesture shape trigger ────────────────────────────────────────────────

  private triggerGestureShape(gesture: GestureType): void {
    const action = getActionForGesture(gesture);
    if (!action) return;

    const shapePos = generateShapePositions(action.shape, PARTICLE_COUNT, SCALE);
    const palette  = action.palette;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      this.targetPositions[bi]     = shapePos[bi];
      this.targetPositions[bi + 1] = shapePos[bi + 1];
      this.targetPositions[bi + 2] = shapePos[bi + 2];

      const col = palette.colors[i % palette.colors.length];
      this.targetColors[bi]     = col.r;
      this.targetColors[bi + 1] = col.g;
      this.targetColors[bi + 2] = col.b;
    }
    this.currentPalette = palette;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Gesture input (highest priority).
   * NONE → release gesture, fluid globe takes over.
   * Non-NONE → snap to gesture shape immediately; holds until gesture changes.
   */
  public setGesture(gesture: GestureType): void {
    if (gesture === GestureType.NONE) {
      if (this.currentGesture === GestureType.NONE) return;
      this.currentGesture  = GestureType.NONE;
      this.currentPalette  = PALETTES.aurora;
      // Re-enter fluid globe — updateFluidTargets will set targets next frame
      this._settled    = false;
      this._idleFrames = 0;
      return;
    }

    if (gesture === this.currentGesture) return;

    const action = getActionForGesture(gesture);
    if (!action) return;

    this.currentGesture = gesture;
    this.triggerGestureShape(gesture);
  }

  /**
   * Face position in normalised image coords [0, 1].
   * Called every frame a face is detected.
   */
  public setFacePosition(x: number, y: number): void {
    this.faceTargetX = -(x - 0.5) * 2; // mirror webcam x, scale to [-1,1]
    this.faceTargetY = -(y - 0.5) * 2; // flip y (image ↓ → world ↑)
  }

  /**
   * Face visibility toggle.
   * Gesture mode has priority — this is ignored while a gesture is active.
   */
  public setFaceVisible(visible: boolean): void {
    if (visible === this.isFaceVisible) return;
    this.isFaceVisible = visible;

    if (!visible) {
      // Decay velocity and reset smooth position so next detection is clean
      this.faceVelX  = 0;
      this.faceVelY  = 0;
      this.faceSmoothX = 0;
      this.faceSmoothY = 0;
    }
    // Reset settle so fluid targets get recomputed on next frame
    this._settled    = false;
    this._idleFrames = 0;
  }

  // ─── Animation loop ───────────────────────────────────────────────────────

  public start(): void {
    let lastFpsTime = performance.now();
    let frameCount  = 0;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const elapsed = this.clock.getElapsedTime();

      // FPS counter
      frameCount++;
      const nowMs = performance.now();
      if (nowMs - lastFpsTime >= 1000) {
        this.onFPS?.(frameCount);
        frameCount = 0;
        lastFpsTime = nowMs;
      }

      // ── Face position & velocity smoothing ───────────────────────────
      if (this.isFaceVisible) {
        // Smooth position
        this.faceSmoothX += (this.faceTargetX - this.faceSmoothX) * 0.07;
        this.faceSmoothY += (this.faceTargetY - this.faceSmoothY) * 0.07;

        // Per-frame delta → smoothed velocity (scaled ×60 to normalise to ~fps)
        const dvx = (this.faceSmoothX - this.facePrevX) * 60;
        const dvy = (this.faceSmoothY - this.facePrevY) * 60;
        this.faceVelX = this.faceVelX * 0.72 + dvx * 0.28;
        this.faceVelY = this.faceVelY * 0.72 + dvy * 0.28;
        this.facePrevX = this.faceSmoothX;
        this.facePrevY = this.faceSmoothY;
      } else {
        // Decay velocity when face disappears
        this.faceVelX *= 0.88;
        this.faceVelY *= 0.88;
      }

      const isGesture = this.currentGesture !== GestureType.NONE;

      // Run fluid update only in sphere mode
      if (!isGesture) {
        this.updateFluidTargets(elapsed);
      }

      // ── CPU lerp ────────────────────────────────────────────────────────
      const pos  = this.geometry.attributes.position.array as Float32Array;
      const col  = this.geometry.attributes.color.array as Float32Array;
      const tpos = this.targetPositions;
      const tcol = this.targetColors;
      const lerpPos = isGesture ? 0.06 : LERP_SPEED;

      for (let i = 0; i < PARTICLE_STRIDE; i++) {
        pos[i] += (tpos[i] - pos[i]) * lerpPos;
      }
      for (let i = 0; i < PARTICLE_STRIDE; i++) {
        col[i] += (tcol[i] - col[i]) * COLOR_LERP;
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate    = true;

      // ── Globe rotation ───────────────────────────────────────────────────
      // Gesture      → damp to zero (shape is static)
      // Fluid (face) → very slow drift so fluid waves are the main motion
      // Idle sphere  → normal gentle rotation
      if (isGesture) {
        this.particles.rotation.y *= 0.97;
        this.particles.rotation.x *= 0.97;
      } else if (this.isFaceVisible) {
        this.particles.rotation.y += 0.0005;
        this.particles.rotation.x += 0.00025;
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
