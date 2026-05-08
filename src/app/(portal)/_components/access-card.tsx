"use client";

import { useState } from "react";

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
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.15)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 500, color: "#2A2A2A", margin: 0 }}>{platform}</h3>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12,
              color: "#1D7070",
              textDecoration: "none",
              border: "1px solid rgba(29,112,112,0.2)",
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            Abrir ↗
          </a>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {username && (
          <Field label="Usuário" value={username} onCopy={() => copy(username, "user")} copied={copied === "user"} />
        )}
        {password && (
          <Field
            label="Senha"
            value={show ? password : "••••••••"}
            onCopy={() => copy(password, "pwd")}
            copied={copied === "pwd"}
            extra={
              <button
                onClick={() => setShow(!show)}
                style={{
                  fontSize: 11,
                  color: "#1D7070",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            }
          />
        )}
        {notes && (
          <p style={{ fontSize: 12, color: "#6B7280", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
            {notes}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  copied,
  extra,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#A0A0A0",
          width: 60,
        }}
      >
        {label}
      </span>
      <code
        style={{
          fontSize: 13,
          color: "#2A2A2A",
          background: "#FAF9F6",
          padding: "4px 10px",
          borderRadius: 4,
          flex: 1,
          fontFamily: "monospace",
        }}
      >
        {value}
      </code>
      <button
        onClick={onCopy}
        style={{
          fontSize: 11,
          color: copied ? "#1D7070" : "#6B7280",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
      {extra}
    </div>
  );
}
