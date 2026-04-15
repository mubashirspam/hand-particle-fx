import React, { useEffect, useRef, useState } from "react";
import { ParticleEngine } from "@/lib/particleEngine";
import { useHandTracking } from "@/hooks/useHandTracking";
import { HUD } from "./HUD";
import { CameraFeed } from "./CameraFeed";

export const ParticleScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);

  const [started, setStarted] = useState(false);
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
    error,
  } = useHandTracking();

  // Auto-start camera on mount — no user interaction required
  useEffect(() => {
    startCamera().then(() => setStarted(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Three.js engine once camera is ready
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

  // Keep latest gesture in a ref to avoid stale closures
  const gestureRef = useRef(gesture);
  gestureRef.current = gesture;

  // Gesture → globe shape
  useEffect(() => {
    if (!engineRef.current || !isTracking) return;
    engineRef.current.setGesture(gestureRef.current);
  }, [handCenter, isTracking]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setGesture(gesture);
  }, [gesture]);

  // Face tracking → fluid globe
  useEffect(() => {
    engineRef.current?.setFaceVisible(isFaceTracking);
  }, [isFaceTracking]);

  useEffect(() => {
    if (!engineRef.current || !isFaceTracking) return;
    engineRef.current.setFacePosition(faceCenter.x, faceCenter.y);
  }, [faceCenter, isFaceTracking]);

  return (
    <div className="relative w-full h-full">
      {/* Camera feed — always mounted so videoRef is ready */}
      <CameraFeed
        videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
        isTracking={isTracking}
        visible={started}
      />

      {/* Show a minimal loading state while camera initialises */}
      {!started && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[#00d4ff]/40 border-t-[#00d4ff] animate-spin" />
            {error ? (
              <p className="font-body text-red-400 text-sm px-6 text-center">{error}</p>
            ) : (
              <p className="font-body text-white/40 text-xs tracking-widest uppercase">
                Initialising…
              </p>
            )}
          </div>
        </div>
      )}

      {started && (
        <>
          {/* Three.js canvas */}
          <div ref={containerRef} className="absolute inset-0" />

          {/* HUD */}
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
