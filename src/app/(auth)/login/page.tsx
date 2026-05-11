"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function PortalStar() {
  const R = 1.0;
  const r = 0.55;
  const w = 0.085;
  const verts: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const angle = ((i * 22.5 - 90) * Math.PI) / 180;
    const radius =
      i % 2 === 0 ? ((i / 2) % 2 === 0 ? R : r) : w;
    verts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  const points = verts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" ");
  const facet = verts
    .filter((_, i) => i % 2 === 0)
    .map(([x, y]) => `M ${x.toFixed(4)} ${y.toFixed(4)} L 0 0`)
    .join(" ");
  return (
    <svg
      width={64}
      height={64}
      viewBox="-1.05 -1.05 2.1 2.1"
      style={{ display: "inline-block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="login-star-grad" x1="80%" y1="10%" x2="20%" y2="90%">
          <stop offset="0%" stopColor="#5FBABA" />
          <stop offset="40%" stopColor="#1D7070" />
          <stop offset="100%" stopColor="#0D4A4A" />
        </linearGradient>
        <linearGradient id="login-star-shine" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity={0.45} />
          <stop offset="60%" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={points} fill="url(#login-star-grad)" strokeLinejoin="round" />
      <path d={facet} stroke="rgba(0,0,0,0.18)" strokeWidth={0.012} fill="none" />
      <polygon points={points} fill="url(#login-star-shine)" />
    </svg>
  );
}

function isClientHost(hostname: string) {
  return hostname.startsWith("clientes.") || hostname.startsWith("portal.");
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPortal, setIsPortal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPortal(isClientHost(window.location.hostname));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Route based on role
    const session = await getSession();
    const role = (session?.user as any)?.role;
    if (role === "CLIENT") {
      router.push("/portal");
    } else {
      router.push("/dashboard");
    }
  }

  if (isPortal) return <PortalLoginUI loading={loading} error={error} onSubmit={handleSubmit} />;
  return <CRMLoginUI loading={loading} error={error} onSubmit={handleSubmit} />;
}

function CRMLoginUI({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Arthea</h1>
          <p className="text-muted-foreground mt-2">CRM da sua agência</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Credenciais padrão: admin@arthea.com / admin123
        </p>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/politica-de-privacidade" className="underline hover:text-foreground">
            Política de privacidade
          </a>
        </p>
      </div>
    </div>
  );
}

function PortalLoginUI({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF9F6",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "white",
          borderRadius: 20,
          padding: 44,
          boxShadow: "0 1px 2px rgba(13,74,74,0.04), 0 16px 48px rgba(13,74,74,0.08)",
          border: "0.5px solid rgba(29,112,112,0.12)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <PortalStar />
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0D4A4A",
              margin: "16px 0 0",
            }}
          >
            Arthea
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1A1A1A",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              marginTop: 10,
              marginBottom: 10,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Bem-vindo ao seu{" "}
            <em
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontWeight: 500,
                fontStyle: "italic",
                color: "#1D7070",
              }}
            >
              projeto
            </em>
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
            Acesse sua área para acompanhar entregáveis, validações e materiais.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                color: "#9A3412",
                fontSize: 13,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#4A4A4A",
                marginBottom: 6,
              }}
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid rgba(29,112,112,0.25)",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                background: "#FAF9F6",
                outline: "none",
                color: "#2A2A2A",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#4A4A4A",
                marginBottom: 6,
              }}
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid rgba(29,112,112,0.25)",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                background: "#FAF9F6",
                outline: "none",
                color: "#2A2A2A",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: "#1D7070",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Entrando..." : "Entrar no portal"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#A0A0A0",
            marginTop: 24,
          }}
        >
          Esqueceu sua senha? Fale com nossa equipe.
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#A0A0A0",
            marginTop: 12,
          }}
        >
          <a
            href="/politica-de-privacidade"
            style={{ color: "#6B7280", textDecoration: "underline" }}
          >
            Política de privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
