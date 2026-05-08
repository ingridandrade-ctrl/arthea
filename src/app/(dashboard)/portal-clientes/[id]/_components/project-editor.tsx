"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Save, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Em preparação" },
  { value: "IN_PROGRESS", label: "Em produção" },
  { value: "WAITING_REVIEW", label: "Aguardando validação" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REVISION", label: "Em revisão" },
];

const CATEGORY_OPTIONS = [
  { value: "POSITIONING", label: "Imersão e Posicionamento" },
  { value: "CONTENT", label: "Construção e Conteúdo" },
  { value: "TRACKING", label: "Rastreamento e Ads" },
  { value: "DELIVERY", label: "Entrega Final" },
];

const REF_TYPE_OPTIONS = [
  { value: "link", label: "Link" },
  { value: "drive", label: "Google Drive" },
  { value: "pinterest", label: "Pinterest" },
  { value: "pdf", label: "PDF" },
  { value: "miro", label: "Miro" },
];

const TABS = [
  { key: "geral", label: "Geral" },
  { key: "entregaveis", label: "Entregáveis" },
  { key: "acessos", label: "Acessos" },
  { key: "referencias", label: "Referências" },
  { key: "resumo", label: "Sobre você" },
];

export function ProjectEditor({ project }: { project: any }) {
  const [tab, setTab] = useState("geral");
  return (
    <div>
      <div className="border-b border-border mb-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && <GeralTab project={project} />}
      {tab === "entregaveis" && <EntregaveisTab project={project} />}
      {tab === "acessos" && <AcessosTab project={project} />}
      {tab === "referencias" && <ReferenciasTab project={project} />}
      {tab === "resumo" && <ResumoTab project={project} />}
    </div>
  );
}

