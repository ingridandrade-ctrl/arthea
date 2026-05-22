# site-psiandreborges

Site institucional do psicólogo André Borges, recriado a partir do projeto que
estava na Lovable. Next.js 14 (App Router) + Tailwind CSS, em um único arquivo
de página com componentes por seção.

## Como rodar

```bash
cd site-psiandreborges
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Como publicar

Recomendado: subir esta pasta para um repositório próprio (separado do
`arthea`) e ligar à Vercel. Apontar o domínio `psiandreborges.arthea.com.br`
para o projeto da Vercel.

```bash
# dentro da pasta site-psiandreborges
git init
git add .
git commit -m "init"
git remote add origin <url-do-novo-repo>
git push -u origin main
```

Na Vercel: New Project → escolha o repo → Framework: Next.js → Deploy.

## Estrutura

```
src/
  app/
    layout.tsx       # fontes (Cormorant Garamond + Inter) e metadata
    page.tsx         # monta as seções na ordem
    globals.css      # tokens de design (eyebrow, accent, cards, marquee)
  components/
    TopBar.tsx       # "André Borges · Psicólogo"  /  "Pirassununga · SP"
    Hero.tsx         # título grande + CTA
    Marquee.tsx      # tira animada com palavras-chave
    ContrastSection.tsx   # "Nunca se falou tanto..."
    PhrasesGrid.tsx       # 8 frases que aparecem nas primeiras sessões
    HistoryIntro.tsx      # "A maioria das histórias..."
    WhyDifferent.tsx      # 4 diferenciais
    About.tsx             # foto + texto longo do André
    Services.tsx          # 3 portas (individual / casal / clareza)
    Testimonials.tsx      # 3 depoimentos
    FAQ.tsx               # 6 perguntas com accordion
    FinalCTA.tsx          # "O relacionamento que você quer ainda existe"
    Footer.tsx            # CRP / direitos reservados
public/
  images/            # ver README de dentro da pasta
```

## Editar conteúdo

Cada componente tem o texto em arrays/JSX no topo do arquivo. Para mudar:

- **Frases** das primeiras sessões → `src/components/PhrasesGrid.tsx`
- **Diferenciais** → `src/components/WhyDifferent.tsx`
- **Serviços** → `src/components/Services.tsx`
- **Depoimentos** → `src/components/Testimonials.tsx`
- **FAQ** → `src/components/FAQ.tsx`
- **Bio do André** → `src/components/About.tsx`

## Design tokens (Tailwind)

Definidos em `tailwind.config.ts`:

- `bg-ink` / `text-cream` — navy escuro e creme
- `text-gold` / `bg-gold` — dourado de acento
- `.accent` — itálico em dourado para palavras-chave dos títulos
- `.eyebrow` — rótulo CAPS com tracking largo
- `.card-light` / `.card-quote-dark` / `.card-quote-gold`
- `.btn-primary` — pílula dourada com seta

## CRP

O footer está com `CRP /` (sem número). Edite em
`src/components/Footer.tsx` quando tiver o número correto.

## WhatsApp

O botão final em `FinalCTA.tsx` aponta para `https://wa.me/` — substitua pelo
número completo com DDI (ex.: `https://wa.me/5519999999999`).
