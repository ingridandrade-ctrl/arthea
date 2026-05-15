import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/mindfulness/admin-auth";
import {
  FFMQ_LABELS,
  DASS_LABELS,
  ffmqBand,
  dassBand,
  type FFMQFacet,
  type FFMQScores,
  type DASSSubscale,
  type DASSScores,
} from "@/lib/mindfulness/scoring";

const FFMQ_FACETS_ORDER: FFMQFacet[] = ["observe", "describe", "act_aware", "nonjudge", "nonreact"];
const DASS_SUBS_ORDER: DASSSubscale[] = ["depressao", "ansiedade", "estresse"];

const FFMQ_BAND_LABEL = {
  abaixo: "Abaixo da média",
  media: "Na média",
  acima: "Acima da média",
} as const;

const SAGE_FILL = "FF7A917C";
const SAND_FILL = "FFF0EAD9";

function styleHeader(sheet: ExcelJS.Worksheet, freezeCols = 4) {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SAGE_FILL } };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 26;
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: freezeCols }];
}

function bandColor(kind: "high" | "mid" | "low"): string {
  if (kind === "high") return "FFE6F0E8";
  if (kind === "mid") return "FFFAF0DC";
  return "FFFDE0E0";
}

export async function GET(_req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const participants = await prisma.mindfulnessParticipant.findMany({
    include: { responses: true },
    orderBy: { createdAt: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Iasmim Sasseron — Mindfulness";
  workbook.created = new Date();

  // =====================================================================
  // Aba 1 — Resumo dos participantes
  // =====================================================================
  const sResumo = workbook.addWorksheet("Resumo");
  sResumo.columns = [
    { header: "#", key: "num", width: 5 },
    { header: "Nome", key: "nome", width: 28 },
    { header: "E-mail", key: "email", width: 30 },
    { header: "Telefone", key: "telefone", width: 16 },
    { header: "Idade", key: "idade", width: 8 },
    { header: "Profissão", key: "profissao", width: 22 },
    { header: "Escolaridade", key: "escolaridade", width: 22 },
    { header: "Estado civil", key: "estadocivil", width: 22 },
    { header: "Meditação prévia", key: "med", width: 16 },
    { header: "Qual prática", key: "qualmed", width: 22 },
    { header: "Há quanto tempo", key: "tempomed", width: 16 },
    { header: "Atenção plena", key: "ffmq", width: 14 },
    { header: "Saúde mental", key: "dass", width: 14 },
    { header: "Cadastro", key: "createdAt", width: 14 },
  ];
  styleHeader(sResumo, 2);
  participants.forEach((p, i) => {
    const ffmqResp = p.responses.find((r) => r.instrument === "FFMQ");
    const dassResp = p.responses.find((r) => r.instrument === "DASS21");
    sResumo.addRow({
      num: i + 1,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone ?? "",
      idade: p.idade,
      profissao: p.profissao ?? "",
      escolaridade: p.escolaridade ?? "",
      estadocivil: p.estadoCivil ?? "",
      med: p.meditacaoPrevia ? "Sim" : "Não",
      qualmed: p.qualMeditacao ?? "",
      tempomed: p.tempoMeditacao ?? "",
      ffmq: ffmqResp ? "✓ Respondido" : "Pendente",
      dass: dassResp ? "✓ Respondido" : "Pendente",
      createdAt: p.createdAt.toLocaleDateString("pt-BR"),
    });
  });

  // =====================================================================
  // Aba 2 — FFMQ (Atenção Plena)
  // =====================================================================
  const sFFMQ = workbook.addWorksheet("Atenção plena");
  const ffmqCols: Partial<ExcelJS.Column>[] = [
    { header: "#", key: "num", width: 5 },
    { header: "Nome", key: "nome", width: 28 },
    { header: "E-mail", key: "email", width: 30 },
    { header: "Data", key: "data", width: 12 },
  ];
  for (let i = 1; i <= 39; i++) {
    ffmqCols.push({ header: `P${i}`, key: `p${i}`, width: 5 });
  }
  FFMQ_FACETS_ORDER.forEach((f) => {
    ffmqCols.push({ header: FFMQ_LABELS[f], key: f, width: 13 });
  });
  ffmqCols.push({ header: "Total", key: "total", width: 8 });
  FFMQ_FACETS_ORDER.forEach((f) => {
    ffmqCols.push({ header: `Faixa — ${FFMQ_LABELS[f]}`, key: `f_${f}`, width: 18 });
  });
  sFFMQ.columns = ffmqCols as ExcelJS.Column[];
  styleHeader(sFFMQ, 4);

  participants.forEach((p, i) => {
    const resp = p.responses.find((r) => r.instrument === "FFMQ");
    if (!resp) return;
    const answers = resp.answers as Record<string, number>;
    const scores = resp.scores as unknown as FFMQScores;
    const row: Record<string, unknown> = {
      num: i + 1,
      nome: p.nome,
      email: p.email,
      data: resp.createdAt.toLocaleDateString("pt-BR"),
    };
    for (let j = 1; j <= 39; j++) row[`p${j}`] = answers[String(j)] ?? "";
    FFMQ_FACETS_ORDER.forEach((f) => {
      row[f] = scores[f];
    });
    row.total = scores.total;
    FFMQ_FACETS_ORDER.forEach((f) => {
      row[`f_${f}`] = FFMQ_BAND_LABEL[ffmqBand(f, scores[f])];
    });
    const added = sFFMQ.addRow(row);

    // Pinta as células de faixa conforme cor
    FFMQ_FACETS_ORDER.forEach((f) => {
      const cell = added.getCell(`f_${f}`);
      const b = ffmqBand(f, scores[f]);
      const tone = b === "abaixo" ? "low" : b === "media" ? "mid" : "high";
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bandColor(tone) } };
      cell.alignment = { horizontal: "center" };
    });
  });

  // =====================================================================
  // Aba 3 — DASS-21 (Saúde Mental)
  // =====================================================================
  const sDASS = workbook.addWorksheet("Saúde mental");
  const dassCols: Partial<ExcelJS.Column>[] = [
    { header: "#", key: "num", width: 5 },
    { header: "Nome", key: "nome", width: 28 },
    { header: "E-mail", key: "email", width: 30 },
    { header: "Data", key: "data", width: 12 },
  ];
  for (let i = 1; i <= 21; i++) {
    dassCols.push({ header: `P${i}`, key: `p${i}`, width: 5 });
  }
  DASS_SUBS_ORDER.forEach((s) => {
    dassCols.push({ header: DASS_LABELS[s], key: s, width: 12 });
  });
  DASS_SUBS_ORDER.forEach((s) => {
    dassCols.push({ header: `Faixa — ${DASS_LABELS[s]}`, key: `f_${s}`, width: 20 });
  });
  sDASS.columns = dassCols as ExcelJS.Column[];
  styleHeader(sDASS, 4);

  participants.forEach((p, i) => {
    const resp = p.responses.find((r) => r.instrument === "DASS21");
    if (!resp) return;
    const answers = resp.answers as Record<string, number>;
    const scores = resp.scores as unknown as DASSScores;
    const row: Record<string, unknown> = {
      num: i + 1,
      nome: p.nome,
      email: p.email,
      data: resp.createdAt.toLocaleDateString("pt-BR"),
    };
    for (let j = 1; j <= 21; j++) row[`p${j}`] = answers[String(j)] ?? "";
    DASS_SUBS_ORDER.forEach((s) => {
      row[s] = scores[s];
    });
    DASS_SUBS_ORDER.forEach((s) => {
      row[`f_${s}`] = dassBand(s, scores[s]);
    });
    const added = sDASS.addRow(row);

    DASS_SUBS_ORDER.forEach((s) => {
      const cell = added.getCell(`f_${s}`);
      const band = dassBand(s, scores[s]);
      const tone = band === "Normal" ? "high" : band === "Leve" ? "mid" : "low";
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bandColor(tone) } };
      cell.alignment = { horizontal: "center" };
    });
  });

  // =====================================================================
  // Aba 4 — Referência (faixas)
  // =====================================================================
  const sRef = workbook.addWorksheet("Referência");
  sRef.columns = [
    { header: "Instrumento", key: "inst", width: 18 },
    { header: "Dimensão", key: "dim", width: 22 },
    { header: "Faixa", key: "band", width: 22 },
    { header: "Pontuação", key: "range", width: 18 },
  ];
  styleHeader(sRef, 1);
  const ffmqRefBands: Record<FFMQFacet, [string, string, string]> = {
    observe: ["Abaixo de 27", "27 a 32", "Acima de 32"],
    describe: ["Abaixo de 30", "30 a 32", "Acima de 33"],
    act_aware: ["Abaixo de 26", "26 a 28", "Acima de 29"],
    nonjudge: ["Abaixo de 29", "29 a 32", "Acima de 33"],
    nonreact: ["Abaixo de 22", "22 a 25", "Acima de 26"],
  };
  FFMQ_FACETS_ORDER.forEach((f) => {
    const [lo, mid, hi] = ffmqRefBands[f];
    sRef.addRow({ inst: "Atenção plena", dim: FFMQ_LABELS[f], band: "Abaixo da média", range: lo });
    sRef.addRow({ inst: "Atenção plena", dim: FFMQ_LABELS[f], band: "Na média", range: mid });
    sRef.addRow({ inst: "Atenção plena", dim: FFMQ_LABELS[f], band: "Acima da média", range: hi });
  });
  const dassRefBands: Record<DASSSubscale, [string, string, string, string, string]> = {
    depressao: ["0 a 4", "5 a 6", "7 a 10", "11 a 13", "14+"],
    ansiedade: ["0 a 3", "4 a 5", "6 a 7", "8 a 9", "10+"],
    estresse: ["0 a 7", "8 a 9", "10 a 12", "13 a 16", "17+"],
  };
  const dassBandNames = ["Normal", "Leve", "Moderado", "Severo", "Extremamente severo"];
  DASS_SUBS_ORDER.forEach((s) => {
    dassRefBands[s].forEach((range, idx) => {
      sRef.addRow({
        inst: "Saúde mental",
        dim: DASS_LABELS[s],
        band: dassBandNames[idx],
        range,
      });
    });
  });

  // Aplica zebra striping na referência pra ficar mais fácil de ler
  sRef.eachRow({ includeEmpty: false }, (r, i) => {
    if (i > 1 && i % 2 === 0) {
      r.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SAND_FILL } };
      });
    }
  });

  // =====================================================================
  // Gera o buffer e retorna como download
  // =====================================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mindfulness-iasmim-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
