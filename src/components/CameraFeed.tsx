import React from "react";

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isTracking: boolean;
  visible: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  canvasRef,
  isTracking,
  visible,
}) => {
  return (
    <div
      className={`
        fixed z-20 rounded-xl overflow-hidden border transition-all duration-500
        bottom-20 right-2 w-[120px] h-[90px]
        sm:bottom-20 sm:right-4 sm:w-[160px] sm:h-[120px]
        md:w-[200px] md:h-[150px]
        ${isTracking
          ? "border-[#00d4ff]/40 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          : "border-white/10"
        }
        ${visible ? "" : "hidden"}
      `}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.03) 2px, rgba(0,212,255,0.03) 4px)",
        }}
      />

      {/* Corner marks */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#00d4ff]/50" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#00d4ff]/50" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#00d4ff]/50" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#00d4ff]/50" />
    </div>
  );
};
