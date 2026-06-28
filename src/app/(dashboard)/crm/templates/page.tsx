"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Check, X, Search, Copy, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FilterDropdown } from "@/components/crm/filter-dropdown";

const VARIABLES = [
  { key: "{{nome}}", label: "Nome do lead" },
  { key: "{{empresa}}", label: "Empresa" },
  { key: "{{telefone}}", label: "Telefone" },
  { key: "{{email}}", label: "Email" },
  { key: "{{servico}}", label: "Serviço" },
  { key: "{{segmento}}", label: "Segmento" },
  { key: "{{cidadeEstado}}", label: "Cidade/Estado" },
  { key: "{{linkAnalise}}", label: "Link da análise" },
];

interface Template {
  id: string;
  code: string | null;
  name: string;
  serviceId: string | null;
  messageTemplate: string;
  isActive: boolean;
  service: { id: string; name: string; slug: string; color: string } | null;
  metaName?: string | null;
  metaCategory?: string | null;
  metaLanguage?: string;
  metaStatus?: string | null;
  metaRejectionReason?: string | null;
  metaSubmittedAt?: string | null;
  metaApprovedAt?: string | null;
  condition?: { source?: string } | null;
  buttons?: ButtonDef[] | null;
}

interface ButtonAction {
  type: "move_stage_by_name" | "trigger_template" | "mark_lost" | "notify_team";
  stageNamePattern?: string;
  templateId?: string;
  reason?: string;
  title?: string;
  body?: string;
}

interface ButtonDef {
  id: string;
  label: string;
  actions: ButtonAction[];
}

const SOURCE_OPTIONS = [
  { value: "FORMS", label: "Forms site", color: "#0ea5e9" },
  { value: "PROSPECCAO", label: "Prospecção", color: "#a855f7" },
  { value: "INDICACAO", label: "Indicação", color: "#ec4899" },
];

function getSourceMeta(value?: string | null) {
  if (!value) return null;
  return SOURCE_OPTIONS.find((o) => o.value === value);
}

