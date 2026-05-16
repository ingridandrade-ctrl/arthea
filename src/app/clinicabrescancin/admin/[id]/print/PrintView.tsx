"use client";

import { useEffect } from "react";
import {
  SECTIONS,
  formatConsultaDate,
  formatDateTime,
  getRawValue,
  renderValue,
  computeAge,
  type FieldDef,
  type ResponseRow,
} from "../../_sections";

function PrintFieldBlock({
  field,
  row,
  depth = 0,
}: {
  field: FieldDef;
  row: ResponseRow;
  depth?: number;
}) {
  return (
    <div
      className={
        depth === 0
          ? "brescancin-print-item"
          : "brescancin-print-item brescancin-print-item-sub"
      }
    >
      <dt>{field.label}</dt>
      <dd>{renderValue(getRawValue(row, field.key), field.type)}</dd>
      {field.followups && field.followups.length > 0 && (
        <div className="brescancin-print-followups">
          {field.followups.map((sub) => (
            <PrintFieldBlock
              key={sub.key}
              field={sub}
              row={row}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrintView({ row }: { row: ResponseRow }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  const notes =
    typeof row.answers.adminNotes === "string"
      ? (row.answers.adminNotes as string).trim()
      : "";
  const dataConsulta =
    typeof row.answers.dataConsulta === "string"
      ? (row.answers.dataConsulta as string)
      : null;
  const age = computeAge(row.dataNascimento);

  return (
    <div className="brescancin-print">
      <header className="brescancin-print-header">
        <div>
          <p className="brescancin-print-brand">Clínica Brescancin</p>
          <p className="brescancin-print-tag">
            Excelência em Restauração Capilar
          </p>
        </div>
        <div className="brescancin-print-meta">
          <p>
            <strong>Recebido em:</strong> {formatDateTime(row.createdAt)}
          </p>
          {dataConsulta && (
            <p>
              <strong>Consulta:</strong> {formatConsultaDate(dataConsulta)}
            </p>
          )}
        </div>
      </header>

      <h1 className="brescancin-print-title">{row.nomeCompleto}</h1>
      <p className="brescancin-print-subtitle">
        {row.apelido ? `${row.apelido} · ` : ""}
        {age != null ? `${age} anos · ` : ""}
        {row.cidade} · {row.telefone}
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} className="brescancin-print-section">
          <h2>{section.title}</h2>
          <dl className="brescancin-print-list">
            {section.fields.map((f) => (
              <PrintFieldBlock key={f.key} field={f} row={row} />
            ))}
          </dl>
        </section>
      ))}

      {notes && (
        <section className="brescancin-print-section brescancin-print-notes">
          <h2>Observações da equipe</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{notes}</p>
        </section>
      )}

      <footer className="brescancin-print-footer">
        Ficha gerada em {new Date().toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
