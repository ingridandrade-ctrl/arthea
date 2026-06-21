"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, ExternalLink, MessageCircle } from "lucide-react";
import type { SceneTheme, SceneStatus } from "@prisma/client";
import { SCENE_THEMES, SCENE_THEME_KEYS } from "@/lib/scenes";
import { Modal } from "@/components/ui/modal";

type Scene = {
  id: string;
  theme: SceneTheme;
  order: number;
  characters: string;
  type: string;
  work: string;
  context: string;
  sceneAndQuote: string;
  platform: string | null;
  videoLink: string | null;
  hook: string | null;
  clinicalAngle: string;
  status: SceneStatus;
  scriptText: string | null;
  _count?: { comments: number };
};

const STATUS_LABEL: Record<SceneStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Reprovada",
};

const input =
  "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function AcervoTab({ clientId, scenes }: { clientId: string; scenes: Scene[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Scene | null>(null);
  const [creatingTheme, setCreatingTheme] = useState<SceneTheme | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function deleteScene(id: string) {
    if (!confirm("Excluir essa cena? Não dá pra desfazer.")) return;
    await fetch(`/api/admin/scenes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function importSeed() {
    if (!confirm("Importar as 24 cenas iniciais do briefing? (Só funciona se a lista estiver vazia.)")) return;
    setSeeding(true);
    const res = await fetch(`/api/admin/scenes/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    setSeeding(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Erro ao importar");
    }
  }

  const grouped: Record<SceneTheme, Scene[]> = SCENE_THEME_KEYS.reduce(
    (acc, key) => {
      acc[key] = scenes.filter((s) => s.theme === key);
      return acc;
    },
    {} as Record<SceneTheme, Scene[]>,
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium mb-1">Módulo Acervo de cenas</p>
          <p>
            Cenas de filmes e séries organizadas por tema clínico. O cliente vê, aprova/reprova e
            escreve roteiros direto. Todo mundo edita: você e a Karol cadastram, o André comenta e
            aprova.
          </p>
        </div>
        {scenes.length === 0 && (
          <button
            onClick={importSeed}
            disabled={seeding}
            className="px-4 py-2 bg-amber-900 text-white rounded-lg text-xs font-medium disabled:opacity-60 whitespace-nowrap"
          >
            {seeding ? "Importando…" : "Importar 24 cenas iniciais"}
          </button>
        )}
      </div>

      {SCENE_THEME_KEYS.map((themeKey) => {
        const themeInfo = SCENE_THEMES[themeKey];
        const themeScenes = grouped[themeKey];
        return (
          <section key={themeKey} className="space-y-3">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: themeInfo.color }}
                />
                <h3 className="text-base font-semibold">
                  {themeInfo.order}. {themeInfo.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {themeScenes.length} {themeScenes.length === 1 ? "cena" : "cenas"}
                </span>
              </div>
              <button
                onClick={() => setCreatingTheme(themeKey)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted transition"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar cena
              </button>
            </header>

            {themeScenes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-3 py-4 border border-dashed border-border rounded-lg">
                Nenhuma cena cadastrada nesse tema ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {themeScenes.map((s) => (
                  <div
                    key={s.id}
                    className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3"
                    style={{ borderLeft: `3px solid ${themeInfo.color}` }}
                  >
                    <div
                      className="w-8 h-8 rounded font-mono text-xs font-semibold flex items-center justify-center flex-shrink-0"
                      style={{ background: `${themeInfo.color}1A`, color: themeInfo.color }}
                    >
                      {String(s.order).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {s.characters}{" "}
                        <span className="text-muted-foreground font-normal">
                          · {s.type} · {s.work.split("·")[0].trim()}
                        </span>
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <StatusBadge status={s.status} hasScript={!!s.scriptText} />
                        {s.videoLink && (
                          <a
                            href={s.videoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-3 h-3" /> vídeo
                          </a>
                        )}
                        {s._count && s._count.comments > 0 && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MessageCircle className="w-3 h-3" /> {s._count.comments}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(s)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteScene(s.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {(editing || creatingTheme) && (
        <SceneModal
          clientId={clientId}
          editing={editing}
          theme={editing?.theme || creatingTheme!}
          onClose={() => {
            setEditing(null);
            setCreatingTheme(null);
          }}
          onSaved={() => {
            setEditing(null);
            setCreatingTheme(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({
  status,
  hasScript,
}: {
  status: SceneStatus;
  hasScript: boolean;
}) {
  const isWithScript = status === "APPROVED" && hasScript;
  const label = isWithScript ? "Com roteiro" : STATUS_LABEL[status];
  const bg = isWithScript
    ? "#E0E7FF"
    : status === "APPROVED"
      ? "#D1FAE5"
      : status === "REJECTED"
        ? "#FEE2E2"
        : "#EDE9E0";
  const fg = isWithScript
    ? "#3730A3"
    : status === "APPROVED"
      ? "#065F46"
      : status === "REJECTED"
        ? "#991B1B"
        : "#6B7280";
  return (
    <span
      className="px-2 py-0.5 rounded-full font-medium"
      style={{ background: bg, color: fg, fontSize: 10.5 }}
    >
      {label}
    </span>
  );
}

function SceneModal({
  clientId,
  editing,
  theme,
  onClose,
  onSaved,
}: {
  clientId: string;
  editing: Scene | null;
  theme: SceneTheme;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      ...(editing ? {} : { clientId }),
      theme,
      characters: fd.get("characters"),
      type: fd.get("type"),
      work: fd.get("work"),
      context: fd.get("context"),
      sceneAndQuote: fd.get("sceneAndQuote"),
      platform: fd.get("platform") || null,
      videoLink: fd.get("videoLink") || null,
      hook: fd.get("hook") || null,
      clinicalAngle: fd.get("clinicalAngle"),
      status: fd.get("status"),
    };
    const res = editing
      ? await fetch(`/api/admin/scenes/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch(`/api/admin/scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erro ao salvar");
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title={editing ? "Editar cena" : `Nova cena · ${SCENE_THEMES[theme].label}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Casal / Personagem *">
            <input
              name="characters"
              required
              defaultValue={editing?.characters || ""}
              className={input}
              placeholder="Ex: Brooke & Gary"
            />
          </Field>
          <Field label="Tipo">
            <select
              name="type"
              defaultValue={editing?.type || "Filme"}
              className={input}
            >
              <option value="Filme">Filme</option>
              <option value="Série">Série</option>
            </select>
          </Field>
        </div>

        <Field label="Obra + plataforma *">
          <input
            name="work"
            required
            defaultValue={editing?.work || ""}
            className={input}
            placeholder="The Break-Up (2006) · Prime Video"
          />
        </Field>

        <Field label="Contexto">
          <textarea
            name="context"
            rows={3}
            defaultValue={editing?.context || ""}
            className={input}
            placeholder="Quem são, o que vivem, o que o público já conhece deles…"
          />
        </Field>

        <Field label="Cena + fala icônica *">
          <textarea
            name="sceneAndQuote"
            required
            rows={3}
            defaultValue={editing?.sceneAndQuote || ""}
            className={input}
            placeholder="Descreva a cena e cole a fala chave"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Plataforma (timestamp)">
            <input
              name="platform"
              defaultValue={editing?.platform || ""}
              className={input}
              placeholder="Prime Video: primeira meia hora"
            />
          </Field>
          <Field label="Link YouTube / Dailymotion">
            <input
              name="videoLink"
              defaultValue={editing?.videoLink || ""}
              className={`${input} font-mono text-xs`}
              placeholder="https://..."
            />
          </Field>
        </div>

        <Field label="Gancho (primeiros 3 segundos)">
          <input
            name="hook"
            defaultValue={editing?.hook || ""}
            className={input}
            placeholder="Pergunta ou frase de abertura"
          />
        </Field>

        <Field label="Ângulo clínico *">
          <textarea
            name="clinicalAngle"
            required
            rows={3}
            defaultValue={editing?.clinicalAngle || ""}
            className={input}
            placeholder="A leitura clínica — sem diagnosticar, sem rotular"
          />
        </Field>

        <Field label="Status">
          <select
            name="status"
            defaultValue={editing?.status || "PENDING"}
            className={input}
          >
            <option value="PENDING">Pendente</option>
            <option value="APPROVED">Aprovada</option>
            <option value="REJECTED">Reprovada</option>
          </select>
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60 hover:opacity-90 transition"
          >
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar cena"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
