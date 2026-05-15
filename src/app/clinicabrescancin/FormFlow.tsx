"use client";

import { useEffect, useRef, useState } from "react";
import {
  COMO_CONHECEU,
  DOENCAS_DIAGNOSTICADAS,
  DOENCAS_EXCLUSIVA,
  ESTADO_CIVIL,
  EVENTOS_ASSOCIADOS,
  EVENTOS_ASSOCIADOS_EXCLUSIVA,
  EXAMES_SANGUINEOS_RECENTES,
  FREQUENCIA_ALCOOL,
  GENERO,
  NIVEL_ESTRESSE,
  QUALIDADE_SONO,
  QUEIXA_CAPILAR,
  QUEIXA_CAPILAR_EXCLUSIVA,
  QUEIXA_CAPILAR_QUEDA,
  QUEIXA_SOBRANCELHA,
  SAUDE_MAE,
  SAUDE_PAI,
  SAUDE_PAIS_EXCLUSIVA,
  SIM_NAO,
  SIM_NAO_NAOSEI,
  TIPO_QUEDA,
} from "@/lib/clinicabrescancin/questions";

type Step = "welcome" | "step1" | "step2" | "step3" | "step4" | "step5" | "done";

type Answers = {
  // Etapa 1
  nomeCompleto: string;
  apelido: string;
  dataNascimento: string; // ISO YYYY-MM-DD
  genero: string;
  estadoCivil: string;
  profissao: string;
  temFilhos: string;
  pretendeFilhos: string;
  cidade: string;
  telefone: string;
  email: string;
  instagram: string;
  // Etapa 2
  doencasDiagnosticadas: string[];
  saudeMae: string[];
  saudePai: string[];
  usaMedicamentos: string;
  quaisMedicamentos: string;
  usaSuplementos: string;
  quaisSuplementos: string;
  usaEsteroides: string;
  usaTestosterona: string;
  usaMedSonoAnsiedade: string;
  quaisMedSonoAnsiedade: string;
  alergiaMedicamento: string;
  qualAlergia: string;
  alergiaAmbiental: string;
  fezCirurgia: string;
  qualCirurgia: string;
  hospitalizadoUltimoAno: string;
  teveCovidDengue: string;
  qualCovidDengue: string;
  fuma: string;
  frequenciaAlcool: string;
  // Etapa 3
  atividadeFisica: string;
  qualAtividadeFisica: string;
  qualidadeSono: string;
  nivelEstresse: string;
  // Etapa 4 — Cabelo
  queixaCapilar: string[];
  tempoQueixa: string;
  tipoQueda: string;
  eventosAssociados: string[];
  historicoFamiliarQueda: string;
  quemHistorico: string;
  tratamentosAnteriores: string;
  usouMinoxidilFinasterida: string;
  quaisTempoUso: string;
  examesSanguineRecentes: string;
  // Etapa 4 — Sobrancelhas
  temQueixaSobrancelha: string;
  queixaSobrancelha: string[];
  procedimentoSobrancelhaAnterior: string;
  qualProcedimento: string;
  // Etapa 5 — Fechamento
  principalIncomodo: string;
  duvidaConsulta: string;
  comoConheceu: string[];
};

type Errors = Partial<Record<keyof Answers, string>>;

const INITIAL_ANSWERS: Answers = {
  nomeCompleto: "",
  apelido: "",
  dataNascimento: "",
  genero: "",
  estadoCivil: "",
  profissao: "",
  temFilhos: "",
  pretendeFilhos: "",
  cidade: "",
  telefone: "",
  email: "",
  instagram: "",
  doencasDiagnosticadas: [],
  saudeMae: [],
  saudePai: [],
  usaMedicamentos: "",
  quaisMedicamentos: "",
  usaSuplementos: "",
  quaisSuplementos: "",
  usaEsteroides: "",
  usaTestosterona: "",
  usaMedSonoAnsiedade: "",
  quaisMedSonoAnsiedade: "",
  alergiaMedicamento: "",
  qualAlergia: "",
  alergiaAmbiental: "",
  fezCirurgia: "",
  qualCirurgia: "",
  hospitalizadoUltimoAno: "",
  teveCovidDengue: "",
  qualCovidDengue: "",
  fuma: "",
  frequenciaAlcool: "",
  atividadeFisica: "",
  qualAtividadeFisica: "",
  qualidadeSono: "",
  nivelEstresse: "",
  queixaCapilar: [],
  tempoQueixa: "",
  tipoQueda: "",
  eventosAssociados: [],
  historicoFamiliarQueda: "",
  quemHistorico: "",
  tratamentosAnteriores: "",
  usouMinoxidilFinasterida: "",
  quaisTempoUso: "",
  examesSanguineRecentes: "",
  temQueixaSobrancelha: "",
  queixaSobrancelha: [],
  procedimentoSobrancelhaAnterior: "",
  qualProcedimento: "",
  principalIncomodo: "",
  duvidaConsulta: "",
  comoConheceu: [],
};

