"use client";

import { useEffect, useRef, useState } from "react";
import BrescancinFooter from "./BrescancinFooter";
import {
  COMO_CONHECEU,
  DIETA,
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
  QUEIXA_SOBRANCELHA,
  SAUDE_MAE,
  SAUDE_PAI,
  SAUDE_PAIS_EXCLUSIVA,
  SIM_NAO,
  SIM_NAO_NAOSEI,
} from "@/lib/clinicabrescancin/questions";

type Step = "welcome" | "step1" | "step2" | "step3" | "step4" | "step5" | "done";

// ─── Data de nascimento (input texto com máscara DD/MM/AAAA) ──────
function applyDateMask(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBrDateToIso(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;
  // Confere data real (ex: 31/02 não existe)
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

type Answers = {
  // Etapa 1
  nomeCompleto: string;
  apelido: string;
  dataNascimento: string; // formato BR DD/MM/AAAA enquanto preenche
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
  dieta: string;
  dietaOutra: string;
  tomaLeite: string;
  comeCastanhasAmendoas: string;
  // Etapa 4 — Cabelo
  queixaCapilar: string[];
  fezTratamentoCapilar: string;
  tempoQueixa: string;
  fotosCabelo: string[];
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
  dieta: "",
  dietaOutra: "",
  tomaLeite: "",
  comeCastanhasAmendoas: "",
  queixaCapilar: [],
  fezTratamentoCapilar: "",
  tempoQueixa: "",
  fotosCabelo: [],
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
  if (!a.dataNascimento.trim()) {
    e.dataNascimento = "Informe sua data de nascimento.";
  } else if (!parseBrDateToIso(a.dataNascimento)) {
    e.dataNascimento = "Use o formato DD/MM/AAAA.";
  }
  if (!a.genero) e.genero = "Selecione uma opção.";
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
  if (a.saudeMae.length === 0) {
    e.saudeMae = "Selecione ao menos uma opção.";
  }
  if (a.saudePai.length === 0) {
    e.saudePai = "Selecione ao menos uma opção.";
  }
  if (!a.usaMedicamentos) e.usaMedicamentos = "Selecione uma opção.";
  if (a.usaMedicamentos === "Sim" && !a.quaisMedicamentos.trim()) {
    e.quaisMedicamentos = "Conte qual(is) e para que usa.";
  }
  if (!a.usaSuplementos) e.usaSuplementos = "Selecione uma opção.";
  if (a.usaSuplementos === "Sim" && !a.quaisSuplementos.trim()) {
    e.quaisSuplementos = "Conte qual(is) suplemento(s).";
  }
  if (!a.usaEsteroides) e.usaEsteroides = "Selecione uma opção.";
  if (!a.usaTestosterona) e.usaTestosterona = "Selecione uma opção.";
  if (!a.usaMedSonoAnsiedade) {
    e.usaMedSonoAnsiedade = "Selecione uma opção.";
  }
  if (a.usaMedSonoAnsiedade === "Sim" && !a.quaisMedSonoAnsiedade.trim()) {
    e.quaisMedSonoAnsiedade = "Conte qual(is).";
  }
  if (!a.alergiaMedicamento) e.alergiaMedicamento = "Selecione uma opção.";
  if (a.alergiaMedicamento === "Sim" && !a.qualAlergia.trim()) {
    e.qualAlergia = "Conte qual.";
  }
  if (!a.alergiaAmbiental) e.alergiaAmbiental = "Selecione uma opção.";
  if (!a.fezCirurgia) e.fezCirurgia = "Selecione uma opção.";
  if (a.fezCirurgia === "Sim" && !a.qualCirurgia.trim()) {
    e.qualCirurgia = "Conte qual e quando aproximadamente.";
  }
  if (!a.hospitalizadoUltimoAno) {
    e.hospitalizadoUltimoAno = "Selecione uma opção.";
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
  if (!a.dieta) e.dieta = "Selecione uma opção.";
  if (a.dieta === "Outra" && !a.dietaOutra.trim()) {
    e.dietaOutra = "Conte qual dieta.";
  }
  if (!a.tomaLeite) e.tomaLeite = "Selecione uma opção.";
  if (!a.comeCastanhasAmendoas) {
    e.comeCastanhasAmendoas = "Selecione uma opção.";
  }
  return e;
}

function validateStep4(a: Answers): Errors {
  const e: Errors = {};
  // Cabelo
  if (a.queixaCapilar.length === 0) {
    e.queixaCapilar = "Selecione ao menos uma opção.";
  }
  if (a.eventosAssociados.length === 0) {
    e.eventosAssociados = "Selecione ao menos uma opção.";
  }
  if (!a.historicoFamiliarQueda) {
    e.historicoFamiliarQueda = "Selecione uma opção.";
  }
  if (a.historicoFamiliarQueda === "Sim" && !a.quemHistorico.trim()) {
    e.quemHistorico = "Conte por parte de quem.";
  }
  if (!a.fezTratamentoCapilar) {
    e.fezTratamentoCapilar = "Selecione uma opção.";
  }
  if (
    a.fezTratamentoCapilar === "Sim" &&
    !a.tratamentosAnteriores.trim()
  ) {
    e.tratamentosAnteriores = "Conte qual(is) tratamento(s).";
  }
  if (!a.usouMinoxidilFinasterida) {
    e.usouMinoxidilFinasterida = "Selecione uma opção.";
  }
  if (a.usouMinoxidilFinasterida === "Sim" && !a.quaisTempoUso.trim()) {
    e.quaisTempoUso = "Conte qual(is) e por quanto tempo.";
  }
  if (!a.examesSanguineRecentes) {
    e.examesSanguineRecentes = "Selecione uma opção.";
  }
  // Sobrancelhas
  if (!a.temQueixaSobrancelha) {
    e.temQueixaSobrancelha = "Selecione uma opção.";
  }
  if (a.temQueixaSobrancelha === "Sim") {
    if (a.queixaSobrancelha.length === 0) {
      e.queixaSobrancelha = "Selecione ao menos uma opção.";
    }
    if (!a.procedimentoSobrancelhaAnterior) {
      e.procedimentoSobrancelhaAnterior = "Selecione uma opção.";
    }
    if (
      a.procedimentoSobrancelhaAnterior === "Sim" &&
      !a.qualProcedimento.trim()
    ) {
      e.qualProcedimento = "Conte qual procedimento e quando.";
    }
  }
  return e;
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
  helper?: string;
  error?: string;
};

function FieldTextarea({
  label,
  required,
  value,
  onChange,
  placeholder,
  helper,
  error,
}: FieldTextareaProps) {
  return (
    <div className="brescancin-field">
      <label className={`brescancin-label${required ? " brescancin-label-required" : ""}`}>
        {label}
      </label>
      {helper && <span className="brescancin-help">{helper}</span>}
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

// ─── Foto upload (Vercel Blob) ─────────────────────────────────────

type FieldPhotosProps = {
  label: string;
  helper?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
};

function FieldPhotos({
  label,
  helper,
  values,
  onChange,
  multiple,
}: FieldPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const toUpload = multiple ? Array.from(files) : [files[0]];
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/clinicabrescancin/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          setUploadError(data?.error || "Falha ao enviar a foto.");
          break;
        }
        uploadedUrls.push(data.url);
      }
      if (uploadedUrls.length > 0) {
        onChange(multiple ? [...values, ...uploadedUrls] : uploadedUrls);
      }
    } catch {
      setUploadError("Sem conexão. Tente novamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) => {
    const next = values.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="brescancin-field">
      <span className="brescancin-label">{label}</span>
      {helper && <span className="brescancin-help">{helper}</span>}
      {values.length > 0 && (
        <div className="brescancin-photos">
          {values.map((url, i) => (
            <div key={url} className="brescancin-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} />
              <button
                type="button"
                className="brescancin-photo-remove"
                onClick={() => removeAt(i)}
                aria-label="Remover foto"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {(multiple || values.length === 0) && (
        <label className="brescancin-photo-add">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple={multiple}
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
          <span>
            {uploading
              ? "Enviando..."
              : values.length === 0
                ? "Tirar ou escolher foto"
                : "Adicionar mais"}
          </span>
        </label>
      )}
      {uploadError && (
        <span className="brescancin-error">{uploadError}</span>
      )}
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
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={answers.dataNascimento}
        onChange={(v) => update("dataNascimento", applyDateMask(v))}
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
        required
        helper="Marque tudo que se aplica. Se já faleceu, marque também as condições que ela tinha em vida."
        values={answers.saudeMae}
        onChange={(v) => update("saudeMae", v)}
        options={SAUDE_MAE}
        exclusive={SAUDE_PAIS_EXCLUSIVA}
        error={errors.saudeMae}
      />
      <FieldCheckbox
        label="Análise sobre a saúde do seu pai"
        required
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
        required
        value={answers.usaEsteroides}
        onChange={(v) => update("usaEsteroides", v)}
        options={SIM_NAO}
        error={errors.usaEsteroides}
      />
      <FieldRadio
        label="Faz uso de testosterona?"
        required
        value={answers.usaTestosterona}
        onChange={(v) => update("usaTestosterona", v)}
        options={SIM_NAO}
        error={errors.usaTestosterona}
      />
      <FieldRadio
        label="Faz uso de medicamento para sono ou ansiedade?"
        required
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
        required
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
        required
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
  return (
    <>
      <h3 className="brescancin-block-title">Cabelo</h3>
      <FieldCheckbox
        label="O que você tem notado no seu cabelo?"
        required
        values={answers.queixaCapilar}
        onChange={(v) => update("queixaCapilar", v)}
        options={QUEIXA_CAPILAR}
        exclusive={QUEIXA_CAPILAR_EXCLUSIVA}
        error={errors.queixaCapilar}
      />
      <FieldCheckbox
        label="Algum desses eventos coincidiu com o início da queixa?"
        required
        values={answers.eventosAssociados}
        onChange={(v) => update("eventosAssociados", v)}
        options={EVENTOS_ASSOCIADOS}
        exclusive={EVENTOS_ASSOCIADOS_EXCLUSIVA}
        error={errors.eventosAssociados}
      />
      <FieldRadio
        label="Há histórico de queda de cabelo na família?"
        required
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
            required
            value={answers.quemHistorico}
            onChange={(v) => update("quemHistorico", v)}
            placeholder="Mãe, pai, avós..."
            error={errors.quemHistorico}
          />
        </div>
      )}
      <FieldRadio
        label="Já fez algum tratamento para o cabelo?"
        required
        value={answers.fezTratamentoCapilar}
        onChange={(v) => {
          update("fezTratamentoCapilar", v);
          if (v !== "Sim") update("tratamentosAnteriores", "");
        }}
        options={SIM_NAO}
        error={errors.fezTratamentoCapilar}
      />
      {answers.fezTratamentoCapilar === "Sim" && (
        <div className="brescancin-subfield">
          <FieldTextarea
            label="Qual(is) tratamento(s)?"
            required
            value={answers.tratamentosAnteriores}
            onChange={(v) => update("tratamentosAnteriores", v)}
            placeholder="Ex: Minoxidil por conta própria, biotina, shampoos específicos..."
            error={errors.tratamentosAnteriores}
          />
        </div>
      )}
      <FieldRadio
        label="Já usou Minoxidil ou Finasterida?"
        required
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
            required
            value={answers.quaisTempoUso}
            onChange={(v) => update("quaisTempoUso", v)}
            error={errors.quaisTempoUso}
          />
        </div>
      )}
      <FieldRadio
        label="Fez exames de sangue recentes?"
        required
        value={answers.examesSanguineRecentes}
        onChange={(v) => update("examesSanguineRecentes", v)}
        options={EXAMES_SANGUINEOS_RECENTES}
        error={errors.examesSanguineRecentes}
      />
      <FieldPhotos
        label="Fotos do seu cabelo"
        helper={
          "Se você conseguir, tire algumas fotos do seu cabelo e insira abaixo.\n" +
          "Recomendamos foto do topo da cabeça (vista de cima) e das laterais. Pode ser feita com celular, mas procure um ambiente claro.\n" +
          "Peça ajuda para alguém se for necessário."
        }
        values={answers.fotosCabelo}
        onChange={(urls) => update("fotosCabelo", urls)}
        multiple
      />

      <h3 className="brescancin-block-title">Sobrancelhas</h3>
      <FieldRadio
        label="Tem alguma queixa em relação às sobrancelhas?"
        required
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
            required
            values={answers.queixaSobrancelha}
            onChange={(v) => update("queixaSobrancelha", v)}
            options={QUEIXA_SOBRANCELHA}
            error={errors.queixaSobrancelha}
          />
          <FieldRadio
            label="Já fez algum procedimento nas sobrancelhas?"
            required
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
                required
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
        label="Conta o que te trouxe à Clínica Brescancin"
        required
        helper="Pode ser direto — o que você espera resolver na consulta."
        value={answers.principalIncomodo}
        onChange={(v) => update("principalIncomodo", v)}
        placeholder="Ex: queda há alguns meses, gostaria de entender o motivo..."
        error={errors.principalIncomodo}
      />
      <FieldTextarea
        label="Tem alguma dúvida específica para trazer na consulta?"
        value={answers.duvidaConsulta}
        onChange={(v) => update("duvidaConsulta", v)}
        placeholder="Opcional — se tiver alguma dúvida específica, escreva aqui."
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
      <FieldRadio
        label="Você faz alguma dieta?"
        required
        value={answers.dieta}
        onChange={(v) => {
          update("dieta", v);
          if (v !== "Outra") update("dietaOutra", "");
        }}
        options={DIETA}
        error={errors.dieta}
      />
      {answers.dieta === "Outra" && (
        <div className="brescancin-subfield">
          <FieldText
            label="Qual dieta?"
            required
            value={answers.dietaOutra}
            onChange={(v) => update("dietaOutra", v)}
            error={errors.dietaOutra}
          />
        </div>
      )}
      <FieldRadio
        label="Você toma leite todos os dias?"
        required
        value={answers.tomaLeite}
        onChange={(v) => update("tomaLeite", v)}
        options={SIM_NAO}
        error={errors.tomaLeite}
      />
      <FieldRadio
        label="Você costuma comer muita castanha ou amêndoas?"
        required
        value={answers.comeCastanhasAmendoas}
        onChange={(v) => update("comeCastanhasAmendoas", v)}
        options={SIM_NAO}
        error={errors.comeCastanhasAmendoas}
      />
    </>
  );
}

// ─── FormFlow ──────────────────────────────────────────────────────

const STEP_HEADERS: Record<Step, { title: string; intro: string }> = {
  welcome: { title: "", intro: "" },
  step1: {
    title: "Sobre você",
    intro: "",
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
    intro: "Queremos saber como anda a saúde dos seus fios.",
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
    window.scrollTo({ top: 0, behavior: "auto" });
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
      const isoBirthdate = parseBrDateToIso(answers.dataNascimento);
      const payload = {
        ...answers,
        dataNascimento: isoBirthdate ?? answers.dataNascimento,
      };
      const res = await fetch("/api/clinicabrescancin/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      // Sobe a tela pra primeira pergunta com erro
      requestAnimationFrame(() => {
        const firstError = document.querySelector(".brescancin-error");
        const field = firstError?.closest(".brescancin-field");
        if (field instanceof HTMLElement) {
          field.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
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
      <div className="brescancin-dark">
        <div className="brescancin-hero">
          <div className="brescancin-hero-inner brescancin-step">
            <p className="brescancin-hero-eyebrow">Clínica Brescancin</p>
            <p className="brescancin-hero-tagline">
              Excelência em Restauração Capilar
            </p>
            <div className="brescancin-hero-rule" aria-hidden />
            <h1 className="brescancin-hero-title">
              Bem-vindo(a) ao
              <br />
              seu <em>Pré-Atendimento</em>.
            </h1>
            <div className="brescancin-hero-body-group">
              <p className="brescancin-hero-body">
                Nós queremos cuidar de você com toda atenção, por isso
                preparamos este formulário pré-consulta para te conhecer
                melhor.
              </p>
              <p className="brescancin-hero-body">
                Suas respostas são <strong>sigilosas</strong> e o
                preenchimento leva <strong>menos de 5 minutos</strong>.
              </p>
              <p className="brescancin-hero-body brescancin-hero-body-finale">
                Estamos felizes em te receber.
              </p>
            </div>
            <div className="brescancin-hero-actions">
              <button
                type="button"
                className="brescancin-btn-primary"
                onClick={() => setStep("step1")}
              >
                Começar agora
              </button>
            </div>
          </div>
        </div>
        <BrescancinFooter />
      </div>
    );
  }

  if (step === "done") {
    const greetingName =
      answers.apelido.trim() ||
      answers.nomeCompleto.trim().split(/\s+/)[0] ||
      "";
    return (
      <div className="brescancin-dark">
        <div className="brescancin-hero">
          <div className="brescancin-hero-inner brescancin-step">
            <div className="brescancin-hero-check" aria-hidden>
              <svg
                width="36"
                height="36"
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
            <h1 className="brescancin-hero-title">
              Recebemos seu formulário
              {greetingName ? (
                <>
                  , <em>{greetingName}</em>
                </>
              ) : null}
              .
            </h1>
            <p className="brescancin-hero-body">
              Vamos preparar tudo com muito carinho para receber você,
              te vemos em consulta!
            </p>
          </div>
        </div>
        <BrescancinFooter />
      </div>
    );
  }

  const idx = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
  const header = STEP_HEADERS[step];
  const isLast = idx === FORM_STEPS.length - 1;
  const stepProps: StepProps = { answers, errors, update };

  return (
    <div className="brescancin-light">
      <div className="brescancin-container">
        <p className="brescancin-brand">Clínica Brescancin</p>
        <div className="brescancin-rule" aria-hidden />
        <div className="brescancin-step" key={step}>
          <div className="brescancin-progress-label">
            Etapa {idx + 1} de {FORM_STEPS.length}
          </div>
          <div className="brescancin-progress" aria-hidden>
            <div
              className="brescancin-progress-fill"
              style={{ width: `${((idx + 1) / FORM_STEPS.length) * 100}%` }}
            />
          </div>
          <section className="brescancin-card">
            <h2
              className={`brescancin-step-title${
                header.intro ? "" : " brescancin-step-title--solo"
              }`}
            >
              {header.title}
            </h2>
            {header.intro && (
              <p className="brescancin-step-intro">{header.intro}</p>
            )}
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
      </div>
      <BrescancinFooter />
    </div>
  );
}
