import { GestureType, HandLandmark } from "@/types";

/**
 * Euclidean distance between two landmarks
 */
function dist(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/**
 * Check if a finger is extended by comparing tip-to-wrist vs pip-to-wrist
 */
function isFingerExtended(
  landmarks: HandLandmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number
): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const tipDist = dist(tip, wrist);
  const pipDist = dist(pip, wrist);
  const mcpDist = dist(mcp, wrist);

  return tipDist > pipDist && tipDist > mcpDist * 0.9;
}

/**
 * Detect gesture from 21 hand landmarks
 */
export function detectGesture(landmarks: HandLandmark[]): GestureType {
  if (!landmarks || landmarks.length < 21) return GestureType.NONE;

  // Finger indices: [tip, dip, pip, mcp]
  // Thumb:  4, 3, 2, 1
  // Index:  8, 7, 6, 5
  // Middle: 12, 11, 10, 9
  // Ring:   16, 15, 14, 13
  // Pinky:  20, 19, 18, 17

  const thumbExtended = isFingerExtended(landmarks, 4, 3, 2);
  const indexExtended = isFingerExtended(landmarks, 8, 7, 5);
  const middleExtended = isFingerExtended(landmarks, 12, 11, 9);
  const ringExtended = isFingerExtended(landmarks, 16, 15, 13);
  const pinkyExtended = isFingerExtended(landmarks, 20, 19, 17);

  const thumbTipToIndexTip = dist(landmarks[4], landmarks[8]);
  const palmSize = dist(landmarks[0], landmarks[9]);

  const extendedCount = [
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
  ].filter(Boolean).length;

  // === IRON MAN: thumb + pinky extended, middle fingers curled ===
  if (
    thumbExtended &&
    pinkyExtended &&
    !indexExtended &&
    !middleExtended &&
    !ringExtended
  ) {
    return GestureType.IRON_MAN;
  }

  // === PINCH: thumb and index tips close together ===
  if (thumbTipToIndexTip < palmSize * 0.25 && !middleExtended) {
    return GestureType.PINCH;
  }

  // === OK SIGN: thumb and index form a circle, others extended ===
  if (
    thumbTipToIndexTip < palmSize * 0.25 &&
    middleExtended &&
    ringExtended &&
    pinkyExtended
  ) {
    return GestureType.OK_SIGN;
  }

  // === FIST: no fingers extended ===
  if (extendedCount <= 1 && !indexExtended && !middleExtended) {
    return GestureType.FIST;
  }

  // === POINT: only index extended ===
  if (
    indexExtended &&
    !middleExtended &&
    !ringExtended &&
    !pinkyExtended
  ) {
    return GestureType.POINT;
  }

  // === PEACE: index + middle extended ===
  if (
    indexExtended &&
    middleExtended &&
    !ringExtended &&
    !pinkyExtended
  ) {
    return GestureType.PEACE;
  }

  // === ROCK: index + pinky extended (rock sign) ===
  if (
    indexExtended &&
    pinkyExtended &&
    !middleExtended &&
    !ringExtended
  ) {
    return GestureType.ROCK;
  }

  // === THUMBS UP: only thumb extended ===
  if (
    thumbExtended &&
    !indexExtended &&
    !middleExtended &&
    !ringExtended &&
    !pinkyExtended
  ) {
    return GestureType.THUMBS_UP;
  }

  // === SPREAD: all fingers wide apart ===
  if (extendedCount >= 4) {
    const indexMiddleDist = dist(landmarks[8], landmarks[12]);
    if (indexMiddleDist > palmSize * 0.4) {
      return GestureType.SPREAD;
    }
  }

  // === OPEN PALM: all/most fingers extended ===
  if (extendedCount >= 4) {
    return GestureType.OPEN_PALM;
  }

  return GestureType.NONE;
}

/**
 * Get hand center position from landmarks (normalized 0-1)
 */
export function getHandCenter(landmarks: HandLandmark[]): {
  x: number;
  y: number;
  z: number;
} {
  if (!landmarks || landmarks.length < 21)
    return { x: 0.5, y: 0.5, z: 0 };

  // Use palm center (average of wrist, index_mcp, middle_mcp, ring_mcp, pinky_mcp)
  const palmIndices = [0, 5, 9, 13, 17];
  const center = { x: 0, y: 0, z: 0 };
  for (const i of palmIndices) {
    center.x += landmarks[i].x;
    center.y += landmarks[i].y;
    center.z += landmarks[i].z;
  }
  center.x /= palmIndices.length;
  center.y /= palmIndices.length;
  center.z /= palmIndices.length;

  return center;
}

/**
 * Get hand scale (distance from wrist to middle finger tip)
 */
export function getHandScale(landmarks: HandLandmark[]): number {
  if (!landmarks || landmarks.length < 21) return 1;
  return dist(landmarks[0], landmarks[12]);
}
