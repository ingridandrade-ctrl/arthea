"use client";

import { Download, ExternalLink, FileText } from "lucide-react";

export function DocumentViewer({
  url,
  embed,
}: {
  url?: string | null;
  embed?: string | null;
}) {
  if (!url && !embed) {
    return (
      <section
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.08)",
          borderRadius: 18,
          padding: "60px 28px",
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <FileText size={20} strokeWidth={1.7} />
        </div>
        <p style={{ fontSize: 15, color: "#2A2A2A", margin: 0, fontWeight: 500 }}>
          Documento em preparação
        </p>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "6px 0 0" }}>
          Você será notificado quando estiver pronto para revisão.
        </p>
      </section>
    );
  }

  // Prefer rendered embed when both exist
  if (embed) {
    return (
      <section
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.08)",
          borderRadius: 18,
          padding: 32,
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 18,
          }}
        >
          Documento
        </p>
        <div className="portal-prose" dangerouslySetInnerHTML={{ __html: embed }} />
        {url && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "0.5px solid rgba(13,74,74,0.08)" }}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <Download size={14} strokeWidth={1.8} />
              Baixar arquivo anexo
            </a>
          </div>
        )}
      </section>
    );
  }

  // url only — try to detect file type
  const isPdf = /\.pdf($|\?)/i.test(url || "");
  const isImage = /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(url || "");
  const filename = url?.split("/").pop()?.split("?")[0] || "Documento";

  if (isPdf) {
    return (
      <section
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.08)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "0.5px solid rgba(29,112,112,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={16} strokeWidth={1.7} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2A2A2A" }}>{filename}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={url!}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--accent)",
                textDecoration: "none",
                padding: "6px 12px",
                border: "1px solid var(--accent-border)",
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              <ExternalLink size={12} strokeWidth={1.8} />
              Tela cheia
            </a>
            <a
              href={url!}
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "white",
                background: "var(--accent)",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              <Download size={12} strokeWidth={1.8} />
              Baixar
            </a>
          </div>
        </div>
        <iframe
          src={url!}
          title={filename}
          style={{ width: "100%", height: 720, border: "none", background: "#FAF9F6" }}
        />
      </section>
    );
  }

  if (isImage) {
    return (
      <section
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.08)",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        }}
      >
        <img
          src={url!}
          alt="Documento"
          style={{
            width: "100%",
            display: "block",
            borderRadius: 12,
            maxHeight: 720,
            objectFit: "contain",
            background: "#FAF9F6",
          }}
        />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <a
            href={url!}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--accent-border)",
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            <ExternalLink size={12} strokeWidth={1.8} />
            Abrir em tela cheia
          </a>
        </div>
      </section>
    );
  }

  // generic external link
  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 18,
        padding: 32,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "var(--accent-soft)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileText size={20} strokeWidth={1.6} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#2A2A2A" }}>
          Documento disponível
        </p>
        <p style={{ fontSize: 12.5, color: "#6B7280", margin: "4px 0 0" }}>
          Clique no botão para abrir em uma nova aba.
        </p>
      </div>
      <a
        href={url!}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "var(--accent)",
          color: "white",
          fontSize: 13,
          padding: "10px 18px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        <ExternalLink size={13} strokeWidth={1.8} />
        Abrir documento
      </a>
    </section>
  );
}
