"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, X, Clock, Film, MessageCircle, FileText } from "lucide-react";
import type { SceneTheme, SceneStatus } from "@prisma/client";
import {
  SCENE_STATUS_BG,
  SCENE_STATUS_FG,
  SCENE_STATUS_LABEL,
  type SceneVisualStatus,
} from "@/lib/scenes";

type SceneItem = {
  id: string;
  order: number;
  characters: string;
  type: string;
  work: string;
  hook: string | null;
  status: SceneStatus;
  hasScript: boolean;
  commentCount: number;
};

type ThemeBlock = {
  key: SceneTheme;
  label: string;
  subtitle: string;
  color: string;
  order: number;
  scenes: SceneItem[];
};

const STATUS_FILTERS: { key: "ALL" | SceneVisualStatus; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "PENDING", label: "Pendentes" },
  { key: "APPROVED", label: "Aprovadas" },
  { key: "WITH_SCRIPT", label: "Com roteiro" },
  { key: "REJECTED", label: "Reprovadas" },
];

function vstatus(s: SceneItem): SceneVisualStatus {
  if (s.status === "APPROVED" && s.hasScript) return "WITH_SCRIPT";
  return s.status;
}

export function ScenesView({
  themes,
  engagementSlug,
}: {
  themes: ThemeBlock[];
  engagementSlug: string;
}) {
  const [filter, setFilter] = useState<"ALL" | SceneVisualStatus>("ALL");
  const [activeTheme, setActiveTheme] = useState<SceneTheme | "ALL">("ALL");

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: 0, PENDING: 0, APPROVED: 0, WITH_SCRIPT: 0, REJECTED: 0 };
    for (const t of themes) {
      for (const s of t.scenes) {
        c.ALL++;
        c[vstatus(s)]++;
      }
    }
    return c;
  }, [themes]);

  const visibleThemes = themes
    .filter((t) => activeTheme === "ALL" || t.key === activeTheme)
    .map((t) => ({
      ...t,
      scenes: t.scenes.filter((s) => filter === "ALL" || vstatus(s) === filter),
    }))
    .filter((t) => t.scenes.length > 0);

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <header style={{ padding: "8px 0 0" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
          Acervo
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(34px, 5vw, 48px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "16px 0 12px",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          Acervo de{" "}
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            cenas
          </em>
        </h1>
        <p style={{ fontSize: 15, color: "#4A4A4A", margin: 0, maxWidth: 620 }}>
          Cenas de filmes e séries organizadas por tema clínico. Aprove, reprove ou escreva o
          roteiro do vídeo direto na cena.
        </p>
      </header>

      {/* Filtros de status */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {STATUS_FILTERS.map((f) => {
          const isActive = filter === f.key;
          const n = counts[f.key] || 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                background: isActive ? "var(--accent)" : "white",
                color: isActive ? "white" : "#4A4A4A",
                border: `0.5px solid ${isActive ? "var(--accent)" : "rgba(13,74,74,0.15)"}`,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {f.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: isActive ? "rgba(255,255,255,0.22)" : "rgba(13,74,74,0.06)",
                  color: isActive ? "white" : "#6B7280",
                }}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabs de tema */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <ThemeTab
          label="Todos os temas"
          color="#4A4A4A"
          isActive={activeTheme === "ALL"}
          onClick={() => setActiveTheme("ALL")}
        />
        {themes.map((t) => (
          <ThemeTab
            key={t.key}
            label={t.label}
            color={t.color}
            isActive={activeTheme === t.key}
            onClick={() => setActiveTheme(t.key)}
          />
        ))}
      </div>

      {visibleThemes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#A0A0A0",
            fontSize: 14,
            border: "1px dashed rgba(13,74,74,0.15)",
            borderRadius: 18,
          }}
        >
          Nenhuma cena com esses filtros.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {visibleThemes.map((t) => (
            <ThemeSection key={t.key} theme={t} engagementSlug={engagementSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeTab({
  label,
  color,
  isActive,
  onClick,
}: {
  label: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 500,
        background: isActive ? color : "white",
        color: isActive ? "white" : "#4A4A4A",
        border: `0.5px solid ${isActive ? color : "rgba(13,74,74,0.12)"}`,
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: isActive ? "white" : color,
          opacity: isActive ? 0.7 : 1,
        }}
      />
      {label}
    </button>
  );
}

function ThemeSection({
  theme,
  engagementSlug,
}: {
  theme: ThemeBlock;
  engagementSlug: string;
}) {
  return (
    <section>
      <header style={{ marginBottom: 18 }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: theme.color,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            margin: 0,
          }}
        >
          <span style={{ width: 18, height: 1, background: theme.color }} />
          Tema {theme.order} · {theme.scenes.length}{" "}
          {theme.scenes.length === 1 ? "cena" : "cenas"}
        </p>
        <h2
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 30,
            fontWeight: 400,
            color: "#1A1A1A",
            margin: "6px 0 6px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {theme.label}
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0, fontStyle: "italic" }}>
          {theme.subtitle}
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {theme.scenes.map((s, idx) => {
          const vs = vstatus(s);
          return (
            <Link
              key={s.id}
              href={`/portal/${engagementSlug}/acervo/${s.id}`}
              className="portal-card-hover portal-stagger"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 18,
                alignItems: "center",
                background: "white",
                border: "0.5px solid rgba(13,74,74,0.10)",
                borderLeft: `3px solid ${theme.color}`,
                borderRadius: 14,
                padding: "16px 20px",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                animationDelay: `${idx * 40}ms`,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: `${theme.color}1A`,
                  color: theme.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {String(s.order).padStart(2, "0")}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#A0A0A0",
                    margin: 0,
                  }}
                >
                  <Film size={10} strokeWidth={2} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />
                  {s.type} · {s.work.split("·")[0].trim()}
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#1A1A1A",
                    margin: "4px 0 0",
                    lineHeight: 1.3,
                  }}
                >
                  {s.characters}
                </p>
                {s.hook && (
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "#6B7280",
                      margin: "4px 0 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    "{s.hook}"
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                {s.commentCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#A0A0A0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MessageCircle size={12} strokeWidth={1.8} />
                    {s.commentCount}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    background: SCENE_STATUS_BG[vs],
                    color: SCENE_STATUS_FG[vs],
                    padding: "4px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <StatusIcon status={vs} />
                  {SCENE_STATUS_LABEL[vs]}
                </span>
                <ArrowRight size={14} strokeWidth={1.6} color="#A0A0A0" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StatusIcon({ status }: { status: SceneVisualStatus }) {
  const props = { size: 11, strokeWidth: 2 };
  if (status === "APPROVED") return <Check {...props} />;
  if (status === "WITH_SCRIPT") return <FileText {...props} />;
  if (status === "REJECTED") return <X {...props} />;
  return <Clock {...props} />;
}
