import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { isBrescancinAdminAuthenticated } from "@/lib/clinicabrescancin/admin-auth";

type Section = { title: string; fields: { key: string; label: string; type?: "list" | "bool" | "date" }[] };

const SECTIONS: Section[] = [
  {
    title: "Identificação",
    fields: [
      { key: "nomeCompleto", label: "Nome completo" },
      { key: "apelido", label: "Apelido" },
      { key: "dataNascimento", label: "Data de nascimento", type: "date" },
      { key: "genero", label: "Gênero" },
      { key: "estadoCivil", label: "Estado civil" },
      { key: "profissao", label: "Profissão" },
      { key: "temFilhos", label: "Tem filhos", type: "bool" },
      { key: "pretendeFilhos", label: "Pretende ter filhos no próximo ano", type: "bool" },
      { key: "cidade", label: "Cidade" },
      { key: "telefone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "instagram", label: "Instagram" },
    ],
  },
  {
    title: "Saúde geral",
    fields: [
      { key: "doencasDiagnosticadas", label: "Doenças diagnosticadas", type: "list" },
      { key: "saudeMae", label: "Saúde da mãe", type: "list" },
      { key: "saudePai", label: "Saúde do pai", type: "list" },
      { key: "usaMedicamentos", label: "Usa medicamento contínuo" },
      { key: "quaisMedicamentos", label: "Qual(is) medicamento(s)" },
      { key: "usaSuplementos", label: "Usa suplementos" },
      { key: "quaisSuplementos", label: "Qual(is) suplemento(s)" },
      { key: "usaEsteroides", label: "Usa esteroides" },
      { key: "usaTestosterona", label: "Usa testosterona" },
      { key: "usaMedSonoAnsiedade", label: "Usa med sono/ansiedade" },
      { key: "quaisMedSonoAnsiedade", label: "Qual(is) sono/ansiedade" },
      { key: "alergiaMedicamento", label: "Alergia a medicamento" },
      { key: "qualAlergia", label: "Qual alergia" },
      { key: "alergiaAmbiental", label: "Alergia ambiental" },
      { key: "fezCirurgia", label: "Já fez cirurgia" },
      { key: "qualCirurgia", label: "Qual cirurgia" },
      { key: "hospitalizadoUltimoAno", label: "Hospitalizado último ano" },
      { key: "teveCovidDengue", label: "Covid/Dengue" },
      { key: "qualCovidDengue", label: "Qual e quando" },
      { key: "fuma", label: "Fuma" },
      { key: "frequenciaAlcool", label: "Frequência de álcool" },
    ],
  },
  {
    title: "Estilo de vida",
    fields: [
      { key: "atividadeFisica", label: "Atividade física" },
      { key: "qualAtividadeFisica", label: "Qual atividade e frequência" },
      { key: "qualidadeSono", label: "Qualidade do sono" },
      { key: "nivelEstresse", label: "Nível de estresse" },
    ],
  },
  {
    title: "Cabelo",
    fields: [
      { key: "queixaCapilar", label: "Queixa capilar", type: "list" },
      { key: "tempoQueixa", label: "Tempo da queixa" },
      { key: "tipoQueda", label: "Tipo de queda" },
      { key: "eventosAssociados", label: "Eventos associados", type: "list" },
      { key: "historicoFamiliarQueda", label: "Histórico familiar" },
      { key: "quemHistorico", label: "Por parte de quem" },
      { key: "tratamentosAnteriores", label: "Tratamentos anteriores" },
      { key: "usouMinoxidilFinasterida", label: "Usou Minoxidil/Finasterida" },
      { key: "quaisTempoUso", label: "Qual(is) e tempo de uso" },
      { key: "examesSanguineRecentes", label: "Exames sangue recentes" },
    ],
  },
  {
    title: "Sobrancelhas",
    fields: [
      { key: "temQueixaSobrancelha", label: "Tem queixa sobrancelha" },
      { key: "queixaSobrancelha", label: "Queixa específica", type: "list" },
      { key: "procedimentoSobrancelhaAnterior", label: "Procedimento anterior" },
      { key: "qualProcedimento", label: "Qual e quando" },
    ],
  },
  {
    title: "Fechamento",
    fields: [
      { key: "principalIncomodo", label: "Principal incômodo" },
      { key: "duvidaConsulta", label: "Dúvida para a consulta" },
      { key: "comoConheceu", label: "Como conheceu", type: "list" },
    ],
  },
];

function formatCell(value: unknown, type?: "list" | "bool" | "date"): string | Date {
  if (value === null || value === undefined) return "";
  if (type === "list") {
    if (!Array.isArray(value)) return "";
    return value.join(", ");
  }
  if (type === "bool") {
    if (value === true) return "Sim";
    if (value === false) return "Não";
    return "";
  }
  if (type === "date") {
    if (value instanceof Date) return value;
    if (typeof value === "string" && value) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return "";
  }
  if (typeof value === "string") return value;
  return String(value);
}

export async function GET(_req: NextRequest) {
  if (!isBrescancinAdminAuthenticated()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const records = await prisma.brescancinResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Clínica Brescancin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Respostas");

  const headers = [
    "#",
    "Recebido em",
    ...SECTIONS.flatMap((s) => s.fields.map((f) => `${s.title} — ${f.label}`)),
  ];
  sheet.columns = headers.map((h, i) => ({
    header: h,
    key: `c${i}`,
    width: i === 0 ? 5 : i === 1 ? 18 : 22,
  }));

  // Estilo cabeçalho
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1B3A6B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 32;
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 2 }];

  records.forEach((r, i) => {
    // Fonte de cada campo: ou direto na linha (etapa 1) ou em answers
    const answers = (r.answers ?? {}) as Record<string, unknown>;
    const top = r as unknown as Record<string, unknown>;
    const getValue = (key: string): unknown =>
      key in top && key !== "answers" ? top[key] : answers[key];

    const rowData: Record<string, string | Date | number> = {
      c0: i + 1,
      c1: r.createdAt,
    };
    let idx = 2;
    SECTIONS.forEach((s) => {
      s.fields.forEach((f) => {
        rowData[`c${idx}`] = formatCell(getValue(f.key), f.type);
        idx++;
      });
    });
    sheet.addRow(rowData);
  });

  // Formato de data nas colunas conhecidas (Recebido em + Data de nascimento)
  sheet.getColumn("c1").numFmt = "dd/mm/yyyy hh:mm";
  // Procura a coluna "Identificação — Data de nascimento" e aplica formato
  const dobIdx = headers.findIndex((h) => h === "Identificação — Data de nascimento");
  if (dobIdx >= 0) {
    sheet.getColumn(`c${dobIdx}`).numFmt = "dd/mm/yyyy";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="respostas-brescancin-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
