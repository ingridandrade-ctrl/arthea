import { notFound } from "next/navigation";
import type { Metadata } from "next";
import path from "path";
import { promises as fs } from "fs";
import { AnaliseClient } from "./AnaliseClient";
import type { ClienteData } from "./types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getClienteData(slug: string): Promise<ClienteData | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "analises", "data", `${slug}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getClienteData(slug);
  if (!data) return { title: "Análise não encontrada" };
  return {
    title: data.nome,
    description: `Diagnóstico exclusivo do Google Meu Negócio para ${data.nome}`,
  };
}

export default async function AnalisePage({ params }: Props) {
  const { slug } = await params;
  const data = await getClienteData(slug);
  if (!data) notFound();
  return <AnaliseClient data={data} />;
}
