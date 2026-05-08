import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "../../_components/profile-form";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <header>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
          }}
        >
          Meu perfil
        </p>
        <h1
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 36,
            fontWeight: 400,
            color: "#2A2A2A",
            margin: "8px 0 8px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Suas informações
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Atualize seu nome e troque sua senha de acesso.
        </p>
      </header>

      <ProfileForm initialName={user?.name || ""} email={user?.email || ""} />
    </div>
  );
}
