import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";

// Upload de arquivos do portal — usado pelo cliente (CLIENT) e também
// admin/manager quando edita dossiê em nome do cliente.
// Mesma lógica de /api/admin/upload, com auth mais permissiva e prefix
// próprio. Aceita fontes (otf/ttf/woff/woff2) além dos tipos do admin.

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  // fontes — tipos modernos
  "font/otf",
  "font/ttf",
  "font/woff",
  "font/woff2",
  "font/collection",
  // fontes — tipos legados que alguns browsers ainda enviam
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/vnd.ms-fontobject",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "gif",
  "otf",
  "ttf",
  "woff",
  "woff2",
  "eot",
]);

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Vercel Blob não habilitado." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo grande demais. Limite: 10 MB." }, { status: 400 });
  }

  // Valida por MIME ou pela extensão — alguns navegadores não preenchem
  // file.type pra fontes; aí caímos no fallback de extensão.
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const typeOk = !file.type || ALLOWED_TYPES.has(file.type);
  const extOk = ALLOWED_EXTENSIONS.has(ext);
  if (!typeOk && !extOk) {
    return NextResponse.json(
      { error: "Tipo de arquivo não permitido. Use PDF, imagem ou fonte (TTF/OTF/WOFF)." },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-").replace(/-+/g, "-");
  const path = `portal/${userId}/${Date.now()}-${safeName}`;

  const blob = await put(path, file, { access: "public", addRandomSuffix: false });
  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    type: file.type,
    name: file.name,
  });
}
