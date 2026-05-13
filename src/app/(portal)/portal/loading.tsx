export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <header>
        <div className="portal-skeleton" style={{ width: 120, height: 12, marginBottom: 14 }} />
        <div className="portal-skeleton" style={{ width: "70%", height: 40, marginBottom: 12 }} />
        <div className="portal-skeleton" style={{ width: 220, height: 16 }} />
      </header>
      <div
        className="portal-skeleton"
        style={{ width: "100%", height: 160, borderRadius: 20 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="portal-skeleton"
            style={{ height: 110, borderRadius: 14 }}
          />
        ))}
      </div>
    </div>
  );
}