interface Service {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface UsageInfo {
  flowCount: number;
  activeFlowCount: number;
  stepCount: number;
  flows: { id: string; name: string; isActive: boolean; stepCount: number }[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [duplicateSeed, setDuplicateSeed] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState<Template | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [usage, setUsage] = useState<Record<string, UsageInfo>>({});

  async function fetchAll() {
    setLoading(true);
    const [t, s] = await Promise.all([
      fetch("/api/followup-templates").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]);
    const list: Template[] = Array.isArray(t) ? t : [];
    setTemplates(list);
    setServices(Array.isArray(s) ? s : []);
    setLoading(false);
    // Carrega usage em paralelo (não bloqueia listagem)
    fetchUsageBulk(list.map((x) => x.id));
  }

  async function fetchUsageBulk(ids: string[]) {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await fetch(`/api/followup-templates/${id}/usage`);
          if (!r.ok) return [id, null] as const;
          const data: UsageInfo = await r.json();
          return [id, data] as const;
        } catch {
          return [id, null] as const;
        }
      })
    );
    const map: Record<string, UsageInfo> = {};
    for (const [id, data] of results) {
      if (data) map[id] = data;
    }
    setUsage(map);
  }

  useEffect(() => { fetchAll(); }, []);

  async function deleteTemplate() {
    if (!deleting) return;
    const res = await fetch(`/api/followup-templates/${deleting.id}`, { method: "DELETE" });
    if (res.ok || res.status === 404) {
      setDeleting(null);
      fetchAll();
    }
  }

  async function toggleActive(t: Template) {
    await fetch(`/api/followup-templates/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    fetchAll();
  }

  function duplicate(t: Template) {
    // Limpa campos Meta (cada template Meta precisa de nome único) e id
    const seed: Template = {
      ...t,
      id: "",
      code: null,
      name: `${t.name} (cópia)`,
      metaName: null,
      metaCategory: t.metaCategory || null,
      metaStatus: null,
      metaRejectionReason: null,
      metaSubmittedAt: null,
      metaApprovedAt: null,
    };
    setDuplicateSeed(seed);
  }

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (filterService !== "all" && t.service?.slug !== filterService) return false;
      if (filterSource !== "all") {
        const src = t.condition?.source || "";
        if (filterSource === "none" ? src !== "" : src !== filterSource) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.messageTemplate.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [templates, filterService, filterSource, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Textos reutilizáveis. Use nos passos dos fluxos de automação.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Novo Template
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <FilterDropdown
          label="Serviço"
          value={filterService}
          onChange={setFilterService}
          defaultLabel="Todos"
          options={services.map((s) => ({ value: s.slug, label: s.name, color: s.color }))}
        />
        <FilterDropdown
          label="Origem"
          value={filterSource}
          onChange={setFilterSource}
          defaultLabel="Todas"
          options={[
            ...SOURCE_OPTIONS.map((s) => ({ value: s.value, label: s.label, color: s.color })),
            { value: "none", label: "Sem origem definida", color: "#94a3b8" },
          ]}
        />
        {(search || filterService !== "all" || filterSource !== "all") && (
          <button
            onClick={() => { setSearch(""); setFilterService("all"); setFilterSource("all"); }}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Limpar filtros"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* Variáveis */}
      <div className="bg-card rounded-xl border border-border p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Variáveis disponíveis</p>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <span key={v.key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-[11px]">
              <code className="font-mono text-primary">{v.key}</code>
              <span className="text-muted-foreground">{v.label}</span>
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p>Nenhum template encontrado</p>
          <p className="text-xs mt-1">Clique em "Novo Template" pra criar o primeiro.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isExpanded = !!expanded[t.id];
            const isLong = t.messageTemplate.length > 240 || t.messageTemplate.split("\n").length > 3;
            const u = usage[t.id];
            return (
            <div key={t.id} className={`bg-card rounded-xl border p-4 transition ${t.isActive ? "border-border" : "border-border opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{t.name}</h3>
                    {t.code && (
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {t.code}
                      </span>
                    )}
                    {t.service && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-white"
                        style={{ backgroundColor: t.service.color }}
                      >
                        {t.service.name}
                      </span>
                    )}
                    {!t.isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Inativo</span>
                    )}
                    <SourceBadge source={t.condition?.source} />
                    <MetaStatusBadge status={t.metaStatus} category={t.metaCategory} />
                    <UsageBadge usage={u} />
                  </div>
                  <p className={`text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-3"}`}>
                    {t.messageTemplate}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => setExpanded((p) => ({ ...p, [t.id]: !p[t.id] }))}
                      className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Ver completo
                        </>
                      )}
                    </button>
                  )}
                  {t.metaStatus === "REJECTED" && t.metaRejectionReason && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                      <strong>Rejeitado:</strong> {t.metaRejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(t)} className="p-1.5 rounded hover:bg-muted" title={t.isActive ? "Desativar" : "Ativar"}>
                    {t.isActive ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => duplicate(t)} className="p-1.5 rounded hover:bg-muted" title="Duplicar">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => setDeleting(t)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600" title="Excluir">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {(creating || editing || duplicateSeed) && (
        <TemplateFormModal
          template={editing || undefined}
          seed={duplicateSeed || undefined}
          services={services}
          onClose={() => { setCreating(false); setEditing(null); setDuplicateSeed(null); }}
          onSaved={() => { setCreating(false); setEditing(null); setDuplicateSeed(null); fetchAll(); }}
        />
      )}

      {deleting && (
        <Modal title="Excluir template" onClose={() => setDeleting(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Excluir <strong>{deleting.name}</strong>? Fluxos que usam esse template vão precisar ser ajustados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                Cancelar
              </button>
              <button onClick={deleteTemplate} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source?: string | null }) {
  const meta = getSourceMeta(source);
  if (!meta) return null;
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full border"
      style={{ background: meta.color + "15", borderColor: meta.color + "55", color: meta.color }}
    >
      Origem: {meta.label}
    </span>
  );
}

function MetaStatusBadge({ status, category }: { status?: string | null; category?: string | null }) {
  if (!status) return null;
  const colorMap: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    DISABLED: "bg-gray-100 text-gray-600 border-gray-200",
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const cls = colorMap[status] || colorMap.DRAFT;
  const label = status === "PENDING" ? "Aprovação Meta · Pendente"
    : status === "APPROVED" ? `Meta · Aprovado${category ? ` · ${category}` : ""}`
    : status === "REJECTED" ? "Meta · Rejeitado"
    : status === "DISABLED" ? "Meta · Desativado"
    : "Meta · Rascunho";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
  );
}

