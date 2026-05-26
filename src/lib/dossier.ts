// Tipos e metadata do ClientDossier — 9 seções estruturadas.
// JSONB no banco, parseado de forma defensiva aqui.

export type DigitalPresence = {
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  gmb: string | null;
  address: string | null;
  whatsappGroup: string | null;
  driveFolder: string | null;
};

export type BrandContext = {
  description: string | null;
  values: string[];
  differentiators: string | null;
  productsServices: string[];
};

export type Voice = {
  tone: string | null;
  audience: string | null;
};

export type Market = {
  competitors: string[];
  notes: string | null;
};

export type ContactChannelKind = "whatsapp" | "email" | "telefone" | "instagram";

export type ContactChannel = {
  kind: ContactChannelKind;
  value: string | null;
};

export type Contact = {
  name: string;
  role: string | null;
  channels: ContactChannel[];
};

// Normaliza o array de channels — aceita formato antigo (string[]) ou novo
// (ContactChannel[]). Usado tanto no parser do dossier quanto na UI.
export function normalizeChannels(raw: unknown): ContactChannel[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ContactChannel | null => {
      if (typeof item === "string") {
        if (!isValidChannelKind(item)) return null;
        return { kind: item, value: null };
      }
      if (item && typeof item === "object") {
        const o = item as { kind?: unknown; value?: unknown };
        if (typeof o.kind !== "string" || !isValidChannelKind(o.kind)) return null;
        return {
          kind: o.kind,
          value: typeof o.value === "string" && o.value.trim() ? o.value.trim() : null,
        };
      }
      return null;
    })
    .filter((c): c is ContactChannel => c !== null);
}

function isValidChannelKind(s: string): s is ContactChannelKind {
  return s === "whatsapp" || s === "email" || s === "telefone" || s === "instagram";
}

// Constrói o href clicável pra cada canal. Retorna null se faltar valor.
export function channelHref(channel: ContactChannel): string | null {
  if (!channel.value) return null;
  const v = channel.value.trim();
  if (!v) return null;
  switch (channel.kind) {
    case "whatsapp": {
      // Mantém só dígitos pra wa.me. Se não tem dígitos, ignora.
      const digits = v.replace(/\D/g, "");
      return digits ? `https://wa.me/${digits}` : null;
    }
    case "email":
      return `mailto:${v}`;
    case "telefone":
      return `tel:${v.replace(/[^\d+]/g, "")}`;
    case "instagram": {
      const handle = v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
      return handle ? `https://instagram.com/${handle}` : null;
    }
    default:
      return null;
  }
}

export type Commercial = {
  monthlyValue: number | null;
  engagementType: string | null;
  startDate: string | null;
  deliveryDate: string | null;
};

export type ArchiveItem = { title: string; url: string | null };
export type Archive = {
  meetingTranscripts: ArchiveItem[];
  relevantFiles: ArchiveItem[];
  adScripts: ArchiveItem[];
};

export type PaletteColor = { name: string; hex: string };
export type LogoFile = { name: string; url: string };
export type BrandFont = {
  name: string;
  usage: string | null; // ex: "Títulos", "Corpo", "Destaque"
  url: string;
};
export type BrandManual = { name: string; url: string };
export type BrandIdentity = {
  palette: PaletteColor[];
  logos: LogoFile[];
  fonts: BrandFont[];
  manuals: BrandManual[];
};

export type Performance = {
  cpaTarget: number | null;
  minRoas: number | null;
  avgTicket: number | null;
  conversionRate: number | null;
  hourlyRate: number | null;
};

export type Dossier = {
  digitalPresence: DigitalPresence;
  brandContext: BrandContext;
  voice: Voice;
  market: Market;
  contacts: Contact[];
  commercial: Commercial;
  archive: Archive;
  brandIdentity: BrandIdentity;
  performance: Performance;
};

