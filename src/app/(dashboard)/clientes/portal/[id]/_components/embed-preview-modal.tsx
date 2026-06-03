"use client";

import { X } from "lucide-react";
import { DocumentViewer } from "@/app/(portal)/_components/document-viewer";

// Modal de pré-visualização do conteúdo de um entregável (documentUrl +
// documentEmbed) renderizado exatamente como o cliente verá no portal.
// Usado pela admin antes de salvar pra conferir.
export function EmbedPreviewModal({
  url,
  embed,
  onClose,
}: {
  url: string | null;
  embed: string | null;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,74,74,0.4)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAF9F6",
          backgroundImage:
            "linear-gradient(rgba(13,74,74,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(13,74,74,0.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          borderRadius: 18,
          width: "100%",
          maxWidth: 980,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // Define accent local pro preview render usar a cor da Arthea padrão
          ["--accent" as any]: "#1D7070",
          ["--accent-hover" as any]: "#1D7070EE",
          ["--accent-soft" as any]: "#1D707012",
          ["--accent-border" as any]: "#1D707033",
          ["--accent-deep" as any]: "#0D4A4A",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          color: "#2A2A2A",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "0.5px solid rgba(13,74,74,0.10)",
            background: "white",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                fontSize: 10.5,
                color: "#8B867B",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Pré-visualização
            </p>
            <p style={{ fontSize: 14, color: "#1A1A1A", margin: "4px 0 0", fontWeight: 500 }}>
              Assim o cliente vai ver no portal
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "0.5px solid rgba(13,74,74,0.18)",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} strokeWidth={1.8} color="#4A4A4A" />
          </button>
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {!url && !embed ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "#8B867B",
                background: "white",
                borderRadius: 14,
                border: "0.5px dashed rgba(13,74,74,0.15)",
              }}
            >
              Sem conteúdo pra mostrar ainda. Cole o HTML no campo embed ou anexe um arquivo
              pra ver a pré-visualização.
            </div>
          ) : (
            <DocumentViewer url={url} embed={embed} />
          )}
        </div>
      </div>
    </div>
  );
}
