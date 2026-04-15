import * as THREE from "three";
import {
  ColorPalette,
  GestureAction,
  GestureType,
  ParticleShape,
} from "@/types";

/* ─── Color Palettes ─── */
export const PALETTES: Record<string, ColorPalette> = {
  aurora: {
    name: "Aurora",
    colors: [
      new THREE.Color(0x00d4ff),
      new THREE.Color(0x00ffaa),
      new THREE.Color(0xa855f7),
      new THREE.Color(0x22d3ee),
    ],
  },
  fireStorm: {
    name: "Fire Storm",
    colors: [
      new THREE.Color(0xff4500),
      new THREE.Color(0xff8c00),
      new THREE.Color(0xffd700),
      new THREE.Color(0xff1493),
    ],
  },
  cosmicPurple: {
    name: "Cosmic Purple",
    colors: [
      new THREE.Color(0x9333ea),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xc084fc),
      new THREE.Color(0xe879f9),
    ],
  },
  neonCity: {
    name: "Neon City",
    colors: [
      new THREE.Color(0xff00ff),
      new THREE.Color(0x00ffff),
      new THREE.Color(0xff0080),
      new THREE.Color(0x80ff00),
    ],
  },
  oceanDeep: {
    name: "Ocean Deep",
    colors: [
      new THREE.Color(0x0077be),
      new THREE.Color(0x00b4d8),
      new THREE.Color(0x0096c7),
      new THREE.Color(0x48cae4),
    ],
  },
  rosegold: {
    name: "Rose Gold",
    colors: [
      new THREE.Color(0xb76e79),
      new THREE.Color(0xf4c2c2),
      new THREE.Color(0xe8a0bf),
      new THREE.Color(0xffd1dc),
    ],
  },
  emerald: {
    name: "Emerald",
    colors: [
      new THREE.Color(0x00ff87),
      new THREE.Color(0x10b981),
      new THREE.Color(0x34d399),
      new THREE.Color(0x6ee7b7),
    ],
  },
  sunsetBlaze: {
    name: "Sunset Blaze",
    colors: [
      new THREE.Color(0xf97316),
      new THREE.Color(0xef4444),
      new THREE.Color(0xeab308),
      new THREE.Color(0xfb923c),
    ],
  },
  iceStorm: {
    name: "Ice Storm",
    colors: [
      new THREE.Color(0xbfdbfe),
      new THREE.Color(0x93c5fd),
      new THREE.Color(0xe0f2fe),
      new THREE.Color(0xdbeafe),
    ],
  },
  ironMan: {
    name: "Iron Man",
    colors: [
      new THREE.Color(0xff0000),
      new THREE.Color(0xffd700),
      new THREE.Color(0xff4500),
      new THREE.Color(0xffffff),
    ],
  },
  rainbow: {
    name: "Rainbow",
    colors: [
      new THREE.Color(0xff0000),
      new THREE.Color(0x00ff00),
      new THREE.Color(0x0000ff),
      new THREE.Color(0xffff00),
    ],
  },
};

/* ─── Gesture → Action Mapping ─── */
export const GESTURE_ACTIONS: GestureAction[] = [
  {
    gesture: GestureType.OPEN_PALM,
    shape: ParticleShape.SPHERE,
    palette: PALETTES.aurora,
    particleSize: 3.0,
    expansion: 1.0,
    label: "Energy Sphere",
    icon: "🖐️",
  },
  {
    gesture: GestureType.FIST,
    shape: ParticleShape.FIREWORK,
    palette: PALETTES.fireStorm,
    particleSize: 4.0,
    expansion: 0.3,
    label: "Power Charge",
    icon: "✊",
  },
  {
    gesture: GestureType.PINCH,
    shape: ParticleShape.GALAXY,
    palette: PALETTES.cosmicPurple,
    particleSize: 2.0,
    expansion: 0.5,
    label: "Micro Galaxy",
    icon: "🤏",
  },
  {
    gesture: GestureType.POINT,
    shape: ParticleShape.SPIRAL,
    palette: PALETTES.neonCity,
    particleSize: 2.5,
    expansion: 1.5,
    label: "Energy Beam",
    icon: "👆",
  },
  {
    gesture: GestureType.PEACE,
    shape: ParticleShape.BUTTERFLY,
    palette: PALETTES.rosegold,
    particleSize: 3.0,
    expansion: 1.2,
    label: "Butterfly Effect",
    icon: "✌️",
  },
  {
    gesture: GestureType.THUMBS_UP,
    shape: ParticleShape.PHOENIX,
    palette: PALETTES.sunsetBlaze,
    particleSize: 3.5,
    expansion: 1.3,
    label: "Phoenix Rise",
    icon: "👍",
  },
  {
    gesture: GestureType.IRON_MAN,
    shape: ParticleShape.HEART,
    palette: PALETTES.ironMan,
    particleSize: 4.5,
    expansion: 2.0,
    label: "Repulsor Blast",
    icon: "🤙",
  },
  {
    gesture: GestureType.ROCK,
    shape: ParticleShape.DNA,
    palette: PALETTES.emerald,
    particleSize: 2.5,
    expansion: 1.0,
    label: "Rock & Code",
    icon: "🤘",
  },
  {
    gesture: GestureType.OK_SIGN,
    shape: ParticleShape.INFINITY,
    palette: PALETTES.oceanDeep,
    particleSize: 3.0,
    expansion: 1.0,
    label: "Perfect Loop",
    icon: "👌",
  },
  {
    gesture: GestureType.SPREAD,
    shape: ParticleShape.LOTUS,
    palette: PALETTES.iceStorm,
    particleSize: 3.5,
    expansion: 2.5,
    label: "Cosmic Bloom",
    icon: "🖐️✨",
  },
];

export function getActionForGesture(
  gesture: GestureType
): GestureAction | undefined {
  return GESTURE_ACTIONS.find((a) => a.gesture === gesture);
}
