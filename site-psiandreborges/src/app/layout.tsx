import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "André Borges — Psicólogo de Relacionamentos | Pirassununga/SP",
  description:
    "Psicólogo especialista em relacionamentos. Um lugar para o seu relacionamento voltar a fazer sentido — individual ou em casal, online e presencial em Pirassununga/SP.",
  openGraph: {
    title: "André Borges — Psicólogo de Relacionamentos",
    description:
      "Atendimento individual, terapia de casal e Sessão de Clareza. Online ou presencial em Pirassununga/SP.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
