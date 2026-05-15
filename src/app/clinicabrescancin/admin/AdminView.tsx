"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ResponseRow = {
  id: string;
  createdAt: string;
  nomeCompleto: string;
  apelido: string | null;
  dataNascimento: string;
  genero: string;
  estadoCivil: string | null;
  profissao: string;
  temFilhos: boolean | null;
  pretendeFilhos: boolean | null;
  cidade: string;
  telefone: string;
  email: string;
  instagram: string | null;
  answers: Record<string, unknown>;
};

type FieldType = "text" | "list" | "bool" | "date" | "longtext";
type FieldDef = { key: string; label: string; type?: FieldType };
type Section = { title: string; fields: FieldDef[] };

const SECTIONS: Section[] = [
  {
    title: "Identificação",
    fields: [
      { key: "nomeCompleto", label: "Nome completo" },
      { key: "apelido", label: "Apelido" },
      { key: "dataNascimento", label: "Data de nascimento", type: "date" },
      { key: "genero", label: "Gênero" },
      { key: "estadoCivil", label: "Estado civil" },
      { key: "profissao", label: "Profissão" },
      { key: "temFilhos", label: "Tem filhos", type: "bool" },
      { key: "pretendeFilhos", label: "Pretende ter filhos", type: "bool" },
      { key: "cidade", label: "Cidade" },
      { key: "telefone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "instagram", label: "Instagram" },
    ],
  },
  {
    title: "Saúde geral",
    fields: [
      { key: "doencasDiagnosticadas", label: "Doenças diagnosticadas", type: "list" },
      { key: "saudeMae", label: "Saúde da mãe", type: "list" },
      { key: "saudePai", label: "Saúde do pai", type: "list" },
      { key: "usaMedicamentos", label: "Usa medicamento contínuo" },
      { key: "quaisMedicamentos", label: "Qual(is) medicamento(s)", type: "longtext" },
      { key: "usaSuplementos", label: "Usa suplementos" },
      { key: "quaisSuplementos", label: "Qual(is) suplemento(s)", type: "longtext" },
      { key: "usaEsteroides", label: "Usa esteroides anabolizantes" },
      { key: "usaTestosterona", label: "Usa testosterona" },
      { key: "usaMedSonoAnsiedade", label: "Usa medicamento para sono/ansiedade" },
      { key: "quaisMedSonoAnsiedade", label: "Qual(is) sono/ansiedade", type: "longtext" },
      { key: "alergiaMedicamento", label: "Alergia a medicamento" },
      { key: "qualAlergia", label: "Qual alergia" },
      { key: "alergiaAmbiental", label: "Alergia ambiental" },
      { key: "fezCirurgia", label: "Já fez cirurgia" },
      { key: "qualCirurgia", label: "Qual cirurgia", type: "longtext" },
      { key: "hospitalizadoUltimoAno", label: "Hospitalizado no último ano" },
      { key: "teveCovidDengue", label: "Teve Covid ou Dengue" },
      { key: "qualCovidDengue", label: "Qual e quando" },
      { key: "fuma", label: "Fuma" },
      { key: "frequenciaAlcool", label: "Frequência de álcool" },
    ],
  },
  {
    title: "Estilo de vida",
    fields: [
      { key: "atividadeFisica", label: "Pratica atividade física" },
      { key: "qualAtividadeFisica", label: "Qual e frequência", type: "longtext" },
      { key: "qualidadeSono", label: "Qualidade do sono" },
      { key: "nivelEstresse", label: "Nível de estresse" },
    ],
  },
  {
    title: "Cabelo",
    fields: [
      { key: "queixaCapilar", label: "Queixa capilar", type: "list" },
      { key: "tempoQueixa", label: "Tempo da queixa" },
      { key: "tipoQueda", label: "Tipo de queda" },
      { key: "eventosAssociados", label: "Eventos associados", type: "list" },
      { key: "historicoFamiliarQueda", label: "Histórico familiar" },
      { key: "quemHistorico", label: "Por parte de quem" },
      { key: "tratamentosAnteriores", label: "Tratamentos anteriores", type: "longtext" },
      { key: "usouMinoxidilFinasterida", label: "Usou Minoxidil/Finasterida" },
      { key: "quaisTempoUso", label: "Qual(is) e tempo de uso", type: "longtext" },
      { key: "examesSanguineRecentes", label: "Exames de sangue recentes" },
    ],
  },
  {
    title: "Sobrancelhas",
    fields: [
      { key: "temQueixaSobrancelha", label: "Tem queixa em sobrancelha" },
      { key: "queixaSobrancelha", label: "Queixa específica", type: "list" },
      { key: "procedimentoSobrancelhaAnterior", label: "Procedimento anterior" },
      { key: "qualProcedimento", label: "Qual e quando", type: "longtext" },
    ],
  },
  {
    title: "Fechamento",
    fields: [
      { key: "principalIncomodo", label: "Principal incômodo", type: "longtext" },
      { key: "duvidaConsulta", label: "Dúvida para a consulta", type: "longtext" },
      { key: "comoConheceu", label: "Como conheceu", type: "list" },
    ],
  },
];

function getRawValue(row: ResponseRow, key: string): unknown {
  if (key in row) {
    return (row as unknown as Record<string, unknown>)[key];
  }
  return row.answers[key];
}

function formatValue(value: unknown, type?: FieldType): string {
  if (value === null || value === undefined) return "Não informado";
  if (type === "list") {
    if (!Array.isArray(value) || value.length === 0) return "Não informado";
    return value.join(", ");
  }
  if (type === "bool") {
    if (value === true) return "Sim";
    if (value === false) return "Não";
    return "Não informado";
  }
  if (type === "date") {
    if (typeof value !== "string" || !value) return "Não informado";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Não informado";
    return d.toLocaleDateString("pt-BR");
  }
  if (typeof value === "string") {
    return value.trim() === "" ? "Não informado" : value;
  }
  return String(value);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateOnly(iso: string): string {
  // YYYY-MM-DD da timestamp em horário local
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
    .replace(/[\u0300-\u036f]/g, "");
}

export default function AdminView({ rows }: { rows: ResponseRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const openRow = filtered.find((r) => r.id === openId) || null;

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/clinicabrescancin/admin/logout", { method: "POST" });
    } catch {
      /* ignora — vamos redirecionar de qualquer jeito */
    }
    router.replace("/clinicabrescancin/admin/login");
    router.refresh();
  }

  return (
    <div className="brescancin-admin">
      <header className="brescancin-admin-header">
        <div>
          <h1 className="brescancin-brand" style={{ margin: 0, textAlign: "left" }}>
            Clínica Brescancin
          </h1>
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
          <label className="brescancin-label" htmlFor="search">Buscar por nome</label>
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
          <label className="brescancin-label" htmlFor="from">De</label>
          <input
            id="from"
            type="date"
            className="brescancin-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="brescancin-field" style={{ margin: 0, flex: "1 1 160px" }}>
          <label className="brescancin-label" htmlFor="to">Até</label>
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
                <th aria-label="Abrir"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id)}>
                  <td>
                    <div>{r.nomeCompleto}</div>
                    {r.apelido && (
                      <div className="brescancin-admin-sub">{r.apelido}</div>
                    )}
                  </td>
                  <td>{r.cidade}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td className="brescancin-admin-chevron">Ver →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openRow && (
        <>
          <div
            className="brescancin-drawer-overlay"
            onClick={() => setOpenId(null)}
            aria-hidden
          />
          <aside className="brescancin-drawer" role="dialog" aria-label="Detalhes da resposta">
            <header className="brescancin-drawer-header">
              <div>
                <div className="brescancin-drawer-name">{openRow.nomeCompleto}</div>
                <div className="brescancin-drawer-meta">
                  Recebido em {formatDateTime(openRow.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className="brescancin-btn-ghost"
                onClick={() => setOpenId(null)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>
            <div className="brescancin-drawer-body">
              {SECTIONS.map((section) => (
                <div key={section.title} className="brescancin-drawer-section">
                  <h3 className="brescancin-block-title">{section.title}</h3>
                  <dl className="brescancin-drawer-list">
                    {section.fields.map((f) => (
                      <div key={f.key} className="brescancin-drawer-item">
                        <dt>{f.label}</dt>
                        <dd>{formatValue(getRawValue(openRow, f.key), f.type)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
