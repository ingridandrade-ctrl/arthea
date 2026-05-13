"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PainelLoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mindfulness/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Senha incorreta.");
      }
      router.replace("/mindfulness/painel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="m-nav">
        <div className="m-nav-brand">
          Iasmim <em>Sasseron</em>
        </div>
        <div className="m-nav-step">Painel de análise</div>
      </nav>
      <main>
        <div className="m-login">
          <h1 className="m-login-title">Acesso restrito</h1>
          <p className="m-login-sub">Esta área é dedicada à análise dos resultados do projeto.</p>
          <form onSubmit={onSubmit}>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
              required
            />
            {error && <div className="m-error-banner" style={{ marginBottom: 0 }}>{error}</div>}
            <button className="m-btn-primary" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
