"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, FileText, Save } from "lucide-react";
import type { SceneStatus } from "@prisma/client";

export function SceneActions({
  sceneId,
  initialStatus,
  initialScript,
  initialVideoLink,
  themeColor,
}: {
  sceneId: string;
  initialStatus: SceneStatus;
  initialScript: string | null;
  initialVideoLink: string | null;
  themeColor: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SceneStatus>(initialStatus);
  const [script, setScript] = useState(initialScript || "");
  const [videoLink, setVideoLink] = useState(initialVideoLink || "");
  const [savingStatus, setSavingStatus] = useState<SceneStatus | null>(null);
  const [savingScript, setSavingScript] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  async function updateStatus(next: SceneStatus) {
    if (status === next) return;
    setSavingStatus(next);
    const res = await fetch(`/api/portal/scenes/${sceneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSavingStatus(null);
    if (res.ok) {
      setStatus(next);
      flash(next === "APPROVED" ? "Cena aprovada" : next === "REJECTED" ? "Cena reprovada" : "Status atualizado");
      router.refresh();
    } else {
      alert("Erro ao atualizar status");
    }
  }

  async function saveScript() {
    setSavingScript(true);
    const res = await fetch(`/api/portal/scenes/${sceneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptText: script }),
    });
    setSavingScript(false);
    if (res.ok) {
      flash("Roteiro salvo");
      router.refresh();
    } else {
      alert("Erro ao salvar roteiro");
    }
  }

  async function saveVideoLink() {
    setSavingLink(true);
    const res = await fetch(`/api/portal/scenes/${sceneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoLink: videoLink.trim() }),
    });
    setSavingLink(false);
    if (res.ok) {
      flash("Link atualizado");
      router.refresh();
    } else {
      alert("Erro ao salvar link");
    }
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "0.5px solid rgba(13,74,74,0.18)",
    borderRadius: 10,
    background: "white",
    fontSize: 14,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    color: "#1A1A1A",
    outline: "none",
  };

  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.10)",
        borderRadius: 16,
        padding: "26px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {toast && (
        <div className="portal-toast" role="status">
          <Check size={14} strokeWidth={2.4} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
          {toast}
        </div>
      )}

      {/* Status buttons */}
      <div>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: "#8B867B",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "0 0 10px",
            fontWeight: 600,
          }}
        >
          Sua decisão
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatusButton
            label="Aprovar"
            icon={Check}
            active={status === "APPROVED"}
            loading={savingStatus === "APPROVED"}
            onClick={() => updateStatus("APPROVED")}
            activeColor={themeColor}
            tone="approve"
          />
          <StatusButton
            label="Reprovar"
            icon={X}
            active={status === "REJECTED"}
            loading={savingStatus === "REJECTED"}
            onClick={() => updateStatus("REJECTED")}
            activeColor="#991B1B"
            tone="reject"
          />
          {status !== "PENDING" && (
            <StatusButton
              label="Voltar pra pendente"
              icon={undefined}
              active={false}
              loading={savingStatus === "PENDING"}
              onClick={() => updateStatus("PENDING")}
              activeColor="#6B7280"
              tone="reset"
            />
          )}
        </div>
      </div>

      {/* Video link */}
      <div>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: "#8B867B",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "0 0 10px",
            fontWeight: 600,
          }}
        >
          Link do vídeo (YouTube / Dailymotion)
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              ...inputBase,
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 13,
              flex: 1,
            }}
          />
          <button
            onClick={saveVideoLink}
            disabled={savingLink}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: themeColor,
              color: "white",
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: savingLink ? "wait" : "pointer",
              opacity: savingLink ? 0.7 : 1,
            }}
          >
            {savingLink ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {/* Script — só aparece após aprovação */}
      {status === "APPROVED" && (
        <div>
          <p
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 10.5,
              color: "#8B867B",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 10px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileText size={12} strokeWidth={2} />
            Roteiro do vídeo
          </p>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Escreva aqui o roteiro do vídeo que vai usar essa cena. Pode usar quebras de linha, listas, o que ajudar a gravar."
            rows={10}
            style={{
              ...inputBase,
              minHeight: 220,
              resize: "vertical",
              lineHeight: 1.55,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button
              onClick={saveScript}
              disabled={savingScript}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 10,
                background: themeColor,
                color: "white",
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: savingScript ? "wait" : "pointer",
                opacity: savingScript ? 0.7 : 1,
              }}
            >
              <Save size={14} strokeWidth={1.8} />
              {savingScript ? "Salvando…" : "Salvar roteiro"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusButton({
  label,
  icon: Icon,
  active,
  loading,
  onClick,
  activeColor,
  tone,
}: {
  label: string;
  icon: any;
  active: boolean;
  loading: boolean;
  onClick: () => void;
  activeColor: string;
  tone: "approve" | "reject" | "reset";
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 10,
        background: active ? activeColor : "white",
        color: active ? "white" : tone === "reset" ? "#6B7280" : "#4A4A4A",
        border: `0.5px solid ${active ? activeColor : "rgba(13,74,74,0.15)"}`,
        fontSize: 13,
        fontWeight: 500,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {loading ? "…" : label}
    </button>
  );
}
