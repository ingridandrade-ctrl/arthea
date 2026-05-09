"use client";

import { useEffect, useState } from "react";

export function CircularProgress({
  value,
  total,
  size = 220,
  stroke = 14,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const [animatedPct, setAnimatedPct] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimatedPct(pct), 100);
    const start = Date.now();
    const dur = 900;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(tick);
    };
    const t2 = setTimeout(tick, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pct, value]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--accent-soft)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progress-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: size * 0.32,
            fontWeight: 400,
            color: "#2A2A2A",
            margin: 0,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {Math.round((animatedValue / Math.max(total, 1)) * 100)}
          <span style={{ fontSize: size * 0.16, color: "#A0A0A0" }}>%</span>
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#A0A0A0",
            margin: "8px 0 0",
          }}
        >
          {animatedValue} de {total}
        </p>
      </div>
    </div>
  );
}
