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
  initHeatmapObserver,
  initSerpRowsObserver,
} from "./animations";
import "./analise.css";

interface Props {
  data: ClienteData;
}

const HEATMAP_GRID = [
  ["h2","h3","h4","h3","h2","h1","h0"],
  ["h3","h5","h5","h4","h3","h2","h1"],
  ["h2","h4","hy","h5","h4","h2","h1"],
  ["h1","h3","h4","h3","h2","h1","h0"],
  ["h0","h1","h2","h1","h0","h0","h0"],
];

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
    const obs7 = initHeatmapObserver();
    const obs8 = initSerpRowsObserver();
    return () => {
      obs1?.disconnect();
      obs2?.forEach((o) => o.disconnect());
      obs3?.forEach((o) => o.disconnect());
      obs4?.disconnect();
      obs5?.disconnect();
      obs6?.disconnect();
      obs7?.disconnect();
      obs8?.forEach((o) => o.disconnect());
    };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAF9F6", color: "#111827" }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        background: "rgba(21,115,115,0.25)",
        borderBottom: "1px solid rgba(45,212,191,0.1)",
      }}>
        <Image
          src="/analises/assets/logo-arthea-oficial.png"
          alt="Arthea"
          width={120}
          height={40}
          style={{ height: 36, width: "auto", objectFit: "contain", opacity: 0.85 }}
          priority
        />
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(245,240,235,0.4)" }}>
          Diagnóstico de presença digital
        </span>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-body" style={{ paddingTop: 100 }}>
          {/* Google G + Pin */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 50, padding: "8px 20px", marginBottom: 28 }}>
            <span style={{ fontSize: 22, fontWeight: 700 }}>
              <span style={{ color: "#4285f4" }}>G</span>
              <span style={{ color: "#ea4335" }}>o</span>
              <span style={{ color: "#fbbc05" }}>o</span>
              <span style={{ color: "#4285f4" }}>g</span>
              <span style={{ color: "#34a853" }}>l</span>
              <span style={{ color: "#ea4335" }}>e</span>
            </span>
            <span style={{ fontSize: 14, color: "rgba(245,240,235,0.6)", fontWeight: 500 }}>📍 Buscas locais</span>
          </div>

          {/* Título principal com serifa */}
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px,5vw,42px)",
            fontWeight: 700,
            lineHeight: 1.25,
            maxWidth: 540,
            margin: "0 auto 16px",
            letterSpacing: "-0.02em",
          }}>
            <span style={{ color: "rgba(245,240,235,0.95)" }}>Análise exclusiva do seu</span>
            <br />
            <span style={{ color: "rgba(245,240,235,0.95)" }}>negócio no </span>
            <em style={{ color: "#2DD4BF", fontStyle: "italic" }}>Google.</em>
          </h2>

          <p style={{ fontSize: 14, color: "rgba(245,240,235,0.45)", marginBottom: 40, letterSpacing: "0.08em", fontWeight: 500 }}>
            por Arthea · assessoria de marketing intencional
          </p>

          <div className="hero-eyebrow" style={{ textAlign: "left", fontSize: 13 }}>Diagnóstico completo para</div>
          <h1 className="hero-h1" style={{ textAlign: "left" }}>
            {d.nome_linha1}
            <br />
            {d.nome_linha2}
          </h1>
          <div className="hero-client" style={{ textAlign: "left" }}>
            {d.cidade} · {d.estado} · {d.segmento}
          </div>
          <a href="#diagnostico" className="hero-cta">
            Ver minha análise completa ↓
          </a>
        </div>
        <div className="scroll-hint">
          <span>Role para ver</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══ SEÇÃO 1: ENTENDENDO O CENÁRIO ═══ */}
      <section style={{ padding: "88px 24px 72px", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div className="ey">Entendendo o cenário</div>
          <h2 className="tt" style={{ fontSize: "clamp(28px,4.5vw,46px)" }}>
            O Google Meu Negócio decide quem aparece primeiro
            <br />
            <em>e quem fica invisível.</em>
          </h2>
          <p className="lead">
            Quando alguém pesquisa um serviço ou produto na sua cidade ou região, os primeiros resultados são perfis do
            Google Meu Negócio. É ali que o cliente decide com quem vai falar antes de visitar qualquer site ou
            estabelecimento.
          </p>

          {/* 4 cards */}
          <div className="fade-up cards-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 48, textAlign: "left" }}>
            {[
              { n: "01", icon: "👁️", title: "Primeira impressão antes de qualquer contato", text: "O perfil aparece com fotos, avaliações e localização antes mesmo de o cliente visitar seu site." },
              { n: "02", icon: "⭐", title: "Avaliações decidem quem é escolhido", text: "Volume, qualidade e frequência das avaliações influenciam diretamente a posição no ranking local." },
              { n: "03", icon: "📍", title: "Buscas locais crescem 136% ao ano", text: 'Pesquisas como "perto de mim" ou "na minha região" já são maioria no Google Maps e na busca local.' },
              { n: "04", icon: "📞", title: "Contato direto, sem etapas extras", text: "O cliente liga, pede rota ou acessa o site direto do perfil — sem passar por landing pages ou formulários." },
            ].map((c) => (
              <div
                key={c.n}
                style={{
                  background: "white",
                  borderRadius: 20,
                  padding: 24,
                  border: "1.5px solid rgba(13,74,74,0.1)",
                  boxShadow: "0 4px 20px rgba(13,74,74,0.07)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#157373,#2DD4BF)", borderRadius: "16px 16px 0 0" }} />
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(13,74,74,0.06)", color: "#157373", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", padding: "3px 9px", borderRadius: 20, marginBottom: 10 }}>
                  {c.n}
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{c.title}</h4>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{c.text}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(13,74,74,0.08)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9CA3AF" }}>O comportamento do seu cliente</span>
            <div style={{ flex: 1, height: 1, background: "rgba(13,74,74,0.08)" }} />
          </div>

          {/* 3 Stats */}
          <div className="fade-up stat-cards-col" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="stat-card-inner" style={{ display: "flex", alignItems: "center", gap: 20, background: "white", borderRadius: 20, padding: "20px 24px", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 20px rgba(13,74,74,0.07)" }}>
              <span data-count="82" data-suffix="%" data-from="0" style={{ fontSize: 40, fontWeight: 700, color: "#157373", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: 80, textAlign: "left" as const }}>0%</span>
              <div style={{ textAlign: "left" as const }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>pesquisam online antes de contratar</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Pesquisa Google/IBOPE 2023 — comportamento de decisão para serviços locais.</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(21,115,115,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>🔍</div>
            </div>

            <div className="stat-card-inner" style={{ display: "flex", alignItems: "center", gap: 20, background: "#0D4A4A", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 20px rgba(13,74,74,0.2)" }}>
              <span data-count="72" data-suffix="%" data-from="0" style={{ fontSize: 40, fontWeight: 700, color: "#FAF9F6", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: 80, textAlign: "left" as const }}>0%</span>
              <div style={{ textAlign: "left" as const }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#FAF9F6", marginBottom: 3 }}>escolhem entre os 3 primeiros resultados</p>
                <p style={{ fontSize: 12, color: "rgba(245,240,235,0.55)", lineHeight: 1.5 }}>BrightLocal 2024 — taxa de clique em resultados do Google Maps e busca local.</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>📊</div>
            </div>

            <div className="stat-card-inner" style={{ display: "flex", alignItems: "center", gap: 20, background: "white", borderRadius: 20, padding: "20px 24px", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 20px rgba(13,74,74,0.07)" }}>
              <span data-count="68" data-suffix="%" data-from="0" style={{ fontSize: 40, fontWeight: 700, color: "#157373", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, minWidth: 80, textAlign: "left" as const }}>0%</span>
              <div style={{ textAlign: "left" as const }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>visitam o estabelecimento após ver o perfil</p>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Google Think Insights — taxa de conversão local para perfis otimizados.</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(21,115,115,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>⭐</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 2: IMPACTO REAL ═══ */}
      <section style={{ padding: "88px 24px", background: "#FAF9F6" }}>
        <div className="wrap">
          <div className="ey">O impacto real</div>
          <h2 className="tt">
            Enquanto você lê isso,
            <br />
            clientes estão escolhendo
            <br />
            <em>o concorrente.</em>
          </h2>
          <p className="lead">Não porque ele é melhor. Porque o perfil dele aparece primeiro — e o Google Meu Negócio já entregou nome, avaliações, fotos e localização antes de qualquer clique.</p>

          {/* SERP Mock */}
          <div className="fade-up" style={{ marginBottom: 32 }}>
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
                {/* 1º */}
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
                {/* 2º */}
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
                {/* Gap */}
                <div className="sr-gap">··· mais {gapCount} {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"} antes de você ···</div>
                {/* You */}
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
              <div className="serp-cap">Como você aparece hoje nas buscas locais</div>
            </div>
          </div>

          {/* +N Card */}
          <div className="fade-up" style={{ background: "#0D4A4A", borderRadius: 20, padding: 40, marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "clamp(64px,10vw,88px)", fontWeight: 700, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  +{impactoNum - posNum + 1 > 0 ? posNum - 1 : impactoNum}
                </span>
                <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2DD4BF", marginTop: 4 }}>
                  {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 16, color: "rgba(245,240,235,0.75)", lineHeight: 1.6, marginBottom: 10 }}>
                  aparecem <strong style={{ color: "white", fontWeight: 700 }}>antes de você</strong> quando alguém pesquisa na sua região.
                </p>
                <p style={{ fontSize: 13, color: "rgba(245,240,235,0.45)", lineHeight: 1.55 }}>
                  Cada busca que não te encontra é um cliente que vai para o concorrente — e nem sabe que você existe.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="fade-up loss-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 0 }}>
            {/* Position */}
            <div style={{ background: "white", borderRadius: 20, padding: "20px 22px", border: "1.5px solid rgba(192,57,43,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C0392B", borderRadius: "16px 16px 0 0" }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", display: "block", marginBottom: 6 }}>Posição no ranking</span>
              <div data-count={posNum} data-suffix="ª" data-from="1" style={{ fontSize: 40, fontWeight: 700, color: "#C0392B", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>1ª</div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{d.posicao}ª de {d.posicao_total} {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"} na região. Os 3 primeiros concentram 72% dos cliques.</p>
            </div>
            {/* Leader */}
            <div style={{ background: "white", borderRadius: 20, padding: "20px 22px", border: "1.5px solid rgba(13,74,74,0.12)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#157373,#2DD4BF)", borderRadius: "16px 16px 0 0" }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", display: "block", marginBottom: 6 }}>Líder do segmento</span>
              <div data-count={d.ranking[0]?.aval || 0} data-from="0" data-formatted={d.lider_aval} style={{ fontSize: 40, fontWeight: 700, color: "#157373", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>0</div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>avaliações. Você tem {d.avaliacoes}.</p>
            </div>
            {/* Stars */}
            <div style={{ background: "white", borderRadius: 20, padding: "20px 22px", border: "1.5px solid rgba(192,57,43,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C0392B", borderRadius: "16px 16px 0 0" }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", display: "block", marginBottom: 6 }}>Sua média de estrelas</span>
              <div data-count-decimal={d.estrelas} data-from="5.0" data-suffix="★" style={{ fontSize: 40, fontWeight: 700, color: "#C0392B", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>5.0★</div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Concorrente direto tem {d.concorrente_stars}★. Média do segmento: {d.estrelas_media_seg}★.</p>
            </div>
            {/* Score */}
            <div style={{ background: "white", borderRadius: 20, padding: "20px 22px", border: "1.5px solid rgba(201,122,6,0.2)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C97A06", borderRadius: "16px 16px 0 0" }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9CA3AF", display: "block", marginBottom: 6 }}>Nota do perfil</span>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#C97A06", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>{d.score}/100</div>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Nota {d.score}/100. Postagens e fotos zeradas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ IMPACT QUESTION ═══ */}
      <section style={{ padding: "0 24px 72px", background: "#FAF9F6" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="fade-up" style={{ background: "#0D4A4A", borderRadius: 20, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "18px 18px" }} />
            <div style={{ padding: "28px 36px 0", position: "relative", zIndex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,212,191,0.65)" }}>O que isso significa na prática</p>
            </div>
            <div style={{ height: 1, background: "rgba(45,212,191,0.1)", margin: "20px 36px", position: "relative", zIndex: 1 }} />
            <div style={{ padding: "0 36px 36px", position: "relative", zIndex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 15, color: "rgba(245,240,235,0.65)", lineHeight: 1.7, marginBottom: 16 }}>
                Se 10 pessoas pesquisam &ldquo;{d.busca_termo}&rdquo; por dia e você aparece na{" "}
                <strong style={{ color: "#FF8080" }}>posição {d.posicao}ª</strong>...
              </p>
              <p style={{ fontSize: "clamp(22px,3.5vw,30px)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                Quantas delas chegam
                <br />
                até você?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 3: RANKING + HEATMAP ═══ */}
      <section style={{ padding: "72px 24px", background: "linear-gradient(160deg,#082E2E 0%,#0D4A4A 45%,#0A3A3A 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 0)", backgroundSize: "20px 20px" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(45,212,191,0.4)" }} />
            Onde você está
          </div>
          <h2 className="tt" style={{ color: "white" }}>
            Ranking de <em style={{ color: "#2DD4BF" }}>avaliações</em>
            <br />
            na sua região
          </h2>
          <p className="lead" style={{ color: "rgba(245,240,235,0.6)" }}>
            Avaliações são o fator nº 1 do ranking local. Veja como você se compara aos líderes do segmento em {d.cidade}.
          </p>

          {/* Ranking Chart */}
          <div className="fade-up" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, overflow: "hidden", marginBottom: 24, textAlign: "left" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "rgba(245,240,235,0.9)" }}>
                {d.segmento === "Escritório de Advocacia" ? "Escritórios de advocacia" : d.segmento} — {d.estado.split(",")[0]}
              </h4>
              <span style={{ fontSize: 11, color: "rgba(245,240,235,0.4)", fontWeight: 600 }}>{d.posicao_total} perfis analisados</span>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {d.ranking.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, fontSize: 10, fontWeight: 700, color: "rgba(245,240,235,0.4)", textAlign: "right", flexShrink: 0 }}>{r.pos}</span>
                  <span style={{ fontSize: 12, width: 130, flexShrink: 0, fontWeight: 600, color: "rgba(245,240,235,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nome}</span>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 22, overflow: "hidden" }}>
                    <div className="rank-bar" data-width={r.pct} style={{ background: "linear-gradient(90deg,rgba(45,212,191,0.8),rgba(45,212,191,0.35))" }}>
                      {r.aval.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
              {/* Dots separator */}
              <div style={{ display: "flex", justifyContent: "center", gap: 3, padding: "3px 0" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#9ca3af", opacity: 0.25 }} />
                ))}
              </div>
              {/* You */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 24, fontSize: 10, fontWeight: 700, color: "#FF8080", textAlign: "right", flexShrink: 0 }}>{d.posicao}º</span>
                <span style={{ fontSize: 12, width: 130, flexShrink: 0, fontWeight: 700, color: "#FF8080", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.nome_linha1}</span>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 22, overflow: "hidden" }}>
                  <div className="rank-bar" data-width={youPct} data-you="true" style={{ background: "#E74C3C", transition: "width 1.8s cubic-bezier(0.4,0,0.2,1) 0.8s" }}>
                    {parseInt(d.avaliacoes).toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Context cards */}
          <div className="fade-up ranking-context-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 52, textAlign: "left" }}>
            <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: "20px 22px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,212,191,0.75)", marginBottom: 8 }}>Por que avaliações importam</p>
              <p style={{ fontSize: 13, color: "rgba(245,240,235,0.6)", lineHeight: 1.6 }}>O Google usa volume e qualidade das avaliações para rankear perfis locais. Mais avaliações = mais visibilidade = mais clientes.</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: "20px 22px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,212,191,0.75)", marginBottom: 8 }}>O que a posição {d.posicao}ª significa</p>
              <p style={{ fontSize: 13, color: "rgba(245,240,235,0.6)", lineHeight: 1.6 }}>72% dos cliques vão para os 3 primeiros resultados. Na posição {d.posicao}ª, seu perfil é praticamente invisível nas buscas.</p>
            </div>
          </div>

          {/* Heatmap */}
          <div className="ey" style={{ color: "rgba(45,212,191,0.7)" }}>
            <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(45,212,191,0.4)" }} />
            Mapa de presença
          </div>
          <h2 className="tt" style={{ color: "white", marginBottom: 32 }}>
            Sua <em style={{ color: "#2DD4BF" }}>visibilidade</em> no mapa
          </h2>

          <div className="fade-up" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "rgba(245,240,235,0.9)" }}>&ldquo;{d.busca_termo_longo}&rdquo;</h4>
              <p style={{ fontSize: 11, color: "rgba(245,240,235,0.4)", marginTop: 3 }}>Análise de visibilidade por área · região do {d.cidade}</p>
            </div>
            <div className="hmap-grid">
              {HEATMAP_GRID.flat().map((cls, i) => (
                <div key={i} className={`hc ${cls}`} />
              ))}
            </div>
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 10, color: "rgba(245,240,235,0.4)", fontWeight: 600, whiteSpace: "nowrap" }}>Pouca visibilidade</span>
              <div style={{ display: "flex", gap: 3, flex: 1 }}>
                <div style={{ flex: 1, height: 7, borderRadius: 2, background: "#D5DDD6", opacity: 0.5 }} />
                <div style={{ flex: 1, height: 7, borderRadius: 2, background: "#A8D5B5", opacity: 0.7 }} />
                <div style={{ flex: 1, height: 7, borderRadius: 2, background: "#3DAD64", opacity: 0.85 }} />
                <div style={{ flex: 1, height: 7, borderRadius: 2, background: "#0F6B3A" }} />
              </div>
              <span style={{ fontSize: 10, color: "rgba(245,240,235,0.4)", fontWeight: 600, whiteSpace: "nowrap" }}>Alta visibilidade</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#C0392B" }} />
                <span style={{ fontSize: 10, color: "rgba(245,240,235,0.4)", fontWeight: 600 }}>Você</span>
              </div>
            </div>
            {/* Red alert */}
            <div style={{ background: "rgba(192,57,43,0.15)", borderTop: "1px solid rgba(192,57,43,0.25)", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span>🔴</span>
              <p style={{ fontSize: 12, color: "#FF8080", fontWeight: 600, lineHeight: 1.45 }}>
                Você está cercado de concorrentes bem posicionados. Mesmo quem pesquisa perto de você encontra outros perfis antes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEÇÃO 4: DIAGNÓSTICO ═══ */}
      <section id="diagnostico" style={{ padding: "96px 24px 104px", background: "#FAF9F6", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="ey">Diagnóstico do perfil</div>
          <h2 className="tt">
            Raio-X completo
            <br />
            <em>do seu Google Meu Negócio</em>
          </h2>
          <p className="lead">
            Analisamos cada item do seu perfil e comparamos com o que o Google exige para um bom posicionamento.
          </p>

          {/* Score Gauge */}
          <div className="fade-up" style={{ background: "white", borderRadius: 20, padding: 32, border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 20px rgba(13,74,74,0.07)", display: "flex", alignItems: "center", gap: 28, marginBottom: 32 }}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#D97706" }} />
                    <stop offset="100%" style={{ stopColor: "#F59E0B" }} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(13,74,74,0.08)" strokeWidth="10" />
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
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF3C7", color: "#C97A06", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 20, marginBottom: 6 }}>
                ⚡ Razoável · Abaixo do potencial
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Pontuação geral do perfil</h3>
              <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.55 }}>
                Alguns itens básicos estão preenchidos, mas faltam configurações estratégicas que fariam o Google mostrar você antes dos concorrentes.
              </p>
            </div>
          </div>

          {/* Checklist: Exists */}
          <div className="fade-up" style={{ background: "white", borderRadius: 20, border: "1.5px solid rgba(13,74,74,0.15)", overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "12px 18px", background: "rgba(21,115,115,0.07)", borderBottom: "1.5px solid rgba(13,74,74,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>ℹ️</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#157373", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preenchidos · requerem gestão contínua</span>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { item: "Horário de funcionamento", note: "precisa ser atualizado em feriados e datas especiais", badge: "Existe", color: "#157373", bg: "rgba(21,115,115,0.08)" },
                { item: `Quantidade de avaliações`, note: `${d.avaliacoes} avaliações, volume abaixo da média do segmento`, badge: "Existe", color: "#157373", bg: "rgba(21,115,115,0.08)" },
                { item: "Imagem do logotipo", note: "presente, mas sem atualização recente de fotos", badge: "Existe", color: "#157373", bg: "rgba(21,115,115,0.08)" },
                { item: "Nome, telefone e website", note: "configurados corretamente", badge: "✓ Ok", color: "#15803D", bg: "#DCFCE7" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(13,74,74,0.05)" : "none" }}>
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
              <div style={{ flex: 1, height: 1, background: "rgba(192,57,43,0.15)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { title: "Postagens no perfil", text: "Nenhuma postagem publicada. O Google prioriza perfis ativos com publicações regulares — postagens, ofertas e novidades." },
                { title: "Fotos recentes do proprietário", text: "Nenhuma foto do proprietário nos últimos 6 meses. Fotos atualizadas aumentam o interesse dos clientes e a confiança no perfil." },
                { title: "Fotos 360°", text: "Nenhum tour virtual ou foto 360° adicionada. Perfis com tour virtual recebem o dobro de interesse dos clientes segundo o Google." },
              ].map((gap, i) => (
                <div key={i} className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "20px 22px", background: "white", borderRadius: 20, border: "2px solid rgba(192,57,43,0.15)", boxShadow: "0 4px 20px rgba(192,57,43,0.06)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C0392B", borderRadius: "16px 16px 0 0" }} />
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#C0392B", flexShrink: 0, marginTop: 1 }}>✗</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
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
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#C97A06" }}>Pontos de melhoria</span>
              <div style={{ flex: 1, height: 1, background: "rgba(201,122,6,0.15)" }} />
            </div>
            <div className="improve-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { title: "Média de avaliações", score: "50%", text: `${d.estrelas}★ atual. Média do segmento: ${d.estrelas_media_seg}★. Precisa melhorar para competir.` },
                { title: "Avaliações sem resposta", score: "50%", text: `${d.avaliacoes_sr} avaliações sem resposta do proprietário. Responder aumenta credibilidade e ranking.` },
                { title: "Avaliações sem comentário", score: "50%", text: `${d.avaliacoes_sc} avaliações sem texto. Avaliações com texto detalhado fazem o Google mostrar seu perfil para mais pessoas.` },
                { title: "Vídeos no perfil", score: "50%", text: "Nenhum vídeo adicionado. Vídeos curtos aumentam o tempo de visualização e a interação dos clientes com o perfil." },
              ].map((item, i) => (
                <div key={i} className="fade-up" style={{ padding: "18px 20px", background: "white", borderRadius: 20, border: "1.5px solid rgba(201,122,6,0.2)", boxShadow: "0 2px 12px rgba(201,122,6,0.05)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#C97A06", borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                    <strong style={{ fontSize: 13, color: "#111827", lineHeight: 1.3, flex: 1 }}>{item.title}</strong>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#C97A06", background: "#FEF3C7", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 8 }}>{item.score}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
            {/* Description full-width */}
            <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 22px", background: "white", borderRadius: 20, border: "1.5px solid rgba(201,122,6,0.15)", boxShadow: "0 2px 12px rgba(201,122,6,0.05)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#C97A06,#F59E0B)", borderRadius: "16px 16px 0 0" }} />
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#C97A06", flexShrink: 0, marginTop: 1 }}>!</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14, color: "#111827" }}>Descrição do negócio</strong>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#C97A06", background: "#FEF3C7", padding: "2px 9px", borderRadius: 20 }}>Nota 70%</span>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>
                  Descrição atual: {d.descricao_chars} caracteres. Mínimo recomendado: 125. Use palavras-chave do segmento e da região para o Google entender seu negócio.
                </p>
              </div>
            </div>
          </div>

          {/* Compare: Você vs. Concorrente */}
          <div className="ey">Você vs. concorrente direto</div>
          <h2 className="tt">
            O que o cliente vê
            <br />
            <em>quando compara os dois perfis</em>
          </h2>
          <p className="lead">
            {d.concorrente_nome}. Mesma região. Mesmo segmento. Aparece no {d.concorrente_pos}.
          </p>

          <div className="fade-up" style={{ borderRadius: 22, overflow: "hidden", border: "1.5px solid rgba(13,74,74,0.1)", boxShadow: "0 4px 20px rgba(13,74,74,0.07)", marginBottom: 24 }}>
            {/* Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(13,74,74,0.08)" }}>
              <div style={{ background: "#FEE2E2", padding: "14px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#C0392B", marginBottom: 2 }}>⚠️ Você · {d.nome_linha1}</p>
                <p style={{ fontSize: 10, color: "#9CA3AF" }}>Matriz · {d.cidade}, {d.estado.split(",")[1]?.trim() || "SP"}</p>
              </div>
              <div style={{ background: "#DCFCE7", padding: "14px 20px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 2 }}>✓ Concorrente direto</p>
                <p style={{ fontSize: 10, color: "#9CA3AF" }}>{d.concorrente_nome.split(" ").slice(0, 2).join(" ")} · mesma região</p>
              </div>
            </div>
            {/* Rows */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "rgba(13,74,74,0.06)" }}>
              <div style={{ background: "white", padding: "0 20px" }}>
                {[
                  { label: "Avaliações", val: d.avaliacoes, color: "#C0392B" },
                  { label: "Média ★", val: d.estrelas, color: "#C0392B" },
                  { label: "Categorias", val: "1 de 3", color: "#C97A06" },
                  { label: "Postagens", val: "Inativo", color: "#C0392B" },
                  { label: "Posição", val: `${d.posicao}ª de ${d.posicao_total}`, color: "#C0392B" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 4 ? "1px solid rgba(13,74,74,0.05)" : "none", fontSize: 11.5 }}>
                    <span style={{ color: "#6B7280" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "white", padding: "0 20px" }}>
                {[
                  { label: "Avaliações", val: d.concorrente_aval, color: "#15803D" },
                  { label: "Média ★", val: d.concorrente_stars, color: "#15803D" },
                  { label: "Categorias", val: "3 ativas", color: "#15803D" },
                  { label: "Postagens", val: "Ativo", color: "#15803D" },
                  { label: "Posição", val: d.concorrente_pos, color: "#15803D" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 4 ? "1px solid rgba(13,74,74,0.05)" : "none", fontSize: 11.5 }}>
                    <span style={{ color: "#6B7280" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "white", borderRadius: 13, padding: "15px 16px", borderLeft: "3.5px solid #C0392B", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🔴</span>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Posição {d.posicao}ª de {d.posicao_total} {d.segmento.toLowerCase().includes("advoc") ? "escritórios" : "negócios"}</h4>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Os 3 primeiros resultados concentram 72% dos cliques. Quem aparece depois praticamente não é visto pelo cliente.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "white", borderRadius: 13, padding: "15px 16px", borderLeft: "3.5px solid #C0392B", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🔴</span>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Postagens: 0 · Fotos recentes: 0</h4>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Nenhuma atividade nos dois itens. O Google interpreta isso como um perfil abandonado — e reduz sua visibilidade automaticamente.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "white", borderRadius: 13, padding: "15px 16px", borderLeft: "3.5px solid #C97A06", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🟡</span>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Avaliações: {d.avaliacoes} · Média: {d.estrelas}★</h4>
                <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>Concorrente direto: {d.concorrente_aval} avaliações · média {d.concorrente_stars}★. Diferença significativa em volume e qualidade.</p>
              </div>
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
            Um processo testado e comprovado que já transformou a presença local de dezenas de negócios.
          </p>

          {/* GMB note */}
          <div className="fade-up" style={{ background: "rgba(45,212,191,0.07)", border: "1px solid rgba(45,212,191,0.18)", borderRadius: 18, padding: "18px 22px", marginBottom: 60, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#2DD4BF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Google Meu Negócio não é Google Ads</p>
              <p style={{ fontSize: 13, color: "rgba(245,240,235,0.6)", lineHeight: 1.6 }}>É uma ferramenta gratuita do Google. Você não paga por clique nem faz anúncio. O trabalho da Arthea é otimizar, gerenciar e posicionar seu perfil — sem pagar por anúncios.</p>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 25, top: 52, bottom: 52, width: 1.5, background: "linear-gradient(to bottom,rgba(45,212,191,0.35),rgba(45,212,191,0.04))" }} />
            {[
              {
                n: 1,
                delay: 0,
                tag: "Primeiros dias",
                badge: "Imersão",
                title: "Imersão no negócio e estratégia completa",
                text: "Entendemos seu mercado, seus diferenciais, seus concorrentes diretos e a região de atuação. O plano de ação é feito sob medida.",
                active: true,
              },
              {
                n: 2,
                delay: 150,
                tag: "Semana 2",
                badge: "Otimização",
                title: "Perfil configurado estrategicamente",
                text: `Todas as categorias, atributos, descrição otimizada, fotos profissionais e configurações avançadas. Nota de ${d.score} para 85+ em semanas.`,
                active: false,
              },
              {
                n: 3,
                delay: 300,
                tag: "Meses 1 e 2",
                badge: "Gestão mensal inclusa",
                title: "Estratégia de avaliações e acompanhamento contínuo",
                text: "Implementamos processo para obter avaliações reais, respondemos cada uma estrategicamente e publicamos conteúdo regular no perfil.",
                active: false,
              },
              {
                n: 4,
                delay: 450,
                tag: "A partir do mês 3",
                badge: "Gestão mensal",
                title: "Perfil sempre ativo, sempre bem posicionado",
                text: "Monitoramento de ranking, relatórios mensais, ajustes de estratégia e gestão completa do perfil — você não precisa fazer nada.",
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
          <div className="fade-up" style={{ marginTop: 72, padding: "52px 40px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, textAlign: "center" }}>
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
              Preparamos planos de otimização exclusivos
              <br />
              para o {d.nome}.
            </p>
            <a
              href="https://arthea.com.br/gmb"
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
