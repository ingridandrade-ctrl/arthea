import type { Metadata } from "next";
import { ArtheaThemeProvider } from "@/components/financas/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Arthea Finanças",
    template: "%s · Arthea Finanças",
  },
  description:
    "Arthea Finanças — finanças pessoais pra você e quem você ama. Importação de fatura por IA, conta de casal, recorrências, metas e relatórios.",
};

export default function FinancasGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArtheaThemeProvider>{children}</ArtheaThemeProvider>;
}
