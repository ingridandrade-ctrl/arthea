# Integrações externas

Mapa das integrações de plataformas terceiras que a Arthea usa (ou pretende usar).
**Este arquivo NÃO contém credenciais** — só onde encontrá-las e como configurar.

---

## Google Ads

**Status:** credenciais geradas, ainda não conectada no app.

- **OAuth Client ID + Secret:** gerados no Google Cloud Console (projeto da Arthea), no Client OAuth `1056079046828-tbhvh...`
- **Refresh token:** gerado em **mai/2026** pelo script `scripts/google_ads_refresh_token.py`, scope `https://www.googleapis.com/auth/adwords`
- **Onde estão guardados:** **Apple Notes da Ingrid** — buscar pela entrada **"Google Ads — Arthea"**

### Pra conectar a integração no app

1. Gerar um **Developer Token** no Google Ads Manager (https://ads.google.com/aw/apicenter)
2. Cadastrar as 4 env vars na Vercel (Settings → Environment Variables):
   - `GOOGLE_ADS_CLIENT_ID`
   - `GOOGLE_ADS_CLIENT_SECRET`
   - `GOOGLE_ADS_REFRESH_TOKEN`
   - `GOOGLE_ADS_DEVELOPER_TOKEN`
3. Implementar rotas em `src/lib/google-ads/` e dashboard de tráfego adicionar bloco Google ao lado do Meta.

### Pra rotacionar credenciais

- **Client Secret:** Google Cloud Console → Credentials → Client OAuth → adicionar nova secret, atualizar Vercel, deletar a antiga. Refresh token continua válido após rotação.
- **Refresh token:** rodar `scripts/google_ads_refresh_token.py` de novo (precisa env vars + redirect URI `http://localhost:8080/oauth2callback` cadastrado no Cloud Console).

---

## Meta Ads (Facebook Business)

**Status:** ✅ conectada.

- **OAuth próprio dentro do app** — admin conecta a conta Meta em `/clientes/meta` e o access token é salvo no banco em `MetaConnection`.
- Cada conta de anúncios pode ser linkada a um `ClientEngagement` específico (relação `MetaAdAccount.engagementId`).
- Métricas aparecem no dashboard `/portal/[engagement]` quando type=PAID_TRAFFIC.

### Env vars necessárias (Vercel)
- `META_APP_ID`
- `META_APP_SECRET`
- `META_OAUTH_REDIRECT_URI` *(opcional — default infere do host)*

### Código relevante
- `src/lib/meta/api.ts` — wrappers da Graph API
- `src/app/api/meta/oauth/*` — fluxo OAuth (callback, disconnect)
- `src/app/api/meta/dashboard/route.ts` — agregação dos insights

---

## Vercel Blob (uploads)

**Status:** ✅ conectada.

- Usada pra armazenar logos, contratos, manuais de marca, fontes — qualquer upload do admin ou do cliente.
- Token configurado automaticamente pela Vercel (env var `BLOB_READ_WRITE_TOKEN`) quando o Blob store está habilitado.

### Rotas
- `POST /api/admin/upload` — admin/manager (`src/app/api/admin/upload/route.ts`)
- `POST /api/portal/upload` — cliente (`src/app/api/portal/upload/route.ts`)

---

## Como adicionar uma integração nova

1. Documenta aqui: status, onde guardar credenciais, env vars necessárias, código relevante.
2. Credenciais reais ficam no cofre pessoal da Ingrid + env vars na Vercel — **nunca no código nem em arquivos commitados**.
3. Se precisar gerar tokens via OAuth localhost (igual fizemos pro Google Ads), criar script em `scripts/` e adicionar `scripts/.*_token` no `.gitignore` pra prevenir vazamento acidental.
