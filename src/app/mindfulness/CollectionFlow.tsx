"use client";

import { useState } from "react";
import {
  FFMQ_QUESTIONS,
  DASS_QUESTIONS,
  FFMQ_SCALE,
  DASS_SCALE,
} from "@/lib/mindfulness/questions";

type Step = "welcome" | "personal" | "ffmq" | "dass" | "done";

type Personal = {
  nome: string;
  email: string;
  telefone: string;
  profissao: string;
  idade: string;
  escolaridade: string;
  estadoCivil: string;
  meditacaoPrevia: "" | "sim" | "nao";
  qualMeditacao: string;
  tempoMeditacao: string;
};

const EMPTY_PERSONAL: Personal = {
  nome: "",
  email: "",
  telefone: "",
  profissao: "",
  idade: "",
  escolaridade: "",
  estadoCivil: "",
  meditacaoPrevia: "",
  qualMeditacao: "",
  tempoMeditacao: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CollectionFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [personal, setPersonal] = useState<Personal>(EMPTY_PERSONAL);
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof Personal, string>>>({});
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [ffmqAnswers, setFfmqAnswers] = useState<Record<number, number>>({});
  const [dassAnswers, setDassAnswers] = useState<Record<number, number>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");

  const stepLabel =
    step === "welcome"
      ? "Boas-vindas"
      : step === "personal"
      ? "Dados pessoais"
      : step === "ffmq"
      ? "Questionário 1 de 2"
      : step === "dass"
      ? "Questionário 2 de 2"
      : "Finalizado";

  return (
    <>
      <nav className="m-nav">
        <div className="m-nav-brand">
          Iasmim <em>Sasseron</em>
        </div>
        <div className="m-nav-step">{stepLabel}</div>
      </nav>
      <main>
        {step === "welcome" && <WelcomeView onStart={() => setStep("personal")} />}
        {step === "personal" && (
          <PersonalView
            personal={personal}
            setPersonal={setPersonal}
            errors={personalErrors}
            setErrors={setPersonalErrors}
            submitError={submitError}
            submitting={submitting}
            onBack={() => setStep("welcome")}
            onSubmit={async () => {
              const errs = validatePersonal(personal);
              setPersonalErrors(errs);
              if (Object.keys(errs).length > 0) return;
              setSubmitting(true);
              setSubmitError(null);
              try {
                const res = await fetch("/api/mindfulness/participants", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    nome: personal.nome.trim(),
                    email: personal.email.trim().toLowerCase(),
                    telefone: personal.telefone.trim() || undefined,
                    profissao: personal.profissao.trim() || undefined,
                    idade: parseInt(personal.idade, 10),
                    escolaridade: personal.escolaridade || undefined,
                    estadoCivil: personal.estadoCivil || undefined,
                    meditacaoPrevia: personal.meditacaoPrevia === "sim",
                    qualMeditacao:
                      personal.meditacaoPrevia === "sim" ? personal.qualMeditacao.trim() || undefined : undefined,
                    tempoMeditacao:
                      personal.meditacaoPrevia === "sim" ? personal.tempoMeditacao.trim() || undefined : undefined,
                  }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data?.error || "Não foi possível salvar seus dados. Tente novamente.");
                }
                const data = (await res.json()) as { id: string; nome: string };
                setParticipantId(data.id);
                setFirstName(data.nome.split(" ")[0]);
                setStep("ffmq");
                window.scrollTo(0, 0);
              } catch (e) {
                setSubmitError(e instanceof Error ? e.message : "Erro inesperado.");
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}
        {step === "ffmq" && (
          <QuestionFlow
            kind="ffmq"
            answers={ffmqAnswers}
            setAnswers={setFfmqAnswers}
            submitError={submitError}
            submitting={submitting}
            onFinish={async () => {
              if (!participantId) return;
              setSubmitting(true);
              setSubmitError(null);
              try {
                const res = await fetch("/api/mindfulness/responses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ participantId, instrument: "FFMQ", answers: ffmqAnswers }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data?.error || "Não foi possível salvar as respostas.");
                }
                setStep("dass");
                window.scrollTo(0, 0);
              } catch (e) {
                setSubmitError(e instanceof Error ? e.message : "Erro inesperado.");
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}
        {step === "dass" && (
          <QuestionFlow
            kind="dass"
            answers={dassAnswers}
            setAnswers={setDassAnswers}
            submitError={submitError}
            submitting={submitting}
            onFinish={async () => {
              if (!participantId) return;
              setSubmitting(true);
              setSubmitError(null);
              try {
                const res = await fetch("/api/mindfulness/responses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ participantId, instrument: "DASS21", answers: dassAnswers }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data?.error || "Não foi possível salvar as respostas.");
                }
                setStep("done");
                window.scrollTo(0, 0);
              } catch (e) {
                setSubmitError(e instanceof Error ? e.message : "Erro inesperado.");
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}
        {step === "done" && <DoneView firstName={firstName} />}
      </main>
    </>
  );
}

// =========================================================================
// WELCOME
// =========================================================================
function WelcomeView({ onStart }: { onStart: () => void }) {
  return (
    <section className="m-welcome">
      <div className="m-ornament" />
      <h1 className="m-title">
        Avaliação de <em>Atenção Plena</em>
        <br />e Saúde Mental
      </h1>
      <p className="m-welcome-intro">
        Bem-vinda. Você está sendo convidada a participar de um projeto de supervisão da formação em
        Mindfulness da Iasmim Sasseron — pelo IPq-USP.
      </p>

      <div className="m-welcome-cards">
        <div className="m-welcome-card">
          <div className="m-card-num">01</div>
          <div className="m-card-title">Questionário sobre atenção plena</div>
          <div className="m-card-desc">39 afirmações sobre como você se percebe no dia a dia.</div>
        </div>
        <div className="m-welcome-card">
          <div className="m-card-num">02</div>
          <div className="m-card-title">Questionário sobre saúde mental</div>
          <div className="m-card-desc">21 afirmações sobre como você se sentiu na última semana.</div>
        </div>
      </div>

      <div className="m-welcome-note">
        <strong>Reserve de 20 a 30 minutos.</strong> Se possível, responda os dois questionários no mesmo
        momento, em um espaço tranquilo. Os dois são respondidos em sequência — o segundo começa
        automaticamente quando você terminar o primeiro.
      </div>

      <p className="m-welcome-intro" style={{ marginBottom: "2rem" }}>
        Não há respostas certas ou erradas. Procure responder com sinceridade, escolhendo o que mais se
        aproxima da sua experiência real. Suas respostas vão contribuir para o projeto e para o desenho
        das aulas que a Iasmim irá construir a partir do grupo.
      </p>

      <button className="m-btn-cta" onClick={onStart} type="button">
        Começar →
      </button>
    </section>
  );
}

// =========================================================================
// PERSONAL DATA
// =========================================================================
function validatePersonal(p: Personal): Partial<Record<keyof Personal, string>> {
  const e: Partial<Record<keyof Personal, string>> = {};
  if (!p.nome.trim() || p.nome.trim().length < 2) e.nome = "Informe seu nome completo.";
  if (!p.email.trim() || !EMAIL_RE.test(p.email.trim())) e.email = "E-mail inválido.";
  const idade = parseInt(p.idade, 10);
  if (!idade || idade < 12 || idade > 120) e.idade = "Idade inválida.";
  if (!p.meditacaoPrevia) e.meditacaoPrevia = "Selecione uma opção.";
  return e;
}

function PersonalView({
  personal,
  setPersonal,
  errors,
  setErrors,
  submitError,
  submitting,
  onBack,
  onSubmit,
}: {
  personal: Personal;
  setPersonal: (p: Personal) => void;
  errors: Partial<Record<keyof Personal, string>>;
  setErrors: (e: Partial<Record<keyof Personal, string>>) => void;
  submitError: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const upd = (k: keyof Personal, v: string) => {
    setPersonal({ ...personal, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  return (
    <section className="m-section">
      <div className="m-form-header">
        <div className="m-step-label">Antes de começar</div>
        <h2 className="m-form-title">Dados pessoais</h2>
        <div className="m-form-instruction">
          Suas informações são usadas exclusivamente para a organização dos dados deste projeto. Você
          preenche apenas uma vez — os dois questionários seguem em sequência.
        </div>
      </div>

      {submitError && <div className="m-error-banner">{submitError}</div>}

      <div className="m-fields">
        <div className="m-field">
          <label>Nome completo *</label>
          <input
            type="text"
            value={personal.nome}
            onChange={(e) => upd("nome", e.target.value)}
            placeholder="Seu nome completo"
          />
          {errors.nome && <div className="m-field-error">{errors.nome}</div>}
        </div>

        <div className="m-field-row">
          <div className="m-field">
            <label>E-mail *</label>
            <input
              type="email"
              value={personal.email}
              onChange={(e) => upd("email", e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
            {errors.email && <div className="m-field-error">{errors.email}</div>}
          </div>
          <div className="m-field">
            <label>Telefone</label>
            <input
              type="tel"
              value={personal.telefone}
              onChange={(e) => upd("telefone", e.target.value)}
              placeholder="(11) 00000-0000"
            />
          </div>
        </div>

        <div className="m-field-row">
          <div className="m-field">
            <label>Profissão</label>
            <input
              type="text"
              value={personal.profissao}
              onChange={(e) => upd("profissao", e.target.value)}
              placeholder=""
            />
          </div>
          <div className="m-field">
            <label>Idade *</label>
            <input
              type="number"
              min={12}
              max={120}
              value={personal.idade}
              onChange={(e) => upd("idade", e.target.value)}
              placeholder="Ex: 34"
            />
            {errors.idade && <div className="m-field-error">{errors.idade}</div>}
          </div>
        </div>

        <div className="m-field-row">
          <div className="m-field">
            <label>Escolaridade</label>
            <select value={personal.escolaridade} onChange={(e) => upd("escolaridade", e.target.value)}>
              <option value="">Selecione</option>
              <option>Ensino Médio</option>
              <option>Graduação incompleta</option>
              <option>Graduação completa</option>
              <option>Pós-graduação</option>
              <option>Mestrado</option>
              <option>Doutorado</option>
            </select>
          </div>
          <div className="m-field">
            <label>Estado civil</label>
            <select value={personal.estadoCivil} onChange={(e) => upd("estadoCivil", e.target.value)}>
              <option value="">Selecione</option>
              <option>Solteiro(a)</option>
              <option>Casado(a) / União estável</option>
              <option>Separado(a) / Divorciado(a)</option>
              <option>Viúvo(a)</option>
            </select>
          </div>
        </div>

        <div className="m-field">
          <label>Já praticava alguma forma de meditação antes? *</label>
          <div className="m-radio-group">
            <label
              className={`m-radio-opt ${personal.meditacaoPrevia === "sim" ? "selected" : ""}`}
              onClick={() => upd("meditacaoPrevia", "sim")}
            >
              Sim
            </label>
            <label
              className={`m-radio-opt ${personal.meditacaoPrevia === "nao" ? "selected" : ""}`}
              onClick={() => upd("meditacaoPrevia", "nao")}
            >
              Não
            </label>
          </div>
          {errors.meditacaoPrevia && <div className="m-field-error">{errors.meditacaoPrevia}</div>}
        </div>

        {personal.meditacaoPrevia === "sim" && (
          <div className="m-field-row">
            <div className="m-field">
              <label>Qual prática?</label>
              <input
                type="text"
                value={personal.qualMeditacao}
                onChange={(e) => upd("qualMeditacao", e.target.value)}
                placeholder="Ex: meditação vipassana, yoga..."
              />
            </div>
            <div className="m-field">
              <label>Há quanto tempo?</label>
              <input
                type="text"
                value={personal.tempoMeditacao}
                onChange={(e) => upd("tempoMeditacao", e.target.value)}
                placeholder="Ex: 2 anos"
              />
            </div>
          </div>
        )}
      </div>

      <div className="m-form-nav">
        <button className="m-btn-ghost" type="button" onClick={onBack} disabled={submitting}>
          ← Voltar
        </button>
        <button className="m-btn-primary" type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Salvando..." : "Iniciar questionários →"}
        </button>
      </div>
    </section>
  );
}

// =========================================================================
// QUESTION FLOW (FFMQ ou DASS)
// =========================================================================
function QuestionFlow({
  kind,
  answers,
  setAnswers,
  submitError,
  submitting,
  onFinish,
}: {
  kind: "ffmq" | "dass";
  answers: Record<number, number>;
  setAnswers: (a: Record<number, number>) => void;
  submitError: string | null;
  submitting: boolean;
  onFinish: () => void;
}) {
  const questions = kind === "ffmq" ? FFMQ_QUESTIONS : DASS_QUESTIONS;
  const scale = kind === "ffmq" ? FFMQ_SCALE : DASS_SCALE;
  const [cursor, setCursor] = useState(0);
  const [shake, setShake] = useState(false);

  const total = questions.length;
  const pct = Math.round((cursor / total) * 100);
  const isLast = cursor === total - 1;
  const currentAnswer = answers[cursor + 1];

  const stepLabel =
    kind === "ffmq" ? "Questionário 01 · Atenção plena" : "Questionário 02 · Saúde mental";
  const title =
    kind === "ffmq" ? "Como você se percebe?" : "Como você se sentiu na última semana?";
  const instruction =
    kind === "ffmq"
      ? "Avalie cada afirmação de acordo com o que considera geralmente verdadeiro para você. Não há resposta certa ou errada — apenas sua experiência real."
      : "Leia cada afirmação e indique o quanto ela se aplicou a você durante a última semana. Não há resposta certa ou errada.";

  function selectAnswer(val: number) {
    const newAnswers = { ...answers, [cursor + 1]: val };
    setAnswers(newAnswers);
    if (cursor < total - 1) {
      setTimeout(() => {
        setCursor(cursor + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 320);
    }
  }

  function next() {
    if (currentAnswer === undefined) {
      setShake(true);
      setTimeout(() => setShake(false), 700);
      return;
    }
    if (isLast) {
      onFinish();
      return;
    }
    setCursor(cursor + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prev() {
    if (cursor === 0) return;
    setCursor(cursor - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="m-section">
      <div className="m-form-header">
        <div className="m-step-label">{stepLabel}</div>
        <h2 className="m-form-title">{title}</h2>
        <div className="m-form-instruction">{instruction}</div>
      </div>

      <div className="m-progress">
        <div className="m-progress-info">
          <span className="m-progress-text">
            Pergunta {cursor + 1} de {total}
          </span>
          <span className="m-progress-pct">{pct}%</span>
        </div>
        <div className="m-progress-bar">
          <div className="m-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {submitError && <div className="m-error-banner">{submitError}</div>}

      <div className={`m-question-card ${currentAnswer !== undefined ? "answered" : ""} ${shake ? "shake" : ""}`}>
        <div className="m-question-num">Pergunta {cursor + 1}</div>
        <div className="m-question-text">{questions[cursor]}</div>
        <div className={`m-scale ${kind === "ffmq" ? "m-scale-ffmq" : "m-scale-dass"}`}>
          {scale.map((opt) => (
            <div
              key={opt.val}
              className="m-scale-opt"
              onClick={() => selectAnswer(opt.val)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectAnswer(opt.val);
                }
              }}
            >
              <button
                className={`m-scale-btn ${currentAnswer === opt.val ? "selected" : ""}`}
                type="button"
                tabIndex={-1}
              >
                {opt.val}
              </button>
              <span className="m-scale-label">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="m-form-nav">
        <button
          className="m-btn-ghost"
          type="button"
          onClick={prev}
          disabled={cursor === 0 || submitting}
          style={{ visibility: cursor === 0 ? "hidden" : "visible" }}
        >
          ← Anterior
        </button>
        <button className="m-btn-primary" type="button" onClick={next} disabled={submitting}>
          {submitting ? "Salvando..." : isLast ? "Finalizar →" : "Próxima →"}
        </button>
      </div>
    </section>
  );
}

// =========================================================================
// DONE
// =========================================================================
function DoneView({ firstName }: { firstName: string }) {
  return (
    <div className="m-complete">
      <div className="m-complete-icon">✓</div>
      <h2 className="m-complete-title">Respostas registradas</h2>
      <p className="m-complete-text">
        Obrigada{firstName ? `, ${firstName}` : ""}. Suas respostas aos dois questionários foram salvas
        com segurança. A Iasmim usará essas informações para o desenho das aulas que serão construídas a
        partir do grupo. Você já pode fechar esta página.
      </p>
    </div>
  );
}
