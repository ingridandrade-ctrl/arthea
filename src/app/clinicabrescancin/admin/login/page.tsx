"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !senha || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clinicabrescancin/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Email ou senha incorretos.",
        );
        return;
      }
      router.replace("/clinicabrescancin/admin");
      router.refresh();
    } catch {
      setError("Sem conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="brescancin-container" style={{ maxWidth: 440 }}>
      <p className="brescancin-brand">Clínica Brescancin · Painel</p>
      <div className="brescancin-rule" aria-hidden />
      <section className="brescancin-card brescancin-step">
        <h2 className="brescancin-step-title">Acesso restrito</h2>
        <p className="brescancin-step-intro">
          Uso exclusivo da equipe Brescancin.
        </p>
        <form onSubmit={onSubmit}>
          <div className="brescancin-field">
            <label
              htmlFor="email-admin"
              className="brescancin-label brescancin-label-required"
            >
              Email
            </label>
            <input
              id="email-admin"
              className="brescancin-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              placeholder="seu@email.com"
            />
          </div>
          <div className="brescancin-field">
            <label
              htmlFor="senha-admin"
              className="brescancin-label brescancin-label-required"
            >
              Senha
            </label>
            <div className="brescancin-password-wrap">
              <input
                id="senha-admin"
                className="brescancin-input"
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="brescancin-password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {error && <span className="brescancin-error">{error}</span>}
          </div>
          <div
            className="brescancin-actions"
            style={{ justifyContent: "flex-end" }}
          >
            <button
              type="submit"
              className="brescancin-btn-primary"
              disabled={isSubmitting || !email || !senha}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
