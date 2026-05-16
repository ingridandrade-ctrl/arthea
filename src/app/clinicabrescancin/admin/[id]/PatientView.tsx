"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SECTIONS,
  formatDateTime,
  getRawValue,
  renderValue,
  computeAge,
  type ResponseRow,
} from "../_sections";

export default function PatientView({ row }: { row: ResponseRow }) {
  const router = useRouter();
  const initialNotes =
    typeof row.answers.adminNotes === "string"
      ? (row.answers.adminNotes as string)
      : "";
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dirty = notes !== savedNotes;

  const age = computeAge(row.dataNascimento);
  const greetingName = row.apelido?.trim() || row.nomeCompleto.split(/\s+/)[0];

  async function saveNotes() {
    if (isSaving || !dirty) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clinicabrescancin/responses/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        window.alert("Não foi possível salvar as observações.");
        return;
      }
      setSavedNotes(notes);
      setSavedAt(Date.now());
    } catch {
      window.alert("Sem conexão. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    const ok = window.confirm(
      `Excluir definitivamente a resposta de ${row.nomeCompleto}? Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clinicabrescancin/responses/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        window.alert("Não foi possível excluir. Tente novamente.");
        return;
      }
      router.replace("/clinicabrescancin/admin");
      router.refresh();
    } catch {
      window.alert("Sem conexão. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  function openPrint() {
    if (dirty) {
      const ok = window.confirm(
        "Você tem observações não salvas. Salvar antes de exportar?",
      );
      if (ok) {
        saveNotes().then(() => {
          window.open(
            `/clinicabrescancin/admin/${row.id}/print`,
            "_blank",
            "noopener,noreferrer",
          );
        });
        return;
      }
    }
    window.open(
      `/clinicabrescancin/admin/${row.id}/print`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="brescancin-patient">
      <div className="brescancin-patient-topbar">
        <Link
          href="/clinicabrescancin/admin"
          className="brescancin-btn-ghost brescancin-patient-back"
        >
          ← Lista de pacientes
        </Link>
        <div className="brescancin-patient-actions">
          <button
            type="button"
            className="brescancin-btn-primary"
            onClick={openPrint}
          >
            Exportar PDF
          </button>
          <button
            type="button"
            className="brescancin-btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>

      <header className="brescancin-patient-header">
        <p className="brescancin-patient-eyebrow">Ficha do paciente</p>
        <h1 className="brescancin-patient-name">{row.nomeCompleto}</h1>
        <div className="brescancin-patient-meta">
          <span>{greetingName}</span>
          {age != null && <span>·</span>}
          {age != null && <span>{age} anos</span>}
          <span>·</span>
          <span>{row.cidade}</span>
          <span>·</span>
          <span>{row.telefone}</span>
        </div>
        <p className="brescancin-patient-received">
          Recebido em {formatDateTime(row.createdAt)}
        </p>
      </header>

      <section className="brescancin-patient-section">
        <div className="brescancin-patient-section-head">
          <h2>Observações da equipe</h2>
          {savedAt != null && (
            <span className="brescancin-patient-saved">
              Salvo às{" "}
              {new Date(savedAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <textarea
          className="brescancin-textarea brescancin-patient-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Espaço pra anotações internas da equipe sobre este paciente. Apenas vocês veem isso."
        />
        <div className="brescancin-patient-notes-actions">
          <button
            type="button"
            className="brescancin-btn-primary"
            onClick={saveNotes}
            disabled={!dirty || isSaving}
          >
            {isSaving ? "Salvando..." : dirty ? "Salvar observações" : "Salvo"}
          </button>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="brescancin-patient-section"
        >
          <div className="brescancin-patient-section-head">
            <h2>{section.title}</h2>
          </div>
          <dl className="brescancin-patient-list">
            {section.fields.map((f) => (
              <div key={f.key} className="brescancin-patient-item">
                <dt>{f.label}</dt>
                <dd>{renderValue(getRawValue(row, f.key), f.type)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
