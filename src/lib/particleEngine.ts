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

// ── Engine modes ────────────────────────────────────────────────────────────
// Priority (high → low):  gesture  >  face  >  sphere
type EngineMode = "sphere" | "face" | "gesture";

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

  // State
  private mode: EngineMode = "sphere";
  private currentGesture: GestureType = GestureType.NONE;
  private currentPalette: ColorPalette = PALETTES.aurora;

  // Face tracking
  private isFaceVisible = false;
  private faceTargetX = 0;   // [-1,1] right=positive
  private faceTargetY = 0;   // [-1,1] up=positive
  private faceSmoothX = 0;
  private faceSmoothY = 0;

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

  // ─── Shape triggers (called once on mode transition) ──────────────────────

  /** Transition → face shape. Particles form a holographic face portrait. */
  private triggerFaceShape(): void {
    const facePos = generateShapePositions(ParticleShape.FACE, PARTICLE_COUNT, SCALE);
    const palette = PALETTES.hologram;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      this.targetPositions[bi]     = facePos[bi];
      this.targetPositions[bi + 1] = facePos[bi + 1];
      this.targetPositions[bi + 2] = facePos[bi + 2];

      const col = palette.colors[i % palette.colors.length];
      this.targetColors[bi]     = col.r;
      this.targetColors[bi + 1] = col.g;
      this.targetColors[bi + 2] = col.b;
    }
    this.currentPalette = palette;
    this.mode = "face";
  }

  /** Transition → sphere. Particles return to base sphere positions. */
  private triggerSphere(): void {
    const palette = PALETTES.aurora;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bi = i * 3;
      this.targetPositions[bi]     = this.basePositions[bi];
      this.targetPositions[bi + 1] = this.basePositions[bi + 1];
      this.targetPositions[bi + 2] = this.basePositions[bi + 2];

      const col = palette.colors[i % palette.colors.length];
      this.targetColors[bi]     = col.r;
      this.targetColors[bi + 1] = col.g;
      this.targetColors[bi + 2] = col.b;
    }
    this.currentPalette = palette;
    this.mode = "sphere";
  }

  /** Transition → gesture shape. */
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
    this.currentPalette = action.palette;
    this.mode = "gesture";
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Gesture input (highest priority).
   * - Non-NONE → switch to gesture shape immediately; hold until gesture changes.
   * - NONE     → drop back to face mode (if face visible) or sphere mode.
   * No timers, no locks.
   */
  public setGesture(gesture: GestureType): void {
    if (gesture === GestureType.NONE) {
      if (this.currentGesture === GestureType.NONE) return; // already clear
      this.currentGesture = GestureType.NONE;
      // Return to the appropriate fallback
      if (this.isFaceVisible) {
        this.triggerFaceShape();
      } else {
        this.triggerSphere();
      }
      return;
    }

    if (gesture === this.currentGesture) return; // same gesture, no-op

    const action = getActionForGesture(gesture);
    if (!action) return;

    this.currentGesture = gesture;
    this.triggerGestureShape(gesture);
  }

  /**
   * Face position in normalised image coords [0,1].
   * Called whenever a face is detected, to steer the particle face's orientation.
   */
  public setFacePosition(x: number, y: number): void {
    // Mirror webcam x; flip y (image y↓ → world y↑)
    this.faceTargetX = -(x - 0.5) * 2;
    this.faceTargetY = -(y - 0.5) * 2;
  }

  /**
   * Face visibility — drives mode transitions between face and sphere.
   * Gesture mode takes priority; this has no effect while a gesture is active.
   */
  public setFaceVisible(visible: boolean): void {
    if (visible === this.isFaceVisible) return;
    this.isFaceVisible = visible;

    if (this.currentGesture !== GestureType.NONE) return; // gesture has priority

    if (visible) {
      this.triggerFaceShape();
    } else {
      // Reset smooth face position so the next detection starts clean
      this.faceSmoothX = 0;
      this.faceSmoothY = 0;
      this.triggerSphere();
    }
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
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        this.onFPS?.(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }

      // Smooth face direction
      if (this.isFaceVisible) {
        this.faceSmoothX += (this.faceTargetX - this.faceSmoothX) * 0.07;
        this.faceSmoothY += (this.faceTargetY - this.faceSmoothY) * 0.07;
      }

      // ── CPU lerp ────────────────────────────────────────────────────────
      const pos  = this.geometry.attributes.position.array as Float32Array;
      const col  = this.geometry.attributes.color.array as Float32Array;
      const tpos = this.targetPositions;
      const tcol = this.targetColors;
      // Face mode uses a slightly slower lerp so the transition feels weightier
      const lerpPos = this.mode === "face" ? 0.04 : LERP_SPEED;

      for (let i = 0; i < PARTICLE_STRIDE; i++) {
        pos[i] += (tpos[i] - pos[i]) * lerpPos;
      }
      for (let i = 0; i < PARTICLE_STRIDE; i++) {
        col[i] += (tcol[i] - col[i]) * COLOR_LERP;
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate    = true;

      // ── Rotation per mode ────────────────────────────────────────────────
      // Gesture → damp to zero (shape is static, no spin)
      // Face    → particle face mirrors real face tilt (yaw + pitch)
      // Sphere  → gentle idle rotation
      if (this.mode === "gesture") {
        this.particles.rotation.y *= 0.97;
        this.particles.rotation.x *= 0.97;
      } else if (this.mode === "face") {
        // Target rotation driven by face position.
        // Face moves right (faceSmoothX < 0) → particle face turns right (neg Y rotation shows right side)
        const tY =  this.faceSmoothX * 0.50;
        const tX = -this.faceSmoothY * 0.35;
        this.particles.rotation.y += (tY - this.particles.rotation.y) * 0.055;
        this.particles.rotation.x += (tX - this.particles.rotation.x) * 0.055;
      } else {
        // Sphere idle rotation
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
