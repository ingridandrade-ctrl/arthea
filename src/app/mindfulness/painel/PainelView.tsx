"use client";

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
  type FFMQFacet,
  type FFMQScores,
  type DASSSubscale,
  type DASSScores,
} from "@/lib/mindfulness/scoring";

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
    bands: Record<FFMQFacet, "abaixo" | "media" | "acima">;
    maxes: Record<FFMQFacet, number>;
    interpretation: string;
    respondedAt: string;
  } | null;
  dass: {
    scores: DASSScores;
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
              <button className="m-btn-logout" type="button" onClick={logout}>
                Sair
              </button>
            </div>
          </div>

          {total === 0 ? (
            <div className="m-empty">
              <div className="m-empty-icon">◌</div>
              <div>Nenhuma resposta registrada ainda.</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
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

function ParticipantCard({ p }: { p: ParticipantSummary }) {
  const meta = [p.profissao, `${p.idade} anos`, p.escolaridade].filter(Boolean).join(" · ");
  const date = p.ffmq?.respondedAt || p.dass?.respondedAt;
  const dateStr = date ? new Date(date).toLocaleDateString("pt-BR") : null;

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
            {p.meditacaoPrevia ? ` · prática prévia: ${p.qualMeditacao || "sim"}${p.tempoMeditacao ? ` (${p.tempoMeditacao})` : ""}` : " · sem prática prévia"}
          </div>
        </div>
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
      </div>

      <div className="m-participant-body">
        {p.ffmq && <FFMQSection ffmq={p.ffmq} />}
        {p.ffmq && p.dass && <div className="m-divider" />}
        {p.dass && <DASSSection dass={p.dass} />}
        {(p.ffmq || p.dass) && (
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
      <div className="m-bars">
        {FACETS.map((f) => {
          const pct = Math.round((ffmq.scores[f] / ffmq.maxes[f]) * 100);
          return (
            <div key={f} className="m-bar-row">
              <div className="m-bar-label">{FFMQ_LABELS[f]}</div>
              <div className="m-bar-track">
                <div className="m-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="m-bar-val">
                {ffmq.scores[f]}/{ffmq.maxes[f]}
              </div>
            </div>
          );
        })}
      </div>
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
            band === "Normal"
              ? "m-band-high"
              : band === "Leve"
              ? "m-band-mid"
              : "m-band-low";
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
            <PolarAngleAxis dataKey="faceta" tick={{ fontSize: 11, fill: "#5a5a52" }} />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fontSize: 9, fill: "#8a8a7e" }} />
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
            <Legend wrapperStyle={{ fontSize: 11, color: "#5a5a52" }} />
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