function UsageBadge({ usage }: { usage?: UsageInfo }) {
  if (!usage) return null;
  if (usage.flowCount === 0) {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200 inline-flex items-center gap-1"
        title="Esse template não é usado por nenhum fluxo. Considere excluir se não for mais necessário."
      >
        <Link2 className="w-2.5 h-2.5" />
        Não usado
      </span>
    );
  }
  const allInactive = usage.activeFlowCount === 0;
  const label = usage.flowCount === 1 ? "Usado em 1 fluxo" : `Usado em ${usage.flowCount} fluxos`;
  const cls = allInactive
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-blue-50 text-blue-700 border-blue-200";
  const title = usage.flows
    .map((f) => `${f.name}${f.isActive ? "" : " (inativo)"} · ${f.stepCount}x`)
    .join("\n");
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cls}`} title={title}>
      <Link2 className="w-2.5 h-2.5" />
      {label}
      {allInactive && " (todos inativos)"}
    </span>
  );
}

// Resolve variáveis pra mostrar preview realista
const PREVIEW_SAMPLE: Record<string, string> = {
  "{{nome}}": "João",
  "{{empresa}}": "Pizzaria do João",
  "{{telefone}}": "(11) 99999-0000",
  "{{email}}": "joao@pizzaria.com",
  "{{servico}}": "Google Meu Negócio",
  "{{segmento}}": "Restaurante",
  "{{cidadeEstado}}": "São Paulo/SP",
  "{{linkAnalise}}": "https://arthea.com.br/a/abc123",
};

function resolveVars(text: string): string {
  return text.replace(/\{\{[^}]+\}\}/g, (m) => PREVIEW_SAMPLE[m] ?? m);
}

function WhatsAppPreview({ message, buttons }: { message: string; buttons: ButtonDef[] }) {
  const rendered = resolveVars(message || "Sua mensagem aparece aqui...");
  // WhatsApp markdown leve: *bold*, _italic_, ~strike~
  const html = rendered
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/~([^~\n]+)~/g, "<s>$1</s>")
    .replace(/\n/g, "<br/>");
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background:
          "linear-gradient(135deg, #e6dcd0 0%, #d9cdb9 100%)",
      }}
    >
      <p className="text-[10px] uppercase tracking-wider text-stone-600 mb-2 font-medium">Preview WhatsApp</p>
      <div className="flex flex-col items-start gap-1 max-w-[85%]">
        <div
          className="relative bg-[#dcf8c6] text-[#111b21] text-[13px] leading-snug px-2.5 py-1.5 rounded-lg shadow-sm whitespace-pre-wrap break-words"
          style={{ borderTopLeftRadius: 2 }}
        >
          <span dangerouslySetInnerHTML={{ __html: html }} />
          <span className="block text-[9px] text-stone-500 text-right mt-1">
            12:34 ✓✓
          </span>
        </div>
        {buttons.length > 0 && (
          <div className="w-full flex flex-col gap-0.5 mt-0.5">
            {buttons.map((b) => (
              <div
                key={b.id}
                className="bg-white text-[#00a884] text-[12px] font-medium text-center py-2 rounded-lg shadow-sm border border-stone-200"
              >
                {b.label || <span className="italic text-stone-400">Sem rótulo</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-stone-600 mt-2 italic">
        Variáveis preenchidas com dados de exemplo.
      </p>
    </div>
  );
}

const META_BODY_LIMIT = 1024;

function TemplateFormModal({
  template,
  seed,
  services,
  onClose,
  onSaved,
}: {
  template?: Template;
  seed?: Template;
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // Template = edição; Seed = duplicação (sem id); senão = criação em branco.
  const src = template || seed;
  const [name, setName] = useState(src?.name || "");
  const [message, setMessage] = useState(src?.messageTemplate || "");
  const [serviceId, setServiceId] = useState(src?.serviceId || "");
  const [sourceTag, setSourceTag] = useState(src?.condition?.source || "");
  const [buttons, setButtons] = useState<ButtonDef[]>(src?.buttons || []);
  const [metaName, setMetaName] = useState(src?.metaName || "");
  const [metaCategory, setMetaCategory] = useState(src?.metaCategory || "");
  const [saving, setSaving] = useState(false);
  const [submittingMeta, setSubmittingMeta] = useState(false);
  const [error, setError] = useState("");
  const [currentTemplate, setCurrentTemplate] = useState<Template | undefined>(template);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sincroniza currentTemplate quando muda o template prop (raro mas defensivo)
  useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);

  // Auto-refresh do status Meta a cada 30s quando está PENDING
  useEffect(() => {
    if (!currentTemplate || currentTemplate.metaStatus !== "PENDING") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/followup-templates/${currentTemplate.id}/meta`, { method: "PUT" });
        if (res.ok) {
          const updated = await res.json();
          setCurrentTemplate((prev) => (prev ? { ...prev, ...updated } : prev));
          // Avisa lista pai pra sincronizar (sem fechar modal)
          if (updated.metaStatus && updated.metaStatus !== "PENDING") {
            onSaved();
          }
        }
      } catch {
        // ignora erro de polling — usuária pode dar ↻ manual
      }
    }, 30_000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentTemplate?.id, currentTemplate?.metaStatus, onSaved]);

  const charCount = message.length;
  const charOverLimit = charCount > META_BODY_LIMIT;

  async function save(): Promise<Template | null> {
    setSaving(true);
    setError("");
    const body = {
      name,
      messageTemplate: message,
      serviceId: serviceId || null,
      condition: sourceTag ? { source: sourceTag } : null,
      buttons: buttons.length > 0 ? buttons : null,
      metaName: metaName.trim() || null,
      metaCategory: metaCategory || null,
    };
    // Edição = PUT existente. Criação E duplicação = POST (seed não tem id).
    const url = currentTemplate?.id ? `/api/followup-templates/${currentTemplate.id}` : "/api/followup-templates";
    const method = currentTemplate?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onSaved();
      return data;
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar");
      return null;
    }
  }

  async function submitToMeta() {
    if (!currentTemplate?.id) {
      setError("Salve o template primeiro pra poder submeter pra Meta");
      return;
    }
    if (!metaName.trim() || !metaCategory) {
      setError("Preencha Nome Meta e Categoria antes de submeter");
      return;
    }
    if (charOverLimit) {
      setError(`Mensagem tem ${charCount} chars — Meta limita a ${META_BODY_LIMIT}. Encurte antes de submeter.`);
      return;
    }
    setSubmittingMeta(true);
    setError("");
    // Salva primeiro pra garantir que os campos estão no banco
    await save();
    const res = await fetch(`/api/followup-templates/${currentTemplate.id}/meta`, { method: "POST" });
    setSubmittingMeta(false);
    if (res.ok) {
      const updated = await res.json();
      setCurrentTemplate((prev) => (prev ? { ...prev, ...updated } : prev));
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao submeter pra Meta");
    }
  }

  async function refreshMetaStatus() {
    if (!currentTemplate?.id) return;
    const res = await fetch(`/api/followup-templates/${currentTemplate.id}/meta`, { method: "PUT" });
    if (res.ok) {
      const updated = await res.json();
      setCurrentTemplate((prev) => (prev ? { ...prev, ...updated } : prev));
      onSaved();
    }
  }

  const title = template ? "Editar template" : seed ? "Duplicar template" : "Novo template";
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4 min-w-0">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Boas-vindas GMN Forms"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Serviço (opcional)</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Qualquer —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Origem (opcional)</label>
            <select
              value={sourceTag}
              onChange={(e) => setSourceTag(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Qualquer —</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground -mt-2">
          Marcar serviço/origem ajuda a filtrar e a se lembrar onde usar esse template.
        </p>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-muted-foreground">Mensagem</label>
            <span
              className={`text-[10px] tabular-nums ${
                charOverLimit
                  ? "text-red-600 font-semibold"
                  : charCount > META_BODY_LIMIT * 0.9
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
              title={charOverLimit ? `${charCount - META_BODY_LIMIT} chars acima do limite Meta` : "Limite Meta: 1024 chars"}
            >
              {charCount}/{META_BODY_LIMIT}
              {charOverLimit && " — Meta vai rejeitar"}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder={"Oi {{nome}}! Tudo bem? Aqui é a Ingrid da Arthea..."}
            className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 ${
              charOverLimit ? "border-red-400 focus:ring-red-500" : "border-border focus:ring-primary"
            }`}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Use {"{{nome}}, {{empresa}}, {{linkAnalise}}"} e outras variáveis listadas no topo da página.
          </p>
        </div>
        {/* Bloco Botões */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Botões de resposta rápida (máx 3)</h3>
            {buttons.length < 3 && (
              <button
                type="button"
                onClick={() => setButtons([...buttons, { id: "btn_" + Date.now(), label: "", actions: [] }])}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar botão
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Quando enviado pelo WhatsApp, aparece como botões clicáveis. Cada botão executa ações ao ser clicado.
          </p>
          {buttons.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sem botões — mensagem é só texto.</p>
          ) : (
            buttons.map((btn, idx) => (
              <ButtonEditor
                key={btn.id}
                button={btn}
                services={services}
                onUpdate={(b) => setButtons(buttons.map((x, i) => (i === idx ? b : x)))}
                onRemove={() => setButtons(buttons.filter((_, i) => i !== idx))}
              />
            ))
          )}
        </div>

        {/* Bloco Meta */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aprovação Meta (WhatsApp oficial)</h3>
            <div className="flex items-center gap-1.5">
              {currentTemplate?.metaStatus && (
                <MetaStatusBadge status={currentTemplate.metaStatus} category={currentTemplate.metaCategory} />
              )}
              {currentTemplate?.metaStatus === "PENDING" && (
                <span
                  className="text-[10px] text-amber-700 inline-flex items-center gap-1"
                  title="Auto-atualizando status da Meta a cada 30s"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  auto-refresh
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pra disparar essa mensagem FORA da janela de 24h (follow-up automático, prospecção fria), a Meta exige aprovação. Configure abaixo e clique em "Submeter".
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nome Meta</label>
              <input
                value={metaName}
                onChange={(e) => setMetaName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                placeholder="gmn_t1_boas_vindas"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">snake_case, sem espaços</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria</label>
              <select
                value={metaCategory}
                onChange={(e) => setMetaCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Selecione —</option>
                <option value="UTILITY">Utility (atualizações operacionais)</option>
                <option value="MARKETING">Marketing (promoções/aproximação)</option>
                <option value="AUTHENTICATION">Authentication (códigos OTP)</option>
              </select>
            </div>
          </div>
          {currentTemplate?.metaStatus === "REJECTED" && currentTemplate?.metaRejectionReason && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
              <strong>Motivo:</strong> {currentTemplate.metaRejectionReason}
            </p>
          )}
          {currentTemplate?.id ? (
            <div className="flex gap-2">
              <button
                onClick={submitToMeta}
                disabled={submittingMeta || !metaName.trim() || !metaCategory || charOverLimit}
                className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 disabled:opacity-50"
              >
                {submittingMeta ? "Submetendo..." : currentTemplate.metaStatus === "PENDING" ? "Re-submeter" : "Submeter pra Meta"}
              </button>
              {currentTemplate.metaStatus && (
                <button
                  onClick={refreshMetaStatus}
                  className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                  title="Atualizar status da Meta"
                >
                  ↻
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              Salve o template primeiro pra habilitar a submissão Meta.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim() || !message.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
        </div>

        {/* Preview lateral (sticky em telas grandes) */}
        <div className="lg:sticky lg:top-0 self-start space-y-3">
          <WhatsAppPreview message={message} buttons={buttons} />
        </div>
      </div>
    </Modal>
  );
}

function ButtonEditor({
  button,
  services,
  onUpdate,
  onRemove,
}: {
  button: ButtonDef;
  services: Service[];
  onUpdate: (b: ButtonDef) => void;
  onRemove: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetch("/api/followup-templates").then((r) => r.json()).then((d) => setTemplates(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  function updateAction(idx: number, patch: Partial<ButtonAction>) {
    onUpdate({ ...button, actions: button.actions.map((a, i) => (i === idx ? { ...a, ...patch } : a)) });
  }

  function addAction(type: ButtonAction["type"]) {
    onUpdate({ ...button, actions: [...button.actions, { type }] });
  }

  function removeAction(idx: number) {
    onUpdate({ ...button, actions: button.actions.filter((_, i) => i !== idx) });
  }

  return (
    <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={button.label}
          onChange={(e) => onUpdate({ ...button, label: e.target.value.slice(0, 20) })}
          placeholder='Ex: "Sim, quero receber"'
          maxLength={20}
          className="flex-1 px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="button" onClick={onRemove} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600" title="Remover botão">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">Máx 20 chars. ID interno: <code className="font-mono">{button.id}</code></p>

      <div className="border-t border-border pt-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Ao clicar:</p>
        {button.actions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic mb-2">Nenhuma ação. Adicione abaixo.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {button.actions.map((a, i) => (
              <div key={i} className="bg-card border border-border rounded p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                    {a.type === "move_stage_by_name" ? "Mover estágio" :
                     a.type === "trigger_template" ? "Disparar template" :
                     a.type === "mark_lost" ? "Marcar perdido" :
                     "Notificar equipe"}
                  </span>
                  <button onClick={() => removeAction(i)} className="text-red-500 hover:bg-red-50 p-0.5 rounded text-xs">×</button>
                </div>
                {a.type === "move_stage_by_name" && (
                  <input
                    type="text"
                    value={a.stageNamePattern || ""}
                    onChange={(e) => updateAction(i, { stageNamePattern: e.target.value })}
                    placeholder='Nome do estágio (ex: "Análise gerada")'
                    className="w-full px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
                {a.type === "trigger_template" && (
                  <select
                    value={a.templateId || ""}
                    onChange={(e) => updateAction(i, { templateId: e.target.value })}
                    className="w-full px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">— Selecione template —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
                {a.type === "mark_lost" && (
                  <input
                    type="text"
                    value={a.reason || ""}
                    onChange={(e) => updateAction(i, { reason: e.target.value })}
                    placeholder='Motivo da perda (ex: "Sem interesse")'
                    className="w-full px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
                {a.type === "notify_team" && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={a.title || ""}
                      onChange={(e) => updateAction(i, { title: e.target.value })}
                      placeholder="Título da notificação"
                      className="w-full px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={a.body || ""}
                      onChange={(e) => updateAction(i, { body: e.target.value })}
                      placeholder="Corpo da notificação"
                      className="w-full px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1 flex-wrap">
          <button type="button" onClick={() => addAction("move_stage_by_name")} className="text-[10px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100">+ Mover estágio</button>
          <button type="button" onClick={() => addAction("trigger_template")} className="text-[10px] px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">+ Disparar template</button>
          <button type="button" onClick={() => addAction("mark_lost")} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">+ Marcar perdido</button>
          <button type="button" onClick={() => addAction("notify_team")} className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">+ Notificar equipe</button>
        </div>
      </div>
    </div>
  );
}
