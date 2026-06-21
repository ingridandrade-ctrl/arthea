"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { ClienteData } from "./types";
import {
  initFadeUpObserver,
  initTimelineObserver,
  initCounterObserver,
  initSerpPositionObserver,
  initRankingBarsObserver,
  initGaugeObserver,
  initSerpRowsObserver,
} from "./animations";
import "./analise.css";

interface Props {
  data: ClienteData;
}

export function AnaliseClient({ data }: Props) {
  const d = data;
  const posNum = parseInt(d.posicao);
  const totalNum = parseInt(d.posicao_total);
  const scoreNum = parseInt(d.score);
  const gaugeOffset = Math.round(314 * (1 - scoreNum / 100));
  const impactoNum = totalNum - 1;
  const gapCount = posNum - 3;
  const youPct = Math.round((parseInt(d.avaliacoes) / (d.ranking[0]?.aval || 1)) * 100);

  useEffect(() => {
    const obs1 = initFadeUpObserver();
    const obs2 = initTimelineObserver();
    const obs3 = initCounterObserver();
    const obs4 = initSerpPositionObserver();
    const obs5 = initRankingBarsObserver();
    const obs6 = initGaugeObserver();
    const obs8 = initSerpRowsObserver();
    return () => {
      obs1?.disconnect();
      obs2?.forEach((o) => o.disconnect());
      obs3?.forEach((o) => o.disconnect());
      obs4?.disconnect();
      obs5?.disconnect();
      obs6?.disconnect();
      obs8?.forEach((o) => o.disconnect());
    };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAF9F6", color: "#111827" }}>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-body">
          {/* Google pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 50, padding: "8px 20px", marginBottom: 48 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              <span style={{ color: "#4285f4" }}>G</span>
              <span style={{ color: "#ea4335" }}>o</span>
              <span style={{ color: "#fbbc05" }}>o</span>
              <span style={{ color: "#4285f4" }}>g</span>
              <span style={{ color: "#34a853" }}>l</span>
              <span style={{ color: "#ea4335" }}>e</span>
            </span>
            <span style={{ width: 1, height: 16, background: "rgba(245,240,235,0.2)" }} />
            <span style={{ fontSize: 12, color: "rgba(245,240,235,0.5)", fontWeight: 600, letterSpacing: "0.05em" }}>📍 Buscas locais</span>
          </div>

          {/* Título principal */}
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(28px,5.5vw,44px)",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            marginBottom: 12,
            textAlign: "center",
          }}>
            <span style={{ color: "rgba(245,240,235,0.95)" }}>Análise exclusiva do seu</span>
            <br />
            <span style={{ color: "rgba(245,240,235,0.95)" }}>negócio no </span>
            <em style={{ fontFamily: "'Playfair Display', serif", color: "#2DD4BF", fontStyle: "italic" }}>Google.</em>
          </h2>

          <p style={{ fontSize: 13, color: "rgba(245,240,235,0.4)", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 28, textTransform: "none" }}>
            por Arthea · Assessoria de Marketing Intencional
          </p>

          {/* Separador */}
          <div style={{ width: 40, height: 1, background: "rgba(45,212,191,0.3)", marginBottom: 28 }} />

          {/* Bloco do cliente */}
          <p style={{ fontSize: "clamp(17px,2.5vw,22px)", fontWeight: 500, color: "rgba(245,240,235,0.7)", marginBottom: 8 }}>
            Diagnóstico completo para
          </p>
          <h1 style={{
            fontSize: "clamp(17px,2.5vw,22px)",
            fontWeight: 700,
            color: "white",
            lineHeight: 1.2,
            letterSpacing: "0.01em",
            marginBottom: 10,
          }}>
            {d.nome_linha1} {d.nome_linha2}
          </h1>
          <div className="hero-client" style={{ marginBottom: 40 }}>
            {d.cidade} · {d.estado} · {d.segmento}
          </div>

          <a href="#diagnostico" className="hero-cta">
            Ver minha análise completa ↓
          </a>

          <div style={{ marginTop: 40, opacity: 0.6 }}>
            <Image
              src="/analises/assets/logo-arthea-oficial.png"
              alt="Arthea"
              width={280}
              height={100}
              style={{ height: 88, width: "auto", objectFit: "contain" }}
            />
          </div>
        </div>
        <div className="scroll-hint">
          <span>Role para ver</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══ SEÇÃO 1: IMPACTO REAL ═══ */}
      <section style={{ padding: "88px 24px 56px", background: "#FAF9F6" }}>
        <div className="wrap">
          <div className="ey">O que encontramos</div>
          <h2 className="tt">
            Analisamos como seu negócio aparece <em>nas buscas do Google.</em>
          </h2>
          <p className="lead">Simulamos <strong>buscas reais na sua região</strong> através de ferramentas especializadas e comparamos o perfil do <strong>Google Meu Negócio</strong> do {d.nome} com os concorrentes.<br />Veja o que encontramos:</p>

          {/* SERP Mock */}
          <div className="fade-up" style={{ marginBottom: 40 }}>
            <div className="serp">
              <div className="serp-bar">
                <span className="serp-g">
                  <span style={{ color: "#4285f4" }}>G</span>
                  <span style={{ color: "#ea4335" }}>o</span>
                  <span style={{ color: "#fbbc05" }}>o</span>
                  <span style={{ color: "#4285f4" }}>g</span>
                  <span style={{ color: "#34a853" }}>l</span>
                  <span style={{ color: "#ea4335" }}>e</span>
                </span>
                <div className="serp-box">🔍 {d.busca_termo}</div>
              </div>
              <div className="serp-map">
                <div className="smd smd-c" style={{ top: "28%", left: "34%" }} />
                <div className="smd smd-c" style={{ top: "52%", left: "62%" }} />
                <div className="smd smd-y" style={{ top: "43%", left: "50%" }} />
              </div>
              <div className="serp-rows">
                <div className="sr">
                  <div className="sr-pos pos1">1</div>
                  <div>
                    <div className="sr-name">{d.lider_nome}</div>
                    <div className="sr-meta">
                      <span className="sr-stars">★★★★★</span>
                      <span>{d.lider_stars}</span>
                      <span style={{ color: "#70757a" }}>({d.lider_aval})</span>
                      <span className="sr-open">Aberto</span>
                    </div>
                  </div>
                </div>
                <div className="sr">
                  <div className="sr-pos pos2">2</div>
                  <div>
                    <div className="sr-name">{d.segundo_nome}</div>
                    <div className="sr-meta">
                      <span className="sr-stars">★★★★★</span>
                      <span>{d.segundo_stars}</span>
                      <span style={{ color: "#70757a" }}>({d.segundo_aval})</span>
                    </div>
                  </div>
                </div>
                <div className="sr-gap">··· mais {gapCount} {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"} antes de você ···</div>
                <div className="sr sr-you">
                  <div className="sr-pos posy" data-count={posNum} data-from="1">{posNum}</div>
                  <div>
                    <div className="sr-name sr-name-you">{d.nome}</div>
                    <div className="sr-meta">
                      <span className="sr-stars-dim">★★★★</span>
                      <span>{d.estrelas}</span>
                      <span style={{ color: "#70757a" }}>({d.avaliacoes})</span>
                      <span className="sr-badge">{d.posicao}ª posição</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="serp-cap">Sua posição hoje: <span style={{ color: "#C0392B" }}>{d.posicao}ª de {d.posicao_total}</span> nas buscas locais do Google</div>
            </div>
          </div>

          {/* +N Card */}
          <div className="fade-up" style={{ background: "#0D4A4A", borderRadius: 22, padding: "36px 32px", marginBottom: 36, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <div className="impacto-card-inner" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <span style={{ display: "block", fontSize: "clamp(56px,9vw,76px)", fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  +{impactoNum - posNum + 1 > 0 ? posNum - 1 : impactoNum}
                </span>
                <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2DD4BF", marginTop: 6 }}>
                  {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"}
                </span>
              </div>
              <div className="impacto-divider" style={{ width: 1, height: 60, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 15, color: "rgba(245,240,235,0.85)", lineHeight: 1.55, fontWeight: 500 }}>
                  aparecem <strong style={{ color: "white", fontWeight: 700 }}>antes de você</strong> no Google Maps quando alguém pesquisa na sua região.
                </p>
                <p style={{ fontSize: 12, color: "rgba(245,240,235,0.4)", lineHeight: 1.5, marginTop: 8 }}>
                  A maioria dos clientes <strong style={{ color: "rgba(245,240,235,0.7)" }}>nunca chega a ver seu perfil</strong>. Eles escolhem quem aparece primeiro.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="fade-up loss-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              {
                label: "Sua posição",
                badge: "Crítico",
                badgeColor: "#C0392B",
                badgeBg: "#FEE2E2",
                borderColor: "rgba(192,57,43,0.15)",
                barColor: "#C0392B",
                valueProps: { "data-count": posNum, "data-suffix": "ª", "data-from": "1" },
                valueText: "1ª",
                valueColor: "#C0392B",
                sub: `de ${d.posicao_total} na região`,
              },
              {
                label: "Suas avaliações",
                badge: "Crítico",
                badgeColor: "#C0392B",
                badgeBg: "#FEE2E2",
                borderColor: "rgba(192,57,43,0.15)",
                barColor: "#C0392B",
                valueProps: { "data-count": parseInt(d.avaliacoes), "data-from": "0" },
                valueText: "0",
                valueColor: "#C0392B",
                sub: `1º lugar tem ${d.lider_aval}`,
              },
              {
                label: "Sua nota média",
                badge: "Atenção",
                badgeColor: "#C97A06",
                badgeBg: "#FEF3C7",
                borderColor: "rgba(201,122,6,0.15)",
                barColor: "#C97A06",
                valueProps: { "data-count-decimal": d.estrelas, "data-from": "5.0", "data-suffix": "★" },
                valueText: "5.0★",
                valueColor: "#C97A06",
                sub: `média do segmento: ${d.estrelas_media_seg}★`,
              },
              {
                label: "Nota do perfil",
                badge: "Atenção",
                badgeColor: "#C97A06",
                badgeBg: "#FEF3C7",
                borderColor: "rgba(201,122,6,0.15)",
                barColor: "#C97A06",
                valueProps: {},
                valueText: null,
                valueColor: "#C97A06",
                sub: "sem postagens e sem fotos",
              },
            ].map((card, i) => (
              <div key={i} style={{ background: "white", borderRadius: 18, padding: "24px 22px", border: `1.5px solid ${card.borderColor}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.barColor, borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{card.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: card.badgeColor, background: card.badgeBg, padding: "3px 10px", borderRadius: 20 }}>{card.badge}</span>
                </div>
                <div {...card.valueProps} style={{ fontSize: 42, fontWeight: 800, color: card.valueColor, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 10 }}>
                  {card.valueText !== null ? card.valueText : <>{d.score}<span style={{ fontSize: 20, fontWeight: 500, color: "#9CA3AF" }}>/100</span></>}
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.4, fontWeight: 500 }}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ IMPACT QUESTION ═══ */}
      <section style={{ padding: "0 24px 88px", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="fade-up impact-question-card" style={{ background: "linear-gradient(160deg,#082E2E 0%,#0D4A4A 100%)", borderRadius: 22, overflow: "hidden", position: "relative", padding: "52px 40px", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 15, color: "rgba(245,240,235,0.6)", lineHeight: 1.7, marginBottom: 6 }}>
                Isso significa que todos os dias, quando pessoas pesquisam
              </p>
              <p style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 700, color: "white", letterSpacing: "-0.01em", marginBottom: 24 }}>
                &ldquo;{d.busca_termo}&rdquo; <span style={{ fontWeight: 400, color: "rgba(245,240,235,0.6)" }}>na sua região</span>
              </p>
              <div style={{ width: 32, height: 1, background: "rgba(245,240,235,0.12)", margin: "0 auto 24px" }} />
              <p style={{ fontSize: 15, color: "rgba(245,240,235,0.6)", lineHeight: 1.7, marginBottom: 6 }}>
                Você aparece na <strong style={{ color: "#FF8080", fontWeight: 700 }}>{d.posicao}ª posição</strong>. Nessa posição,
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "clamp(24px,4vw,34px)", fontWeight: 400, color: "#2DD4BF", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                quantas escolhem você?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 3: DIAGNÓSTICO COMPLETO ═══ */}
      <section id="diagnostico" style={{ padding: "72px 24px 96px", background: "linear-gradient(160deg,#082E2E 0%,#0D4A4A 45%,#0A3A3A 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "20px 20px" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(45,212,191,0.4)" }} />
            Diagnóstico do perfil
          </div>
          <h2 className="tt" style={{ color: "white" }}>
            O <em style={{ color: "#2DD4BF" }}>porquê</em> de cada
            <br />
            resultado acima
          </h2>
          <p className="lead" style={{ color: "rgba(245,240,235,0.6)" }}>
            Já vimos onde você aparece e qual sua posição. Abaixo, detalhamos <strong>item por item</strong> do seu perfil — o que está funcionando e o que <strong>precisa de atenção</strong> para subir no ranking.
          </p>

          {/* Score Gauge */}
          <div className="fade-up score-gauge-wrap" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: 28, marginBottom: 32 }}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#D97706" }} />
                    <stop offset="100%" style={{ stopColor: "#F59E0B" }} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle
                  className="score-gauge-fill"
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="314"
                  strokeDashoffset="314"
                  data-target-offset={gaugeOffset}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: "white", lineHeight: 1 }}>{d.score}</span>
                <span style={{ fontSize: 10, color: "rgba(245,240,235,0.45)", fontWeight: 600, marginTop: 2 }}>de 100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,122,6,0.2)", color: "#F59E0B", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 20, marginBottom: 6 }}>
                ⚡ Razoável · Abaixo do potencial
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>Pontuação geral do perfil</h3>
              <p style={{ fontSize: 12, color: "rgba(245,240,235,0.55)", lineHeight: 1.55 }}>
                Alguns itens básicos estão preenchidos, mas faltam <strong>configurações estratégicas</strong> que fariam o Google mostrar você <strong>antes dos concorrentes</strong>.
              </p>
            </div>
          </div>

          {/* Checklist: Exists */}
          <div className="fade-up" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "12px 18px", background: "rgba(45,212,191,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>ℹ️</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(45,212,191,0.85)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preenchidos · requerem gestão contínua</span>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { item: "Horário de funcionamento", note: "precisa ser atualizado em feriados e datas especiais", badge: "Existe", color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
                { item: `Quantidade de avaliações`, note: `${d.avaliacoes} avaliações, volume abaixo da média do segmento`, badge: "Existe", color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
                { item: "Imagem do logotipo", note: "presente, mas sem atualização recente de fotos", badge: "Existe", color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
                { item: "Nome, telefone e website", note: "configurados corretamente", badge: "✓ Ok", color: "#34D399", bg: "rgba(52,211,153,0.15)" },
              ].map((row, i) => (
                <div key={i} className="checklist-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div>
                    <span style={{ fontSize: 13, color: "rgba(245,240,235,0.85)", fontWeight: 500 }}>{row.item}</span>
                    <span style={{ fontSize: 11, color: "rgba(245,240,235,0.4)", marginLeft: 8 }}>· {row.note}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.color, background: row.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{row.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Gaps */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FF8080" }}>Lacunas críticas</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,128,128,0.2)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { title: "Postagens no perfil", text: <>Nenhuma postagem publicada. O Google <strong style={{ color: "rgba(245,240,235,0.75)" }}>prioriza perfis ativos</strong> com publicações regulares — postagens, ofertas e novidades.</> },
                { title: "Fotos recentes do proprietário", text: <>Nenhuma foto do proprietário nos últimos 6 meses. Fotos atualizadas <strong style={{ color: "rgba(245,240,235,0.75)" }}>aumentam o interesse dos clientes</strong> e a confiança no perfil.</> },
                { title: "Fotos 360°", text: <>Nenhum tour virtual ou foto 360° adicionada. Perfis com tour virtual recebem <strong style={{ color: "rgba(245,240,235,0.75)" }}>o dobro de interesse</strong> dos clientes segundo o Google.</> },
              ].map((gap, i) => (
                <div key={i} className="fade-up gap-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "20px 22px", background: "rgba(192,57,43,0.08)", borderRadius: 20, border: "1px solid rgba(192,57,43,0.25)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C0392B", borderRadius: "16px 16px 0 0" }} />
                  <div className="gap-icon" style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(192,57,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#FF8080", flexShrink: 0, marginTop: 1 }}>✗</div>
                  <div style={{ flex: 1 }}>
                    <div className="gap-badge-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 14, color: "white" }}>{gap.title}</strong>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#FF8080", background: "rgba(192,57,43,0.2)", padding: "2px 9px", borderRadius: 20 }}>Não preenchido</span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(245,240,235,0.55)", lineHeight: 1.55 }}>{gap.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Points */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#F59E0B" }}>Pontos de melhoria</span>
              <div style={{ flex: 1, height: 1, background: "rgba(245,158,11,0.2)" }} />
            </div>
            <div className="improve-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { title: "Média de avaliações", score: "50%", text: <>{d.estrelas}★ atual. Média do segmento: {d.estrelas_media_seg}★. <strong style={{ color: "rgba(245,240,235,0.75)" }}>Precisa melhorar</strong> para competir.</> },
                { title: "Avaliações sem resposta", score: "50%", text: <><strong style={{ color: "rgba(245,240,235,0.75)" }}>{d.avaliacoes_sr} avaliações sem resposta</strong> do proprietário. Responder aumenta credibilidade e ranking.</> },
                { title: "Avaliações sem comentário", score: "50%", text: <>{d.avaliacoes_sc} avaliações sem texto. Avaliações com texto detalhado fazem o Google <strong style={{ color: "rgba(245,240,235,0.75)" }}>mostrar seu perfil para mais pessoas</strong>.</> },
                { title: "Vídeos no perfil", score: "50%", text: <>Nenhum vídeo adicionado. Vídeos curtos <strong style={{ color: "rgba(245,240,235,0.75)" }}>aumentam o tempo de visualização</strong> e a interação dos clientes com o perfil.</> },
              ].map((item, i) => (
                <div key={i} className="fade-up" style={{ padding: "18px 20px", background: "rgba(201,122,6,0.08)", borderRadius: 20, border: "1px solid rgba(201,122,6,0.25)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C97A06", borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                    <strong style={{ fontSize: 13, color: "white", lineHeight: 1.3, flex: 1 }}>{item.title}</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "rgba(201,122,6,0.2)", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 8 }}>{item.score}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(245,240,235,0.55)", lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
            {/* Description full-width */}
            <div className="fade-up desc-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 22px", background: "rgba(201,122,6,0.08)", borderRadius: 20, border: "1px solid rgba(201,122,6,0.2)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#C97A06,#F59E0B)", borderRadius: "16px 16px 0 0" }} />
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(201,122,6,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#F59E0B", flexShrink: 0, marginTop: 1 }}>!</div>
              <div style={{ flex: 1 }}>
                <div className="desc-badge-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14, color: "white" }}>Descrição do negócio</strong>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "rgba(201,122,6,0.2)", padding: "2px 9px", borderRadius: 20 }}>Nota 70%</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(245,240,235,0.55)", lineHeight: 1.55 }}>
                  Descrição atual: <strong style={{ color: "rgba(245,240,235,0.75)" }}>{d.descricao_chars} caracteres</strong>. Mínimo recomendado: 125. Use <strong style={{ color: "rgba(245,240,235,0.75)" }}>palavras-chave do segmento e da região</strong> para o Google entender seu negócio.
                </p>
              </div>
            </div>
          </div>

          {/* Compare: Você vs. Concorrente */}
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(45,212,191,0.4)" }} />
            Comparação direta
          </div>
          <h2 className="tt" style={{ color: "white" }}>
            Na prática, é isso
            <br />
            <em style={{ color: "#2DD4BF" }}>que o cliente vê</em>
          </h2>
          <p className="lead" style={{ color: "rgba(245,240,235,0.6)" }}>
            Todas essas lacunas ficam claras quando colocamos <strong>seu perfil ao lado de um concorrente</strong> da mesma região — {d.concorrente_nome}, que aparece no {d.concorrente_pos}:
          </p>

          <div className="fade-up" style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", marginBottom: 24 }}>
            {/* Headers */}
            <div className="cmp-header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(255,255,255,0.06)" }}>
              <div style={{ background: "rgba(192,57,43,0.15)", padding: "14px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#FF8080", marginBottom: 2 }}>⚠️ Você · {d.nome_linha1}</p>
                <p style={{ fontSize: 10, color: "rgba(245,240,235,0.4)" }}>Matriz · {d.cidade}, {d.estado.split(",")[1]?.trim() || "SP"}</p>
              </div>
              <div style={{ background: "rgba(52,211,153,0.12)", padding: "14px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#34D399", marginBottom: 2 }}>✓ Concorrente direto</p>
                <p style={{ fontSize: 10, color: "rgba(245,240,235,0.4)" }}>{d.concorrente_nome.split(" ").slice(0, 2).join(" ")} · mesma região</p>
              </div>
            </div>
            {/* Rows */}
            <div className="cmp-rows-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "0 20px" }}>
                {[
                  { label: "Avaliações", val: d.avaliacoes, color: "#FF8080" },
                  { label: "Média ★", val: d.estrelas, color: "#FF8080" },
                  { label: "Categorias", val: "1 de 3", color: "#F59E0B" },
                  { label: "Postagens", val: "Inativo", color: "#FF8080" },
                  { label: "Posição", val: `${d.posicao}ª de ${d.posicao_total}`, color: "#FF8080" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: 11.5 }}>
                    <span style={{ color: "rgba(245,240,235,0.5)" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "0 20px" }}>
                {[
                  { label: "Avaliações", val: d.concorrente_aval, color: "#34D399" },
                  { label: "Média ★", val: d.concorrente_stars, color: "#34D399" },
                  { label: "Categorias", val: "3 ativas", color: "#34D399" },
                  { label: "Postagens", val: "Ativo", color: "#34D399" },
                  { label: "Posição", val: d.concorrente_pos, color: "#34D399" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: 11.5 }}>
                    <span style={{ color: "rgba(245,240,235,0.5)" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary: key takeaways */}
          <div style={{ marginTop: 32, marginBottom: 0 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(245,240,235,0.5)" }}>Resumo da análise</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "rgba(192,57,43,0.1)", borderRadius: 13, padding: "15px 16px", borderLeft: "3.5px solid #C0392B" }}>
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🔴</span>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 3 }}>Perfil inativo: sem postagens e sem fotos recentes</h4>
                  <p style={{ fontSize: 12, color: "rgba(245,240,235,0.55)", lineHeight: 1.5 }}>O Google interpreta isso como <strong style={{ color: "rgba(245,240,235,0.7)" }}>perfil abandonado</strong> e reduz a visibilidade automaticamente. É o principal motivo da nota {d.score}/100.</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "rgba(192,57,43,0.1)", borderRadius: 13, padding: "15px 16px", borderLeft: "3.5px solid #C0392B" }}>
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🔴</span>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 3 }}>Volume de avaliações muito abaixo do necessário</h4>
                  <p style={{ fontSize: 12, color: "rgba(245,240,235,0.55)", lineHeight: 1.5 }}><strong style={{ color: "rgba(245,240,235,0.7)" }}>{d.avaliacoes} avaliações</strong> contra {d.concorrente_aval} do concorrente direto e {d.lider_aval} do líder. Isso explica a posição <strong style={{ color: "rgba(245,240,235,0.7)" }}>{d.posicao}ª no ranking</strong>.</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "rgba(201,122,6,0.1)", borderRadius: 13, padding: "15px 16px", borderLeft: "3.5px solid #C97A06" }}>
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🟡</span>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 3 }}>Média de estrelas abaixo do segmento</h4>
                  <p style={{ fontSize: 12, color: "rgba(245,240,235,0.55)", lineHeight: 1.5 }}>{d.estrelas}★ contra {d.estrelas_media_seg}★ da média. Combinado com {d.avaliacoes_sr} avaliações sem resposta, passa uma <strong style={{ color: "rgba(245,240,235,0.7)" }}>impressão de descuido</strong> para quem pesquisa.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 4: COMO FUNCIONA + RANKING (fundo claro) ═══ */}
      <section style={{ padding: "88px 24px 72px", background: "#FAF9F6" }}>
        <div className="wrap">
          <div className="ey">Como funciona a busca local</div>
          <h2 className="tt">
            O que acontece quando alguém <em>pesquisa na sua região</em>
          </h2>
          <p className="lead">
            Quando alguém pesquisa &ldquo;{d.busca_termo}&rdquo;, os <strong>perfis mais completos aparecem primeiro</strong>. O cliente decide ali mesmo, sem visitar outro site.
          </p>

          {/* 3 info cards */}
          <div className="fade-up por-que-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24, textAlign: "left" }}>
            {[
              { icon: "👁️", title: "Primeira impressão", text: <>Fotos, avaliações e estrelas aparecem <strong>antes de qualquer clique</strong>. É ali que o cliente decide.</> },
              { icon: "⭐", title: "Volume de avaliações", text: <>O líder tem <strong>{d.lider_aval}</strong>. Você tem <strong>{d.avaliacoes}</strong>. Essa diferença define quem aparece primeiro.</> },
              { icon: "📞", title: "Contato direto", text: <>O cliente liga, pede rota ou acessa seu site <strong>direto do perfil</strong>, sem visitar nenhum outro.</> },
            ].map((c, i) => (
              <div key={i} style={{ background: "white", borderRadius: 18, padding: "22px 20px", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 2px 12px rgba(13,74,74,0.06)" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 5, lineHeight: 1.3 }}>{c.title}</h4>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.55 }}>{c.text}</p>
              </div>
            ))}
          </div>

          {/* 72% stat */}
          <div className="fade-up stat-72-wrap" style={{ display: "flex", alignItems: "center", gap: 20, background: "#0D4A4A", borderRadius: 20, padding: "20px 28px", marginBottom: 56, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <span data-count="72" data-suffix="%" data-from="0" style={{ fontSize: 44, fontWeight: 700, color: "#FAF9F6", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: 80, textAlign: "left" as const, position: "relative", zIndex: 1 }}>0%</span>
            <div style={{ textAlign: "left" as const, position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#FAF9F6", marginBottom: 3 }}>dos clientes escolhem entre os <strong>3 primeiros resultados</strong></p>
              <p style={{ fontSize: 12, color: "rgba(245,240,235,0.5)", lineHeight: 1.5 }}>Na posição {d.posicao}ª, seu perfil fica <strong style={{ color: "rgba(245,240,235,0.7)" }}>fora dessa faixa de decisão</strong>.</p>
            </div>
          </div>

          {/* Sub-section: Ranking */}
          <div className="ey">Sua posição hoje</div>
          <h2 className="tt">
            Avaliações definem <em>quem aparece primeiro</em>
          </h2>
          <p className="lead">
            Avaliações são o <strong>fator nº 1</strong> no ranking local. Veja a diferença entre quem lidera e a sua posição atual em {d.cidade}:
          </p>

          {/* Ranking Chart */}
          <div className="fade-up" style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 20, overflow: "hidden", marginBottom: 24, textAlign: "left", boxShadow: "0 4px 20px rgba(13,74,74,0.07)" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(13,74,74,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {d.segmento === "Escritório de Advocacia" ? "Escritórios de advocacia" : d.segmento} — {d.estado.split(",")[0]}
              </h4>
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{d.posicao_total} perfis analisados</span>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {d.ranking.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, fontSize: 10, fontWeight: 700, color: "#9CA3AF", textAlign: "right", flexShrink: 0 }}>{r.pos}</span>
                  <span className="ranking-name" style={{ fontSize: 12, width: 130, flexShrink: 0, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nome}</span>
                  <div style={{ flex: 1, background: "rgba(13,74,74,0.08)", borderRadius: 4, height: 22, overflow: "hidden" }}>
                    <div className="rank-bar" data-width={r.pct} style={{ background: "linear-gradient(90deg,#157373,rgba(21,115,115,0.5))" }}>
                      {r.aval.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
              {/* Dots separator */}
              <div style={{ display: "flex", justifyContent: "center", gap: 3, padding: "3px 0" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#9ca3af", opacity: 0.35 }} />
                ))}
              </div>
              {/* You */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 24, fontSize: 10, fontWeight: 700, color: "#C0392B", textAlign: "right", flexShrink: 0 }}>{d.posicao}º</span>
                <span className="ranking-name" style={{ fontSize: 12, width: 130, flexShrink: 0, fontWeight: 700, color: "#C0392B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.nome_linha1}</span>
                <div style={{ flex: 1, background: "rgba(13,74,74,0.08)", borderRadius: 4, height: 22, overflow: "hidden" }}>
                  <div className="rank-bar" data-width={youPct} data-you="true" style={{ background: "#E74C3C", transition: "width 1.8s cubic-bezier(0.4,0,0.2,1) 0.8s" }}>
                    {parseInt(d.avaliacoes).toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Context cards */}
          <div className="fade-up ranking-context-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
            <div style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 18, padding: "20px 22px", boxShadow: "0 2px 12px rgba(13,74,74,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#157373", marginBottom: 8 }}>Sua situação atual</p>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Com {d.avaliacoes} avaliações, você está <strong style={{ color: "#374151" }}>{(d.ranking[0]?.aval || 0) - parseInt(d.avaliacoes)} avaliações atrás</strong> do líder. Essa distância se reflete diretamente na posição.</p>
            </div>
            <div style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 18, padding: "20px 22px", boxShadow: "0 2px 12px rgba(13,74,74,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#157373", marginBottom: 8 }}>O que pode mudar</p>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Você não precisa alcançar o 1º lugar para ganhar visibilidade. <strong style={{ color: "#374151" }}>Entrar no top 3</strong> já muda completamente quantos clientes te encontram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 5: TIMELINE + CTA ═══ */}
      <section style={{ padding: "96px 24px 88px", background: "linear-gradient(160deg,#082E2E 0%,#0D4A4A 45%,#0A3A3A 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "20px 20px" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(45,212,191,0.4)" }} />
            Como a Arthea transforma
          </div>
          <h2 className="tt" style={{ color: "white" }}>
            O plano para colocar o<br />
            <em style={{ color: "#2DD4BF" }}>{d.nome_linha1}</em> no topo
          </h2>
          <p className="lead" style={{ color: "rgba(245,240,235,0.6)" }}>
            Um processo <strong>testado e comprovado</strong> que já transformou a presença local de dezenas de negócios.
          </p>

          {/* GMB note */}
          <div className="fade-up" style={{ background: "rgba(45,212,191,0.07)", border: "1px solid rgba(45,212,191,0.18)", borderRadius: 18, padding: "18px 22px", marginBottom: 60, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#2DD4BF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Google Meu Negócio não é Google Ads</p>
              <p style={{ fontSize: 13, color: "rgba(245,240,235,0.6)", lineHeight: 1.6 }}>É uma <strong style={{ color: "rgba(245,240,235,0.8)" }}>ferramenta gratuita</strong> do Google. Você não paga por clique nem faz anúncio. O trabalho da Arthea é otimizar, gerenciar e posicionar seu perfil — <strong style={{ color: "rgba(245,240,235,0.8)" }}>sem pagar por anúncios</strong>.</p>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ position: "relative" }}>
            <div className="tl-line" style={{ position: "absolute", left: 25, top: 52, bottom: 52, width: 1.5, background: "linear-gradient(to bottom,rgba(45,212,191,0.35),rgba(45,212,191,0.04))" }} />
            {[
              {
                n: 1,
                delay: 0,
                tag: "Primeiros dias",
                badge: "Imersão",
                title: "Imersão no negócio e estratégia completa",
                text: <>Entendemos seu mercado, seus diferenciais, seus concorrentes diretos e a região de atuação. O plano de ação é <strong style={{ color: "rgba(245,240,235,0.8)" }}>feito sob medida</strong>.</>,
                active: true,
              },
              {
                n: 2,
                delay: 150,
                tag: "Semana 2",
                badge: "Otimização",
                title: "Perfil configurado estrategicamente",
                text: <>Todas as categorias, atributos, descrição otimizada, fotos profissionais e configurações avançadas. <strong style={{ color: "rgba(245,240,235,0.8)" }}>Nota de {d.score} para 85+</strong> em semanas.</>,
                active: false,
              },
              {
                n: 3,
                delay: 300,
                tag: "Meses 1 e 2",
                badge: "Gestão mensal inclusa",
                title: "Estratégia de avaliações e acompanhamento contínuo",
                text: <>Implementamos processo para obter <strong style={{ color: "rgba(245,240,235,0.8)" }}>avaliações reais</strong>, respondemos cada uma estrategicamente e publicamos conteúdo regular no perfil.</>,
                active: false,
              },
              {
                n: 4,
                delay: 450,
                tag: "A partir do mês 3",
                badge: "Gestão mensal",
                title: "Perfil sempre ativo, sempre bem posicionado",
                text: <>Monitoramento de ranking, relatórios mensais, ajustes de estratégia e <strong style={{ color: "rgba(245,240,235,0.8)" }}>gestão completa do perfil</strong> — você não precisa fazer nada.</>,
                active: false,
              },
            ].map((step) => (
              <div
                key={step.n}
                className="fade-up tl-step"
                data-delay={step.delay}
                style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 36 }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                    fontWeight: 700,
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    ...(step.active
                      ? { background: "#FAF9F6", color: "#0D4A4A", boxShadow: "0 0 0 6px rgba(245,240,235,0.07)" }
                      : { background: "rgba(245,240,235,0.12)", border: "1.5px solid rgba(245,240,235,0.28)", color: "white" }),
                  }}
                >
                  {step.n}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: step.active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                    border: `1px solid rgba(255,255,255,${step.active ? "0.12" : "0.08"})`,
                    borderRadius: 20,
                    padding: "20px 22px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,212,191,0.65)" }}>{step.tag}</p>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(45,212,191,0.7)", background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.18)", padding: "3px 10px", borderRadius: 20 }}>{step.badge}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 7, letterSpacing: "-0.01em" }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(245,240,235,0.6)", lineHeight: 1.65 }}>{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Impact phrase */}
          <div className="fade-up impact-phrase-card" style={{ marginTop: 72, padding: "52px 40px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, color: "white", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              Quer que o próximo cliente
              <br />
              que pesquisar na sua região
              <br />
              <em style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "#2DD4BF" }}>encontre você primeiro?</em>
            </h2>
          </div>

          {/* CTA */}
          <div className="fade-up" style={{ textAlign: "center", marginTop: 56 }}>
            <div className="ey" style={{ color: "rgba(45,212,191,0.7)", marginBottom: 16 }}>
              <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(45,212,191,0.4)" }} />
              Próximo passo
            </div>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, color: "white", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
              Preparamos planos
              <br />
              <em style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "#2DD4BF" }}>feitos para o seu negócio.</em>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(245,240,235,0.6)", lineHeight: 1.7, marginBottom: 36 }}>
              Preparamos <strong>planos de otimização exclusivos</strong>
              <br />
              para o {d.nome}.
            </p>
            <a
              href="https://arthea.com.br/gmb"
              className="cta-final"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "#FAF9F6",
                color: "#0D4A4A",
                textDecoration: "none",
                padding: "18px 52px",
                borderRadius: 50,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.02em",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                transition: "all 0.25s ease",
              }}
            >
              Ver planos de otimização →
            </a>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(245,240,235,0.3)", marginTop: 16 }}>Análise gratuita · Sem compromisso</p>

            <div style={{ marginTop: 60, opacity: 0.15 }}>
              <Image
                src="/analises/assets/logo-arthea-oficial.png"
                alt="Arthea"
                width={120}
                height={60}
                style={{ height: 80, width: "auto", objectFit: "contain", filter: "brightness(10)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#0D4A4A", padding: "28px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 10, color: "rgba(245,240,235,0.4)", letterSpacing: "0.18em", fontWeight: 600 }}>
          ARTHEA · Dados coletados em {d.data_analise} por ferramenta especializada da agência · Uso exclusivo e confidencial
        </p>
      </footer>
    </div>
  );
}
