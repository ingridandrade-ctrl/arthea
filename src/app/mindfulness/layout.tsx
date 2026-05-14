import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./mindfulness.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
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
    <div className={`mindfulness-app ${playfair.variable} ${dmSans.variable}`}>{children}</div>
  );
}
