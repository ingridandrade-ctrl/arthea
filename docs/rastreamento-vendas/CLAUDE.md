# Regras do projeto

Projeto: Rastreamento de vendas do WhatsApp para Meta Ads

Plataforma que lê as etapas do RD Station e envia Compra com valor e Lead qualificado ao Meta, ligando cada lead à campanha pelo código da mensagem. Conseguimos liberar isso pra vários CRM's?

> Adaptado em 2026-11-06: o projeto vive como um módulo da plataforma Arthea (este repositório), e não no Lovable. Veja "Decisões tomadas" em PROJETO.md.

## Com quem você fala

- Quem conversa com você não programa. Fale sem termos técnicos: nada de commit, branch, migration ou deploy no texto. Você faz a parte técnica.
- Escreva sempre em português do Brasil, inclusive nas linhas sobre o que você está fazendo.
- Pergunte só o que depende do cliente. O resto, decida com um padrão sensato e diga o que decidiu.
- Não invente regra de negócio: o que não estiver em PROJETO.md, pergunte.

## Como trabalhar

- Siga PLANO.md, uma etapa por vez. Ao terminar uma etapa:
  1. confira que o projeto compila (`npm run build`);
  2. envie as mudanças para a branch de trabalho da sessão (não direto para a main);
  3. mande o link da prévia gerada pela Vercel para essa branch e 2 ou 3 passos para testar na tela;
  4. pergunte se pode seguir para a próxima etapa.
- Publicar (levar para a main, que vai ao ar na plataforma Arthea): só quando a pessoa pedir.
- Não mexa no resto da plataforma (CRM, finanças, portais, páginas de clientes) além do mínimo que o módulo precisa, e avise quando precisar.

## Como o módulo é montado nesta plataforma

- Código: telas em `src/app/(dashboard)/clientes/rastreamento/` (menu Clientes → Rastreamento), rotas do servidor em `src/app/api/rastreamento/`, lógica em `src/lib/rastreamento/`. Botões principais usam `bg-primary text-primary-foreground` (não `var(--accent)`, que só existe no portal).
- Banco: é o Postgres que a plataforma já usa. Não crie outro banco, nem projeto no Supabase ou no Lovable. Tabelas e colunas novas entram só em `prisma/schema.prisma`: a publicação cria sozinha (`prisma db push`). Um arquivo em `prisma/migrations-manual/` só é preciso para transformar dados existentes. Os modelos do módulo começam com `Rastreamento`. Só mudanças que acrescentam; nunca apagar ou renomear o que existe, porque a publicação roda com `--accept-data-loss`. Não rode `prisma format` (reformata o arquivo inteiro). Nunca peça para a pessoa rodar SQL.
- Testar antes de enviar: dá para subir um Postgres local (`/usr/lib/postgresql/16/bin`), aplicar o banco com `prisma db push`, criar usuários de teste e rodar `next start` para testar rotas e telas.
- Isolamento por dono: o Prisma não usa RLS. Toda consulta do módulo filtra pelo usuário logado dono do cliente; nenhuma rota devolve dado de outro usuário. A etapa 9 testa isso.
- Login: reaproveite o login da agência que já existe (NextAuth). Não crie outro.
- Vários CRMs: a leitura do CRM fica em `src/lib/rastreamento/crm/`, um arquivo por CRM, todos com a mesma interface (buscar oportunidade, listar alteradas, validar webhook). O resto do módulo não sabe qual CRM é. RD Station primeiro; outros só quando a pessoa pedir.
- Meta: reaproveite `src/lib/meta/` e a versão da API já configurada (`META_GRAPH_VERSION`).
- Tarefas agendadas: como as existentes, uma rota em `src/app/api/cron/` protegida por `isAuthorizedCron`, chamada por um agendamento em `.github/workflows/`.
- Chaves da plataforma: diga o nome da chave e onde cadastrar (Vercel, Settings, Environment Variables). Nunca peça o valor no chat.
- Tokens de cada cliente (RD Station, Meta): cifrados no banco, lidos só no servidor, nunca devolvidos para a tela nem gravados em log. O telefone nunca vai em log.

## Fora do escopo

- Migrar o atendimento para a WhatsApp Cloud API: os clientes recusaram sair do app do celular.
- Capturar o ctwa_clid ou ler mensagens do WhatsApp: a plataforma não vê as conversas.
- Cadastrar o lead no RD Station automaticamente: o atendente continua cadastrando e preenchendo o código.
- Gerenciar campanhas, orçamentos ou públicos no Meta Ads.
- Garantir melhora de otimização, custo por lead ou taxa de correspondência no Meta.
- Declarar conformidade com a LGPD: o aviso ao lead e a base legal são de cada cliente.
