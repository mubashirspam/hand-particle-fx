import React from "react";
import { GestureType } from "@/types";
import { getActionForGesture, GESTURE_ACTIONS } from "@/lib/palettes";

interface HUDProps {
  gesture: GestureType;
  isTracking: boolean;
  isFaceTracking: boolean;
  fps: number;
  particleCount: number;
  cameraActive: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  gesture,
  isTracking,
  isFaceTracking,
  fps,
  particleCount,
  cameraActive,
}) => {
  const action = getActionForGesture(gesture);

  return (
    <>
      {/* Top-left: Status */}
      <div className="fixed top-4 left-4 z-30 space-y-2">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isTracking
                ? "bg-green-400 shadow-[0_0_8px_#22c55e]"
                : cameraActive
                ? "bg-yellow-400 shadow-[0_0_8px_#eab308] animate-pulse"
                : "bg-red-400 shadow-[0_0_8px_#ef4444]"
            }`}
          />
          <span className="font-body text-xs text-white/60 uppercase tracking-wider">
            {isTracking ? "Tracking" : cameraActive ? "Searching..." : "Camera Off"}
          </span>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2">
          <span className="font-display text-[10px] text-white/40 tracking-widest">
            {fps} FPS • {(particleCount / 1000).toFixed(0)}K PARTICLES
          </span>
        </div>

        {/* Face tracking indicator — only shown when no hand gesture is active */}
        {!isTracking && isFaceTracking && (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-[#ff44cc]/30 rounded-lg px-3 py-2 shadow-[0_0_12px_rgba(255,68,204,0.2)]">
            <div className="w-2 h-2 rounded-full bg-[#ff44cc] shadow-[0_0_8px_#ff44cc] animate-pulse" />
            <span className="font-body text-xs text-[#ff44cc]/80 uppercase tracking-wider">
              Face Mode
            </span>
          </div>
        )}

      </div>

      {/* Top-right: Current gesture */}
      <div className="fixed top-4 right-4 z-30">
        <div
          className={`bg-black/60 backdrop-blur-md border rounded-xl px-4 py-3 transition-all duration-500 ${
            action
              ? "border-[#00d4ff]/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]"
              : "border-white/10"
          }`}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">{action?.icon ?? "👋"}</div>
            <div className="font-display text-sm text-white/90 tracking-wide">
              {action?.label ?? "No Gesture"}
            </div>
            <div className="font-body text-[10px] text-white/40 mt-1 uppercase tracking-widest">
              {action?.shape ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Gesture guide */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
          <div className="flex gap-3 items-center overflow-x-auto max-w-[90vw] scrollbar-none">
            {GESTURE_ACTIONS.map((a) => (
              <div
                key={a.gesture}
                className={`flex flex-col items-center min-w-[48px] transition-all duration-300 ${
                  gesture === a.gesture
                    ? "scale-110 opacity-100"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <span className="text-lg">{a.icon}</span>
                <span className="font-body text-[8px] text-white/70 mt-1 whitespace-nowrap">
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
