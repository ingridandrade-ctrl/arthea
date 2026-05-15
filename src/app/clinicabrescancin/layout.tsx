import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./clinicabrescancin.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antes da sua consulta — Clínica Brescancin",
  description:
    "Formulário pré-consulta da Clínica Brescancin. Suas informações ficam sigilosas e ajudam o Dr. Samuel e a Alana a chegar preparados para o seu atendimento.",
  robots: { index: false, follow: false },
};

export default function BrescancinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`brescancin-app ${playfair.variable} ${dmSans.variable}`}>
      {children}
    </div>
  );
}
