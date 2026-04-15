import React from "react";

interface StartScreenProps {
  onStart: () => void;
  loading: boolean;
  error: string | null;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  loading,
  error,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "drift 20s linear infinite",
        }}
      />

      <div className="relative text-center px-5 w-full max-w-sm sm:max-w-lg">
        {/* Glowing orb */}
        <div className="mx-auto mb-6 sm:mb-8 relative w-24 h-24 sm:w-32 sm:h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#a855f7]/20 animate-pulse" />
          <div
            className="absolute inset-3 sm:inset-4 rounded-full border border-[#00d4ff]/30"
            style={{ animation: "spin 8s linear infinite" }}
          />
          <div
            className="absolute inset-6 sm:inset-8 rounded-full border border-[#a855f7]/30"
            style={{ animation: "spin 6s linear infinite reverse" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl">
            ✦
          </div>
        </div>

        <h1
          className="font-display text-2xl sm:text-3xl md:text-5xl font-black tracking-wider mb-2 sm:mb-3"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #a855f7, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PARTICLE FX
        </h1>

        <p className="font-body text-white/50 text-xs sm:text-sm md:text-base mb-2 tracking-wide">
          Hand Gesture Particle Engine
        </p>

        <p className="font-body text-white/30 text-xs mb-6 sm:mb-8 max-w-xs mx-auto leading-relaxed hidden sm:block">
          Use your camera to track hand gestures and control 30,000 particles in
          real-time. Make a fist, spread your fingers, flash a peace sign —
          each gesture triggers unique shapes, colors, and effects.
        </p>

        {/* Short version for mobile */}
        <p className="font-body text-white/30 text-[11px] mb-6 max-w-[260px] mx-auto leading-relaxed sm:hidden">
          Control 30,000 particles with hand gestures in real-time.
        </p>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-red-400 text-xs sm:text-sm font-body">{error}</p>
          </div>
        )}

        <button
          onClick={onStart}
          disabled={loading}
          className="group relative font-display text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase
            w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-4 rounded-full
            border border-[#00d4ff]/40 text-white/90 hover:text-white
            transition-all duration-500 hover:border-[#00d4ff]/80
            hover:shadow-[0_0_40px_rgba(0,212,255,0.3)]
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">
            {loading ? "INITIALIZING…" : "ENABLE CAMERA & START"}
          </span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>

        <p className="mt-5 font-body text-white/20 text-[10px] tracking-widest uppercase">
          Requires webcam · Works best in Chrome
        </p>
      </div>

      <style jsx>{`
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
