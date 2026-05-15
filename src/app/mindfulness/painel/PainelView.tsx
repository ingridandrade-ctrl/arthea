"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import {
  FFMQ_LABELS,
  DASS_LABELS,
  FFMQ_FACETS,
  FFMQ_REVERSED,
  FFMQ_NORMS,
  DASS_SUBSCALES,
  type FFMQFacet,
  type FFMQScores,
  type DASSSubscale,
  type DASSScores,
} from "@/lib/mindfulness/scoring";
import {
  FFMQ_QUESTIONS,
  DASS_QUESTIONS,
  FFMQ_SCALE,
  DASS_SCALE,
} from "@/lib/mindfulness/questions";

export type ParticipantSummary = {
  id: string;
  nome: string;
  email: string;
  idade: number;
  profissao: string | null;
  escolaridade: string | null;
  estadoCivil: string | null;
  meditacaoPrevia: boolean;
  qualMeditacao: string | null;
  tempoMeditacao: string | null;
  ffmq: {
    scores: FFMQScores;
    answers: Record<string, number>;
    bands: Record<FFMQFacet, "abaixo" | "media" | "acima">;
    maxes: Record<FFMQFacet, number>;
    interpretation: string;
    respondedAt: string;
  } | null;
  dass: {
    scores: DASSScores;
    answers: Record<string, number>;
    bands: Record<DASSSubscale, string>;
    interpretation: string;
    respondedAt: string;
  } | null;
};

export type PainelData = {
  participants: ParticipantSummary[];
  insights: string[];
};

const FACETS: FFMQFacet[] = ["observe", "describe", "act_aware", "nonjudge", "nonreact"];
const SUBSCALES: DASSSubscale[] = ["depressao", "ansiedade", "estresse"];
const RADAR_COLORS = ["#8a9e8c", "#c4a05a", "#b08282", "#7a9eb4", "#9e8aaa"];

// Lookup: nº da pergunta → faceta FFMQ (1-indexed)
const FFMQ_ITEM_TO_FACET: Record<number, FFMQFacet> = (() => {
  const map: Record<number, FFMQFacet> = {};
  (Object.keys(FFMQ_FACETS) as FFMQFacet[]).forEach((f) => {
    FFMQ_FACETS[f].forEach((item) => {
      map[item] = f;
    });
  });
  return map;
})();

// Lookup: nº da pergunta → subescala DASS
const DASS_ITEM_TO_SUB: Record<number, DASSSubscale> = (() => {
  const map: Record<number, DASSSubscale> = {};
  (Object.keys(DASS_SUBSCALES) as DASSSubscale[]).forEach((s) => {
    DASS_SUBSCALES[s].forEach((item) => {
      map[item] = s;
    });
  });
  return map;
})();

