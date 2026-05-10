export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <header>
        <div className="portal-skeleton" style={{ width: 120, height: 12, marginBottom: 14 }} />
        <div className="portal-skeleton" style={{ width: 280, height: 36, marginBottom: 10 }} />
        <div className="portal-skeleton" style={{ width: "60%", height: 14 }} />
      </header>
      <div className="portal-skeleton" style={{ width: "100%", height: 40 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[60, 90, 80, 70, 100].map((w, i) => (
          <div key={i} className="portal-skeleton" style={{ width: w, height: 28, borderRadius: 999 }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="portal-skeleton" style={{ height: 70, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
