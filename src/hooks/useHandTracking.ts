import { useEffect, useRef, useState, useCallback } from "react";
import { GestureType, HandLandmark } from "@/types";
import {
  detectGesture,
  getHandCenter,
  getHandScale,
} from "@/lib/gestureDetector";

interface HandTrackingResult {
  gesture: GestureType;
  handCenter: { x: number; y: number; z: number };
  handScale: number;
  isTracking: boolean;
  faceCenter: { x: number; y: number };
  isFaceTracking: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  error: string | null;
}

// Face detection keypoint labels and colors
const FACE_KP_COLORS = [
  "#88ddff", // 0: right eye
  "#88ddff", // 1: left eye
  "#ffffff", // 2: nose tip
  "#ff88aa", // 3: mouth center
  "#ffdd44", // 4: right ear
  "#ffdd44", // 5: left ear
];

export function useHandTracking(): HandTrackingResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [handCenter, setHandCenter] = useState({ x: 0.5, y: 0.5, z: 0 });
  const [handScale, setHandScale] = useState(1);
  const [isTracking, setIsTracking] = useState(false);
  const [faceCenter, setFaceCenter] = useState({ x: 0.5, y: 0.5 });
  const [isFaceTracking, setIsFaceTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handsModelRef = useRef<any>(null);
  const faceModelRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Latest results stored in refs so the unified draw call always has both
  const latestHandLandmarks = useRef<HandLandmark[] | null>(null);
  const latestFaceData = useRef<{ bbox: any; keypoints: any[] } | null>(null);

  // Smoothing buffer for gesture stability
  const gestureBuffer = useRef<GestureType[]>([]);
  const BUFFER_SIZE = 5;

  // ── Unified canvas draw: hand skeleton + face overlay ─────────────────────
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // ── Hand skeleton ──────────────────────────────────────────────────────
    const lms = latestHandLandmarks.current;
    if (lms) {
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17],
      ];

      ctx.strokeStyle = "#00d4ff";
      ctx.lineWidth = 1;
      for (const [a, b] of connections) {
        ctx.beginPath();
        ctx.moveTo(lms[a].x * w, lms[a].y * h);
        ctx.lineTo(lms[b].x * w, lms[b].y * h);
        ctx.stroke();
      }

      ctx.fillStyle = "#00d4ff";
      for (const lm of lms) {
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Face overlay ───────────────────────────────────────────────────────
    const face = latestFaceData.current;
    if (face) {
      const bb = face.bbox;
      if (bb) {
        // Bounding box — pink glow
        ctx.save();
        ctx.strokeStyle = "#ff44cc";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#ff44cc";
        ctx.shadowBlur = 8;
        ctx.strokeRect(
          bb.xmin * w,
          bb.ymin * h,
          bb.width * w,
          bb.height * h
        );
        // Tiny corner marks inside the box
        const cx = bb.xmin * w;
        const cy = bb.ymin * h;
        const bw = bb.width * w;
        const bh = bb.height * h;
        const cs = Math.min(bw, bh) * 0.12;
        ctx.lineWidth = 2;
        // TL
        ctx.beginPath(); ctx.moveTo(cx, cy + cs); ctx.lineTo(cx, cy); ctx.lineTo(cx + cs, cy); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(cx + bw - cs, cy); ctx.lineTo(cx + bw, cy); ctx.lineTo(cx + bw, cy + cs); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(cx, cy + bh - cs); ctx.lineTo(cx, cy + bh); ctx.lineTo(cx + cs, cy + bh); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(cx + bw - cs, cy + bh); ctx.lineTo(cx + bw, cy + bh); ctx.lineTo(cx + bw, cy + bh - cs); ctx.stroke();
        ctx.restore();
      }

      // Keypoints (6 face landmarks)
      for (let i = 0; i < face.keypoints.length; i++) {
        const kp = face.keypoints[i];
        const color = FACE_KP_COLORS[i] ?? "#ff44cc";
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(kp.x * w, kp.y * h, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Eye connection line
      if (face.keypoints.length >= 2) {
        const re = face.keypoints[0];
        const le = face.keypoints[1];
        ctx.save();
        ctx.strokeStyle = "rgba(136,221,255,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(re.x * w, re.y * h);
        ctx.lineTo(le.x * w, le.y * h);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, []);

  // ── Hand results ───────────────────────────────────────────────────────────
  const onHandResults = useCallback((results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks: HandLandmark[] = results.multiHandLandmarks[0];
      latestHandLandmarks.current = landmarks;
      setIsTracking(true);

      // Gesture smoothing via mode of buffer
      const rawGesture = detectGesture(landmarks);
      gestureBuffer.current.push(rawGesture);
      if (gestureBuffer.current.length > BUFFER_SIZE) {
        gestureBuffer.current.shift();
      }

      const counts = new Map<GestureType, number>();
      for (const g of gestureBuffer.current) {
        counts.set(g, (counts.get(g) || 0) + 1);
      }
      let modeGesture = GestureType.NONE;
      let maxCount = 0;
      counts.forEach((count, g) => {
        if (count > maxCount) { maxCount = count; modeGesture = g; }
      });
      setGesture(modeGesture);

      const center = getHandCenter(landmarks);
      setHandCenter(center);
      setHandScale(getHandScale(landmarks));
    } else {
      latestHandLandmarks.current = null;
      setIsTracking(false);
      setGesture(GestureType.NONE);
      gestureBuffer.current = [];
    }

    drawOverlay();
  }, [drawOverlay]);

  // ── Face results ───────────────────────────────────────────────────────────
  const onFaceResults = useCallback((results: any) => {
    if (results.detections && results.detections.length > 0) {
      const det = results.detections[0];

      // Normalise bounding box across API versions
      let bbox: { xmin: number; ymin: number; width: number; height: number } | null = null;

      if (det.boundingBox) {
        const bb = det.boundingBox;
        // Some versions give xCenter/yCenter, others give xmin/ymin
        if (bb.xmin != null) {
          bbox = { xmin: bb.xmin, ymin: bb.ymin, width: bb.width, height: bb.height };
        } else if (bb.xCenter != null) {
          bbox = {
            xmin: bb.xCenter - bb.width / 2,
            ymin: bb.yCenter - bb.height / 2,
            width: bb.width,
            height: bb.height,
          };
        }
      } else if (det.locationData?.relativeBoundingBox) {
        const bb = det.locationData.relativeBoundingBox;
        bbox = { xmin: bb.xmin, ymin: bb.ymin, width: bb.width, height: bb.height };
      }

      // Normalise keypoints / landmarks
      let keypoints: { x: number; y: number }[] = [];
      const rawKps = det.keypoints ?? det.landmarks ?? det.locationData?.relativeKeypoints ?? [];
      for (const kp of rawKps) {
        if (kp.x != null && kp.y != null) keypoints.push({ x: kp.x, y: kp.y });
      }

      latestFaceData.current = { bbox, keypoints };

      // Use nose tip (index 2) for accurate center; fall back to bounding box center
      let cx = 0.5, cy = 0.5;
      if (keypoints.length > 2) {
        cx = keypoints[2].x; // nose tip
        cy = keypoints[2].y;
      } else if (bbox) {
        cx = bbox.xmin + bbox.width / 2;
        cy = bbox.ymin + bbox.height / 2;
      }

      setFaceCenter({ x: cx, y: cy });
      setIsFaceTracking(true);
    } else {
      latestFaceData.current = null;
      setIsFaceTracking(false);
    }

    drawOverlay();
  }, [drawOverlay]);

  // ── Camera start ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    // Guard: if already initialised, skip to prevent double-init of WASM
    if (handsModelRef.current || cameraRef.current) return;

    try {
      setError(null);

      const { Hands } = await import("@mediapipe/hands");
      // Face detection disabled
      // const { FaceDetection } = await import("@mediapipe/face_detection");
      const { Camera } = await import("@mediapipe/camera_utils");

      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onHandResults);
      handsModelRef.current = hands;

      // Face detection disabled — uncomment to re-enable
      // const faceDetection = new FaceDetection({ locateFile: (file) =>
      //   `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}` });
      // faceDetection.setOptions({ model: "short", minDetectionConfidence: 0.4 });
      // faceDetection.onResults(onFaceResults);
      // faceModelRef.current = faceDetection;

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!videoRef.current) return;
            if (handsModelRef.current) {
              await handsModelRef.current.send({ image: videoRef.current });
            }
            // Face detection disabled
            // if (faceModelRef.current) {
            //   await faceModelRef.current.send({ image: videoRef.current });
            // }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current = camera;
        await camera.start();
        streamRef.current = videoRef.current.srcObject as MediaStream;
      }
    } catch (err: any) {
      console.error("Camera init error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permission."
          : "Failed to initialize camera. Please try again."
      );
    }
  }, [onHandResults, onFaceResults]);

  // ── Camera stop ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      streamRef.current = null;
    }
    if (handsModelRef.current) {
      handsModelRef.current.close();
      handsModelRef.current = null;
    }
    if (faceModelRef.current) {
      faceModelRef.current.close();
      faceModelRef.current = null;
    }
    latestHandLandmarks.current = null;
    latestFaceData.current = null;
    setIsTracking(false);
    setGesture(GestureType.NONE);
    setIsFaceTracking(false);
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  return {
    gesture,
    handCenter,
    handScale,
    isTracking,
    faceCenter,
    isFaceTracking,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    error,
  };
}
