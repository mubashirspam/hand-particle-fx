import * as THREE from "three";
import { ParticleShape } from "@/types";

/**
 * Generate target positions for particle shape templates
 */
export function generateShapePositions(
  shape: ParticleShape,
  count: number,
  scale: number = 1
): Float32Array {
  const positions = new Float32Array(count * 3);

  switch (shape) {
    case ParticleShape.FACE:
      generateFace(positions, count, scale);
      break;
    case ParticleShape.HEART:
      generateHeart(positions, count, scale);
      break;
    case ParticleShape.FLOWER:
      generateFlower(positions, count, scale);
      break;
    case ParticleShape.LOTUS:
      generateLotus(positions, count, scale);
      break;
    case ParticleShape.SATURN:
      generateSaturn(positions, count, scale);
      break;
    case ParticleShape.FIREWORK:
      generateFirework(positions, count, scale);
      break;
    case ParticleShape.SPIRAL:
      generateSpiral(positions, count, scale);
      break;
    case ParticleShape.DNA:
      generateDNA(positions, count, scale);
      break;
    case ParticleShape.GALAXY:
      generateGalaxy(positions, count, scale);
      break;
    case ParticleShape.BUTTERFLY:
      generateButterfly(positions, count, scale);
      break;
    case ParticleShape.PHOENIX:
      generatePhoenix(positions, count, scale);
      break;
    case ParticleShape.INFINITY:
      generateInfinity(positions, count, scale);
      break;
    default:
      generateSphere(positions, count, scale);
  }

  return positions;
}

function generateSphere(pos: Float32Array, count: number, s: number) {
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = s * (0.8 + Math.random() * 0.2);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
}

function generateHeart(pos: Float32Array, count: number, s: number) {
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.5;
    // 3D heart parametric
    const x = 16 * Math.sin(t) ** 3;
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    const z = (Math.random() - 0.5) * 4;
    pos[i * 3] = (x * s * r) / 18;
    pos[i * 3 + 1] = (y * s * r) / 18;
    pos[i * 3 + 2] = (z * s) / 18;
  }
}

function generateFlower(pos: Float32Array, count: number, s: number) {
  const petals = 6;
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const r =
      s * (0.3 + 0.7 * Math.abs(Math.cos((petals * t) / 2))) * (0.6 + Math.random() * 0.4);
    const z = (Math.random() - 0.5) * s * 0.3;
    pos[i * 3] = r * Math.cos(t);
    pos[i * 3 + 1] = r * Math.sin(t);
    pos[i * 3 + 2] = z;
  }
}

function generateLotus(pos: Float32Array, count: number, s: number) {
  const layers = 4;
  for (let i = 0; i < count; i++) {
    const layer = Math.floor((i / count) * layers);
    const t = (i / count) * Math.PI * 2 * 3;
    const petalAngle = (layer / layers) * 0.6;
    const r = s * (0.3 + (layer / layers) * 0.7) * (0.7 + Math.random() * 0.3);
    pos[i * 3] = r * Math.cos(t);
    pos[i * 3 + 1] = r * Math.sin(t) * Math.cos(petalAngle) + layer * s * 0.08;
    pos[i * 3 + 2] = r * Math.sin(t) * Math.sin(petalAngle) * 0.3;
  }
}

function generateSaturn(pos: Float32Array, count: number, s: number) {
  const ringCount = Math.floor(count * 0.6);
  // Planet sphere
  for (let i = 0; i < count - ringCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = s * 0.35;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  // Ring
  for (let i = count - ringCount; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = s * (0.55 + Math.random() * 0.4);
    pos[i * 3] = r * Math.cos(theta);
    pos[i * 3 + 1] = (Math.random() - 0.5) * s * 0.04;
    pos[i * 3 + 2] = r * Math.sin(theta) * 0.3;
  }
}

function generateFirework(pos: Float32Array, count: number, s: number) {
  const bursts = 5;
  for (let i = 0; i < count; i++) {
    const burst = i % bursts;
    const angle = (burst / bursts) * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = s * (0.3 + Math.random() * 0.7);
    const offsetX = Math.cos(angle) * s * 0.3;
    const offsetY = Math.sin(angle) * s * 0.3;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 0.4 + offsetX;
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4 + offsetY;
    pos[i * 3 + 2] = r * Math.cos(phi) * 0.4;
  }
}

function generateSpiral(pos: Float32Array, count: number, s: number) {
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 8;
    const r = (i / count) * s;
    const y = ((i / count) - 0.5) * s * 2;
    pos[i * 3] = r * Math.cos(t) * (0.8 + Math.random() * 0.2);
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = r * Math.sin(t) * (0.8 + Math.random() * 0.2);
  }
}

