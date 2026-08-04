import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./clinicabrescancin.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    absolute: "Clínica Brescancin — Excelência em Restauração Capilar",
  },
  description:
    "Formulário pré-consulta da Clínica Brescancin. Suas informações ficam sigilosas e ajudam o Dr. Samuel e a Alana a chegar preparados para o seu atendimento.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Clínica Brescancin — Excelência em Restauração Capilar",
    description:
      "Formulário pré-consulta. Suas informações ficam sigilosas e ajudam o Dr. Samuel e a Alana a chegar preparados para o seu atendimento.",
    siteName: "Clínica Brescancin",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clínica Brescancin — Excelência em Restauração Capilar",
    description:
      "Formulário pré-consulta. Suas informações ficam sigilosas e ajudam o Dr. Samuel e a Alana a chegar preparados para o seu atendimento.",
  },
};

export default function BrescancinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`brescancin-app ${playfair.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
