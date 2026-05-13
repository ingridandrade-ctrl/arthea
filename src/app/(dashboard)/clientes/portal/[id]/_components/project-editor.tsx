"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  Pencil,
  ArrowUp,
  ArrowDown,
  Check,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FileUploadField } from "./file-upload-field";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Em preparação" },
  { value: "IN_PROGRESS", label: "Em produção" },
  { value: "WAITING_REVIEW", label: "Aguardando validação" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REVISION", label: "Em revisão" },
];

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  WAITING_REVIEW: "bg-emerald-100 text-emerald-800",
  APPROVED: "bg-green-100 text-green-800",
  REVISION: "bg-orange-100 text-orange-800",
};

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
  { key: "interno", label: "Interno" },
];

// ─────────────────────────── Toast helper (shared) ───────────────────────────
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  function show(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 1800);
  }
  const node = msg ? (
    <div
      className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-2"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <span className="inline-flex items-center gap-2">
        <Check className="w-4 h-4 text-emerald-400" />
        {msg}
      </span>
    </div>
  ) : null;
  return { show, node };
}

export function ProjectEditor({ project }: { project: any }) {
  const [tab, setTab] = useState("geral");
  return (
    <div>
      <div className="border-b border-border mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t.key
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <>
          <GeralTab project={project} />
          <ClientAccountSection projectId={project.id} client={project.client} />
        </>
      )}
      {tab === "entregaveis" && <EntregaveisTab project={project} />}
      {tab === "acessos" && <AcessosTab project={project} />}
      {tab === "referencias" && <ReferenciasTab project={project} />}
      {tab === "resumo" && <ResumoTab project={project} />}
      {tab === "interno" && <InternoTab project={project} />}
    </div>
  );
}

// ─────────────────── GERAL ───────────────────
function GeralTab({ project }: { project: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
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
      toast.show("Alterações salvas");
      router.refresh();
    } else {
      toast.show("Erro ao salvar");
    }
  }

  async function deleteProject() {
    if (!confirm("Excluir este projeto e todos os entregáveis? Não dá pra desfazer.")) return;
    await fetch(`/api/admin/client-projects/${project.id}`, { method: "DELETE" });
    window.location.href = "/clientes/portal";
  }

  return (
    <form
      onSubmit={save}
      className="space-y-5 bg-card border border-border rounded-2xl p-6 max-w-3xl"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Identidade do projeto
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          O cliente vê o nome e a fase logo ao entrar.
        </p>
      </div>

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
          <div className="flex gap-2">
            <input
              name="accentColor"
              type="color"
              defaultValue={project.accentColor}
              className="w-12 h-9 border border-border rounded-lg cursor-pointer"
            />
            <input
              defaultValue={project.accentColor}
              readOnly
              className={`${input} flex-1 font-mono text-xs`}
            />
          </div>
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
      <FileUploadField
        label="Logo do cliente (PNG, JPG ou SVG)"
        name="logoUrl"
        accept="image/*"
        hint="Recomendado: imagem quadrada, mín. 64×64 px"
        initialUrl={project.logoUrl}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={project.isActive} />
        Projeto ativo (visível no portal)
      </label>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          onClick={deleteProject}
          className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> Excluir projeto
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
      {toast.node}
    </form>
  );
}

