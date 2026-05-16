import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB por foto
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Upload de fotos não está disponível no momento." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Foto muito grande. Limite: 10 MB." },
      { status: 400 },
    );
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return NextResponse.json(
      { error: "Formato não suportado. Use JPG, PNG, WebP ou HEIC." },
      { status: 400 },
    );
  }

  const safeName = file.name
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const path = `brescancin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  try {
    const blob = await put(path, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json(
      { error: "Falha ao subir a foto. Tente novamente." },
      { status: 500 },
    );
  }
}
