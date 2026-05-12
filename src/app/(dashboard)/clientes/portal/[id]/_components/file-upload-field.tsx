"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, Image as ImageIcon } from "lucide-react";

export function FileUploadField({
  label,
  initialUrl,
  accept = ".pdf,image/*",
  hint,
  name,
}: {
  label: string;
  initialUrl?: string | null;
  accept?: string;
  hint?: string;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState<string | null>(
    initialUrl ? initialUrl.split("/").pop() || null : null
  );

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao enviar.");
      } else {
        setUrl(data.url);
        setFilename(data.name);
      }
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl(null);
    setFilename(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const isImage = url && /\.(png|jpe?g|webp|gif|svg)$/i.test(url);

  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
      <input type="hidden" name={name} value={url || ""} />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="hidden"
      />
      {url ? (
        <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
          {isImage ? (
            <img src={url} alt="" className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{filename || "Arquivo"}</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Ver / baixar
            </a>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Trocar
          </button>
          <button
            type="button"
            onClick={clear}
            className="p-1 text-muted-foreground hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition flex flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          {uploading ? (
            <span className="text-sm">Enviando...</span>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">
                Clique para enviar arquivo
              </span>
              {hint && <span className="text-xs">{hint}</span>}
            </>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
