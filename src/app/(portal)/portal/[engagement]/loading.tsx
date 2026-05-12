// Skeleton genérico do dashboard de uma frente. Aparece durante o fetch
// (especialmente útil pro tráfego pago que chama a Meta API).
export default function EngagementLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <header style={{ padding: "8px 0 0" }}>
        <SkeletonLine width="38%" height={12} />
        <SkeletonLine width="72%" height={48} style={{ marginTop: 18 }} />
        <SkeletonLine width="62%" height={14} style={{ marginTop: 14 }} />
      </header>

      {/* "phase timeline" or "metrics" placeholder */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "32px 36px",
          border: "0.5px solid rgba(29,112,112,0.08)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonLine width="100%" height={4} />
            <SkeletonLine width="58%" height={12} />
            <SkeletonLine width="40%" height={11} />
          </div>
        ))}
      </div>

      {/* Métricas em cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "white",
              border: "0.5px solid rgba(29,112,112,0.10)",
              borderRadius: 16,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <SkeletonLine width="44%" height={11} />
            <SkeletonLine width="68%" height={24} />
            <SkeletonLine width="36%" height={10} />
          </div>
        ))}
      </div>

      {/* Lista */}
      <div
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.10)",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "22px 26px 16px", borderBottom: "0.5px solid rgba(13,74,74,0.05)" }}>
          <SkeletonLine width="34%" height={11} />
          <SkeletonLine width="58%" height={20} style={{ marginTop: 8 }} />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              padding: "14px 26px",
              borderTop: i === 0 ? "none" : "0.5px solid rgba(13,74,74,0.05)",
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 18,
              alignItems: "center",
            }}
          >
            <SkeletonLine width="80%" height={14} />
            <SkeletonLine width={60} height={12} />
            <SkeletonLine width={80} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonLine({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="portal-skeleton"
      style={{
        width,
        height,
        borderRadius: height < 6 ? height / 2 : 6,
        ...style,
      }}
    />
  );
}