export default function PainelView({ data }: { data: PainelData }) {
  const router = useRouter();
  const total = data.participants.length;
  const completos = data.participants.filter((p) => p.ffmq && p.dass).length;
  const withFFMQ = data.participants.filter((p) => p.ffmq);

  async function logout() {
    await fetch("/api/mindfulness/admin/logout", { method: "POST" });
    router.replace("/mindfulness/painel/login");
    router.refresh();
  }

  return (
    <>
      <nav className="m-nav">
        <div className="m-nav-brand">
          Iasmim <em>Sasseron</em>
        </div>
        <div className="m-nav-step">Painel de análise</div>
      </nav>
      <main>
        <div className="m-painel-wrap">
          <div className="m-painel-header">
            <div>
              <h1 className="m-painel-title">Painel de Resultados</h1>
              <p className="m-painel-sub">
                Análise individual e coletiva dos questionários aplicados.
              </p>
            </div>
            <div className="m-painel-actions">
              <span className="m-painel-stat">
                {total} {total === 1 ? "participante" : "participantes"} · {completos} completas
              </span>
              <a
                className="m-btn-export"
                href="/api/mindfulness/export"
                download
                title="Baixar planilha Excel com todos os dados"
              >
                Exportar Excel
              </a>
              <button className="m-btn-logout" type="button" onClick={logout}>
                Sair
              </button>
            </div>
          </div>

          {total === 0 ? (
            <div className="m-empty">
              <div className="m-empty-icon">◌</div>
              <div>Nenhuma resposta registrada ainda.</div>
              <div style={{ fontSize: "0.88rem", marginTop: "0.5rem" }}>
                Compartilhe o link público e aguarde os preenchimentos.
              </div>
            </div>
          ) : (
            <>
              <div className="m-participants">
                {data.participants.map((p) => (
                  <ParticipantCard key={p.id} p={p} />
                ))}
              </div>

              {withFFMQ.length >= 2 && (
                <CollectiveView participants={withFFMQ} insights={data.insights} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

type CardTab = "analise" | "respostas";

function ParticipantCard({ p }: { p: ParticipantSummary }) {
  const router = useRouter();
  const [tab, setTab] = useState<CardTab>("analise");
  const [deleting, setDeleting] = useState(false);
  const meta = [p.profissao, `${p.idade} anos`, p.escolaridade].filter(Boolean).join(" · ");
  const date = p.ffmq?.respondedAt || p.dass?.respondedAt;
  const dateStr = date ? new Date(date).toLocaleDateString("pt-BR") : null;
  const hasResponses = !!(p.ffmq || p.dass);

  async function handleDelete() {
    const ok = window.confirm(
      `Excluir todos os dados de ${p.nome} (${p.email}) permanentemente? Esta ação remove respostas e rascunhos e não pode ser desfeita.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/mindfulness/participants/${p.id}`, { method: "DELETE" });
      if (res.status === 401) {
        alert("Sua sessão precisa ser renovada. Vou te levar pra fazer login novamente.");
        router.push("/mindfulness/painel/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Não foi possível excluir.");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir.");
      setDeleting(false);
    }
  }

  return (
    <div className="m-participant">
      <div className="m-participant-header">
        <div>
          <div className="m-participant-name">{p.nome}</div>
          <div className="m-participant-meta">
            {meta}
            {dateStr ? ` · ${dateStr}` : ""}
          </div>
          <div className="m-participant-meta" style={{ marginTop: "0.25rem" }}>
            {p.email}
            {p.meditacaoPrevia
              ? ` · prática prévia: ${p.qualMeditacao || "sim"}${p.tempoMeditacao ? ` (${p.tempoMeditacao})` : ""}`
              : " · sem prática prévia"}
          </div>
        </div>
        <div className="m-participant-header-right">
          <div className="m-badges">
            {p.ffmq ? (
              <span className="m-badge m-badge-ffmq">Atenção plena ✓</span>
            ) : (
              <span className="m-badge m-badge-pending">Atenção plena pendente</span>
            )}
            {p.dass ? (
              <span className="m-badge m-badge-dass">Saúde mental ✓</span>
            ) : (
              <span className="m-badge m-badge-pending">Saúde mental pendente</span>
            )}
          </div>
          <button
            type="button"
            className="m-btn-card-delete"
            onClick={handleDelete}
            disabled={deleting}
            title="Remove permanentemente este participante e todas as respostas associadas"
          >
            {deleting ? "Excluindo..." : "Excluir participante"}
          </button>
        </div>
      </div>

      {hasResponses && (
        <div className="m-tabs">
          <button
            type="button"
            className={`m-tab ${tab === "analise" ? "active" : ""}`}
            onClick={() => setTab("analise")}
          >
            Análise
          </button>
          <button
            type="button"
            className={`m-tab ${tab === "respostas" ? "active" : ""}`}
            onClick={() => setTab("respostas")}
          >
            Respostas detalhadas
          </button>
        </div>
      )}

      <div className="m-participant-body">
        {tab === "analise" && (
          <>
            {p.ffmq && <FFMQSection ffmq={p.ffmq} />}
            {p.ffmq && p.dass && <div className="m-divider" />}
            {p.dass && <DASSSection dass={p.dass} />}
            {hasResponses && (
              <>
                {p.ffmq && (
                  <div className="m-interp">
                    <div className="m-interp-title">Leitura — atenção plena</div>
                    <div className="m-interp-text">{p.ffmq.interpretation}</div>
                  </div>
                )}
                {p.dass && (
                  <div className="m-interp" style={{ marginTop: p.ffmq ? "1rem" : "1.5rem" }}>
                    <div className="m-interp-title">Leitura — saúde mental</div>
                    <div className="m-interp-text">{p.dass.interpretation}</div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "respostas" && (
          <>
            {p.ffmq && <ResponsesList kind="ffmq" answers={p.ffmq.answers} />}
            {p.ffmq && p.dass && <div className="m-divider" />}
            {p.dass && <ResponsesList kind="dass" answers={p.dass.answers} />}
          </>
        )}
      </div>
    </div>
  );
}

function FFMQSection({ ffmq }: { ffmq: NonNullable<ParticipantSummary["ffmq"]> }) {
  return (
    <div className="m-scores-section">
      <div className="m-scores-title">Atenção plena · 5 facetas</div>
      <div className="m-scores-grid">
        {FACETS.map((f) => {
          const band = ffmq.bands[f];
          const bandClass = band === "abaixo" ? "m-band-low" : band === "media" ? "m-band-mid" : "m-band-high";
          const bandLabel = band === "abaixo" ? "Abaixo da média" : band === "media" ? "Na média" : "Acima da média";
          return (
            <div key={f} className="m-score-item">
              <div className="m-score-label">{FFMQ_LABELS[f]}</div>
              <div className="m-score-value">{ffmq.scores[f]}</div>
              <span className={`m-score-band ${bandClass}`}>{bandLabel}</span>
            </div>
          );
        })}
      </div>
      <div className="m-norm-legend" aria-label="Legenda das referências">
        <span className="m-norm-legend-item">
          <span className="m-norm-legend-bar m-norm-legend-fill" /> Pontuação da participante
        </span>
        <span className="m-norm-legend-item">
          <span className="m-norm-legend-marker m-norm-legend-marker-nm" /> Média não-meditantes
        </span>
        <span className="m-norm-legend-item">
          <span className="m-norm-legend-marker m-norm-legend-marker-m" /> Média meditantes regulares
        </span>
      </div>
      <div className="m-bars">
        {FACETS.map((f) => {
          const max = ffmq.maxes[f];
          const pct = Math.round((ffmq.scores[f] / max) * 100);
          const refNm = (FFMQ_NORMS[f].nao_meditantes / max) * 100;
          const refMed = (FFMQ_NORMS[f].meditantes / max) * 100;
          return (
            <div key={f} className="m-bar-row">
              <div className="m-bar-label">{FFMQ_LABELS[f]}</div>
              <div className="m-bar-track">
                <div className="m-bar-fill" style={{ width: `${pct}%` }} />
                <span
                  className="m-bar-ref m-bar-ref-nm"
                  style={{ left: `${refNm}%` }}
                  title={`Média de não-meditantes: ${FFMQ_NORMS[f].nao_meditantes}`}
                  aria-hidden="true"
                />
                <span
                  className="m-bar-ref m-bar-ref-m"
                  style={{ left: `${refMed}%` }}
                  title={`Média de meditantes regulares: ${FFMQ_NORMS[f].meditantes}`}
                  aria-hidden="true"
                />
              </div>
              <div className="m-bar-val">
                {ffmq.scores[f]}/{max}
              </div>
            </div>
          );
        })}
      </div>
      <p className="m-norm-source">
        Referências de média: Baer et al. (2008), <em>Construct Validity of the Five Facet
        Mindfulness Questionnaire in Meditating and Nonmeditating Samples</em>, Tab. 4. As pontuações
        e faixas oficiais do FFMQ permanecem inalteradas — os marcadores servem só para contextualizar
        a leitura.
      </p>
    </div>
  );
}

function DASSSection({ dass }: { dass: NonNullable<ParticipantSummary["dass"]> }) {
  return (
    <div className="m-scores-section">
      <div className="m-scores-title">Saúde mental · 3 subescalas (escala 0–21)</div>
      <div className="m-scores-grid">
        {SUBSCALES.map((s) => {
          const band = dass.bands[s];
          const bandClass =
            band === "Normal" ? "m-band-high" : band === "Leve" ? "m-band-mid" : "m-band-low";
          return (
            <div key={s} className="m-score-item">
              <div className="m-score-label">{DASS_LABELS[s]}</div>
              <div className="m-score-value">{dass.scores[s]}</div>
              <span className={`m-score-band ${bandClass}`}>{band}</span>
            </div>
          );
        })}
      </div>
      <div className="m-bars">
        {SUBSCALES.map((s) => {
          const pct = Math.round((dass.scores[s] / 21) * 100);
          return (
            <div key={s} className="m-bar-row">
              <div className="m-bar-label">{DASS_LABELS[s]}</div>
              <div className="m-bar-track">
                <div className="m-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="m-bar-val">{dass.scores[s]}/21</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResponsesList({
  kind,
  answers,
}: {
  kind: "ffmq" | "dass";
  answers: Record<string, number>;
}) {
  const questions = kind === "ffmq" ? FFMQ_QUESTIONS : DASS_QUESTIONS;
  const scale = kind === "ffmq" ? FFMQ_SCALE : DASS_SCALE;
  const total = questions.length;
  const title =
    kind === "ffmq"
      ? "Atenção plena · 39 perguntas"
      : "Saúde mental · 21 perguntas";

  return (
    <div className="m-responses-section">
      <div className="m-scores-title">{title}</div>
      <ol className="m-responses-list">
        {questions.map((text, idx) => {
          const i = idx + 1;
          const val = answers[String(i)];
          const opt = scale.find((s) => s.val === val);
          const isReversed = kind === "ffmq" && FFMQ_REVERSED.has(i);
          const facet = kind === "ffmq" ? FFMQ_LABELS[FFMQ_ITEM_TO_FACET[i]] : DASS_LABELS[DASS_ITEM_TO_SUB[i]];

          return (
            <li key={i} className="m-response-item">
              <div className="m-response-head">
                <span className="m-response-num">{i.toString().padStart(2, "0")}</span>
                <span className="m-response-tag">
                  {facet}
                  {isReversed && <span className="m-response-rev"> · invertido</span>}
                </span>
              </div>
              <div className="m-response-text">{text}</div>
              <div className="m-response-answer">
                <span className="m-response-val">{val}</span>
                <span className="m-response-label">{opt?.label ?? "—"}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="m-responses-foot">{total} perguntas respondidas</div>
    </div>
  );
}

function CollectiveView({
  participants,
  insights,
}: {
  participants: ParticipantSummary[];
  insights: string[];
}) {
  const radarData = FACETS.map((f) => {
    const point: Record<string, number | string> = { faceta: FFMQ_LABELS[f] };
    participants.forEach((p) => {
      if (p.ffmq) {
        const pct = Math.round((p.ffmq.scores[f] / p.ffmq.maxes[f]) * 100);
        point[firstName(p.nome)] = pct;
      }
    });
    return point;
  });

  return (
    <div className="m-collective">
      <h3 className="m-collective-title">Visão coletiva</h3>
      <p className="m-collective-sub">
        Comparação das facetas de atenção plena entre as participantes (% da pontuação máxima).
      </p>
      <div className="m-radar-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="75%">
            <PolarGrid stroke="rgba(196,212,198,0.6)" />
            <PolarAngleAxis dataKey="faceta" tick={{ fontSize: 12, fill: "#5a5a52" }} />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fontSize: 10, fill: "#75756a" }} />
            {participants.map((p, i) => (
              <Radar
                key={p.id}
                name={firstName(p.nome)}
                dataKey={firstName(p.nome)}
                stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 12, color: "#5a5a52" }} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="m-insights">
        <div className="m-insights-title">Padrões para considerar nas aulas</div>
        {insights.map((ins, i) => (
          <div key={i} className="m-insight-item">
            <div className="m-insight-dot" />
            <div className="m-insight-text">{ins}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function firstName(full: string): string {
  return (full?.split(" ")[0] || "").trim();
}
