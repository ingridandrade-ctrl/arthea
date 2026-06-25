export interface RankingItem {
  pos: string;
  nome: string;
  aval: number;
  pct: number;
}

export interface PreenchidoItem {
  item: string;
  note: string;
  badge: string;
  positive?: boolean;
}

export interface DiagnosticoItem {
  title: string;
  text: string;
}

export interface CardMetrica {
  label: string;
  badge: string;
  badgeTip: string;
  badgeColor: string;
  badgeBg: string;
  barColor: string;
  valueType: "counter" | "stars" | "score";
  valueColor: string;
  explain: string;
}

export interface ClienteData {
  nome: string;
  nome_linha1: string;
  nome_linha2: string;
  cidade: string;
  estado: string;
  segmento: string;
  busca_termo: string;
  busca_termo_longo: string;
  data_analise: string;
  posicao: string;
  posicao_total: string;
  score: string;
  avaliacoes: string;
  estrelas: string;
  concorrente_nome: string;
  concorrente_aval: string;
  concorrente_stars: string;
  concorrente_pos: string;
  lider_nome: string;
  lider_aval: string;
  lider_stars: string;
  segundo_nome: string;
  segundo_aval: string;
  segundo_stars: string;
  avaliacoes_sr: string;
  avaliacoes_sc: string;
  descricao_chars: string;
  estrelas_media_seg: string;
  ranking: RankingItem[];
  preenchidos?: PreenchidoItem[];
  lacunas?: DiagnosticoItem[];
  melhorias?: DiagnosticoItem[];
  cards_metricas?: CardMetrica[];
}
