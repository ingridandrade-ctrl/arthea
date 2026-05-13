// Skeleton do dossiê — formato editorial papel.
export default function DossierLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SkeletonLine width={220} height={12} />
        <SkeletonLine width={120} height={32} />
      </div>

      {/* Hero */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1fr)",
          background: "white",
          border: "0.5px solid rgba(13,74,74,0.10)",
          borderRadius: 18,
          marginBottom: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "44px 44px 38px", borderRight: "0.5px solid rgba(13,74,74,0.05)" }}>
          <SkeletonLine width={180} height={12} />
          <SkeletonLine width="86%" height={48} style={{ marginTop: 18 }} />
          <SkeletonLine width="62%" height={42} style={{ marginTop: 6 }} />
          <SkeletonLine width="92%" height={14} style={{ marginTop: 18 }} />
          <SkeletonLine width="74%" height={14} style={{ marginTop: 6 }} />
        </div>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                padding: "28px 32px",
                borderTop: i === 1 ? "0.5px solid rgba(13,74,74,0.05)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <SkeletonLine width="56%" height={11} />
              <SkeletonLine width="48%" height={36} />
              <SkeletonLine width="80%" height={12} />
            </div>
          ))}
        </div>
      </div>

      {/* 3 seções skeletizadas */}
      {[0, 1, 2].map((i) => (
        <section
          key={i}
          style={{
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.10)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <header style={{ padding: "30px 36px 26px", borderBottom: "0.5px solid rgba(13,74,74,0.05)" }}>
            <SkeletonLine width={140} height={11} />
            <SkeletonLine width="48%" height={24} style={{ marginTop: 10 }} />
            <SkeletonLine width="64%" height={13} style={{ marginTop: 6 }} />
          </header>
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr",
                gap: 28,
                padding: "18px 36px",
                borderBottom: j === 2 ? "none" : "0.5px solid rgba(13,74,74,0.05)",
              }}
            >
              <SkeletonLine width="80%" height={11} />
              <SkeletonLine width="70%" height={14} />
            </div>
          ))}
        </section>
      ))}
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