// ─────────────────── GERAL ───────────────────
function GeralTab({ project }: { project: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/client-projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description") || null,
        currentPhase: Number(fd.get("currentPhase") || 1),
        accentColor: fd.get("accentColor"),
        logoUrl: fd.get("logoUrl") || null,
        startDate: fd.get("startDate") || null,
        endDate: fd.get("endDate") || null,
        isActive: fd.get("isActive") === "on",
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Salvo.");
      router.refresh();
    } else {
      setMsg("Erro ao salvar.");
    }
  }

  async function deleteProject() {
    if (!confirm("Excluir este projeto e todos os entregáveis? Não dá pra desfazer.")) return;
    await fetch(`/api/admin/client-projects/${project.id}`, { method: "DELETE" });
    window.location.href = "/portal-clientes";
  }

  return (
    <form
      onSubmit={save}
      className="space-y-4 bg-card border border-border rounded-xl p-5 max-w-2xl"
    >
      <Field label="Nome do projeto">
        <input name="name" required defaultValue={project.name} className={input} />
      </Field>
      <Field label="Descrição">
        <input name="description" defaultValue={project.description || ""} className={input} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fase atual">
          <select name="currentPhase" defaultValue={project.currentPhase} className={input}>
            <option value="1">1 — Imersão</option>
            <option value="2">2 — Construção</option>
            <option value="3">3 — Rastreamento</option>
            <option value="4">4 — Entrega</option>
          </select>
        </Field>
        <Field label="Cor de destaque">
          <input
            name="accentColor"
            type="color"
            defaultValue={project.accentColor}
            className="w-full h-9 border border-border rounded-lg"
          />
        </Field>
        <Field label="Início">
          <input
            name="startDate"
            type="date"
            defaultValue={project.startDate ? project.startDate.slice(0, 10) : ""}
            className={input}
          />
        </Field>
        <Field label="Fim previsto">
          <input
            name="endDate"
            type="date"
            defaultValue={project.endDate ? project.endDate.slice(0, 10) : ""}
            className={input}
          />
        </Field>
      </div>
      <Field label="URL do logo do cliente (opcional)">
        <input
          name="logoUrl"
          defaultValue={project.logoUrl || ""}
          placeholder="https://..."
          className={input}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={project.isActive} />
        Projeto ativo (visível no portal)
      </label>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <button
          type="button"
          onClick={deleteProject}
          className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" /> Excluir projeto
        </button>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─────────────────── ENTREGÁVEIS ───────────────────
function EntregaveisTab({ project }: { project: any }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function deleteOne(id: string) {
    if (!confirm("Excluir este entregável?")) return;
    await fetch(`/api/admin/deliverables/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function quickStatus(id: string, status: string) {
    await fetch(`/api/admin/deliverables/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  const byPhase: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const d of project.deliverables) byPhase[d.phase].push(d);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {project.deliverables.length} entregáveis ao todo. Click no status para mudar rapidinho.
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {[1, 2, 3, 4].map((phase) => (
        <div key={phase}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Fase {phase}
          </h3>
          {byPhase[phase].length === 0 ? (
            <p className="text-sm text-muted-foreground italic mb-4">Sem entregáveis nesta fase.</p>
          ) : (
            <div className="space-y-1.5 mb-4">
              {byPhase[phase].map((d) => (
                <div
                  key={d.id}
                  className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setEditing(d)}
                      className="text-sm font-medium hover:text-primary text-left"
                    >
                      {d.title}
                    </button>
                    {d.description && (
                      <p className="text-xs text-muted-foreground truncate">{d.description}</p>
                    )}
                  </div>
                  <select
                    value={d.status}
                    onChange={(e) => quickStatus(d.id, e.target.value)}
                    className="text-xs border border-border rounded px-2 py-1 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditing(d)}
                    className="text-xs text-primary hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteOne(d.id)}
                    className="text-muted-foreground hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {showAdd && (
        <DeliverableForm
          projectId={project.id}
          nextOrder={project.deliverables.length}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editing && (
        <DeliverableForm
          projectId={project.id}
          editing={editing}
          nextOrder={project.deliverables.length}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function DeliverableForm({
  projectId,
  editing,
  nextOrder,
  onClose,
}: {
  projectId: string;
  editing?: any;
  nextOrder: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title"),
      description: fd.get("description") || null,
      category: fd.get("category"),
      phase: Number(fd.get("phase")),
      order: editing ? editing.order : nextOrder,
      status: fd.get("status"),
      documentUrl: fd.get("documentUrl") || null,
      documentEmbed: fd.get("documentEmbed") || null,
      isVisible: fd.get("isVisible") === "on",
    };
    const res = editing
      ? await fetch(`/api/admin/deliverables/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/client-projects/${projectId}/deliverables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      onClose();
      router.refresh();
    }
  }

  return (
    <Modal
      title={editing ? "Editar entregável" : "Novo entregável"}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <form onSubmit={save} className="space-y-3">
        <Field label="Título">
          <input name="title" required defaultValue={editing?.title || ""} className={input} />
        </Field>
        <Field label="Descrição (opcional)">
          <input name="description" defaultValue={editing?.description || ""} className={input} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Fase">
            <select name="phase" defaultValue={editing?.phase || 1} className={input}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select name="category" defaultValue={editing?.category || "POSITIONING"} className={input}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={editing?.status || "PENDING"} className={input}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Link do documento (Google Drive, PDF, etc.)">
          <input
            name="documentUrl"
            placeholder="https://..."
            defaultValue={editing?.documentUrl || ""}
            className={input}
          />
        </Field>
        <Field label="Conteúdo HTML embed (opcional, aparece dentro do portal)">
          <textarea
            name="documentEmbed"
            rows={6}
            defaultValue={editing?.documentEmbed || ""}
            placeholder="<p>Texto, imagens, links...</p>"
            className={input}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={editing ? editing.isVisible : true}
          />
          Visível para o cliente
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar entregável"}
        </button>
      </form>
    </Modal>
  );
}

// ─────────────────── ACESSOS ───────────────────
function AcessosTab({ project }: { project: any }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [revealing, setRevealing] = useState<string | null>(null);

  async function deleteOne(id: string) {
    if (!confirm("Excluir este acesso?")) return;
    await fetch(`/api/admin/accesses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Adicionar acesso
        </button>
      </div>

      {project.accesses.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhum acesso cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {project.accesses.map((a: any) => (
            <div
              key={a.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{a.platform}</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {a.username && <p>Usuário: <span className="font-mono">{a.username}</span></p>}
                  {a.password && (
                    <p className="flex items-center gap-2">
                      Senha:
                      <span className="font-mono">
                        {revealing === a.id ? a.password : "••••••••"}
                      </span>
                      <button
                        onClick={() => setRevealing(revealing === a.id ? null : a.id)}
                        className="text-primary"
                      >
                        {revealing === a.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </p>
                  )}
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> {a.url}
                    </a>
                  )}
                  {a.notes && <p className="italic">{a.notes}</p>}
                </div>
              </div>
              <button
                onClick={() => deleteOne(a.id)}
                className="text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AccessForm
          projectId={project.id}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function AccessForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/client-projects/${projectId}/accesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: fd.get("platform"),
        username: fd.get("username") || null,
        password: fd.get("password") || null,
        url: fd.get("url") || null,
        notes: fd.get("notes") || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onClose();
      router.refresh();
    }
  }
  return (
    <Modal title="Novo acesso" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={save} className="space-y-3">
        <Field label="Plataforma">
          <input name="platform" required placeholder="Ex: Instagram" className={input} />
        </Field>
        <Field label="Usuário">
          <input name="username" className={input} />
        </Field>
        <Field label="Senha">
          <input name="password" className={input} />
        </Field>
        <Field label="URL">
          <input name="url" placeholder="https://..." className={input} />
        </Field>
        <Field label="Observações">
          <textarea name="notes" rows={2} className={input} />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </form>
    </Modal>
  );
}

// ─────────────────── REFERÊNCIAS ───────────────────
function ReferenciasTab({ project }: { project: any }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Adicionar referência
        </button>
      </div>

      {project.references.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma referência cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {project.references.map((r: any) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-lg p-3 flex items-center justify-between hover:border-primary/40 transition"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center gap-3 text-foreground"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.type} · {r.url}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
              <button
                onClick={async () => {
                  if (!confirm("Excluir esta referência?")) return;
                  await fetch(`/api/admin/references/${r.id}`, { method: "DELETE" });
                  router.refresh();
                }}
                className="ml-3 text-muted-foreground hover:text-red-600"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <ReferenceForm projectId={project.id} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

function ReferenceForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/client-projects/${projectId}/references`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        type: fd.get("type"),
        url: fd.get("url"),
        description: fd.get("description") || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onClose();
      router.refresh();
    }
  }
  return (
    <Modal title="Nova referência" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={save} className="space-y-3">
        <Field label="Título">
          <input name="title" required className={input} />
        </Field>
        <Field label="URL">
          <input name="url" required placeholder="https://..." className={input} />
        </Field>
        <Field label="Tipo">
          <select name="type" defaultValue="link" className={input}>
            {REF_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Descrição (opcional)">
          <input name="description" className={input} />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </form>
    </Modal>
  );
}

// ─────────────────── RESUMO ───────────────────
function ResumoTab({ project }: { project: any }) {
  const router = useRouter();
  const [content, setContent] = useState(project.summary?.content || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/client-projects/${project.id}/summary`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Salvo.");
      router.refresh();
    } else {
      setMsg("Erro ao salvar.");
    }
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Este texto aparece como "Sobre você" no dashboard do portal. Aceita HTML simples
        (parágrafos, negrito, listas).
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        className={`${input} font-mono text-xs`}
        placeholder="<p>Texto sobre o cliente...</p>"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>

      <div className="border-t border-border pt-4 mt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Pré-visualização
        </p>
        <div
          className="bg-card border border-border rounded-lg p-5 text-sm leading-relaxed text-foreground/80"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

// ─────────────────── helpers ───────────────────
const input =
  "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
