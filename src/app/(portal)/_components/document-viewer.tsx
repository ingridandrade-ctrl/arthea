"use client";

import { Download, ExternalLink, FileText, Maximize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const RESIZE_SCRIPT = `
<script>
(function () {
  var last = 0;
  var pending = false;
  function report() {
    pending = false;
    try {
      var h = Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      );
      // Only notify when height changes by more than 8px — prevents feedback loops
      if (Math.abs(h - last) < 8) return;
      last = h;
      parent.postMessage({ type: 'arthea:height', height: h }, '*');
    } catch (e) {}
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(report);
  }
  if (window.ResizeObserver && document.body) {
    new ResizeObserver(schedule).observe(document.body);
  }
  window.addEventListener('load', schedule);
  // Two fallbacks for late-loading fonts/images, no more spamming
  setTimeout(schedule, 400);
  setTimeout(schedule, 1600);
})();
</script>
`;

function buildSrcDoc(embed: string): string {
  // If user pasted a full HTML document, use it as-is (don't double-wrap).
  // No resize script injected — full docs render in fixed viewport (richDoc mode).
  if (/<html[\s>]/i.test(embed) || /<!doctype/i.test(embed)) return embed;

  // Otherwise wrap with default styling matching the portal + resize script
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { --accent: #1D7070; --accent-soft: #F0F8F6; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.75;
    color: #4A4A4A;
    background: white;
    overflow-x: hidden;
  }
  p { margin: 0 0 14px; }
  strong { color: #1A1A1A; font-weight: 600; }
  em { font-style: italic; }
  a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  a:hover { opacity: 0.8; }
  h1, h2, h3, h4 { font-family: "Fraunces", Georgia, serif; color: #1A1A1A; font-weight: 400; letter-spacing: -0.02em; margin: 28px 0 12px; line-height: 1.2; }
  h1 { font-size: 30px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  h4 { font-size: 17px; }
  ul, ol { margin: 0 0 14px; padding-left: 22px; }
  li { margin-bottom: 6px; }
  blockquote { border-left: 3px solid var(--accent); padding: 12px 18px; background: var(--accent-soft); border-radius: 8px; margin: 16px 0; font-style: italic; }
  img, video { max-width: 100%; height: auto; border-radius: 12px; margin: 14px 0; }
  iframe { max-width: 100%; border: 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th, td { padding: 10px 12px; border-bottom: 1px solid rgba(13,74,74,0.1); text-align: left; }
  th { font-weight: 600; color: #1A1A1A; background: #FAF9F6; }
  hr { border: none; border-top: 0.5px solid rgba(13,74,74,0.15); margin: 28px 0; }
  pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
  code { background: #FAF9F6; padding: 2px 6px; border-radius: 4px; }
  pre { background: #FAF9F6; padding: 14px; border-radius: 10px; overflow-x: auto; }
</style>
</head>
<body>
${embed}
${RESIZE_SCRIPT}
</body>
</html>`;
}

function isFullHtmlDoc(embed: string): boolean {
  return /<html[\s>]/i.test(embed) || /<!doctype/i.test(embed);
}

function hasStickyOrFixed(embed: string): boolean {
  return /position\s*:\s*(sticky|fixed)/i.test(embed);
}

function EmbedFrame({ embed }: { embed: string }) {
  // Detect "rich" docs (full HTML or sticky/fixed CSS) and render them in a
  // fixed viewport so internal scrolling works (sticky/fixed has somewhere to stick).
  // Plain HTML fragments use auto-resize for the smoother UX.
  const richDoc = useMemo(
    () => isFullHtmlDoc(embed) || hasStickyOrFixed(embed),
    [embed]
  );

  // Memoize the actual srcDoc string. Without this, the iframe reloads on
  // every parent re-render, killing scroll position and freezing big docs.
  const srcDoc = useMemo(() => buildSrcDoc(embed), [embed]);

  // Blob URL for "tela cheia". Memoized so it's stable across re-renders.
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  useEffect(() => {
    const blob = new Blob([srcDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setFullUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [srcDoc]);

  // Auto-height (fragments only). Rich docs use fixed viewport, no listener.
  const [autoHeight, setAutoHeight] = useState(640);
  useEffect(() => {
    if (richDoc) return;
    function onMessage(e: MessageEvent) {
      if (e.data && e.data.type === "arthea:height" && typeof e.data.height === "number") {
        setAutoHeight((prev) => {
          const next = Math.min(Math.max(e.data.height + 24, 320), 4000);
          // Guard: ignore tiny changes to avoid layout thrash
          return Math.abs(next - prev) < 8 ? prev : next;
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [richDoc]);

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
          padding: "14px 22px",
          borderBottom: "0.5px solid rgba(29,112,112,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              margin: 0,
            }}
          >
            Documento
          </p>
          {richDoc && (
            <span style={{ fontSize: 10, color: "#A0A0A0", fontStyle: "italic" }}>
              · Rola por dentro do documento
            </span>
          )}
        </div>
        {fullUrl && (
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              padding: "5px 11px",
              border: "1px solid var(--accent-border)",
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            <Maximize2 size={12} strokeWidth={1.8} />
            Tela cheia
          </a>
        )}
      </div>
      <iframe
        // key=embed ensures the iframe only fully remounts when the embed
        // CONTENT changes — not on every parent re-render.
        key={embed.length + ":" + embed.slice(0, 64)}
        srcDoc={srcDoc}
        title="Documento"
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-same-origin"
        style={{
          width: "100%",
          height: richDoc ? "calc(100vh - 180px)" : autoHeight,
          minHeight: richDoc ? 600 : undefined,
          maxHeight: richDoc ? 900 : undefined,
          border: "none",
          background: "white",
          display: "block",
          transition: richDoc ? "none" : "height 0.18s ease",
        }}
      />
    </section>
  );
}

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
      <>
        <EmbedFrame embed={embed} />
        {url && (
          <section
            style={{
              background: "white",
              border: "0.5px solid rgba(29,112,112,0.08)",
              borderRadius: 14,
              padding: "14px 22px",
              boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 13, color: "#4A4A4A" }}>
              Anexo do entregável
            </span>
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
              Baixar arquivo
            </a>
          </section>
        )}
      </>
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
