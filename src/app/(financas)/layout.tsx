import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arthea Finanças Pessoais",
  description:
    "Finanças pessoais pra você e quem você ama — importação de fatura por IA, conta de casal, recorrências, metas e relatórios.",
};

export default function FinancasGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
