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
            {(d.cards_metricas ?? [
              { label: "Suas avaliações", badge: "Crítico", badgeTip: "impacta diretamente sua posição", badgeColor: "#C0392B", badgeBg: "#FEE2E2", barColor: "#C0392B", valueType: "counter" as const, valueColor: "#C0392B", explain: `Pro Google, mais avaliações = mais relevante. Você tem bem menos que os primeiros (líder: ${d.lider_aval}).` },
              { label: "Sua nota média", badge: "Atenção", badgeTip: "afasta clientes antes do clique", badgeColor: "#B45309", badgeBg: "#FEF3C7", barColor: "#D97706", valueType: "stars" as const, valueColor: "#B45309", explain: `Abaixo de 4.0, muita gente descarta o perfil antes mesmo de clicar. Média do segmento: ${d.estrelas_media_seg}★.` },
              { label: "Nota do perfil", badge: "Atenção", badgeTip: "perfil incompleto perde visibilidade", badgeColor: "#B45309", badgeBg: "#FEF3C7", barColor: "#D97706", valueType: "score" as const, valueColor: "#B45309", explain: `Mede o quão completo e otimizado está seu perfil. ${d.score} mostra que há bastante a melhorar — sem postagens nem fotos recentes.` },
            ]).map((card, i) => {
              const valueProps = card.valueType === "counter"
                ? { "data-count": parseInt(d.avaliacoes), "data-from": "0" }
                : card.valueType === "stars"
                ? { "data-count-decimal": d.estrelas, "data-from": "5.0", "data-suffix": "★" }
                : {};
              const valueText = card.valueType === "counter" ? "0"
                : card.valueType === "stars" ? "5.0★"
                : null;
              return (
                <div key={i} style={{ background: "white", borderRadius: 18, padding: "24px 22px", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.barColor, borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{card.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: card.badgeColor, background: card.badgeBg, padding: "3px 10px", borderRadius: 20, cursor: "default" }} title={card.badgeTip}>{card.badge} · {card.badgeTip}</span>
                  </div>
                  <div {...valueProps} style={{ fontSize: 42, fontWeight: 800, color: card.valueColor, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 12 }}>
                    {valueText !== null ? valueText : <>{d.score}<span style={{ fontSize: 20, fontWeight: 500, color: "#9CA3AF" }}>/100</span></>}
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>{card.explain}</p>
                </div>
              );
            })}
          </div>

          {/* 72% stat */}
          <div className="fade-up stat-72-wrap" style={{ display: "flex", alignItems: "center", gap: 20, background: "#0D4A4A", borderRadius: 20, padding: "20px 28px", marginTop: 36, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <span data-count="72" data-suffix="%" data-from="0" style={{ fontSize: 44, fontWeight: 700, color: "#FAF9F6", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: 80, textAlign: "left" as const, position: "relative", zIndex: 1 }}>0%</span>
            <div style={{ textAlign: "left" as const, position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#FAF9F6", marginBottom: 3 }}>das pessoas escolhem entre os <strong>3 primeiros resultados</strong></p>
              <p style={{ fontSize: 12, color: "rgba(245,240,235,0.5)", lineHeight: 1.5 }}>Na {d.posicao}ª posição, você fica <strong style={{ color: "rgba(245,240,235,0.7)" }}>fora dessa faixa de decisão</strong>.</p>
              <p style={{ fontSize: 13, fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#2DD4BF", marginTop: 10, lineHeight: 1.5 }}>Quantas dessas pessoas você acredita que chegam até você?</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REGRA DO JOGO (escuro) ═══ */}
      <section style={{ padding: "80px 24px 88px", background: "linear-gradient(155deg,#071E1E 0%,#0D4A4A 55%,#093535 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "20px 20px" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>A regra do jogo</div>
          <h2 className="tt" style={{ color: "white" }}>
            Como o Google decide <em style={{ color: "#2DD4BF" }}>quem aparece primeiro</em>
          </h2>

          {/* 3 fatores de ranqueamento */}
          <div className="fade-up pilares-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, margin: "32px 0 40px" }}>
            {[
              { icon: "🎯", title: "Relevância", text: "Quão completo e certo está seu perfil: serviços, categorias e descrição. Quanto mais claro, melhor o Google entende pra quem te mostrar." },
              { icon: "📍", title: "Proximidade", text: "A distância entre você e quem está pesquisando. Um perfil bem configurado ajuda o Google a te posicionar na sua região." },
              { icon: "⭐", title: "Destaque", text: "Sua reputação e atividade: volume de avaliações, nota, postagens e fotos. É o que mostra ao Google que você é relevante e ativo." },
            ].map((f, i) => (
              <div key={i} className="fade-up" data-delay={i * 150} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.05))", border: "1px solid rgba(45,212,191,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(245,240,235,0.65)", lineHeight: 1.55 }}>{f.text}</p>
              </div>
            ))}
          </div>

          {/* Frase de virada */}
          <div className="fade-up" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "rgba(245,240,235,0.75)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
              Proximidade você quase não controla. Mas <strong style={{ color: "white" }}>relevância</strong> e <strong style={{ color: "white" }}>destaque</strong> dependem de como o perfil é cuidado. E é exatamente aí que <strong style={{ color: "#FF8080" }}>você está perdendo posições</strong>.
            </p>
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
            Agora que você sabe onde está e por que, vamos ao detalhe. Abaixo, analisamos <strong>cada item do seu perfil</strong> para mostrar o que já funciona e o que <strong>precisa mudar</strong> para você subir no ranking.
          </p>

          {/* Score Gauge */}
          <div className="fade-up score-gauge-wrap" style={{ background: "white", borderRadius: 24, padding: "36px 32px", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", display: "flex", alignItems: "center", gap: 28, marginBottom: 48 }}>
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
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF3C7", color: "#B45309", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>
                ⚡ Razoável · Abaixo do potencial
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Pontuação geral do perfil</h3>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                Alguns itens básicos estão preenchidos, mas faltam <strong style={{ color: "#374151" }}>configurações estratégicas</strong> que fariam o Google mostrar você <strong style={{ color: "#374151" }}>antes dos concorrentes</strong>.
              </p>
            </div>
          </div>

          {/* ── GRUPO 1: O QUE JÁ ESTÁ PREENCHIDO ── */}
          <div className="fade-up" style={{ background: "white", borderRadius: 24, border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", overflow: "hidden", marginBottom: 48 }}>
            <div style={{ padding: "18px 24px", background: "rgba(21,128,61,0.04)", borderBottom: "1px solid rgba(13,74,74,0.08)", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(21,128,61,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#15803D", display: "block", marginBottom: 3 }}>Já preenchidos</span>
                <span style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}>Existem, mas precisam de gestão contínua</span>
              </div>
            </div>
            <div style={{ padding: "8px 24px 16px" }}>
              {(d.preenchidos ?? [
                { item: "Horário de funcionamento", note: "Precisa ser atualizado em feriados e datas especiais", badge: "Existe", positive: false },
                { item: "Quantidade de avaliações", note: `${d.avaliacoes} avaliações. Volume abaixo da média do segmento`, badge: "Existe", positive: false },
                { item: "Imagem do logotipo", note: "Presente, mas sem atualização recente de fotos", badge: "Existe", positive: false },
                { item: "Nome, telefone e website", note: "Configurados corretamente", badge: "✓ Ok", positive: true },
              ]).map((row) => {
                const color = row.positive ? "#15803D" : "#157373";
                const bg = row.positive ? "rgba(21,128,61,0.08)" : "rgba(13,74,74,0.07)";
                return { ...row, color, bg };
              }).map((row, i, arr) => (
                <div key={i} className="checklist-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(13,74,74,0.06)" : "none", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, color: "#374151", fontWeight: 600, display: "block", marginBottom: 3 }}>{row.item}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{row.note}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.color, background: row.bg, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap", marginTop: 2 }}>{row.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── GRUPO 2: LACUNAS CRÍTICAS ── */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#C0392B", fontWeight: 700, flexShrink: 0 }}>✗</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#C0392B" }}>Lacunas críticas</span>
                <div style={{ flex: 1, height: 1, background: "rgba(192,57,43,0.12)" }} />
              </div>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginLeft: 38, lineHeight: 1.5 }}>Esses itens estão vazios no seu perfil e são os que mais prejudicam sua posição.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(d.lacunas ?? [
                { title: "Postagens no perfil", text: "Nenhuma postagem publicada. Seu perfil aparece como inativo para o Google." },
                { title: "Fotos recentes do proprietário", text: "Nenhuma foto do proprietário nos últimos 6 meses. O perfil passa uma impressão desatualizada." },
                { title: "Fotos 360°", text: "Nenhum tour virtual ou foto 360° adicionada. É um recurso que seus concorrentes já utilizam." },
              ]).map((gap, i) => (
                <div key={i} className="fade-up gap-card" style={{ background: "white", borderRadius: 20, border: "1.5px solid rgba(192,57,43,0.15)", borderLeft: "4px solid #C0392B", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", padding: "22px 24px" }}>
                  <div className="gap-badge-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 15, color: "#111827" }}>{gap.title}</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#C0392B", background: "#FEE2E2", padding: "3px 10px", borderRadius: 20 }}>Não preenchido</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{gap.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── GRUPO 3: PONTOS DE MELHORIA ── */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#B45309", fontWeight: 700, flexShrink: 0 }}>!</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>Pontos de melhoria</span>
                <div style={{ flex: 1, height: 1, background: "rgba(180,83,9,0.12)" }} />
              </div>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginLeft: 38, lineHeight: 1.5 }}>Esses itens existem, mas precisam de atenção para melhorar sua visibilidade.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(d.melhorias ?? [
                { title: "Média de avaliações", text: `${d.estrelas}★ atual, enquanto a média do segmento é ${d.estrelas_media_seg}★.` },
                { title: "Avaliações sem resposta", text: `${d.avaliacoes_sr} avaliações sem nenhuma resposta do proprietário.` },
                { title: "Avaliações sem comentário", text: `${d.avaliacoes_sc} avaliações sem texto. Só a nota, sem detalhes.` },
                { title: "Vídeos no perfil", text: "Nenhum vídeo adicionado ao perfil." },
                { title: "Descrição do negócio", text: `${d.descricao_chars} caracteres na descrição atual. O mínimo recomendado é 125.` },
              ]).map((item, i) => (
                <div key={i} className="fade-up" style={{ background: "white", borderRadius: 20, border: "1.5px solid rgba(180,83,9,0.15)", borderLeft: "4px solid #D97706", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 15, color: "#111827" }}>{item.title}</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "3px 10px", borderRadius: 20 }}>Precisa melhorar</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── PROVA COMPARATIVA ── */}
          <div style={{ marginBottom: 48 }}>
            <div className="ey">Prova comparativa</div>
            <h2 className="tt">
              Avaliações e atividade são o <em>fator nº 1</em>
              <br />no ranking local
            </h2>
            <p className="lead">Veja por quê:</p>

            {/* 📊 Gráfico de ranking — o tamanho da distância */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>📊 O tamanho da diferença</p>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Você tem <strong style={{ color: "#C0392B" }}>{d.avaliacoes}</strong> avaliações. Os líderes passam de <strong style={{ color: "#157373" }}>{d.lider_aval}</strong>.</p>
              </div>
              <div className="fade-up" style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 20, overflow: "hidden", textAlign: "left", boxShadow: "0 4px 20px rgba(13,74,74,0.07)" }}>
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
                  <div style={{ display: "flex", justifyContent: "center", gap: 3, padding: "3px 0" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#9ca3af", opacity: 0.35 }} />
                    ))}
                  </div>
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
            </div>

            {/* 📋 Tabela comparativa — a amplitude */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>📋 E não é só volume</p>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>Mesmo ao lado de um concorrente comum (não o líder), a diferença aparece em tudo:</p>
              </div>
              <div className="fade-up" style={{ borderRadius: 22, overflow: "hidden", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", background: "white" }}>
                <div className="cmp-header-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ background: "rgba(192,57,43,0.05)", padding: "16px 22px", borderRight: "1px solid rgba(13,74,74,0.06)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#C0392B", marginBottom: 3 }}>⚠️ Você · {d.nome_linha1}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>Matriz · {d.cidade}, {d.estado.split(",")[1]?.trim() || "SP"}</p>
                  </div>
                  <div style={{ background: "rgba(21,128,61,0.04)", padding: "16px 22px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 3 }}>✓ Concorrente direto</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{d.concorrente_nome.split(" ").slice(0, 2).join(" ")} · mesma região</p>
                  </div>
                </div>
                <div className="cmp-rows-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ background: "rgba(192,57,43,0.02)", padding: "0 22px", borderRight: "1px solid rgba(13,74,74,0.06)" }}>
                    {[
                      { label: "Categorias", val: "1 de 3", color: "#C0392B", highlight: true },
                      { label: "Postagens", val: "Inativo", color: "#C0392B", highlight: true },
                      { label: "Avaliações", val: d.avaliacoes, color: "#C0392B", highlight: false },
                      { label: "Média ★", val: d.estrelas, color: "#C0392B", highlight: false },
                      { label: "Posição", val: `${d.posicao}ª de ${d.posicao_total}`, color: "#C0392B", highlight: false },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.highlight ? "11px 22px" : "11px 0", borderBottom: i < 4 ? "1px solid rgba(13,74,74,0.06)" : "none", fontSize: 12.5, background: row.highlight ? "rgba(192,57,43,0.03)" : "transparent", margin: row.highlight ? "0 -22px" : 0 }}>
                        <span style={{ color: row.highlight ? "#374151" : "#9CA3AF", fontWeight: row.highlight ? 600 : 400 }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(21,128,61,0.02)", padding: "0 22px" }}>
                    {[
                      { label: "Categorias", val: "3 ativas", color: "#15803D", highlight: true },
                      { label: "Postagens", val: "Ativo", color: "#15803D", highlight: true },
                      { label: "Avaliações", val: d.concorrente_aval, color: "#15803D", highlight: false },
                      { label: "Média ★", val: d.concorrente_stars, color: "#15803D", highlight: false },
                      { label: "Posição", val: d.concorrente_pos, color: "#15803D", highlight: false },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.highlight ? "11px 22px" : "11px 0", borderBottom: i < 4 ? "1px solid rgba(13,74,74,0.06)" : "none", fontSize: 12.5, background: row.highlight ? "rgba(21,128,61,0.03)" : "transparent", margin: row.highlight ? "0 -22px" : 0 }}>
                        <span style={{ color: row.highlight ? "#374151" : "#9CA3AF", fontWeight: row.highlight ? 600 : 400 }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 🎯 Conclusão do diagnóstico */}
            <div className="fade-up" style={{ background: "white", border: "1.5px solid rgba(13,74,74,0.1)", borderRadius: 20, padding: "24px 28px", boxShadow: "0 4px 24px rgba(13,74,74,0.06)", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>
                Volume baixo de avaliações + perfil inativo + dados incompletos.
                <br />
                Somados, <strong style={{ color: "#C0392B" }}>é isso que te mantém na {d.posicao}ª posição</strong>.
              </p>
            </div>
          </div>

          {/* ── PONTE EMOCIONAL (fecho do diagnóstico) ── */}
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

      {/* ═══ SEÇÃO 5: SOLUÇÃO ═══ */}
      <section style={{ padding: "96px 24px 96px", background: "linear-gradient(155deg,#071E1E 0%,#0D4A4A 55%,#093535 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "20px 20px" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            A boa notícia
          </div>
          <h2 className="tt" style={{ color: "white" }}>
            Tudo o que mostramos tem solução — <em style={{ color: "#2DD4BF" }}>e a Arthea te ajuda a resolver.</em>
          </h2>
          <p className="lead" style={{ color: "rgba(245,240,235,0.75)" }}>
            Cada lacuna do diagnóstico acima tem correção. A Arthea <strong style={{ color: "white" }}>estrutura seu perfil do zero</strong> e cuida dele todos os meses. Pra te tirar da <strong style={{ color: "#FF8080" }}>{d.posicao}ª posição</strong> e te colocar onde o cliente está procurando.
          </p>

          {/* DE → PARA */}
          <div className="fade-up de-para-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "stretch", gap: 0, marginBottom: 56 }}>
            {/* Card Hoje */}
            <div style={{ background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 20, padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 16 }}>📉</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#FF8080", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hoje</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <li style={{ fontSize: 13, color: "rgba(245,240,235,0.8)", lineHeight: 1.55, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#FF8080" }}>•</span>
                  <strong style={{ color: "#FF8080" }}>{d.posicao}ª posição</strong> — 2ª página do Maps
                </li>
                <li style={{ fontSize: 13, color: "rgba(245,240,235,0.8)", lineHeight: 1.55, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#FF8080" }}>•</span>
                  Perfil <strong style={{ color: "#FF8080" }}>inativo</strong> — sem postagens nem fotos recentes
                </li>
                <li style={{ fontSize: 13, color: "rgba(245,240,235,0.8)", lineHeight: 1.55, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#FF8080" }}>•</span>
                  <strong style={{ color: "#FF8080" }}>{d.estrelas}★</strong> · <strong style={{ color: "#FF8080" }}>{d.avaliacoes}</strong> avaliações (abaixo do segmento)
                </li>
              </ul>
            </div>

            {/* Seta */}
            <div className="de-para-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
              <span style={{ fontSize: 24, color: "#2DD4BF" }}>→</span>
            </div>

            {/* Card Com a Arthea */}
            <div style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)", borderRadius: 20, padding: "28px 24px", boxShadow: "0 0 40px rgba(45,212,191,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 16 }}>📈</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: "0.1em" }}>Com a Arthea</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <li style={{ fontSize: 13, color: "rgba(245,240,235,0.8)", lineHeight: 1.55, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#2DD4BF" }}>•</span>
                  <strong style={{ color: "#2DD4BF" }}>Subindo no ranking</strong>, rumo ao topo
                </li>
                <li style={{ fontSize: 13, color: "rgba(245,240,235,0.8)", lineHeight: 1.55, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#2DD4BF" }}>•</span>
                  Perfil <strong style={{ color: "#2DD4BF" }}>ativo</strong> todos os meses
                </li>
                <li style={{ fontSize: 13, color: "rgba(245,240,235,0.8)", lineHeight: 1.55, paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#2DD4BF" }}>•</span>
                  Reputação <strong style={{ color: "#2DD4BF" }}>crescente</strong> e bem trabalhada
                </li>
              </ul>
            </div>
          </div>

          {/* 3 pilares — o como */}
          <h3 className="fade-up" style={{ fontSize: "clamp(18px,2.5vw,22px)", fontWeight: 700, color: "white", textAlign: "center", marginBottom: 24, lineHeight: 1.3 }}>
            Nossa missão é fazer o seu negócio<br />
            <em style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "#2DD4BF" }}>ser encontrado, escolhido e lembrado.</em>
          </h3>
          <div className="pilares-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 56 }}>
            {[
              { icon: "🎯", tag: "Encontrado", title: "Aparecer no topo", text: "Subimos seu perfil nas buscas do Maps, na sua região, onde estão os cliques.", delay: 0 },
              { icon: "⭐", tag: "Escolhido", title: "Perfil que converte", text: "Perfil completo e confiável que transforma quem vê em quem entra em contato.", delay: 150 },
              { icon: "📈", tag: "Lembrado", title: "Presença ativa", text: "Gestão mensal pra manter e melhorar sua posição ao longo do tempo.", delay: 300 },
            ].map((p, i) => (
              <div key={i} className="fade-up" data-delay={p.delay} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 22px", textAlign: "center", transition: "background .2s, border-color .2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,212,191,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#2DD4BF", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)", borderRadius: 50, padding: "4px 12px", marginBottom: 14 }}>{p.tag}</span>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #0D4A4A, #157373)", border: "1px solid rgba(45,212,191,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px", boxShadow: "0 4px 16px rgba(13,74,74,0.3)" }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 10, letterSpacing: "-0.01em" }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(245,240,235,0.65)", lineHeight: 1.6 }}>{p.text}</p>
              </div>
            ))}
          </div>

          {/* Impact phrase — fecho da seção */}
          <div className="fade-up impact-phrase-card" style={{ padding: "40px 36px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(20px,3.5vw,32px)", fontWeight: 700, color: "white", lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: 14 }}>
              Quer que o próximo cliente
              <br />
              que pesquisar na sua região
              <br />
              <em style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "#2DD4BF" }}>encontre você primeiro?</em>
            </h2>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(245,240,235,0.35)" }}>Veja o que preparamos abaixo</p>
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
          </div>

          <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/analises/assets/logo-escura.png"
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
