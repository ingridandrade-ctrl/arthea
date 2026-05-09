import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/portal-auth";

// Limite de 10 MB pra arquivos
const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob não está habilitado. No painel da Vercel, vá em Storage → Create → Blob. O token é configurado automaticamente.",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Arquivo grande demais. Limite: 10 MB.` },
      { status: 400 }
    );
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não permitido. Use PDF, PNG, JPG, WebP, SVG ou GIF." },
      { status: 400 }
    );
  }

  // Generate a safe filename with timestamp prefix
  const safeName = file.name
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  const path = `portal/${Date.now()}-${safeName}`;

  const blob = await put(path, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    type: file.type,
    name: file.name,
  });
}