// ─────────────────── CONTA DO CLIENTE ───────────────────
function ClientAccountSection({
  projectId,
  client,
}: {
  projectId: string;
  client: { id: string; name: string; email: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const password = (fd.get("password") as string) || "";
    const body: Record<string, string> = {
      name: (fd.get("name") as string) || "",
      email: (fd.get("email") as string) || "",
    };
    if (password) body.password = password;

    const res = await fetch(`/api/admin/client-projects/${projectId}/client`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast.show(password ? "Credenciais e senha atualizadas" : "Credenciais atualizadas");
      (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value = "";
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.show(data.error || "Erro ao salvar");
    }
  }

  return (
    <form
      onSubmit={save}
      className="space-y-5 bg-card border border-border rounded-2xl p-6 max-w-3xl mt-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <KeyRound className="w-4 h-4 text-primary" strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conta de acesso ao portal
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            O cliente entra em clientes.arthea.com.br com esse e-mail e senha.
          </p>
        </div>
      </div>

      <Field label="Nome (aparece no portal)">
        <input name="name" required defaultValue={client.name} className={input} />
      </Field>
      <Field label="E-mail">
        <input
          name="email"
          type="email"
          required
          defaultValue={client.email}
          className={input}
        />
      </Field>
      <Field label="Nova senha (em branco = manter atual)">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Deixe em branco pra não alterar"
            className={`${input} pr-10`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar credenciais"}
        </button>
      </div>
      {toast.node}
    </form>
  );
}

// ─────────────────── ENTREGÁVEIS ───────────────────
function EntregaveisTab({ project }: { project: any }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const toast = useToast();

  async function deleteOne(id: string) {
    if (!confirm("Excluir este entregável?")) return;
    await fetch(`/api/admin/deliverables/${id}`, { method: "DELETE" });
    toast.show("Entregável excluído");
    router.refresh();
  }

  async function applyTemplate() {
    const hasItems = project.deliverables.length > 0;
    if (hasItems) {
      if (
        !confirm(
          `Essa frente já tem ${project.deliverables.length} entregáveis. Aplicar o template vai ADICIONAR os entregáveis padrão por cima (não substitui). Continuar?`,
        )
      )
        return;
    }
    setApplyingTemplate(true);
    const res = await fetch(`/api/admin/client-projects/${project.id}/apply-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: hasItems }),
    });
    setApplyingTemplate(false);
    if (res.ok) {
      const data = await res.json();
      toast.show(`Template "${data.template}" aplicado · ${data.created} entregáveis criados`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.show(data.error || "Erro ao aplicar template");
    }
  }

  async function quickStatus(id: string, status: string) {
    await fetch(`/api/admin/deliverables/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.show("Status atualizado");
    router.refresh();
  }

  async function reorder(deliverable: any, dir: -1 | 1) {
    const samePhase = project.deliverables.filter((d: any) => d.phase === deliverable.phase);
    samePhase.sort((a: any, b: any) => a.order - b.order);
    const idx = samePhase.findIndex((d: any) => d.id === deliverable.id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= samePhase.length) return;
    const target = samePhase[targetIdx];
    // Swap orders
    await Promise.all([
      fetch(`/api/admin/deliverables/${deliverable.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/admin/deliverables/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: deliverable.order }),
      }),
    ]);
    router.refresh();
  }

  const byPhase: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const d of project.deliverables) byPhase[d.phase].push(d);
  for (const phase of Object.keys(byPhase)) {
    byPhase[Number(phase)].sort((a, b) => a.order - b.order);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {project.deliverables.length} entregáveis. Mude o status pelo dropdown e a ordem com as setas.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={applyTemplate}
            disabled={applyingTemplate}
            className="px-3.5 py-1.5 border border-border rounded-lg text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted transition disabled:opacity-60"
            title="Cria os entregáveis padrão Arthea pro tipo dessa frente"
          >
            <Sparkles className="w-4 h-4" />
            {applyingTemplate ? "Aplicando…" : "Aplicar template"}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      {[1, 2, 3, 4].map((phase) => (
        <div key={phase}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2.5">
            Fase {phase}
          </h3>
          {byPhase[phase].length === 0 ? (
            <p className="text-sm text-muted-foreground italic mb-4">
              Sem entregáveis nesta fase.
            </p>
          ) : (
            <div className="space-y-1.5 mb-4">
              {byPhase[phase].map((d, i) => (
                <div
                  key={d.id}
                  className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-primary/30 transition"
                >
                  <div className="flex flex-col gap-0.5 -my-1">
                    <button
                      onClick={() => reorder(d, -1)}
                      disabled={i === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => reorder(d, 1)}
                      disabled={i === byPhase[phase].length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
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
                    className={`text-xs border-0 rounded-full px-3 py-1 font-medium cursor-pointer ${
                      STATUS_TONE[d.status] || "bg-slate-100"
                    }`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditing(d)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteOne(d.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded"
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
          onSaved={() => toast.show("Entregável criado")}
        />
      )}
      {editing && (
        <DeliverableForm
          projectId={project.id}
          editing={editing}
          nextOrder={project.deliverables.length}
          onClose={() => setEditing(null)}
          onSaved={() => toast.show("Entregável atualizado")}
        />
      )}
      {toast.node}
    </div>
  );
}

function DeliverableForm({
  projectId,
  editing,
  nextOrder,
  onClose,
  onSaved,
}: {
  projectId: string;
  editing?: any;
  nextOrder: number;
  onClose: () => void;
  onSaved?: () => void;
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
      kind: fd.get("kind") || "DOCUMENT",
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
      onSaved?.();
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
            <select
              name="category"
              defaultValue={editing?.category || "POSITIONING"}
              className={input}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select
              name="kind"
              defaultValue={editing?.kind || "DOCUMENT"}
              className={input}
              title="TASK: setup interno · FORM: formulário · DOCUMENT: material pra revisar"
            >
              <option value="DOCUMENT">📄 Documento (revisa + aprova)</option>
              <option value="FORM">📋 Formulário (cliente preenche)</option>
              <option value="TASK">🔧 Setup (Arthea faz, cliente acompanha)</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={editing?.status || "PENDING"} className={input}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <FileUploadField
          label="Documento do entregável (PDF, imagem)"
          name="documentUrl"
          accept=".pdf,image/*"
          hint="Até 10 MB. Aparece no portal do cliente como botão 'Abrir documento' ou preview."
          initialUrl={editing?.documentUrl}
        />
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
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 hover:opacity-90 transition"
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
  const [editing, setEditing] = useState<any>(null);
  const [revealing, setRevealing] = useState<string | null>(null);
  const toast = useToast();

  async function deleteOne(id: string) {
    if (!confirm("Excluir este acesso?")) return;
    await fetch(`/api/admin/accesses/${id}`, { method: "DELETE" });
    toast.show("Acesso excluído");
    router.refresh();
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {project.accesses.length} {project.accesses.length === 1 ? "acesso cadastrado" : "acessos cadastrados"}.
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar acesso
        </button>
      </div>

      {project.accesses.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum acesso cadastrado. Use este espaço para registrar logins de redes sociais,
            ferramentas e contas que você cria para o cliente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {project.accesses.map((a: any) => (
            <div
              key={a.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 hover:border-primary/30 transition"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{a.platform}</p>
                <div className="text-xs text-muted-foreground mt-1.5 space-y-1">
                  {a.username && (
                    <p>
                      Usuário: <span className="font-mono">{a.username}</span>
                    </p>
                  )}
                  {a.password && (
                    <p className="flex items-center gap-2">
                      Senha:
                      <span className="font-mono">
                        {revealing === a.id ? a.password : "••••••••"}
                      </span>
                      <button
                        onClick={() => setRevealing(revealing === a.id ? null : a.id)}
                        className="text-primary"
                        title={revealing === a.id ? "Ocultar" : "Mostrar"}
                      >
                        {revealing === a.id ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
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
                  {a.notes && <p className="italic text-muted-foreground/80">{a.notes}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(a)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteOne(a.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AccessForm
          projectId={project.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => toast.show("Acesso adicionado")}
        />
      )}
      {editing && (
        <AccessForm
          projectId={project.id}
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => toast.show("Acesso atualizado")}
        />
      )}
      {toast.node}
    </div>
  );
}

function AccessForm({
  projectId,
  editing,
  onClose,
  onSaved,
}: {
  projectId: string;
  editing?: any;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      platform: fd.get("platform"),
      username: fd.get("username") || null,
      password: fd.get("password") || null,
      url: fd.get("url") || null,
      notes: fd.get("notes") || null,
    };
    const res = editing
      ? await fetch(`/api/admin/accesses/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/client-projects/${projectId}/accesses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      onSaved?.();
      onClose();
      router.refresh();
    }
  }
  return (
    <Modal
      title={editing ? `Editar acesso — ${editing.platform}` : "Novo acesso"}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={save} className="space-y-3">
        <Field label="Plataforma *">
          <input
            name="platform"
            required
            defaultValue={editing?.platform || ""}
            placeholder="Ex: Instagram, Meta Ads, Google Meu Negócio..."
            className={input}
          />
        </Field>
        <Field label="Usuário">
          <input name="username" defaultValue={editing?.username || ""} className={input} />
        </Field>
        <Field label="Senha">
          <input
            name="password"
            type="text"
            defaultValue={editing?.password || ""}
            className={input}
          />
        </Field>
        <Field label="URL (link de acesso)">
          <input
            name="url"
            defaultValue={editing?.url || ""}
            placeholder="https://..."
            className={input}
          />
        </Field>
        <Field label="Observações">
          <textarea
            name="notes"
            rows={2}
            defaultValue={editing?.notes || ""}
            className={input}
          />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 hover:opacity-90 transition"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar acesso"}
        </button>
      </form>
    </Modal>
  );
}

// ─────────────────── REFERÊNCIAS ───────────────────
function ReferenciasTab({ project }: { project: any }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const toast = useToast();

  async function deleteOne(id: string) {
    if (!confirm("Excluir esta referência?")) return;
    await fetch(`/api/admin/references/${id}`, { method: "DELETE" });
    toast.show("Referência excluída");
    router.refresh();
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {project.references.length}{" "}
          {project.references.length === 1
            ? "referência cadastrada"
            : "referências cadastradas"}.
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar referência
        </button>
      </div>

      {project.references.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma referência cadastrada. Adicione links de inspiração, documentos compartilhados e materiais.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {project.references.map((r: any) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-lg p-3 flex items-center justify-between hover:border-primary/30 transition"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center gap-3 text-foreground"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.type} · {r.url}
                  </p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{r.description}</p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </a>
              <div className="flex gap-1 ml-3">
                <button
                  onClick={() => setEditing(r)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteOne(r.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <ReferenceForm
          projectId={project.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => toast.show("Referência adicionada")}
        />
      )}
      {editing && (
        <ReferenceForm
          projectId={project.id}
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => toast.show("Referência atualizada")}
        />
      )}
      {toast.node}
    </div>
  );
}

function ReferenceForm({
  projectId,
  editing,
  onClose,
  onSaved,
}: {
  projectId: string;
  editing?: any;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title"),
      type: fd.get("type"),
      url: fd.get("url"),
      description: fd.get("description") || null,
    };
    const res = editing
      ? await fetch(`/api/admin/references/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/client-projects/${projectId}/references`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      onSaved?.();
      onClose();
      router.refresh();
    }
  }
  return (
    <Modal
      title={editing ? `Editar referência` : "Nova referência"}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={save} className="space-y-3">
        <Field label="Título *">
          <input
            name="title"
            required
            defaultValue={editing?.title || ""}
            className={input}
          />
        </Field>
        <Field label="URL *">
          <input
            name="url"
            required
            defaultValue={editing?.url || ""}
            placeholder="https://..."
            className={input}
          />
        </Field>
        <Field label="Tipo">
          <select name="type" defaultValue={editing?.type || "link"} className={input}>
            {REF_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descrição (opcional)">
          <input
            name="description"
            defaultValue={editing?.description || ""}
            className={input}
          />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 hover:opacity-90 transition"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar referência"}
        </button>
      </form>
    </Modal>
  );
}

// ─────────────────── RESUMO ───────────────────
function ResumoTab({ project }: { project: any }) {
  const router = useRouter();
  const [content, setContent] = useState(project.dossier?.legacySummaryHtml || "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/client-projects/${project.id}/summary`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (res.ok) {
      toast.show("Resumo salvo");
      router.refresh();
    } else {
      toast.show("Erro ao salvar");
    }
  }

  function insertTag(tag: string) {
    const ta = document.querySelector<HTMLTextAreaElement>("textarea[name='summaryContent']");
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || "texto";
    const before = content.slice(0, start);
    const after = content.slice(end);
    const wrapped = `<${tag}>${selected}</${tag}>`;
    const next = before + wrapped + after;
    setContent(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(before.length + tag.length + 2, before.length + tag.length + 2 + selected.length);
    }, 0);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Este texto aparece como "Sobre você" no dashboard do portal. Aceita HTML simples — use os
        botões abaixo para formatar rapidinho.
      </p>

      <div className="flex flex-wrap gap-2">
        <FormatButton onClick={() => insertTag("p")}>Parágrafo</FormatButton>
        <FormatButton onClick={() => insertTag("strong")}>Negrito</FormatButton>
        <FormatButton onClick={() => insertTag("em")}>Itálico</FormatButton>
        <FormatButton
          onClick={() => {
            const url = prompt("URL do link:");
            if (!url) return;
            const ta = document.querySelector<HTMLTextAreaElement>("textarea[name='summaryContent']");
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const selected = content.slice(start, end) || url;
            const next = content.slice(0, start) + `<a href="${url}">${selected}</a>` + content.slice(end);
            setContent(next);
          }}
        >
          Link
        </FormatButton>
      </div>

      <textarea
        name="summaryContent"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        className={`${input} font-mono text-xs`}
        placeholder="<p>Texto sobre o cliente...</p>"
      />
      <div className="flex items-center justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Como aparece para o cliente
        </p>
        <div
          className="bg-card border border-border rounded-2xl p-7 text-sm leading-relaxed text-foreground/80"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
          dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground italic'>Sem conteúdo</p>" }}
        />
      </div>

      {toast.node}
    </div>
  );
}

function FormatButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/70 rounded-lg transition"
    >
      {children}
    </button>
  );
}

// ─────────────────── INTERNO (admin-only) ───────────────────
function InternoTab({ project }: { project: any }) {
  const router = useRouter();
  const toast = useToast();
  const initial = (project.internalData || {}) as Record<string, any>;

  const [contractUrl, setContractUrl] = useState<string | null>(initial.contractUrl || null);
  const [contractStartDate, setContractStartDate] = useState(initial.contractStartDate || "");
  const [contractEndDate, setContractEndDate] = useState(initial.contractEndDate || "");
  const [contractValue, setContractValue] = useState(
    initial.contractValue != null ? String(initial.contractValue) : "",
  );
  const [paymentTerms, setPaymentTerms] = useState(initial.paymentTerms || "");
  const [notes, setNotes] = useState(initial.notes || "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/client-projects/${project.id}/internal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractUrl: contractUrl || null,
        contractStartDate: contractStartDate || null,
        contractEndDate: contractEndDate || null,
        contractValue: contractValue === "" ? null : Number(contractValue),
        paymentTerms: paymentTerms || null,
        notes: notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.show("Dados internos salvos");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.show(data.error || "Erro ao salvar");
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 max-w-3xl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <Eye className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={1.7} />
        <div className="text-xs text-amber-900">
          <p className="font-semibold mb-0.5">Dados internos · privados da agência</p>
          <p>
            Nada aqui aparece no portal do cliente. É onde a Arthea guarda contrato, valores
            internos e anotações operacionais sobre essa frente.
          </p>
        </div>
      </div>

      <fieldset className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contrato
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Link pro contrato (Drive, Dropbox, etc.) e janela vigente.
          </p>
        </div>
        <Field label="URL do contrato">
          <input
            value={contractUrl ?? ""}
            onChange={(e) => setContractUrl(e.target.value || null)}
            placeholder="https://drive.google.com/..."
            className={input}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início do contrato">
            <input
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Fim do contrato">
            <input
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
              className={input}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <input
              type="number"
              step="0.01"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              placeholder="0,00"
              className={input}
            />
          </Field>
          <Field label="Termos de pagamento">
            <input
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ex: Mensal · todo dia 5"
              className={input}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Anotações privadas
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Histórico interno, contexto, alertas. Markdown simples é bem-vindo.
          </p>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Ex: cliente prefere chamadas após 18h · revisar paleta na próxima call · …"
          className={`${input} font-normal leading-relaxed`}
          style={{ resize: "vertical" }}
        />
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar dados internos"}
        </button>
      </div>
      {toast.node}
    </form>
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
