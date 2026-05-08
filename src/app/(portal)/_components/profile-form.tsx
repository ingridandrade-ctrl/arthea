"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError("Nova senha e confirmação não conferem.");
        return;
      }
      if (newPassword.length < 6) {
        setError("A nova senha precisa ter ao menos 6 caracteres.");
        return;
      }
      if (!currentPassword) {
        setError("Informe sua senha atual para trocar.");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
      } else {
        setToast("Perfil atualizado");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setToast(null);
          router.refresh();
        }, 1000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.08)",
        borderRadius: 18,
        padding: 28,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <fieldset style={{ border: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <legend
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 4,
            padding: 0,
          }}
        >
          Dados pessoais
        </legend>

        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="E-mail">
          <input value={email} disabled style={{ ...inputStyle, background: "#FAF9F6", color: "#6B7280" }} />
          <p style={{ fontSize: 11.5, color: "#A0A0A0", margin: "6px 0 0" }}>
            Para trocar o e-mail, fale com a equipe Arthea.
          </p>
        </Field>
      </fieldset>

      <div style={{ height: 0.5, background: "rgba(29,112,112,0.1)" }} />

      <fieldset style={{ border: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <legend
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 4,
            padding: 0,
          }}
        >
          Trocar senha
        </legend>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          Deixe em branco para manter a senha atual.
        </p>

        <Field label="Senha atual">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </Field>
        <Field label="Nova senha">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar nova senha">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            autoComplete="new-password"
          />
        </Field>
      </fieldset>

      {error && (
        <p style={{ color: "#9A3412", fontSize: 13, margin: 0 }}>{error}</p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            padding: "11px 22px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            cursor: saving ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: saving ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {toast && <div className="portal-toast">{toast}</div>}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid rgba(29,112,112,0.2)",
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "inherit",
  background: "white",
  color: "#2A2A2A",
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11.5,
          fontWeight: 500,
          color: "#6B7280",
          marginBottom: 6,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
