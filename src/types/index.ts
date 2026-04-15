import * as THREE from "three";

/* ─── Hand Tracking Types ─── */
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: { label: string; score: number }[];
}

/* ─── Gesture Types ─── */
export enum GestureType {
  NONE = "none",
  OPEN_PALM = "open_palm",
  FIST = "fist",
  PINCH = "pinch",
  POINT = "point",
  PEACE = "peace",
  THUMBS_UP = "thumbs_up",
  IRON_MAN = "iron_man",
  ROCK = "rock",
  OK_SIGN = "ok_sign",
  SPREAD = "spread",
}

/* ─── Particle Shape Templates ─── */
export enum ParticleShape {
  SPHERE = "sphere",
  HEART = "heart",
  FLOWER = "flower",
  LOTUS = "lotus",
  SATURN = "saturn",
  FIREWORK = "firework",
  SPIRAL = "spiral",
  DNA = "dna",
  GALAXY = "galaxy",
  BUTTERFLY = "butterfly",
  PHOENIX = "phoenix",
  INFINITY = "infinity",
}

/* ─── Color Palette ─── */
export interface ColorPalette {
  name: string;
  colors: THREE.Color[];
}

/* ─── Particle System Config ─── */
export interface ParticleConfig {
  count: number;
  size: number;
  shape: ParticleShape;
  palette: ColorPalette;
  speed: number;
  spread: number;
  turbulence: number;
  trail: boolean;
  glow: number;
  pulseRate: number;
}

/* ─── Gesture → Action Mapping ─── */
export interface GestureAction {
  gesture: GestureType;
  shape: ParticleShape;
  palette: ColorPalette;
  particleSize: number;
  expansion: number;
  label: string;
  icon: string;
}

/* ─── App State ─── */
export interface AppState {
  currentGesture: GestureType;
  currentShape: ParticleShape;
  handPosition: THREE.Vector3;
  handScale: number;
  isTracking: boolean;
  fps: number;
  particleCount: number;
}
