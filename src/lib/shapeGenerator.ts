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
