"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check, ExternalLink } from "lucide-react";

const PLATFORM_BRAND: Record<string, { color: string; letter: string }> = {
  instagram: { color: "#E1306C", letter: "I" },
  facebook: { color: "#1877F2", letter: "F" },
  meta: { color: "#0668E1", letter: "M" },
  google: { color: "#4285F4", letter: "G" },
  tiktok: { color: "#000000", letter: "T" },
  youtube: { color: "#FF0000", letter: "Y" },
  linkedin: { color: "#0A66C2", letter: "L" },
  twitter: { color: "#1DA1F2", letter: "X" },
  x: { color: "#000000", letter: "X" },
  whatsapp: { color: "#25D366", letter: "W" },
};

function detectBrand(platform: string) {
  const p = platform.toLowerCase();
  for (const key of Object.keys(PLATFORM_BRAND)) {
    if (p.includes(key)) return PLATFORM_BRAND[key];
  }
  return { color: "var(--accent)", letter: platform.charAt(0).toUpperCase() };
}

export function AccessCard({
  platform,
  icon,
  username,
  password,
  url,
  notes,
}: {
  platform: string;
  icon?: string | null;
  username?: string | null;
  password?: string | null;
  url?: string | null;
  notes?: string | null;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const brand = detectBrand(platform);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div
      className="portal-card-hover"
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: brand.color,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 18,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {brand.letter}
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#2A2A2A",
              margin: 0,
              fontFamily: "Fraunces, Georgia, serif",
              letterSpacing: "-0.01em",
              minWidth: 0,
            }}
          >
            {platform}
          </h3>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              border: "1px solid var(--accent-border)",
              padding: "5px 11px",
              borderRadius: 999,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            <ExternalLink size={12} strokeWidth={1.8} />
            Abrir
          </a>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {username && (
          <Field
            label="Usuário"
            display={username}
            onCopy={() => copy(username, "user")}
            copied={copied === "user"}
          />
        )}
        {password && (
          <Field
            label="Senha"
            display={show ? password : "••••••••••"}
            onCopy={() => copy(password, "pwd")}
            copied={copied === "pwd"}
            extra={
              <button
                onClick={() => setShow(!show)}
                title={show ? "Ocultar" : "Mostrar"}
                style={iconBtn}
              >
                {show ? <EyeOff size={14} strokeWidth={1.7} /> : <Eye size={14} strokeWidth={1.7} />}
              </button>
            }
          />
        )}
        {notes && (
          <p
            style={{
              fontSize: 12.5,
              color: "#6B7280",
              margin: "8px 0 0",
              whiteSpace: "pre-wrap",
              lineHeight: 1.55,
              padding: "10px 12px",
              background: "#FAF9F6",
              borderRadius: 8,
            }}
          >
            {notes}
          </p>
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "#6B7280",
  cursor: "pointer",
  padding: 6,
  borderRadius: 6,
  transition: "all 0.15s ease",
};

function Field({
  label,
  display,
  onCopy,
  copied,
  extra,
}: {
  label: string;
  display: string;
  onCopy: () => void;
  copied: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#A0A0A0",
          width: 64,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <code
        style={{
          fontSize: 13,
          color: "#2A2A2A",
          background: "#FAF9F6",
          padding: "8px 12px",
          borderRadius: 8,
          flex: 1,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {display}
      </code>
      <button onClick={onCopy} title={copied ? "Copiado" : "Copiar"} style={iconBtn}>
        {copied ? (
          <Check size={14} strokeWidth={2} color="var(--accent)" />
        ) : (
          <Copy size={14} strokeWidth={1.7} />
        )}
      </button>
      {extra}
    </div>
  );
}
