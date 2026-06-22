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
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F5F1", color: "#111827" }}>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-body">
          {/* Logo Arthea */}
          <div style={{ marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/analises/assets/logo-arthea.svg"
              alt="Arthea"
              className="hero-brand"
            />
          </div>

          {/* Kicker pill */}
          <p className="hero-pill">
            <span className="hero-dot" />
            Gestão de Google Meu Negócio
          </p>

          {/* Título principal */}
          <h1 style={{
            fontSize: "clamp(30px,5.5vw,64px)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            marginBottom: 10,
            textAlign: "center",
            textWrap: "balance" as const,
          }}>
            Análise exclusiva do seu negócio
            <em style={{
              display: "block",
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: "clamp(34px,6.5vw,76px)",
              color: "#2DD4BF",
              lineHeight: 1,
            }}>
              no Google.
            </em>
          </h1>

          {/* Subtítulo */}
          <p style={{
            fontSize: "clamp(17px,2.2vw,20px)",
            fontWeight: 500,
            color: "rgba(245,240,235,0.92)",
            lineHeight: 1.6,
            margin: "24px auto 10px",
            maxWidth: 520,
            textAlign: "center",
          }}>
            Diagnóstico completo para
            <br />
            <strong style={{ color: "white", fontWeight: 700 }}>{d.nome_linha1} {d.nome_linha2}</strong>
            <br />
            <span style={{ fontSize: 13, color: "rgba(245,240,235,0.45)", letterSpacing: "0.04em" }}>
              {d.cidade} · {d.estado} · {d.segmento}
            </span>
          </p>

          {/* Botão CTA */}
          <a href="#analise" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: "#2DD4BF",
            color: "#0D4A4A",
            textDecoration: "none",
            padding: "18px 40px",
            borderRadius: 50,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: "0 24px 64px rgba(0,0,0,0.32)",
            transition: "transform .2s, box-shadow .2s",
            marginTop: 24,
          }}>
            Ver minha análise completa ↓
          </a>
        </div>
      </section>

      {/* ═══ SEÇÃO 1: IMPACTO REAL ═══ */}
      <section id="analise" style={{ padding: "96px 24px 56px", background: "#F7F5F1" }}>
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
          <div className="fade-up impacto-card" style={{ background: "#0D4A4A", borderRadius: 22, padding: "40px 36px", marginBottom: 36, position: "relative", overflow: "hidden", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{ display: "block", fontSize: "clamp(52px,8vw,72px)", fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                +{impactoNum - posNum + 1 > 0 ? posNum - 1 : impactoNum}
              </span>
              <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2DD4BF", marginTop: 8, marginBottom: 20 }}>
                {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"}
              </span>
              <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.12)", margin: "0 auto 20px" }} />
              <p style={{ fontSize: "clamp(15px,2vw,18px)", color: "rgba(245,240,235,0.88)", lineHeight: 1.6, fontWeight: 500, maxWidth: 420, margin: "0 auto" }}>
                aparecem <strong style={{ color: "white", fontWeight: 700 }}>antes de você</strong> no Google Maps quando alguém pesquisa na sua região.
              </p>
              <p style={{ fontSize: 13, color: "rgba(245,240,235,0.4)", lineHeight: 1.55, marginTop: 12, maxWidth: 380, margin: "12px auto 0" }}>
                A maioria dos clientes <strong style={{ color: "rgba(245,240,235,0.65)" }}>nunca chega a ver seu perfil</strong>. Eles escolhem quem aparece primeiro.
              </p>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                label: "Suas avaliações",
                badge: "Crítico",
                badgeTip: "impacta diretamente sua posição",
                badgeColor: "#C0392B",
                badgeBg: "#FEE2E2",
                barColor: "#C0392B",
                valueProps: { "data-count": parseInt(d.avaliacoes), "data-from": "0" },
                valueText: "0",
                valueColor: "#C0392B",
                explain: <>Pro Google, mais avaliações = mais relevante. Você tem bem menos que os primeiros <strong style={{ color: "#374151" }}>(líder: {d.lider_aval})</strong>.</>,
              },
              {
                label: "Sua nota média",
                badge: "Atenção",
                badgeTip: "afasta clientes antes do clique",
                badgeColor: "#B45309",
                badgeBg: "#FEF3C7",
                barColor: "#D97706",
                valueProps: { "data-count-decimal": d.estrelas, "data-from": "5.0", "data-suffix": "★" },
                valueText: "5.0★",
                valueColor: "#B45309",
                explain: <>Abaixo de 4.0, muita gente descarta o perfil antes mesmo de clicar. <strong style={{ color: "#374151" }}>Média do segmento: {d.estrelas_media_seg}★.</strong></>,
              },
              {
                label: "Nota do perfil",
                badge: "Atenção",
                badgeTip: "perfil incompleto perde visibilidade",
                badgeColor: "#B45309",
                badgeBg: "#FEF3C7",
                barColor: "#D97706",
                valueProps: {},
                valueText: null,
                valueColor: "#B45309",
                explain: <>Mede o quão completo e otimizado está seu perfil. <strong style={{ color: "#374151" }}>{d.score} mostra que há bastante a melhorar</strong> — sem postagens nem fotos recentes.</>,
              },
            ].map((card, i) => (
              <div key={i} style={{ background: "white", borderRadius: 18, padding: "24px 22px", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.barColor, borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{card.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: card.badgeColor, background: card.badgeBg, padding: "3px 10px", borderRadius: 20, cursor: "default" }} title={card.badgeTip}>{card.badge} · {card.badgeTip}</span>
                </div>
                <div {...card.valueProps} style={{ fontSize: 42, fontWeight: 800, color: card.valueColor, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 12 }}>
                  {card.valueText !== null ? card.valueText : <>{d.score}<span style={{ fontSize: 20, fontWeight: 500, color: "#9CA3AF" }}>/100</span></>}
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>{card.explain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA (regra do jogo) ═══ */}
      <section style={{ padding: "64px 24px 72px", background: "#F7F5F1" }}>
        <div className="wrap">
          <div className="ey">A regra do jogo</div>
          <h2 className="tt">
            Como o Google decide <em>quem aparece primeiro</em>
          </h2>

          {/* Mini-fluxo 3 passos */}
          <div className="fade-up flow-steps" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, margin: "32px auto 36px", maxWidth: 520 }}>
            {[
              { icon: "🔎", label: "Cliente pesquisa", delay: 0 },
              { icon: "📍", label: "Vê os 3 primeiros", delay: 200 },
              { icon: "👆", label: "Escolhe ali mesmo", delay: 400 },
            ].map((step, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className="fade-up flow-step" data-delay={step.delay} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #0D4A4A, #157373)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 16px rgba(13,74,74,0.2)" }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>{step.label}</span>
                </div>
                {i < 2 && (
                  <div className="flow-arrow" style={{ fontSize: 16, color: "#9CA3AF", flexShrink: 0, padding: "0 6px", marginBottom: 20 }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* 72% stat */}
          <div className="fade-up stat-72-wrap" style={{ display: "flex", alignItems: "center", gap: 20, background: "#0D4A4A", borderRadius: 20, padding: "20px 28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <span data-count="72" data-suffix="%" data-from="0" style={{ fontSize: 44, fontWeight: 700, color: "#FAF9F6", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: 80, textAlign: "left" as const, position: "relative", zIndex: 1 }}>0%</span>
            <div style={{ textAlign: "left" as const, position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#FAF9F6", marginBottom: 3 }}>escolhem entre os <strong>3 primeiros resultados</strong></p>
              <p style={{ fontSize: 12, color: "rgba(245,240,235,0.5)", lineHeight: 1.5 }}>Na {d.posicao}ª posição, você fica <strong style={{ color: "rgba(245,240,235,0.7)" }}>fora dessa faixa de decisão</strong>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ IMPACT QUESTION ═══ */}
      <section style={{ padding: "0 24px 96px", background: "#F7F5F1" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="fade-up impact-question-card" style={{ background: "linear-gradient(160deg,#082E2E 0%,#0D4A4A 100%)", borderRadius: 22, overflow: "hidden", position: "relative", padding: "52px 40px", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 15, color: "rgba(245,240,235,0.75)", lineHeight: 1.7, marginBottom: 16 }}>
                Isso significa que todos os dias, quando pessoas pesquisam &ldquo;{d.busca_termo}&rdquo; na sua região, você aparece na <strong style={{ color: "#FF8080", fontWeight: 700 }}>{d.posicao}ª posição</strong>. Nessa posição,
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "clamp(24px,4vw,34px)", fontWeight: 400, color: "#2DD4BF", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                quantas escolhem você?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 3: DIAGNÓSTICO COMPLETO ═══ */}
      <section id="diagnostico" style={{ padding: "96px 24px 96px", background: "#F7F5F1" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="ey">
            Diagnóstico do perfil
          </div>
          <h2 className="tt">
            O <em>porquê</em> de cada
            <br />
            resultado acima
          </h2>
          <p className="lead">
            Já vimos onde você aparece e qual sua posição. Abaixo, detalhamos <strong>item por item</strong> do seu perfil — o que está funcionando e o que <strong>precisa de atenção</strong> para subir no ranking.
          </p>

          {/* Score Gauge */}
          <div className="fade-up score-gauge-wrap" style={{ background: "white", borderRadius: 20, padding: 32, border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", display: "flex", alignItems: "center", gap: 28, marginBottom: 32 }}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#D97706" }} />
                    <stop offset="100%" style={{ stopColor: "#F59E0B" }} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(13,74,74,0.1)" strokeWidth="10" />
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
                <span style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{d.score}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>de 100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF3C7", color: "#B45309", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 20, marginBottom: 6 }}>
                ⚡ Razoável · Abaixo do potencial
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Pontuação geral do perfil</h3>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.55 }}>
                Alguns itens básicos estão preenchidos, mas faltam <strong style={{ color: "#374151" }}>configurações estratégicas</strong> que fariam o Google mostrar você <strong style={{ color: "#374151" }}>antes dos concorrentes</strong>.
              </p>
            </div>
          </div>

          {/* Checklist: Exists */}
          <div className="fade-up" style={{ background: "white", borderRadius: 20, border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "12px 18px", background: "rgba(13,74,74,0.03)", borderBottom: "1px solid rgba(13,74,74,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>ℹ️</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#157373", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preenchidos · requerem gestão contínua</span>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { item: "Horário de funcionamento", note: "precisa ser atualizado em feriados e datas especiais", badge: "Existe", color: "#157373", bg: "rgba(13,74,74,0.08)" },
                { item: `Quantidade de avaliações`, note: `${d.avaliacoes} avaliações, volume abaixo da média do segmento`, badge: "Existe", color: "#157373", bg: "rgba(13,74,74,0.08)" },
                { item: "Imagem do logotipo", note: "presente, mas sem atualização recente de fotos", badge: "Existe", color: "#157373", bg: "rgba(13,74,74,0.08)" },
                { item: "Nome, telefone e website", note: "configurados corretamente", badge: "✓ Ok", color: "#15803D", bg: "rgba(21,128,61,0.08)" },
              ].map((row, i) => (
                <div key={i} className="checklist-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(13,74,74,0.06)" : "none" }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{row.item}</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}>· {row.note}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.color, background: row.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{row.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Gaps */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#C0392B" }}>Lacunas críticas</span>
              <div style={{ flex: 1, height: 1, background: "rgba(192,57,43,0.2)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { title: "Postagens no perfil", text: <>Nenhuma postagem publicada. O Google <strong style={{ color: "#C0392B" }}>prioriza perfis ativos</strong> com publicações regulares — postagens, ofertas e novidades.</> },
                { title: "Fotos recentes do proprietário", text: <>Nenhuma foto do proprietário nos últimos 6 meses. Fotos atualizadas <strong style={{ color: "#C0392B" }}>aumentam o interesse dos clientes</strong> e a confiança no perfil.</> },
                { title: "Fotos 360°", text: <>Nenhum tour virtual ou foto 360° adicionada. Perfis com tour virtual recebem <strong style={{ color: "#C0392B" }}>o dobro de interesse</strong> dos clientes segundo o Google.</> },
              ].map((gap, i) => (
                <div key={i} className="fade-up gap-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "20px 22px", background: "white", borderRadius: 20, border: "1.5px solid rgba(13,74,74,0.1)", borderLeft: "3px solid #C0392B", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", position: "relative", overflow: "hidden" }}>
                  <div className="gap-icon" style={{ width: 34, height: 34, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#C0392B", flexShrink: 0, marginTop: 1 }}>✗</div>
                  <div style={{ flex: 1 }}>
                    <div className="gap-badge-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 14, color: "#111827" }}>{gap.title}</strong>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#C0392B", background: "#FEE2E2", padding: "2px 9px", borderRadius: 20 }}>Não preenchido</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>{gap.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Points */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B45309" }}>Pontos de melhoria</span>
              <div style={{ flex: 1, height: 1, background: "rgba(180,83,9,0.2)" }} />
            </div>
            <div className="improve-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { title: "Média de avaliações", score: "50%", text: <>{d.estrelas}★ atual. Média do segmento: {d.estrelas_media_seg}★. <strong style={{ color: "#B45309" }}>Precisa melhorar</strong> para competir.</> },
                { title: "Avaliações sem resposta", score: "50%", text: <><strong style={{ color: "#B45309" }}>{d.avaliacoes_sr} avaliações sem resposta</strong> do proprietário. Responder aumenta credibilidade e ranking.</> },
                { title: "Avaliações sem comentário", score: "50%", text: <>{d.avaliacoes_sc} avaliações sem texto. Avaliações com texto detalhado fazem o Google <strong style={{ color: "#B45309" }}>mostrar seu perfil para mais pessoas</strong>.</> },
                { title: "Vídeos no perfil", score: "50%", text: <>Nenhum vídeo adicionado. Vídeos curtos <strong style={{ color: "#B45309" }}>aumentam o tempo de visualização</strong> e a interação dos clientes com o perfil.</> },
              ].map((item, i) => (
                <div key={i} className="fade-up" style={{ padding: "18px 20px", background: "white", borderRadius: 20, border: "1.5px solid rgba(13,74,74,0.1)", borderLeft: "3px solid #D97706", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", position: "relative", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                    <strong style={{ fontSize: 13, color: "#111827", lineHeight: 1.3, flex: 1 }}>{item.title}</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 8 }}>{item.score}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
            {/* Description full-width */}
            <div className="fade-up desc-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 22px", background: "white", borderRadius: 20, border: "1.5px solid rgba(13,74,74,0.1)", borderLeft: "3px solid #D97706", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", position: "relative", overflow: "hidden" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#B45309", flexShrink: 0, marginTop: 1 }}>!</div>
              <div style={{ flex: 1 }}>
                <div className="desc-badge-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14, color: "#111827" }}>Descrição do negócio</strong>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 9px", borderRadius: 20 }}>Nota 70%</span>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>
                  Descrição atual: <strong style={{ color: "#B45309" }}>{d.descricao_chars} caracteres</strong>. Mínimo recomendado: 125. Use <strong style={{ color: "#B45309" }}>palavras-chave do segmento e da região</strong> para o Google entender seu negócio.
                </p>
              </div>
            </div>
          </div>

          {/* Compare: Você vs. Concorrente */}
          <div className="ey">
            Comparação direta
          </div>
          <h2 className="tt">
            Na prática, é isso
            <br />
            <em>que o cliente vê</em>
          </h2>
          <p className="lead">
            Todas essas lacunas ficam claras quando colocamos <strong>seu perfil ao lado de um concorrente</strong> da mesma região — {d.concorrente_nome}, que aparece no {d.concorrente_pos}:
          </p>

          <div className="fade-up" style={{ borderRadius: 22, overflow: "hidden", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)" }}>
            {/* Headers */}
            <div className="cmp-header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(13,74,74,0.06)" }}>
              <div style={{ background: "rgba(192,57,43,0.06)", padding: "14px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#C0392B", marginBottom: 2 }}>⚠️ Você · {d.nome_linha1}</p>
                <p style={{ fontSize: 10, color: "#9CA3AF" }}>Matriz · {d.cidade}, {d.estado.split(",")[1]?.trim() || "SP"}</p>
              </div>
              <div style={{ background: "rgba(21,128,61,0.05)", padding: "14px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 2 }}>✓ Concorrente direto</p>
                <p style={{ fontSize: 10, color: "#9CA3AF" }}>{d.concorrente_nome.split(" ").slice(0, 2).join(" ")} · mesma região</p>
              </div>
            </div>
            {/* Rows */}
            <div className="cmp-rows-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(13,74,74,0.06)" }}>
              <div style={{ background: "rgba(192,57,43,0.03)", padding: "0 20px" }}>
                {[
                  { label: "Avaliações", val: d.avaliacoes, color: "#C0392B" },
                  { label: "Média ★", val: d.estrelas, color: "#C0392B" },
                  { label: "Categorias", val: "1 de 3", color: "#B45309" },
                  { label: "Postagens", val: "Inativo", color: "#C0392B" },
                  { label: "Posição", val: `${d.posicao}ª de ${d.posicao_total}`, color: "#C0392B" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 4 ? "1px solid rgba(13,74,74,0.06)" : "none", fontSize: 11.5 }}>
                    <span style={{ color: "#9CA3AF" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(21,128,61,0.03)", padding: "0 20px" }}>
                {[
                  { label: "Avaliações", val: d.concorrente_aval, color: "#15803D" },
                  { label: "Média ★", val: d.concorrente_stars, color: "#15803D" },
                  { label: "Categorias", val: "3 ativas", color: "#15803D" },
                  { label: "Postagens", val: "Ativo", color: "#15803D" },
                  { label: "Posição", val: d.concorrente_pos, color: "#15803D" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 4 ? "1px solid rgba(13,74,74,0.06)" : "none", fontSize: 11.5 }}>
                    <span style={{ color: "#9CA3AF" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 4: RANKING (fundo claro) ═══ */}
      <section style={{ padding: "96px 24px 72px", background: "#F7F5F1" }}>
        <div className="wrap">
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
            <div style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 18, padding: "20px 22px", boxShadow: "0 4px 24px rgba(13,74,74,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#157373", marginBottom: 8 }}>Sua situação atual</p>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Com {d.avaliacoes} avaliações, você está <strong style={{ color: "#374151" }}>{(d.ranking[0]?.aval || 0) - parseInt(d.avaliacoes)} avaliações atrás</strong> do líder. Essa distância se reflete diretamente na posição.</p>
            </div>
            <div style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 18, padding: "20px 22px", boxShadow: "0 4px 24px rgba(13,74,74,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#157373", marginBottom: 8 }}>O que pode mudar</p>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Você não precisa alcançar o 1º lugar para ganhar visibilidade. <strong style={{ color: "#374151" }}>Entrar no top 3</strong> já muda completamente quantos clientes te encontram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 5: PLANO COMPLETO + CTA ═══ */}
      <section style={{ padding: "96px 24px 96px", background: "linear-gradient(155deg,#071E1E 0%,#0D4A4A 55%,#093535 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "20px 20px" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            A boa notícia
          </div>
          <h2 className="tt" style={{ color: "white" }}>
            Tudo o que mostramos tem solução<br />
            <em style={{ color: "#2DD4BF" }}>e ela é sob medida pro {d.nome_linha1}.</em>
          </h2>
          <p className="lead" style={{ color: "rgba(245,240,235,0.75)" }}>
            Cada lacuna do diagnóstico acima tem correção. A Arthea <strong style={{ color: "white" }}>estrutura seu perfil do zero</strong> e cuida dele todos os meses — pra te tirar da <strong style={{ color: "#FF8080" }}>{d.posicao}ª posição</strong> e te colocar onde o cliente está procurando.
          </p>

          {/* GMB note */}
          <div className="fade-up" style={{ background: "rgba(45,212,191,0.07)", border: "1px solid rgba(45,212,191,0.18)", borderRadius: 18, padding: "18px 22px", marginBottom: 48, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#2DD4BF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Google Meu Negócio não é Google Ads</p>
              <p style={{ fontSize: 13, color: "rgba(245,240,235,0.75)", lineHeight: 1.6 }}>É uma <strong style={{ color: "rgba(245,240,235,0.9)" }}>ferramenta gratuita</strong> do Google. Você não paga por clique nem faz anúncio. O trabalho da Arthea é otimizar, gerenciar e posicionar seu perfil — <strong style={{ color: "rgba(245,240,235,0.9)" }}>sem pagar por anúncios</strong>.</p>
            </div>
          </div>

          {/* 3 pilares de resultado */}
          <div className="fade-up pilares-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 48 }}>
            {[
              { icon: "🎯", title: "Aparecer no topo", text: "Subir nas buscas do Google Maps na sua região, onde estão os cliques." },
              { icon: "⭐", title: "Perfil que converte", text: "Um perfil completo e confiável que transforma quem vê em quem entra em contato." },
              { icon: "📈", title: "Presença ativa", text: "Gestão mensal pra manter — e melhorar — sua posição ao longo do tempo." },
            ].map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.05))", border: "1px solid rgba(45,212,191,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 8, letterSpacing: "-0.01em" }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(245,240,235,0.65)", lineHeight: 1.55 }}>{p.text}</p>
              </div>
            ))}
          </div>

          {/* Impact phrase */}
          <div className="fade-up impact-phrase-card" style={{ padding: "40px 36px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, color: "white", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              Quer que o próximo cliente
              <br />
              que pesquisar na sua região
              <br />
              <em style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "#2DD4BF" }}>encontre você primeiro?</em>
            </h2>
          </div>

        </div>
      </section>

      {/* ═══ SEÇÃO 6: PRÓXIMO PASSO (fundo claro) ═══ */}
      <section style={{ padding: "96px 24px 80px", background: "#F7F5F1" }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="ey">Próximo passo</div>
          <h2 className="tt">
            Preparamos planos
            <br />
            <em>feitos para o seu negócio.</em>
          </h2>
          <p className="lead">
            Veja os <strong>planos de otimização exclusivos</strong>
            <br />
            que preparamos para o {d.nome}.
          </p>
          <div className="fade-up" style={{ marginTop: 8 }}>
            <a
              href="https://propostagmn.arthea.com.br/"
              className="btn-whatsapp"
              style={{ background: "#0D4A4A", color: "#F7F5F1" }}
            >
              <span>Ver proposta completa →</span>
            </a>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "#9CA3AF", marginTop: 16 }}>Análise gratuita · Sem compromisso</p>
          </div>

          <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/analises/assets/logo-arthea.svg"
              alt="Arthea"
              style={{ height: 140, objectFit: "contain", opacity: 0.85 }}
            />
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#082E2E", padding: "28px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 10, color: "rgba(245,240,235,0.4)", letterSpacing: "0.18em", fontWeight: 600 }}>
          ARTHEA · Dados coletados por ferramenta especializada da agência · Uso exclusivo e confidencial
        </p>
      </footer>
    </div>
  );
}
