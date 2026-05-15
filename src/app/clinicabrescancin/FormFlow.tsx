"use client";

import { useEffect, useRef, useState } from "react";
import {
  DOENCAS_DIAGNOSTICADAS,
  DOENCAS_EXCLUSIVA,
  ESTADO_CIVIL,
  FREQUENCIA_ALCOOL,
  GENERO,
  NIVEL_ESTRESSE,
  QUALIDADE_SONO,
  SAUDE_MAE,
  SAUDE_PAI,
  SIM_NAO,
  SIM_NAO_NAOSEI,
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

function validateForStep(step: Step, a: Answers): Errors {
  if (step === "step1") return validateStep1(a);
  if (step === "step2") return validateStep2(a);
  if (step === "step3") return validateStep3(a);
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
            label="Pretende ter filhos?"
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
        label="Como anda a saúde da sua mãe?"
        values={answers.saudeMae}
        onChange={(v) => update("saudeMae", v)}
        options={SAUDE_MAE}
        error={errors.saudeMae}
      />
      <FieldCheckbox
        label="Como anda a saúde do seu pai?"
        values={answers.saudePai}
        onChange={(v) => update("saudePai", v)}
        options={SAUDE_PAI}
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
  step4: { title: "Cabelo e sobrancelhas", intro: "" },
  step5: { title: "Para fechar", intro: "" },
  done: { title: "", intro: "" },
};

export default function FormFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [errors, setErrors] = useState<Errors>({});
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

  const goNext = () => {
    const stepErrors = validateForStep(step, answers);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    const idx = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
    if (idx >= 0 && idx < FORM_STEPS.length - 1) {
      setStep(FORM_STEPS[idx + 1]);
    } else if (idx === FORM_STEPS.length - 1) {
      // step5 → done (submit virá no Step 7/8 de implementação)
      setStep("done");
    }
  };

  const goBack = () => {
    const idx = FORM_STEPS.indexOf(step as (typeof FORM_STEPS)[number]);
    setErrors({});
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
    return (
      <section className="brescancin-card brescancin-step">
        <p className="brescancin-body" style={{ textAlign: "center" }}>
          Tela de confirmação será implementada na próxima etapa.
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
        {(step === "step4" || step === "step5") && (
          <p className="brescancin-body">
            Esta etapa será implementada em breve.
          </p>
        )}
      </section>
      <div className="brescancin-actions">
        <button type="button" className="brescancin-btn-ghost" onClick={goBack}>
          ← Voltar
        </button>
        <button type="button" className="brescancin-btn-primary" onClick={goNext}>
          {isLast ? "Enviar" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}
