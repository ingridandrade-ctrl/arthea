type Variant = "flat" | "gradient" | "ghost";

export function ArtheaStar({
  size = 40,
  variant = "gradient",
  className,
}: {
  size?: number;
  variant?: Variant;
  className?: string;
}) {
  // Stable id per render of "gradient" — doesn't need to be unique across instances
  // since SVG resolves by nearest ancestor scope. We use a deterministic id.
  const gradId = `arthea-star-grad`;
  const shineId = `arthea-star-shine`;

  // 16 vertices alternating: cardinal point (R), waist, diagonal point (r), waist
  const R = 1.0;
  const r = 0.55;
  const w = 0.085;

  const verts: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const angle = ((i * 22.5 - 90) * Math.PI) / 180;
    let radius: number;
    if (i % 2 === 0) {
      const isCardinal = (i / 2) % 2 === 0;
      radius = isCardinal ? R : r;
    } else {
      radius = w;
    }
    verts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  const points = verts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" ");

  // Inner facet lines from each point to center for the "3D faceted" hint
  const facetLines = verts
    .filter((_, i) => i % 2 === 0)
    .map(([x, y]) => `M ${x.toFixed(4)} ${y.toFixed(4)} L 0 0`)
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="-1.05 -1.05 2.1 2.1"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="80%" y1="10%" x2="20%" y2="90%">
          <stop offset="0%" stopColor="#5FBABA" />
          <stop offset="40%" stopColor="#1D7070" />
          <stop offset="100%" stopColor="#0D4A4A" />
        </linearGradient>
        <linearGradient id={shineId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity={0.45} />
          <stop offset="60%" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>

      <polygon
        points={points}
        fill={variant === "ghost" ? "none" : variant === "flat" ? "currentColor" : `url(#${gradId})`}
        stroke={variant === "ghost" ? "currentColor" : "none"}
        strokeWidth={variant === "ghost" ? 0.06 : 0}
        strokeLinejoin="round"
      />
      {variant === "gradient" && (
        <>
          {/* faux 3D facet shading */}
          <path
            d={facetLines}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth={0.012}
            fill="none"
          />
          {/* highlight overlay */}
          <polygon points={points} fill={`url(#${shineId})`} />
        </>
      )}
    </svg>
  );
}
