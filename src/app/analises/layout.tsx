import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Análise GMB · Arthea",
    template: "Análise · %s · Arthea",
  },
  description: "Diagnóstico exclusivo do Google Meu Negócio.",
};

export default function AnalisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
