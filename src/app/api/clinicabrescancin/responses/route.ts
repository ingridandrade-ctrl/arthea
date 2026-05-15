import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const GENERO = ["Feminino", "Masculino"] as const;
const SIM_NAO = ["Sim", "Não"] as const;
const SIM_NAO_NAOSEI = ["Sim", "Não", "Não sei"] as const;
const ESTADO_CIVIL = [
  "Solteiro(a)",
  "Casado(a)",
  "União estável",
  "Divorciado(a)",
  "Viúvo(a)",
];
const FREQUENCIA_ALCOOL = [
  "Não costumo",
  "1x por semana",
  "2 a 3x por semana",
  "4 a 5x por semana",
  "6 a 7x por semana",
];
const QUALIDADE_SONO = ["Menos de 5h", "Entre 5h e 6h", "Entre 7h e 8h", "Mais de 8h"];
const NIVEL_ESTRESSE = ["Baixo", "Moderado", "Alto", "Muito alto"];

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toStrArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function toBoolFromSimNao(v: unknown): boolean | null {
  if (v === "Sim") return true;
  if (v === "Não") return false;
  return null;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhoneDigits(v: string): boolean {
  const d = v.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return err("Requisição inválida.");
  }
  if (!raw || typeof raw !== "object") return err("Requisição inválida.");
  const b = raw as Record<string, unknown>;

  // ─── Etapa 1 ───
  const nomeCompleto = toStr(b.nomeCompleto).trim();
  if (!nomeCompleto) return err("Preencha seu nome completo.");

  const dataNascimentoStr = toStr(b.dataNascimento).trim();
  if (!dataNascimentoStr) return err("Selecione sua data de nascimento.");
  const dataNascimento = new Date(dataNascimentoStr);
  if (Number.isNaN(dataNascimento.getTime())) {
    return err("Data de nascimento inválida.");
  }

  const genero = toStr(b.genero);
  if (!GENERO.includes(genero as (typeof GENERO)[number])) {
    return err("Selecione o gênero.");
  }

  const profissao = toStr(b.profissao).trim();
  if (!profissao) return err("Conte qual é sua profissão.");

  const cidade = toStr(b.cidade).trim();
  if (!cidade) return err("Em que cidade você mora?");

  const telefone = toStr(b.telefone).trim();
  if (!telefone || !isValidPhoneDigits(telefone)) return err("Telefone inválido.");

  const email = toStr(b.email).trim().toLowerCase();
  if (!email || !isValidEmail(email)) return err("E-mail inválido.");

  const estadoCivilRaw = toStr(b.estadoCivil).trim();
  const estadoCivil = ESTADO_CIVIL.includes(estadoCivilRaw) ? estadoCivilRaw : null;

  const apelido = toStr(b.apelido).trim() || null;
  const instagram = toStr(b.instagram).trim() || null;

  // ─── Etapa 2 — obrigatórios ───
  const doencasDiagnosticadas = toStrArray(b.doencasDiagnosticadas);
  if (doencasDiagnosticadas.length === 0) {
    return err("Selecione ao menos uma opção na lista de doenças.");
  }

  const usaMedicamentos = toStr(b.usaMedicamentos);
  if (!SIM_NAO.includes(usaMedicamentos as (typeof SIM_NAO)[number])) {
    return err("Informe se faz uso contínuo de medicamento.");
  }
  if (usaMedicamentos === "Sim" && !toStr(b.quaisMedicamentos).trim()) {
    return err("Conte qual(is) medicamento(s) você usa.");
  }

  const usaSuplementos = toStr(b.usaSuplementos);
  if (!SIM_NAO.includes(usaSuplementos as (typeof SIM_NAO)[number])) {
    return err("Informe se faz uso de suplementos.");
  }
  if (usaSuplementos === "Sim" && !toStr(b.quaisSuplementos).trim()) {
    return err("Conte qual(is) suplemento(s).");
  }

  const usaMedSonoAnsiedade = toStr(b.usaMedSonoAnsiedade);
  if (
    usaMedSonoAnsiedade === "Sim" &&
    !toStr(b.quaisMedSonoAnsiedade).trim()
  ) {
    return err("Conte qual(is) medicamento(s) para sono ou ansiedade.");
  }

  const alergiaMedicamento = toStr(b.alergiaMedicamento);
  if (!SIM_NAO_NAOSEI.includes(alergiaMedicamento as (typeof SIM_NAO_NAOSEI)[number])) {
    return err("Informe se tem alergia a medicamento.");
  }
  if (alergiaMedicamento === "Sim" && !toStr(b.qualAlergia).trim()) {
    return err("Conte qual medicamento causa alergia.");
  }

  const fezCirurgia = toStr(b.fezCirurgia);
  if (!SIM_NAO.includes(fezCirurgia as (typeof SIM_NAO)[number])) {
    return err("Informe se já fez cirurgia.");
  }
  if (fezCirurgia === "Sim" && !toStr(b.qualCirurgia).trim()) {
    return err("Conte qual cirurgia e quando.");
  }

  const teveCovidDengue = toStr(b.teveCovidDengue);
  if (!SIM_NAO.includes(teveCovidDengue as (typeof SIM_NAO)[number])) {
    return err("Informe se teve Covid ou Dengue.");
  }
  if (teveCovidDengue === "Sim" && !toStr(b.qualCovidDengue).trim()) {
    return err("Conte qual delas e quando.");
  }

  const fuma = toStr(b.fuma);
  if (!SIM_NAO.includes(fuma as (typeof SIM_NAO)[number])) {
    return err("Informe se você fuma.");
  }

  const frequenciaAlcool = toStr(b.frequenciaAlcool);
  if (!FREQUENCIA_ALCOOL.includes(frequenciaAlcool)) {
    return err("Selecione a frequência de consumo de álcool.");
  }

  // ─── Etapa 3 — obrigatórios ───
  const atividadeFisica = toStr(b.atividadeFisica);
  if (!SIM_NAO.includes(atividadeFisica as (typeof SIM_NAO)[number])) {
    return err("Informe se pratica atividade física.");
  }
  if (atividadeFisica === "Sim" && !toStr(b.qualAtividadeFisica).trim()) {
    return err("Conte qual atividade física e a frequência.");
  }

  const qualidadeSono = toStr(b.qualidadeSono);
  if (!QUALIDADE_SONO.includes(qualidadeSono)) {
    return err("Selecione a qualidade do seu sono.");
  }

  const nivelEstresse = toStr(b.nivelEstresse);
  if (!NIVEL_ESTRESSE.includes(nivelEstresse)) {
    return err("Selecione o nível de estresse.");
  }

  // ─── Etapa 5 — obrigatórios ───
  const principalIncomodo = toStr(b.principalIncomodo).trim();
  if (!principalIncomodo) return err("Conte o que mais te incomoda hoje.");

  const comoConheceu = toStrArray(b.comoConheceu);
  if (comoConheceu.length === 0) {
    return err("Conte como você conheceu a clínica.");
  }

  // ─── Coleta dos demais campos (todos opcionais) ───
  const answersJson: Prisma.InputJsonObject = {
    // Etapa 2
    doencasDiagnosticadas,
    saudeMae: toStrArray(b.saudeMae),
    saudePai: toStrArray(b.saudePai),
    usaMedicamentos,
    quaisMedicamentos: toStr(b.quaisMedicamentos).trim(),
    usaSuplementos,
    quaisSuplementos: toStr(b.quaisSuplementos).trim(),
    usaEsteroides: toStr(b.usaEsteroides),
    usaTestosterona: toStr(b.usaTestosterona),
    usaMedSonoAnsiedade,
    quaisMedSonoAnsiedade: toStr(b.quaisMedSonoAnsiedade).trim(),
    alergiaMedicamento,
    qualAlergia: toStr(b.qualAlergia).trim(),
    alergiaAmbiental: toStr(b.alergiaAmbiental),
    fezCirurgia,
    qualCirurgia: toStr(b.qualCirurgia).trim(),
    hospitalizadoUltimoAno: toStr(b.hospitalizadoUltimoAno),
    teveCovidDengue,
    qualCovidDengue: toStr(b.qualCovidDengue).trim(),
    fuma,
    frequenciaAlcool,
    // Etapa 3
    atividadeFisica,
    qualAtividadeFisica: toStr(b.qualAtividadeFisica).trim(),
    qualidadeSono,
    nivelEstresse,
    // Etapa 4
    queixaCapilar: toStrArray(b.queixaCapilar),
    tempoQueixa: toStr(b.tempoQueixa).trim(),
    tipoQueda: toStr(b.tipoQueda),
    eventosAssociados: toStrArray(b.eventosAssociados),
    historicoFamiliarQueda: toStr(b.historicoFamiliarQueda),
    quemHistorico: toStr(b.quemHistorico).trim(),
    tratamentosAnteriores: toStr(b.tratamentosAnteriores).trim(),
    usouMinoxidilFinasterida: toStr(b.usouMinoxidilFinasterida),
    quaisTempoUso: toStr(b.quaisTempoUso).trim(),
    examesSanguineRecentes: toStr(b.examesSanguineRecentes),
    temQueixaSobrancelha: toStr(b.temQueixaSobrancelha),
    queixaSobrancelha: toStrArray(b.queixaSobrancelha),
    procedimentoSobrancelhaAnterior: toStr(b.procedimentoSobrancelhaAnterior),
    qualProcedimento: toStr(b.qualProcedimento).trim(),
    // Etapa 5
    principalIncomodo,
    duvidaConsulta: toStr(b.duvidaConsulta).trim(),
    comoConheceu,
  };

  try {
    const resp = await prisma.brescancinResponse.create({
      data: {
        nomeCompleto,
        apelido,
        dataNascimento,
        genero,
        estadoCivil,
        profissao,
        temFilhos: toBoolFromSimNao(b.temFilhos),
        pretendeFilhos: toBoolFromSimNao(b.pretendeFilhos),
        cidade,
        telefone,
        email,
        instagram,
        answers: answersJson,
      },
      select: { id: true },
    });
    return NextResponse.json({ success: true, id: resp.id }, { status: 201 });
  } catch (e) {
    console.error("[brescancin] erro ao salvar resposta", e);
    return err(
      "Não conseguimos salvar agora. Tente novamente em instantes.",
      500,
    );
  }
}