function generateDNA(pos: Float32Array, count: number, s: number) {
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 6;
    const y = ((i / count) - 0.5) * s * 3;
    const strand = i % 2 === 0 ? 1 : -1;
    const r = s * 0.35;
    pos[i * 3] = r * Math.cos(t) * strand + (Math.random() - 0.5) * 0.05;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = r * Math.sin(t) * strand + (Math.random() - 0.5) * 0.05;
  }
}

function generateGalaxy(pos: Float32Array, count: number, s: number) {
  const arms = 3;
  for (let i = 0; i < count; i++) {
    const arm = i % arms;
    const armAngle = (arm / arms) * Math.PI * 2;
    const distance = Math.random() * s;
    const spiralAngle = distance * 3 + armAngle;
    const scatter = (1 - distance / s) * 0.3 + 0.05;
    pos[i * 3] = distance * Math.cos(spiralAngle) + (Math.random() - 0.5) * scatter * s;
    pos[i * 3 + 1] = (Math.random() - 0.5) * s * 0.08 * (1 + distance * 0.5);
    pos[i * 3 + 2] = distance * Math.sin(spiralAngle) + (Math.random() - 0.5) * scatter * s;
  }
}

function generateButterfly(pos: Float32Array, count: number, s: number) {
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const r =
      s *
      0.6 *
      (Math.exp(Math.cos(t)) -
        2 * Math.cos(4 * t) -
        Math.sin(t / 12) ** 5) *
      0.15;
    const side = i < count / 2 ? 1 : -1;
    pos[i * 3] = Math.abs(r) * Math.cos(t) * side;
    pos[i * 3 + 1] = Math.abs(r) * Math.sin(t);
    pos[i * 3 + 2] = (Math.random() - 0.5) * s * 0.1;
  }
}

function generatePhoenix(pos: Float32Array, count: number, s: number) {
  // Body + wings
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    if (i < count * 0.3) {
      // Body
      const y = ((i / (count * 0.3)) - 0.5) * s * 1.5;
      const bodyR = s * 0.15 * Math.cos((y / s) * 1.5);
      pos[i * 3] = bodyR * Math.cos(t * 5) + (Math.random() - 0.5) * 0.02;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = bodyR * Math.sin(t * 5) * 0.3;
    } else {
      // Wings
      const wingT = ((i - count * 0.3) / (count * 0.7)) * Math.PI;
      const side = i % 2 === 0 ? 1 : -1;
      const wingspan = s * Math.sin(wingT) * (0.6 + Math.random() * 0.4);
      pos[i * 3] = wingspan * side;
      pos[i * 3 + 1] = Math.cos(wingT) * s * 0.3 + Math.sin(wingT * 2) * s * 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * s * 0.08;
    }
  }
}

/**
 * Face shape — viewed face-on (like a hologram portrait).
 * Features: head oval outline, filled eyes, eyebrows, nose bridge + nostrils,
 * upper/lower lips, sparse face-surface fill for depth.
 */
