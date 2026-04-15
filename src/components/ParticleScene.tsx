import React, { useEffect, useRef, useState, useCallback } from "react";
import { ParticleEngine } from "@/lib/particleEngine";
import { useHandTracking } from "@/hooks/useHandTracking";
import { HUD } from "./HUD";
import { CameraFeed } from "./CameraFeed";
import { StartScreen } from "./StartScreen";
import { GestureType } from "@/types";

export const ParticleScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fps, setFps] = useState(0);
  const [particleCount, setParticleCount] = useState(0);

  const {
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
  } = useHandTracking();

  // Initialize Three.js engine
  useEffect(() => {
    if (!started || !containerRef.current) return;

    const engine = new ParticleEngine(containerRef.current);
    engine.onFPS = (f) => setFps(f);
    engine.start();
    setParticleCount(engine.getParticleCount());
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [started]);

  // Keep a ref so the latest gesture is accessible without stale closure issues
  const gestureRef = useRef(gesture);
  gestureRef.current = gesture;

  // ── Gesture → globe shape ─────────────────────────────────────────────────
  // Push the current gesture on every hand-center update so the engine always
  // has the latest state; also fire immediately when the gesture itself changes.

  useEffect(() => {
    if (!engineRef.current || !isTracking) return;
    engineRef.current.setGesture(gestureRef.current);
  }, [handCenter, isTracking]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setGesture(gesture);
  }, [gesture]);

  // ── Face fallback → organic sphere animation ───────────────────────────────
  // Face has lower priority than gesture input. The engine ignores face position
  // while a gesture shape is active — only uses it in sphere (NONE) mode.

  useEffect(() => {
    engineRef.current?.setFaceVisible(isFaceTracking);
  }, [isFaceTracking]);

  useEffect(() => {
    if (!engineRef.current || !isFaceTracking) return;
    engineRef.current.setFacePosition(faceCenter.x, faceCenter.y);
  }, [faceCenter, isFaceTracking]);

  const handleStart = useCallback(async () => {
    setLoading(true);
    await startCamera();
    setStarted(true);
    setLoading(false);
  }, [startCamera]);

  return (
    <div className="relative w-full h-full">
      {/* Always mount CameraFeed so videoRef is populated before startCamera runs */}
      <CameraFeed
        videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
        isTracking={isTracking}
        visible={started}
      />

      {!started ? (
        <StartScreen onStart={handleStart} loading={loading} error={error} />
      ) : (
        <>
          {/* Three.js canvas container */}
          <div ref={containerRef} className="absolute inset-0" />

          {/* HUD overlay */}
          <HUD
            gesture={gesture}
            isTracking={isTracking}
            isFaceTracking={isFaceTracking}
            fps={fps}
            particleCount={particleCount}
            cameraActive={started}
          />

          {/* Vignette */}
          <div
            className="fixed inset-0 pointer-events-none z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(3,0,8,0.6) 100%)",
            }}
          />
        </>
      )}
    </div>
  );
};