const FORM_STEPS: Step[] = ["step1", "step2", "step3", "step4", "step5"];

function phoneMask(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  const a = digits.slice(0, 2);
  const long = digits.length > 10;
  const b = long ? digits.slice(2, 7) : digits.slice(2, 6);
  const c = long ? digits.slice(7, 11) : digits.slice(6, 10);
  if (!a) return "";
  if (!b) return `(${a}`;
  if (!c) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

function isValidPhone(v: string): boolean {
  const d = v.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function validateStep1(a: Answers): Errors {
  const e: Errors = {};
  if (!a.nomeCompleto.trim()) e.nomeCompleto = "Preencha seu nome completo.";
  if (!a.dataNascimento) e.dataNascimento = "Selecione sua data de nascimento.";
  if (!a.genero) e.genero = "Selecione uma opção.";
  if (!a.profissao.trim()) e.profissao = "Conte qual é sua profissão.";
  if (!a.cidade.trim()) e.cidade = "Em que cidade você mora?";
  if (!a.telefone.trim()) e.telefone = "Informe um telefone para contato.";
  else if (!isValidPhone(a.telefone)) e.telefone = "Telefone incompleto.";
  if (!a.email.trim()) e.email = "Informe seu e-mail.";
  else if (!isValidEmail(a.email)) e.email = "E-mail inválido.";
  return e;
}

function validateStep2(a: Answers): Errors {
  const e: Errors = {};
  if (a.doencasDiagnosticadas.length === 0) {
    e.doencasDiagnosticadas = "Selecione ao menos uma opção (ou \"Nenhuma\").";
  }
  if (!a.usaMedicamentos) e.usaMedicamentos = "Selecione uma opção.";
  if (a.usaMedicamentos === "Sim" && !a.quaisMedicamentos.trim()) {
    e.quaisMedicamentos = "Conte qual(is) e para que usa.";
  }
  if (!a.usaSuplementos) e.usaSuplementos = "Selecione uma opção.";
  if (a.usaSuplementos === "Sim" && !a.quaisSuplementos.trim()) {
    e.quaisSuplementos = "Conte qual(is) suplemento(s).";
  }
  if (a.usaMedSonoAnsiedade === "Sim" && !a.quaisMedSonoAnsiedade.trim()) {
    e.quaisMedSonoAnsiedade = "Conte qual(is).";
  }
  if (!a.alergiaMedicamento) e.alergiaMedicamento = "Selecione uma opção.";
  if (a.alergiaMedicamento === "Sim" && !a.qualAlergia.trim()) {
    e.qualAlergia = "Conte qual.";
  }
  if (!a.fezCirurgia) e.fezCirurgia = "Selecione uma opção.";
  if (a.fezCirurgia === "Sim" && !a.qualCirurgia.trim()) {
    e.qualCirurgia = "Conte qual e quando aproximadamente.";
  }
  if (!a.teveCovidDengue) e.teveCovidDengue = "Selecione uma opção.";
  if (a.teveCovidDengue === "Sim" && !a.qualCovidDengue.trim()) {
    e.qualCovidDengue = "Conte qual delas e quando.";
  }
  if (!a.fuma) e.fuma = "Selecione uma opção.";
  if (!a.frequenciaAlcool) e.frequenciaAlcool = "Selecione uma opção.";
  return e;
}

function validateStep3(a: Answers): Errors {
  const e: Errors = {};
  if (!a.atividadeFisica) e.atividadeFisica = "Selecione uma opção.";
  if (a.atividadeFisica === "Sim" && !a.qualAtividadeFisica.trim()) {
    e.qualAtividadeFisica = "Conte qual e com que frequência.";
  }
  if (!a.qualidadeSono) e.qualidadeSono = "Selecione uma opção.";
  if (!a.nivelEstresse) e.nivelEstresse = "Selecione uma opção.";
  return e;
}

function validateStep4(_: Answers): Errors {
  // Etapa 4 não tem campos obrigatórios — todas as perguntas são opcionais.
  return {};
}

function validateStep5(a: Answers): Errors {
  const e: Errors = {};
  if (!a.principalIncomodo.trim()) {
    e.principalIncomodo = "Conte rapidinho — pode ser direto.";
  }
  if (a.comoConheceu.length === 0) {
    e.comoConheceu = "Selecione ao menos uma opção.";
  }
  return e;
}

function validateForStep(step: Step, a: Answers): Errors {
  if (step === "step1") return validateStep1(a);
  if (step === "step2") return validateStep2(a);
  if (step === "step3") return validateStep3(a);
  if (step === "step4") return validateStep4(a);
  if (step === "step5") return validateStep5(a);
  return {};
}

// ─── Field components ──────────────────────────────────────────────

type FieldTextProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  placeholder?: string;
  helper?: string;
  error?: string;
};

function FieldText({
  label,
  required,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  helper,
  error,
}: FieldTextProps) {
  return (
    <div className="brescancin-field">
      <label className={`brescancin-label${required ? " brescancin-label-required" : ""}`}>
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        className="brescancin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {helper && <span className="brescancin-help">{helper}</span>}
      {error && <span className="brescancin-error">{error}</span>}
    </div>
  );
}

type FieldTextareaProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
};

