"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check, ExternalLink } from "lucide-react";

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
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#2A2A2A",
            margin: 0,
            fontFamily: "Fraunces, Georgia, serif",
            letterSpacing: "-0.01em",
          }}
        >
          {platform}
        </h3>
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
            value={username}
            display={username}
            onCopy={() => copy(username, "user")}
            copied={copied === "user"}
          />
        )}
        {password && (
          <Field
            label="Senha"
            value={password}
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
  value: string;
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
        }}
      >
        {label}
      </span>
      <code
        style={{
          fontSize: 13,
          color: "#2A2A2A",
          background: "#FAF9F6",
          padding: "7px 12px",
          borderRadius: 8,
          flex: 1,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
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
