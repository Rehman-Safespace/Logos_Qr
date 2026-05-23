import React from "react";
import { motion } from "motion/react";

interface MandalaProps {
  isLoading: boolean;
  activityLevel: "idle" | "searching" | "analyzing" | "completed";
  dataLoad?: number; // 0 to 100
}

export default function ArabesqueMandala({ isLoading, activityLevel, dataLoad = 20 }: MandalaProps) {
  // Determine rotation speeds and visual effects based on Neural Expressive activity
  const outerSpeed = activityLevel === "searching" ? 4 : activityLevel === "analyzing" ? 12 : 25;
  const innerSpeed = activityLevel === "searching" ? -6 : activityLevel === "analyzing" ? -18 : -40;
  const glowIntensity = isLoading ? "rgba(110, 231, 183, 0.9)" : "rgba(147, 197, 253, 0.5)";
  const colorStroke = isLoading ? "#34d399" : "#60a5fa";

  return (
    <div className="relative flex items-center justify-center p-6 w-full max-w-[240px] md:max-w-[280px] aspect-square mx-auto">
      {/* Golden Ratio Proportional Decorative Background Rings */}
      <div className="absolute inset-0 rounded-full border border-slate-800/40 pointer-events-none" />
      <div className="absolute inset-4 rounded-full border border-slate-700/20 pointer-events-none" />
      <div className="absolute inset-10 rounded-full border border-emerald-500/10 pointer-events-none" />

      {/* Main Fractal Mandala Vector */}
      <svg
        id="arabic-mandala-vector"
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(30,41,59,0.5)]"
        style={{ filter: `drop-shadow(0 0 10px ${glowIntensity})` }}
      >
        {/* Outer Arabesque Rotating Symmetry Node Container */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: outerSpeed,
            ease: "linear",
          }}
          style={{ originX: "100px", originY: "100px" }}
        >
          {/* Symmetrical Spokes (8 spokes x 3 circles) */}
          {Array.from({ length: 8 }).map((_, index) => {
            const angle = (index * Math.PI) / 4;
            const x1 = 100 + 40 * Math.cos(angle);
            const y1 = 100 + 40 * Math.sin(angle);
            const x2 = 100 + 85 * Math.cos(angle);
            const y2 = 100 + 85 * Math.sin(angle);
            return (
              <g key={`spoke-${index}`}>
                {/* Radial lines */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={colorStroke}
                  strokeWidth="0.75"
                  strokeDasharray={isLoading ? "2 2" : "none"}
                  opacity="0.45"
                />
                {/* Symmetrical Arabesque Rings */}
                <circle
                  cx={100 + 65 * Math.cos(angle)}
                  cy={100 + 65 * Math.sin(angle)}
                  r="12"
                  fill="none"
                  stroke={colorStroke}
                  strokeWidth="0.5"
                  opacity="0.6"
                />
                <circle
                  cx={100 + 78 * Math.cos(angle)}
                  cy={100 + 78 * Math.sin(angle)}
                  r="5"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.5"
                  opacity="0.8"
                />
              </g>
            );
          })}

          {/* Golden Ratio Spiral Curve Placeholder or Fractal Symmetrical Polygon */}
          <polygon
            points="100,20 156,56 180,112 144,168 80,180 32,136 44,72 100,20"
            fill="none"
            stroke={colorStroke}
            strokeWidth="0.5"
            opacity="0.3"
          />
        </motion.g>

        {/* Inner Counter-Rotating Arabesque Symmetries */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: Math.abs(innerSpeed),
            ease: "linear",
          }}
          style={{ originX: "100px", originY: "100px" }}
        >
          {/* Inner Polygon and Stars representing "Absolute Symmetries" */}
          <polygon
            points="100,50 135,85 135,115 100,150 65,115 65,85"
            fill="none"
            stroke={isLoading ? "#fbbf24" : colorStroke}
            strokeWidth="1"
            opacity="0.8"
          />

          {Array.from({ length: 6 }).map((_, idx) => {
            const rotAngle = (idx * Math.PI) / 3;
            // Interlocking Star of Symmetries conforming to historical Arabesque geometries
            return (
              <circle
                key={`inner-circle-${idx}`}
                cx={100 + 30 * Math.cos(rotAngle)}
                cy={100 + 30 * Math.sin(rotAngle)}
                r="10"
                fill="none"
                stroke={isLoading ? "#10b981" : "#818cf8"}
                strokeWidth="0.75"
                opacity="0.7"
              />
            );
          })}
        </motion.g>

        {/* Center Nucleus: Representing "LOGOS SOURCE" (True Coordinate Core) */}
        <circle
          cx="100"
          cy="100"
          r="15"
          fill="#0f172a"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        <circle
          cx="100"
          cy="100"
          r="6"
          fill={isLoading ? "#34d399" : "#fbbf24"}
          className={isLoading ? "animate-ping" : ""}
        />

        {/* Technical crosshairs for the "Diagnostic Terminal" feel */}
        <line x1="100" y1="0" x2="100" y2="200" stroke="#475569" strokeWidth="0.25" strokeDasharray="5 5" opacity="0.4" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="#475569" strokeWidth="0.25" strokeDasharray="5 5" opacity="0.4" />
      </svg>

      {/* Expressive metadata diagnostics below/overlaying the graphic */}
      <div className="absolute bottom-2 text-center select-none pointer-events-none">
        <span className="font-mono text-[9px] tracking-wider text-slate-400 upper">
          LOGOS FREQ: {isLoading ? "942.8 HZ" : "432.0 HZ"}
        </span>
      </div>
    </div>
  );
}