function generateFace(pos: Float32Array, count: number, s: number) {
  let pi = 0;

  const noise = (mag: number) => (Math.random() - 0.5) * mag;

  const put = (x: number, y: number, z: number) => {
    if (pi >= count) return;
    pos[pi * 3]     = x;
    pos[pi * 3 + 1] = y;
    pos[pi * 3 + 2] = z;
    pi++;
  };

  // Head proportions
  const hw = s * 0.62;  // head half-width
  const hh = s * 0.80;  // head half-height

  // Eye geometry
  const eyeY =  s * 0.22;
  const eyeX =  s * 0.25;
  const eaw  =  s * 0.145; // eye ellipse semi-width
  const eah  =  s * 0.088; // eye ellipse semi-height

  // Mouth geometry
  const mouthY = -s * 0.42;
  const mouthW =  s * 0.28;

  // ── Head outline ────────────────────────────────────────────────────────
  const nHead = Math.floor(count * 0.16);
  for (let i = 0; i < nHead; i++) {
    const t = (i / nHead) * Math.PI * 2;
    put(
      hw * Math.cos(t) + noise(s * 0.013),
      hh * Math.sin(t) + noise(s * 0.013),
      noise(s * 0.016)
    );
  }

  // ── Left eye (filled ellipse, uniform density) ───────────────────────
  const nEye = Math.floor(count * 0.14);
  for (let i = 0; i < nEye; i++) {
    const r = Math.sqrt(Math.random()); // sqrt → uniform area distribution
    const t = Math.random() * Math.PI * 2;
    put(
      -eyeX + r * eaw * Math.cos(t) + noise(s * 0.006),
       eyeY + r * eah * Math.sin(t) + noise(s * 0.006),
       s * 0.042 + noise(s * 0.010)
    );
  }

  // ── Right eye ────────────────────────────────────────────────────────
  for (let i = 0; i < nEye; i++) {
    const r = Math.sqrt(Math.random());
    const t = Math.random() * Math.PI * 2;
    put(
       eyeX + r * eaw * Math.cos(t) + noise(s * 0.006),
       eyeY + r * eah * Math.sin(t) + noise(s * 0.006),
       s * 0.042 + noise(s * 0.010)
    );
  }

  // ── Eyebrows ─────────────────────────────────────────────────────────
  const nBrow = Math.floor(count * 0.08);
  const halfBrow = Math.floor(nBrow / 2);
  for (let i = 0; i < nBrow; i++) {
    const isRight = i >= halfBrow;
    const t = ((isRight ? i - halfBrow : i) / halfBrow) - 0.5; // [-0.5, 0.5]
    const xBase = isRight ? eyeX : -eyeX;
    const arch = (1 - 4 * t * t) * s * 0.024; // quadratic arch
    put(
      xBase + t * s * 0.20 + noise(s * 0.010),
      eyeY + s * 0.135 + arch + noise(s * 0.012),
      s * 0.030 + noise(s * 0.008)
    );
  }

  // ── Nose bridge + nostrils ────────────────────────────────────────────
  const nNose = Math.floor(count * 0.09);
  for (let i = 0; i < nNose; i++) {
    const t = i / nNose;
    if (t < 0.55) {
      // Bridge: vertical line from just below brows down
      const bt = t / 0.55; // 0→1
      put(
        noise(s * 0.022),
        s * 0.10 - bt * s * 0.26 + noise(s * 0.014),
        s * 0.050 + noise(s * 0.010)
      );
    } else {
      // Nostrils: two small semicircular arcs
      const nt = (t - 0.55) / 0.45; // 0→1
      const side = nt < 0.5 ? -1.0 : 1.0;
      const lt = nt < 0.5 ? nt * 2.0 : (nt - 0.5) * 2.0; // 0→1
      const ang = lt * Math.PI;
      put(
        side * s * 0.10 + Math.sin(ang) * s * 0.060 + noise(s * 0.010),
        -s * 0.160 - Math.cos(ang) * s * 0.032 + noise(s * 0.010),
        s * 0.062 + noise(s * 0.008)
      );
    }
  }

  // ── Mouth (upper + lower lips) ────────────────────────────────────────
  const nMouth = Math.floor(count * 0.13);
  const halfMouth = Math.floor(nMouth / 2);
  for (let i = 0; i < nMouth; i++) {
    const isLower = i >= halfMouth;
    const t = (isLower ? (i - halfMouth) / halfMouth : i / halfMouth); // [0,1]
    const ang = (t - 0.5) * Math.PI * 0.88; // arc span
    if (!isLower) {
      // Upper lip: subtle cupid's bow
      const cupid = Math.cos(ang * 2.0) * s * 0.014;
      put(
        Math.sin(ang) * mouthW + noise(s * 0.012),
        mouthY + s * 0.028 + cupid + noise(s * 0.010),
        s * 0.028 + noise(s * 0.008)
      );
    } else {
      // Lower lip: fuller downward curve
      const fullness = Math.cos(ang) * s * 0.036;
      put(
        Math.sin(ang) * mouthW * 0.88 + noise(s * 0.012),
        mouthY - s * 0.018 - fullness + noise(s * 0.010),
        s * 0.028 + noise(s * 0.008)
      );
    }
  }

  // ── Face-surface fill (sparse, gives hologram depth) ─────────────────
  const nFill = count - pi;
  for (let i = 0; i < nFill; i++) {
    const r = Math.sqrt(Math.random()) * 0.90;
    const t = Math.random() * Math.PI * 2;
    put(
      r * hw * Math.cos(t) + noise(s * 0.012),
      r * hh * Math.sin(t) + noise(s * 0.012),
      noise(s * 0.032)
    );
  }
}

function generateInfinity(pos: Float32Array, count: number, s: number) {
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const r = s * 0.6;
    // Lemniscate of Bernoulli
    const denom = 1 + Math.sin(t) ** 2;
    pos[i * 3] = (r * Math.cos(t)) / denom + (Math.random() - 0.5) * 0.05;
    pos[i * 3 + 1] = (r * Math.sin(t) * Math.cos(t)) / denom + (Math.random() - 0.5) * 0.05;
    pos[i * 3 + 2] = (Math.random() - 0.5) * s * 0.15;
  }
}
