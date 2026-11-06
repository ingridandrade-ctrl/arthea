import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// Cifra das chaves dos clientes (token do CRM, token do Meta).
// AES-256-GCM. A chave vem de RASTREAMENTO_CHAVE_CIFRA (32 bytes em base64)
// ou, se não existir, é derivada do NEXTAUTH_SECRET com HKDF — assim funciona
// sem configuração nova. Atenção: trocar o NEXTAUTH_SECRET (sem definir
// RASTREAMENTO_CHAVE_CIFRA com a chave antiga) invalida as chaves guardadas,
// que precisam ser cadastradas de novo.

const VERSAO = "v1";

function chave(): Buffer {
  const explicita = process.env.RASTREAMENTO_CHAVE_CIFRA;
  if (explicita) {
    const k = Buffer.from(explicita, "base64");
    if (k.length !== 32) throw new Error("RASTREAMENTO_CHAVE_CIFRA precisa ter 32 bytes em base64");
    return k;
  }
  const segredo = process.env.NEXTAUTH_SECRET;
  if (!segredo) throw new Error("Sem NEXTAUTH_SECRET nem RASTREAMENTO_CHAVE_CIFRA para cifrar as chaves");
  return Buffer.from(hkdfSync("sha256", segredo, "arthea-rastreamento", "chaves-de-clientes", 32));
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return [VERSAO, iv.toString("base64"), tag.toString("base64"), dados.toString("base64")].join(":");
}

export function decifrar(cifrado: string): string {
  const [versao, iv, tag, dados] = cifrado.split(":");
  if (versao !== VERSAO || !iv || !tag || !dados) throw new Error("Formato de chave cifrada desconhecido");
  const d = createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(dados, "base64")), d.final()]).toString("utf8");
}