function FieldTextarea({ label, required, value, onChange, placeholder, error }: FieldTextareaProps) {
  return (
    <div className="brescancin-field">
      <label className={`brescancin-label${required ? " brescancin-label-required" : ""}`}>
        {label}
      </label>
      <textarea
        className="brescancin-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="brescancin-error">{error}</span>}
    </div>
  );
}

type FieldSelectProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: string;
};

function FieldSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  error,
}: FieldSelectProps) {
  return (
    <div className="brescancin-field">
      <label className={`brescancin-label${required ? " brescancin-label-required" : ""}`}>
        {label}
      </label>
      <select
        className="brescancin-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <span className="brescancin-error">{error}</span>}
    </div>
  );
}

type FieldRadioProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  helper?: string;
  error?: string;
};

function FieldRadio({ label, required, value, onChange, options, helper, error }: FieldRadioProps) {
  return (
    <div className="brescancin-field">
      <span className={`brescancin-label${required ? " brescancin-label-required" : ""}`}>
        {label}
      </span>
      {helper && <span className="brescancin-help">{helper}</span>}
      <div className="brescancin-radio-group">
        {options.map((opt) => (
          <label key={opt} className="brescancin-radio">
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {error && <span className="brescancin-error">{error}</span>}
    </div>
  );
}

type FieldCheckboxProps = {
  label: string;
  required?: boolean;
  values: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  /** Opção exclusiva: marcar zera as outras; marcar outra zera essa. */
  exclusive?: string;
  helper?: string;
  error?: string;
};

function FieldCheckbox({
  label,
  required,
  values,
  onChange,
  options,
  exclusive,
  helper,
  error,
}: FieldCheckboxProps) {
  const toggle = (opt: string) => {
    const has = values.includes(opt);
    if (has) {
      onChange(values.filter((v) => v !== opt));
      return;
    }
    if (exclusive && opt === exclusive) {
      onChange([exclusive]);
      return;
    }
    if (exclusive && values.includes(exclusive)) {
      onChange([...values.filter((v) => v !== exclusive), opt]);
      return;
    }
    onChange([...values, opt]);
  };
  return (
    <div className="brescancin-field">
      <span className={`brescancin-label${required ? " brescancin-label-required" : ""}`}>
        {label}
      </span>
      {helper && <span className="brescancin-help">{helper}</span>}
      <div className="brescancin-checkbox-group">
        {options.map((opt) => (
          <label key={opt} className="brescancin-checkbox">
            <input
              type="checkbox"
              checked={values.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {error && <span className="brescancin-error">{error}</span>}
    </div>
  );
}

// ─── Step renderers ────────────────────────────────────────────────

type StepProps = {
  answers: Answers;
  errors: Errors;
  update: <K extends keyof Answers>(field: K, value: Answers[K]) => void;
};

function Step1Fields({ answers, errors, update }: StepProps) {
  return (
    <>
      <FieldText
        label="Nome completo"
        required
        value={answers.nomeCompleto}
        onChange={(v) => update("nomeCompleto", v)}
        error={errors.nomeCompleto}
      />
      <FieldText
        label="Como prefere ser chamado(a)?"
        value={answers.apelido}
        onChange={(v) => update("apelido", v)}
        placeholder="Apelido ou primeiro nome"
        error={errors.apelido}
      />
      <FieldText
        label="Data de nascimento"
        required
        type="date"
        value={answers.dataNascimento}
        onChange={(v) => update("dataNascimento", v)}
        error={errors.dataNascimento}
      />
      <FieldRadio
        label="Gênero"
        required
        value={answers.genero}
        onChange={(v) => update("genero", v)}
        options={GENERO}
        error={errors.genero}
      />
      <FieldSelect
        label="Estado civil"
        value={answers.estadoCivil}
        onChange={(v) => update("estadoCivil", v)}
        options={ESTADO_CIVIL}
        error={errors.estadoCivil}
      />
      <FieldText
        label="Profissão"
        required
        value={answers.profissao}
        onChange={(v) => update("profissao", v)}
        error={errors.profissao}
      />
      <FieldRadio
        label="Tem filhos?"
        value={answers.temFilhos}
        onChange={(v) => {
          update("temFilhos", v);
          if (v === "Sim") update("pretendeFilhos", "");
        }}
        options={SIM_NAO}
        error={errors.temFilhos}
      />
      {answers.temFilhos === "Não" && (
        <div className="brescancin-subfield">
          <FieldRadio
            label="Pretende ter filhos no próximo ano?"
            value={answers.pretendeFilhos}
            onChange={(v) => update("pretendeFilhos", v)}
            options={SIM_NAO}
            error={errors.pretendeFilhos}
          />
        </div>
      )}
      <FieldText
        label="Cidade"
        required
        value={answers.cidade}
        onChange={(v) => update("cidade", v)}
        error={errors.cidade}
      />
      <FieldText
        label="Telefone"
        required
        type="tel"
        inputMode="tel"
        placeholder="(XX) XXXXX-XXXX"
        value={answers.telefone}
        onChange={(v) => update("telefone", phoneMask(v))}
        error={errors.telefone}
      />
      <FieldText
        label="E-mail"
        required
        type="email"
        inputMode="email"
        value={answers.email}
        onChange={(v) => update("email", v)}
        error={errors.email}
      />
      <FieldText
        label="Instagram"
        placeholder="@seuperfil"
        value={answers.instagram}
        onChange={(v) => update("instagram", v)}
        error={errors.instagram}
      />
    </>
  );
}

function Step2Fields({ answers, errors, update }: StepProps) {
  return (
    <>
      <FieldCheckbox
        label="Você tem alguma dessas doenças diagnosticadas?"
        required
        values={answers.doencasDiagnosticadas}
        onChange={(v) => update("doencasDiagnosticadas", v)}
        options={DOENCAS_DIAGNOSTICADAS}
        exclusive={DOENCAS_EXCLUSIVA}
        error={errors.doencasDiagnosticadas}
      />
      <FieldCheckbox
        label="Análise sobre a saúde da sua mãe"
        helper="Marque tudo que se aplica. Se já faleceu, marque também as condições que ela tinha em vida."
        values={answers.saudeMae}
        onChange={(v) => update("saudeMae", v)}
        options={SAUDE_MAE}
        exclusive={SAUDE_PAIS_EXCLUSIVA}
        error={errors.saudeMae}
      />
      <FieldCheckbox
        label="Análise sobre a saúde do seu pai"
        helper="Marque tudo que se aplica. Se já faleceu, marque também as condições que ele tinha em vida."
        values={answers.saudePai}
        onChange={(v) => update("saudePai", v)}
        options={SAUDE_PAI}
        exclusive={SAUDE_PAIS_EXCLUSIVA}
        error={errors.saudePai}
      />
      <FieldRadio
        label="Faz uso contínuo de algum medicamento?"
        required
        value={answers.usaMedicamentos}
        onChange={(v) => {
          update("usaMedicamentos", v);
          if (v !== "Sim") update("quaisMedicamentos", "");
        }}
        options={SIM_NAO}
        error={errors.usaMedicamentos}
      />
      {answers.usaMedicamentos === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual(is) medicamento(s)?"
            required
            value={answers.quaisMedicamentos}
            onChange={(v) => update("quaisMedicamentos", v)}
            placeholder="Nome do medicamento e para que usa"
            error={errors.quaisMedicamentos}
          />
        </div>
      )}
      <FieldRadio
        label="Faz uso de algum suplemento ou vitamina?"
        required
        value={answers.usaSuplementos}
        onChange={(v) => {
          update("usaSuplementos", v);
          if (v !== "Sim") update("quaisSuplementos", "");
        }}
        options={SIM_NAO}
        error={errors.usaSuplementos}
      />
      {answers.usaSuplementos === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual(is)?"
            required
            value={answers.quaisSuplementos}
            onChange={(v) => update("quaisSuplementos", v)}
            error={errors.quaisSuplementos}
          />
        </div>
      )}
      <FieldRadio
        label="Faz uso de esteroides anabolizantes?"
        value={answers.usaEsteroides}
        onChange={(v) => update("usaEsteroides", v)}
        options={SIM_NAO}
        error={errors.usaEsteroides}
      />
      <FieldRadio
        label="Faz uso de testosterona?"
        value={answers.usaTestosterona}
        onChange={(v) => update("usaTestosterona", v)}
        options={SIM_NAO}
        error={errors.usaTestosterona}
      />
      <FieldRadio
        label="Faz uso de medicamento para sono ou ansiedade?"
        value={answers.usaMedSonoAnsiedade}
        onChange={(v) => {
          update("usaMedSonoAnsiedade", v);
          if (v !== "Sim") update("quaisMedSonoAnsiedade", "");
        }}
        options={SIM_NAO}
        error={errors.usaMedSonoAnsiedade}
      />
      {answers.usaMedSonoAnsiedade === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual(is)?"
            required
            value={answers.quaisMedSonoAnsiedade}
            onChange={(v) => update("quaisMedSonoAnsiedade", v)}
            error={errors.quaisMedSonoAnsiedade}
          />
        </div>
      )}
      <FieldRadio
        label="Tem alergia a algum medicamento?"
        required
        value={answers.alergiaMedicamento}
        onChange={(v) => {
          update("alergiaMedicamento", v);
          if (v !== "Sim") update("qualAlergia", "");
        }}
        options={SIM_NAO_NAOSEI}
        error={errors.alergiaMedicamento}
      />
      {answers.alergiaMedicamento === "Sim" && (
        <div className="brescancin-subfield">
          <FieldText
            label="Qual?"
            required
            value={answers.qualAlergia}
            onChange={(v) => update("qualAlergia", v)}
            error={errors.qualAlergia}
          />
        </div>
      )}
      <FieldRadio
        label="Tem alergia ambiental?"
        helper="Pelo, ácaros, camarão, frutos do mar."
        value={answers.alergiaAmbiental}
        onChange={(v) => update("alergiaAmbiental", v)}
        options={SIM_NAO}
        error={errors.alergiaAmbiental}
      />
      <FieldRadio
        label="Já fez alguma cirurgia?"
        required
        value={answers.fezCirurgia}
        onChange={(v) => {
          update("fezCirurgia", v);
          if (v !== "Sim") update("qualCirurgia", "");
        }}
        options={SIM_NAO}
        error={errors.fezCirurgia}
      />
      {answers.fezCirurgia === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual e quando aproximadamente?"
            required
            value={answers.qualCirurgia}
            onChange={(v) => update("qualCirurgia", v)}
            error={errors.qualCirurgia}
          />
        </div>
      )}
      <FieldRadio
        label="Ficou hospitalizado(a) no último ano?"
        value={answers.hospitalizadoUltimoAno}
        onChange={(v) => update("hospitalizadoUltimoAno", v)}
        options={SIM_NAO}
        error={errors.hospitalizadoUltimoAno}
      />
      <FieldRadio
        label="Teve Covid ou Dengue?"
        required
        value={answers.teveCovidDengue}
        onChange={(v) => {
          update("teveCovidDengue", v);
          if (v !== "Sim") update("qualCovidDengue", "");
        }}
        options={SIM_NAO}
        error={errors.teveCovidDengue}
      />
      {answers.teveCovidDengue === "Sim" && (
        <div className="brescancin-subfield">
          <FieldText
            label="Qual delas e quando?"
            required
            value={answers.qualCovidDengue}
            onChange={(v) => update("qualCovidDengue", v)}
            error={errors.qualCovidDengue}
          />
        </div>
      )}
      <FieldRadio
        label="Fuma?"
        required
        value={answers.fuma}
        onChange={(v) => update("fuma", v)}
        options={SIM_NAO}
        error={errors.fuma}
      />
      <FieldRadio
        label="Com que frequência consome álcool?"
        required
        value={answers.frequenciaAlcool}
        onChange={(v) => update("frequenciaAlcool", v)}
        options={FREQUENCIA_ALCOOL}
        error={errors.frequenciaAlcool}
      />
    </>
  );
}

function Step4Fields({ answers, errors, update }: StepProps) {
  const queixaCapilarAtiva =
    answers.queixaCapilar.length > 0 &&
    !answers.queixaCapilar.includes(QUEIXA_CAPILAR_EXCLUSIVA);
  const temQueda = answers.queixaCapilar.includes(QUEIXA_CAPILAR_QUEDA);

  return (
    <>
      <h3 className="brescancin-block-title">Cabelo</h3>
      <FieldCheckbox
        label="Qual é sua queixa em relação ao cabelo?"
        values={answers.queixaCapilar}
        onChange={(v) => {
          update("queixaCapilar", v);
          const ativa = v.length > 0 && !v.includes(QUEIXA_CAPILAR_EXCLUSIVA);
          if (!ativa) {
            update("tempoQueixa", "");
            update("tipoQueda", "");
          } else if (!v.includes(QUEIXA_CAPILAR_QUEDA)) {
            update("tipoQueda", "");
          }
        }}
        options={QUEIXA_CAPILAR}
        exclusive={QUEIXA_CAPILAR_EXCLUSIVA}
        error={errors.queixaCapilar}
      />
      {queixaCapilarAtiva && (
        <div className="brescancin-subfield">
          <FieldText
            label="Há quanto tempo você notou isso?"
            value={answers.tempoQueixa}
            onChange={(v) => update("tempoQueixa", v)}
            placeholder="Ex: Há uns 8 meses, desde o início do ano..."
            error={errors.tempoQueixa}
          />
          {temQueda && (
            <FieldRadio
              label="A queda começou de repente ou foi gradual?"
              value={answers.tipoQueda}
              onChange={(v) => update("tipoQueda", v)}
              options={TIPO_QUEDA}
              error={errors.tipoQueda}
            />
          )}
        </div>
      )}
      <FieldCheckbox
        label="Algum desses eventos coincidiu com o início da queixa?"
        values={answers.eventosAssociados}
        onChange={(v) => update("eventosAssociados", v)}
        options={EVENTOS_ASSOCIADOS}
        exclusive={EVENTOS_ASSOCIADOS_EXCLUSIVA}
        error={errors.eventosAssociados}
      />
      <FieldRadio
        label="Há histórico de queda de cabelo na família?"
        value={answers.historicoFamiliarQueda}
        onChange={(v) => {
          update("historicoFamiliarQueda", v);
          if (v !== "Sim") update("quemHistorico", "");
        }}
        options={SIM_NAO_NAOSEI}
        error={errors.historicoFamiliarQueda}
      />
      {answers.historicoFamiliarQueda === "Sim" && (
        <div className="brescancin-subfield">
          <FieldText
            label="Por parte de quem?"
            value={answers.quemHistorico}
            onChange={(v) => update("quemHistorico", v)}
            placeholder="Mãe, pai, avós..."
            error={errors.quemHistorico}
          />
        </div>
      )}
      <FieldTextarea
        label="Já fez algum tratamento para o cabelo?"
        value={answers.tratamentosAnteriores}
        onChange={(v) => update("tratamentosAnteriores", v)}
        placeholder={
          "Ex: Minoxidil por conta própria, biotina, shampoos específicos... Se não tentou nada, escreva não."
        }
        error={errors.tratamentosAnteriores}
      />
      <FieldRadio
        label="Já usou Minoxidil ou Finasterida?"
        value={answers.usouMinoxidilFinasterida}
        onChange={(v) => {
          update("usouMinoxidilFinasterida", v);
          if (v !== "Sim") update("quaisTempoUso", "");
        }}
        options={SIM_NAO}
        error={errors.usouMinoxidilFinasterida}
      />
      {answers.usouMinoxidilFinasterida === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual(is) e por quanto tempo?"
            value={answers.quaisTempoUso}
            onChange={(v) => update("quaisTempoUso", v)}
            error={errors.quaisTempoUso}
          />
        </div>
      )}
      <FieldRadio
        label="Fez exames de sangue recentes?"
        value={answers.examesSanguineRecentes}
        onChange={(v) => update("examesSanguineRecentes", v)}
        options={EXAMES_SANGUINEOS_RECENTES}
        error={errors.examesSanguineRecentes}
      />

      <h3 className="brescancin-block-title">Sobrancelhas</h3>
      <FieldRadio
        label="Tem alguma queixa em relação às sobrancelhas?"
        value={answers.temQueixaSobrancelha}
        onChange={(v) => {
          update("temQueixaSobrancelha", v);
          if (v !== "Sim") {
            update("queixaSobrancelha", []);
            update("procedimentoSobrancelhaAnterior", "");
            update("qualProcedimento", "");
          }
        }}
        options={SIM_NAO}
        error={errors.temQueixaSobrancelha}
      />
      {answers.temQueixaSobrancelha === "Sim" && (
        <div className="brescancin-subfield">
          <FieldCheckbox
            label="Qual é a queixa?"
            values={answers.queixaSobrancelha}
            onChange={(v) => update("queixaSobrancelha", v)}
            options={QUEIXA_SOBRANCELHA}
            error={errors.queixaSobrancelha}
          />
          <FieldRadio
            label="Já fez algum procedimento nas sobrancelhas?"
            value={answers.procedimentoSobrancelhaAnterior}
            onChange={(v) => {
              update("procedimentoSobrancelhaAnterior", v);
              if (v !== "Sim") update("qualProcedimento", "");
            }}
            options={SIM_NAO}
            error={errors.procedimentoSobrancelhaAnterior}
          />
          {answers.procedimentoSobrancelhaAnterior === "Sim" && (
            <div className="brescancin-subfield">
              <FieldTextarea
                label="Qual e quando? Ainda está visível?"
                value={answers.qualProcedimento}
                onChange={(v) => update("qualProcedimento", v)}
                error={errors.qualProcedimento}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Step5Fields({ answers, errors, update }: StepProps) {
  return (
    <>
      <FieldTextarea
        label="O que mais te incomoda hoje?"
        required
        value={answers.principalIncomodo}
        onChange={(v) => update("principalIncomodo", v)}
        placeholder="Pode ser direto. Nenhuma resposta é errada."
        error={errors.principalIncomodo}
      />
      <FieldTextarea
        label="Tem alguma dúvida específica para trazer na consulta?"
        value={answers.duvidaConsulta}
        onChange={(v) => update("duvidaConsulta", v)}
        placeholder="Se tiver alguma dúvida específica para trazer na consulta, escreva aqui."
        error={errors.duvidaConsulta}
      />
      <FieldCheckbox
        label="Como você conheceu a Clínica Brescancin?"
        required
        values={answers.comoConheceu}
        onChange={(v) => update("comoConheceu", v)}
        options={COMO_CONHECEU}
        error={errors.comoConheceu}
      />
    </>
  );
}

function Step3Fields({ answers, errors, update }: StepProps) {
  return (
    <>
      <FieldRadio
        label="Pratica alguma atividade física?"
        required
        value={answers.atividadeFisica}
        onChange={(v) => {
          update("atividadeFisica", v);
          if (v !== "Sim") update("qualAtividadeFisica", "");
        }}
        options={SIM_NAO}
        error={errors.atividadeFisica}
      />
      {answers.atividadeFisica === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual e com que frequência?"
            required
            value={answers.qualAtividadeFisica}
            onChange={(v) => update("qualAtividadeFisica", v)}
            error={errors.qualAtividadeFisica}
          />
        </div>
      )}
      <FieldRadio
        label="Como anda a sua qualidade de sono?"
        required
        value={answers.qualidadeSono}
        onChange={(v) => update("qualidadeSono", v)}
        options={QUALIDADE_SONO}
        error={errors.qualidadeSono}
      />
      <FieldRadio
        label="Como você descreveria seu nível de estresse atual?"
        required
        value={answers.nivelEstresse}
        onChange={(v) => update("nivelEstresse", v)}
        options={NIVEL_ESTRESSE}
        error={errors.nivelEstresse}
      />
    </>
  );
}

// ─── FormFlow ──────────────────────────────────────────────────────

const STEP_HEADERS: Record<Step, { title: string; intro: string }> = {
  welcome: { title: "", intro: "" },
  step1: {
    title: "Vamos começar pelo básico",
    intro: "Suas informações de identificação e contato.",
  },
  step2: {
    title: "Como anda sua saúde",
    intro: "Histórico geral pra preparar a sua consulta com mais cuidado.",
  },
  step3: {
    title: "Seu dia a dia",
    intro: "Algumas perguntas rápidas sobre estilo de vida.",
  },
  step4: {
    title: "Cabelo e sobrancelhas",
    intro: "Conte das suas queixas — pode pular o que não se aplica.",
  },
  step5: {
    title: "Para fechar",
    intro: "Últimas perguntas pra entender o que te trouxe até aqui.",
  },
  done: { title: "", intro: "" },
};

export default function FormFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const skipScrollOnMount = useRef(true);

  useEffect(() => {
    if (skipScrollOnMount.current) {
      skipScrollOnMount.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const update = <K extends keyof Answers>(field: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clinicabrescancin/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          (data && typeof data.error === "string" && data.error) ||
            "Não conseguimos enviar agora. Tente novamente em instantes.",
        );
        return;
      }
      setStep("done");
    } catch {
      setSubmitError("Sem conexão. Confira sua internet e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (isSubmitting) return;
    const stepErrors = validateForStep(step, answers);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    const idx = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
    if (idx === FORM_STEPS.length - 1) {
      submit();
      return;
    }
    if (idx >= 0 && idx < FORM_STEPS.length - 1) {
      setStep(FORM_STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    if (isSubmitting) return;
    const idx = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
    setErrors({});
    setSubmitError(null);
    if (idx === 0) {
      setStep("welcome");
    } else if (idx > 0) {
      setStep(FORM_STEPS[idx - 1]);
    }
  };

  if (step === "welcome") {
    return (
      <section className="brescancin-card brescancin-step">
        <h2 className="brescancin-title">Antes da sua consulta</h2>
        <p className="brescancin-subtitle">Essas informações são sigilosas.</p>
        <p className="brescancin-body">
          Preenchendo com atenção, o Dr. Samuel e a Alana chegam preparados para
          o seu caso. Leva menos de 5 minutos.
        </p>
        <div className="brescancin-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="brescancin-btn-primary"
            onClick={() => setStep("step1")}
          >
            Começar →
          </button>
        </div>
      </section>
    );
  }

  if (step === "done") {
    const greetingName =
      answers.apelido.trim() ||
      answers.nomeCompleto.trim().split(/\s+/)[0] ||
      "";
    return (
      <section className="brescancin-card brescancin-step" style={{ textAlign: "center" }}>
        <div className="brescancin-check" aria-hidden>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="brescancin-title">
          Recebemos{greetingName ? `, ${greetingName}` : ""}.
        </h2>
        <p className="brescancin-body">
          O Dr. Samuel e a Alana já podem chegar preparados para a sua consulta.
          Até breve.
        </p>
      </section>
    );
  }

  const idx = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
  const header = STEP_HEADERS[step];
  const isLast = idx === FORM_STEPS.length - 1;
  const stepProps: StepProps = { answers, errors, update };

  return (
    <div className="brescancin-step" key={step}>
      <div className="brescancin-progress-label">Etapa {idx + 1} de {FORM_STEPS.length}</div>
      <div className="brescancin-progress" aria-hidden>
        <div
          className="brescancin-progress-fill"
          style={{ width: `${((idx + 1) / FORM_STEPS.length) * 100}%` }}
        />
      </div>
      <section className="brescancin-card">
        <h2 className="brescancin-step-title">{header.title}</h2>
        {header.intro && <p className="brescancin-step-intro">{header.intro}</p>}
        {step === "step1" && <Step1Fields {...stepProps} />}
        {step === "step2" && <Step2Fields {...stepProps} />}
        {step === "step3" && <Step3Fields {...stepProps} />}
        {step === "step4" && <Step4Fields {...stepProps} />}
        {step === "step5" && <Step5Fields {...stepProps} />}
      </section>
      {submitError && (
        <p
          className="brescancin-error"
          style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}
          role="alert"
        >
          {submitError}
        </p>
      )}
      <div className="brescancin-actions">
        <button
          type="button"
          className="brescancin-btn-ghost"
          onClick={goBack}
          disabled={isSubmitting}
        >
          ← Voltar
        </button>
        <button
          type="button"
          className="brescancin-btn-primary"
          onClick={goNext}
          disabled={isSubmitting}
        >
          {isLast ? (isSubmitting ? "Enviando..." : "Enviar") : "Próximo →"}
        </button>
      </div>
    </div>
  );
}
