"use client";

// Header de seção dentro do dashboard. Uniformiza espaçamento + tipografia.

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header style={{ margin: "8px 0 16px" }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: "#8B867B",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 18, height: 1, background: "#8B867B" }} />
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#1A1A1A",
          margin: "6px 0 0",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ fontSize: 13.5, color: "#6B7280", margin: "6px 0 0", maxWidth: 620 }}>
          {description}
        </p>
      )}
    </header>
  );
}