// Defaults seguros pra renderização — se o JSON do banco tiver campo faltando
// (e.g. dossier recém-criado pelo SQL de migração), a UI não quebra.
export const DOSSIER_DEFAULTS: Dossier = {
  digitalPresence: {
    instagram: null,
    tiktok: null,
    website: null,
    gmb: null,
    address: null,
    whatsappGroup: null,
    driveFolder: null,
  },
  brandContext: {
    description: null,
    values: [],
    differentiators: null,
    productsServices: [],
  },
  voice: { tone: null, audience: null },
  market: { competitors: [], notes: null },
  contacts: [],
  commercial: {
    monthlyValue: null,
    engagementType: null,
    startDate: null,
    deliveryDate: null,
  },
  archive: { meetingTranscripts: [], relevantFiles: [], adScripts: [] },
  brandIdentity: { palette: [], logos: [], fonts: [], manuals: [] },
  performance: {
    cpaTarget: null,
    minRoas: null,
    avgTicket: null,
    conversionRate: null,
    hourlyRate: null,
  },
};

// Parser defensivo: aceita JsonValue do Prisma e retorna Dossier completo.
export function parseDossier(raw: unknown): Dossier {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const obj = <K extends keyof Dossier>(key: K): Dossier[K] => {
    const v = r[key];
    const fallback = DOSSIER_DEFAULTS[key];
    return (v && typeof v === "object" ? { ...fallback, ...v } : fallback) as Dossier[K];
  };
  return {
    digitalPresence: obj("digitalPresence"),
    brandContext: obj("brandContext"),
    voice: obj("voice"),
    market: obj("market"),
    contacts: Array.isArray(r.contacts)
      ? r.contacts.map((c: any) => ({
          name: typeof c?.name === "string" ? c.name : "",
          role: typeof c?.role === "string" ? c.role : null,
          channels: normalizeChannels(c?.channels),
        }))
      : [],
    commercial: obj("commercial"),
    archive: obj("archive"),
    brandIdentity: obj("brandIdentity"),
    performance: obj("performance"),
  };
}

// Metadados de cada seção pra UI editorial.
export const SECTIONS = [
  {
    key: "digitalPresence" as const,
    number: "01",
    eyebrow: "Foundations",
    title: "Presença Digital",
    description: "Links e endereços públicos.",
  },
  {
    key: "brandContext" as const,
    number: "02",
    eyebrow: "Identidade",
    title: "Contexto da Marca",
    description: "Quem é o cliente, no que acredita e o que entrega.",
  },
  {
    key: "voice" as const,
    number: "03",
    eyebrow: "Voz",
    title: "Comunicação & Público",
    description: "Como o cliente fala e com quem.",
  },
  {
    key: "market" as const,
    number: "04",
    eyebrow: "Contexto",
    title: "Mercado & Extras",
    description: "Concorrentes e qualquer informação relevante.",
  },
  {
    key: "contacts" as const,
    number: "05",
    eyebrow: "Pessoas",
    title: "Contatos do Cliente",
    description: "Pessoas-chave para o relacionamento.",
  },
  {
    key: "commercial" as const,
    number: "06",
    eyebrow: "Negócio",
    title: "Informações Comerciais",
    description: "Termos do contrato e cronograma.",
  },
  {
    key: "archive" as const,
    number: "07",
    eyebrow: "Acervo",
    title: "Arquivos & Roteiros",
    description: "Transcrições, materiais e roteiros de anúncios.",
  },
  {
    key: "brandIdentity" as const,
    number: "08",
    eyebrow: "Visual",
    title: "Identidade Visual",
    description: "Cores e logos da marca.",
  },
  {
    key: "performance" as const,
    number: "09",
    eyebrow: "Performance",
    title: "Benchmark Operacional & Metas",
    description: "Indicadores que guiam a operação.",
  },
];

// Valida shape parcial vindo do body do PUT — confia em TS no client e faz
// sanitização básica no server.
export function sanitizeSectionUpdate(key: string, value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;
  // Pass-through: cada UI já valida os campos. Server só impede tipos errados.
  switch (key) {
    case "digitalPresence":
    case "brandContext":
    case "voice":
    case "market":
    case "commercial":
    case "archive":
    case "brandIdentity":
    case "performance":
      return value;
    case "contacts":
      return Array.isArray(value) ? value : undefined;
    default:
      return undefined;
  }
}
