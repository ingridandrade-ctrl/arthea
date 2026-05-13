import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./mindfulness.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Avaliação de Atenção Plena e Saúde Mental · Iasmim Sasseron",
  description:
    "Projeto de supervisão da formação em Mindfulness — coleta de dois questionários validados.",
  robots: { index: false, follow: false },
};

export default function MindfulnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mindfulness-app ${cormorant.variable} ${dmSans.variable}`}>{children}</div>
  );
}
