"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, type ResponseRow } from "./_sections";

export type { ResponseRow };

function dateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function AdminView({ rows }: { rows: ResponseRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return rows.filter((r) => {
      if (q && !normalize(r.nomeCompleto).includes(q)) return false;
      const day = dateOnly(r.createdAt);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    });
  }, [rows, query, dateFrom, dateTo]);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/clinicabrescancin/admin/logout", { method: "POST" });
    } catch {
      /* ignora */
    }
    router.replace("/clinicabrescancin/admin/login");
    router.refresh();
  }

  async function handleDelete(e: React.MouseEvent, row: ResponseRow) {
    e.stopPropagation();
    if (deletingId) return;
    const ok = window.confirm(
      `Excluir definitivamente a resposta de ${row.nomeCompleto}? Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/clinicabrescancin/responses/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        window.alert("Não foi possível excluir. Tente novamente.");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Sem conexão. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }

  function openPatient(row: ResponseRow) {
    router.push(`/clinicabrescancin/admin/${row.id}`);
  }

  return (
    <div className="brescancin-admin">
      <header className="brescancin-admin-header">
        <div>
          <h1 className="brescancin-admin-brand">Clínica Brescancin</h1>
          <p className="brescancin-admin-count">
            {rows.length} {rows.length === 1 ? "resposta" : "respostas"} no total
            {filtered.length !== rows.length
              ? ` · ${filtered.length} no filtro`
              : ""}
          </p>
        </div>
        <div className="brescancin-admin-actions">
          <a
            className="brescancin-btn-primary"
            href="/api/clinicabrescancin/export"
          >
            Exportar Excel
          </a>
          <button
            type="button"
            className="brescancin-btn-ghost"
            onClick={logout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </header>

      <section className="brescancin-admin-filters">
        <div className="brescancin-field" style={{ margin: 0, flex: "2 1 240px" }}>
          <label className="brescancin-label" htmlFor="search">
            Buscar por nome
          </label>
          <input
            id="search"
            type="search"
            className="brescancin-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do paciente"
          />
        </div>
        <div className="brescancin-field" style={{ margin: 0, flex: "1 1 160px" }}>
          <label className="brescancin-label" htmlFor="from">
            De
          </label>
          <input
            id="from"
            type="date"
            className="brescancin-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="brescancin-field" style={{ margin: 0, flex: "1 1 160px" }}>
          <label className="brescancin-label" htmlFor="to">
            Até
          </label>
          <input
            id="to"
            type="date"
            className="brescancin-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="brescancin-card" style={{ textAlign: "center" }}>
          <p className="brescancin-body" style={{ marginTop: 0 }}>
            {rows.length === 0
              ? "Nenhuma resposta recebida ainda."
              : "Nenhuma resposta bate com o filtro."}
          </p>
        </div>
      ) : (
        <div className="brescancin-admin-table-wrap">
          <table className="brescancin-admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Data de envio</th>
                <th aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => openPatient(r)}>
                  <td>
                    <div>{r.nomeCompleto}</div>
                    {r.apelido && (
                      <div className="brescancin-admin-sub">{r.apelido}</div>
                    )}
                  </td>
                  <td>{r.cidade}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td className="brescancin-admin-row-actions">
                    <button
                      type="button"
                      className="brescancin-admin-delete"
                      onClick={(e) => handleDelete(e, r)}
                      disabled={deletingId === r.id}
                      aria-label={`Excluir ${r.nomeCompleto}`}
                      title="Excluir"
                    >
                      ✕
                    </button>
                    <span className="brescancin-admin-chevron">Abrir →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
