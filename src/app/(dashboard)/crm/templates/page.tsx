"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Check, X, Search } from "lucide-react";
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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Template | null>(null);

  async function fetchAll() {
    setLoading(true);
    const [t, s] = await Promise.all([
      fetch("/api/followup-templates").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]);
    setTemplates(Array.isArray(t) ? t : []);
    setServices(Array.isArray(s) ? s : []);
    setLoading(false);
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
          {filtered.map((t) => (
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
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap line-clamp-3">
                    {t.messageTemplate}
                  </p>
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
                  <button onClick={() => setDeleting(t)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600" title="Excluir">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <TemplateFormModal
          template={editing || undefined}
          services={services}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); fetchAll(); }}
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

function TemplateFormModal({
  template,
  services,
  onClose,
  onSaved,
}: {
  template?: Template;
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [message, setMessage] = useState(template?.messageTemplate || "");
  const [serviceId, setServiceId] = useState(template?.serviceId || "");
  const [sourceTag, setSourceTag] = useState(template?.condition?.source || "");
  const [metaName, setMetaName] = useState(template?.metaName || "");
  const [metaCategory, setMetaCategory] = useState(template?.metaCategory || "");
  const [saving, setSaving] = useState(false);
  const [submittingMeta, setSubmittingMeta] = useState(false);
  const [error, setError] = useState("");

  async function save(): Promise<Template | null> {
    setSaving(true);
    setError("");
    const body = {
      name,
      messageTemplate: message,
      serviceId: serviceId || null,
      condition: sourceTag ? { source: sourceTag } : null,
      metaName: metaName.trim() || null,
      metaCategory: metaCategory || null,
    };
    const url = template ? `/api/followup-templates/${template.id}` : "/api/followup-templates";
    const method = template ? "PUT" : "POST";
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
    if (!template) {
      setError("Salve o template primeiro pra poder submeter pra Meta");
      return;
    }
    if (!metaName.trim() || !metaCategory) {
      setError("Preencha Nome Meta e Categoria antes de submeter");
      return;
    }
    setSubmittingMeta(true);
    setError("");
    // Salva primeiro pra garantir que os campos estão no banco
    await save();
    const res = await fetch(`/api/followup-templates/${template.id}/meta`, { method: "POST" });
    setSubmittingMeta(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao submeter pra Meta");
    }
  }

  async function refreshMetaStatus() {
    if (!template) return;
    const res = await fetch(`/api/followup-templates/${template.id}/meta`, { method: "PUT" });
    if (res.ok) onSaved();
  }

  return (
    <Modal title={template ? "Editar template" : "Novo template"} onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-4">
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
          <label className="block text-xs font-medium text-muted-foreground mb-1">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder={"Oi {{nome}}! Tudo bem? Aqui é a Ingrid da Arthea..."}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Use {"{{nome}}, {{empresa}}, {{linkAnalise}}"} e outras variáveis listadas no topo da página.
          </p>
        </div>
        {/* Bloco Meta */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aprovação Meta (WhatsApp oficial)</h3>
            {template?.metaStatus && (
              <MetaStatusBadge status={template.metaStatus} category={template.metaCategory} />
            )}
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
          {template?.metaStatus === "REJECTED" && template?.metaRejectionReason && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
              <strong>Motivo:</strong> {template.metaRejectionReason}
            </p>
          )}
          {template && (
            <div className="flex gap-2">
              <button
                onClick={submitToMeta}
                disabled={submittingMeta || !metaName.trim() || !metaCategory}
                className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 disabled:opacity-50"
              >
                {submittingMeta ? "Submetendo..." : template.metaStatus === "PENDING" ? "Re-submeter" : "Submeter pra Meta"}
              </button>
              {template.metaStatus && (
                <button
                  onClick={refreshMetaStatus}
                  className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                  title="Atualizar status da Meta"
                >
                  ↻
                </button>
              )}
            </div>
          )}
          {!template && (
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
    </Modal>
  );
}
