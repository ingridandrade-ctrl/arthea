# Rastreamento de vendas do WhatsApp para Meta Ads

Plataforma que lê as etapas do RD Station e envia Compra com valor e Lead qualificado ao Meta, ligando cada lead à campanha pelo código da mensagem. Conseguimos liberar isso pra vários CRM's?

**Viabilidade:** complexa

Viável só como recorte. O atendimento fica no WhatsApp Business app, então o ctwa_clid não chega à plataforma e o vínculo com o anúncio depende do código de campanha que o atendente digita no RD Station. Os eventos vão ao Meta com telefone com hash, valor e moeda. A aceitação desses eventos sem a API oficial e a taxa de correspondência precisam ser testadas no Test Events do Meta antes de prometer melhora na otimização. O gatilho de mudança de etapa no RD Station ainda não está confirmado.

## Como funciona

O atendente conversa pelo WhatsApp Business app, cadastra o lead no RD Station e preenche o campo personalizado com o código da campanha que veio na mensagem pré-preenchida do anúncio. Quando ele move a oportunidade de etapa, o RD Station chama um endpoint de webhook nas funções do servidor do projeto. A função valida um segredo compartilhado, identifica o cliente pelo cadastro do projeto e busca a oportunidade na API do RD Station, lendo telefone, valor, moeda, etapa e código da campanha. A etapa é comparada com o mapeamento do cliente, que diz quais etapas valem Lead qualificado e quais valem Compra. Se vale, a função grava um evento no banco do projeto com event_id determinístico (id da oportunidade mais tipo), o que impede envio duplicado. O telefone é normalizado para E.164 e vira hash SHA-256 antes do envio. Outra função envia o evento à API de Conversões do Meta, no conjunto de dados do cliente, com valor, moeda e hash, e grava a resposta. Falhas ficam com status de erro e voltam à fila com espera crescente. Um job agendado a cada 15 minutos consulta oportunidades alteradas no RD Station, para cobrir webhook perdido ou plano sem webhook. O painel mostra, por cliente, eventos enviados, com erro e leads sem código de campanha, com botão de reenvio. Os tokens de cada cliente ficam cifrados no banco do projeto, lidos só pelas funções do servidor. Cada linha pertence a um usuário da agência, com RLS por proprietário, e o telefone nunca vai em log.

### Evento de venda, a cada mudança de etapa

1. **Cadastro** (RD Station CRM): O atendente cadastra o lead e preenche o código da campanha no campo personalizado.
2. **Etapa** (RD Station CRM): O atendente move a oportunidade e o RD Station chama o webhook do projeto.
3. **Validação** (Lovable): A função confere o segredo, lê a oportunidade e aplica o mapeamento de etapas do cliente.
4. **Envio** (API de Conversões do Meta): A função envia Compra com valor ou Lead qualificado, com telefone em hash, ao conjunto de dados.
5. **Painel** (Lovable): A agência vê o evento como enviado ou com erro e reenvia quando preciso.

### Reenvio e consulta de apoio, a cada 15 minutos

1. **Consulta** (RD Station CRM): O job lista oportunidades alteradas no RD Station e gera os eventos que o webhook não entregou.
2. **Reenvio** (API de Conversões do Meta): A função reenvia eventos com erro, com até 5 tentativas e espera crescente.
3. **Revisão** (Agência Arthea): A agência revisa no painel os eventos que esgotaram as tentativas.

## Antes de começar

- Confirmar permissão da Arthea no Business Manager de cada cliente para criar o token da API de Conversões no conjunto de dados.
- Obter o token da API do RD Station de cada cliente piloto e permissão para criar o webhook de mudança de etapa.
- Montar por cliente a tabela de etapas do funil que valem lead qualificado e compra, com o nome do campo de valor e do campo de código.
- Definir o código de campanha de cada anúncio e a mensagem pré-preenchida, com um responsável por treinar os atendentes.

## A confirmar

- Gatilho do RD Station: confirmar se o plano de cada cliente oferece webhook de mudança de etapa; sem ele, a plataforma consulta a API a cada 15 minutos.
- Dados no RD Station: conferir se o telefone do lead fica preenchido em todo cadastro e em que formato, pois o hash depende dele.
- Meta: confirmar se o conjunto de dados aceita Compra e Lead qualificado sem ctwa_clid e qual taxa de correspondência aparece no Test Events.
- Consentimento: confirmar se cada cliente avisa o lead sobre uso de dados em publicidade antes de enviar o telefone com hash ao Meta.

## Custos a revisar

Não é uma cotação. Confirme valores e consumo com os fornecedores.

- **Lovable: app, banco e funções:** A cotar
  - Consumo de banco e funções com até 5 clientes e 1.000 conversas por mês; falta cotar o plano e medir o uso no piloto.
  - Como cobra: Assinatura mais uso de banco e funções. Volume: Até 1.000 conversas por mês.
- **API de Conversões do Meta:** A cotar
  - Não há valor informado. Confirmar com a Meta se existe cobrança por evento enviado.
  - Como cobra: A confirmar com a Meta. Volume: Medir eventos enviados no piloto.
- **RD Station (API e webhook):** A cotar
  - Depende do plano de cada cliente; confirmar se o plano inclui API e webhook e se há limite de chamadas.
  - Como cobra: Assinatura do cliente no RD Station. Volume: Chamadas por etapa alterada; medir no piloto.

## Ferramentas

- **Lovable** (freemium, classificação indicativa a confirmar) — Hospeda o painel da agência, o banco do projeto, o login e as funções do servidor que recebem o webhook, calculam o evento e enviam ao Meta.
- **RD Station CRM** (paga, classificação indicativa a confirmar) — Fonte dos dados: etapa da oportunidade, valor, telefone e campo personalizado com o código da campanha. Dispara o webhook e responde às consultas da API.
- **API de Conversões do Meta** (gratuita, classificação indicativa a confirmar) — Recebe os eventos Compra com valor e Lead qualificado, com telefone com hash, valor e moeda, no conjunto de dados de cada cliente.
- **Meta Events Manager** (gratuita, classificação indicativa a confirmar) — Valida os envios na aba Test Events e mostra a taxa de correspondência durante o piloto.
- **Meta Business Manager** (gratuita, classificação indicativa a confirmar) — Dá à Arthea o acesso de parceiro para gerar o token da API de Conversões no conjunto de dados de cada cliente.

## Passo a passo

### 01. Definir códigos de campanha e coletar acessos do piloto

Com o cliente piloto, definir um código curto por campanha, colocar na mensagem pré-preenchida de cada anúncio e criar no RD Station o campo personalizado Código da campanha. Reunir o token do RD Station e o acesso ao conjunto de dados do Meta, combinando um canal seguro para recebê-los.

_RD Station CRM · Meta Business Manager_

### 02. Criar esqueleto com login, banco e telas de cliente

Criar login para usuários da agência e as tabelas clientes, mapeamento_etapas, eventos e leads_espelho, todas com RLS por proprietário. Criar a tela de cadastro de cliente com ID do conjunto de dados do Meta, campo de código da campanha e campo de valor do RD Station.

_Lovable_

### 03. Guardar credenciais e mapear etapas por cliente

Guardar o token do RD Station e o token do Meta de cada cliente cifrados no banco do projeto, legíveis só pelas funções do servidor, sem aparecer no front-end. Criar a tela que mapeia cada etapa do funil do cliente para Nenhum, Lead qualificado ou Compra.

_Lovable_

### 04. Criar o webhook do RD Station com validação

Criar o endpoint que recebe a mudança de etapa, rejeita chamadas sem o segredo compartilhado do cliente e busca a oportunidade na API do RD Station. Testar com um payload sintético, uma chamada sem segredo e um cliente inexistente.

_Lovable · RD Station CRM_

### 05. Montar o evento com hash e deduplicação

Aplicar o mapeamento de etapas, normalizar o telefone para E.164, gerar o hash SHA-256 e gravar o evento com event_id igual a id da oportunidade mais tipo. Leads sem código de campanha seguem o fluxo, marcados como sem código.

_Lovable_

### 06. Enviar eventos à API de Conversões com repetição

Criar a função que envia Compra com valor e moeda, e Lead qualificado, ao conjunto de dados do cliente. Aceitar o código de teste do Test Events, gravar a resposta do Meta e repetir falhas até 5 vezes com espera crescente antes de marcar como erro.

_Lovable · API de Conversões do Meta_

### 07. Criar consulta agendada de apoio ao webhook

Criar um job a cada 15 minutos que lista no RD Station as oportunidades alteradas, compara com leads_espelho e gera os eventos que o webhook não entregou, usando o mesmo event_id para não duplicar.

_Lovable · RD Station CRM_

### 08. Criar painel de eventos enviados e com erro

Criar o painel com filtro por cliente, tipo e status, lista de erros com a mensagem do Meta, contagem de leads sem código de campanha e botão de reenvio. Mostrar telefone mascarado.

_Lovable_

### 09. Testar acesso cruzado e logs

Com dois usuários sintéticos, confirmar que um não lê clientes, tokens nem eventos do outro. Confirmar que nenhum log, resposta de erro ou tela expõe token ou telefone completo.

_Lovable_

### 10. Validar no Test Events e rodar o piloto

Enviar eventos de teste de um cliente piloto, conferir no Test Events do Meta o recebimento, o valor e a taxa de correspondência, e registrar o resultado. Só então ligar os envios reais para o piloto, durante 2 semanas, comparando com as vendas do RD Station.

_Meta Events Manager · API de Conversões do Meta_

### 11. Treinar atendentes e ligar os demais clientes

Treinar os atendentes a preencher o código da campanha no cadastro e a mover a oportunidade de etapa no momento certo. Depois do piloto, cadastrar os outros clientes, até 5, um por vez, com o mapeamento de etapas de cada um.

_RD Station CRM_

## Prompts

### Esqueleto, login, tabelas e RLS

```
Crie um app para uma agência de marketing rastrear vendas feitas por WhatsApp e enviá-las ao Meta. Crie login para usuários da agência. Crie no banco do projeto as tabelas: clientes (id, user_id, nome, meta_dataset_id, rd_campo_codigo, rd_campo_valor, ativo), mapeamento_etapas (id, cliente_id, etapa_rd, tipo com valores nenhum, lead_qualificado ou compra), leads_espelho (id, cliente_id, rd_deal_id, telefone_hash, codigo_campanha, valor, moeda, etapa) e eventos (id, cliente_id, rd_deal_id, tipo, event_id único, status com valores pendente, enviado ou erro, tentativas, erro_msg, resposta_meta, criado_em). Ative RLS em todas, de modo que cada usuário só leia e altere linhas dos clientes que ele criou. Crie telas de lista e cadastro de clientes e a tela de mapeamento de etapas. Não use dados reais, use 2 clientes sintéticos. Não coloque nenhuma chave no front-end.
```

### Webhook do RD Station com validação

```
Crie uma função do servidor que recebe o webhook de mudança de etapa de oportunidade do RD Station. Identifique o cliente por um identificador na URL e compare o segredo compartilhado, guardado em segredos do servidor ou cifrado no banco, com o recebido; se não bater, responda 401 sem processar. Com o token do cliente, busque a oportunidade na API do RD Station e leia telefone, valor, moeda, etapa atual e o campo personalizado de código da campanha. Grave ou atualize leads_espelho. Procure a etapa em mapeamento_etapas e, se o tipo for diferente de nenhum, crie um evento pendente com event_id igual a rd_deal_id mais tipo, ignorando se já existir. Responda 200 rápido. Nunca registre token nem telefone completo em log. Teste com 3 payloads sintéticos: etapa de lead qualificado, etapa de compra e segredo errado.
```

### Envio à API de Conversões do Meta

```
Crie uma função do servidor que processa eventos pendentes e com erro. Para cada evento, normalize o telefone do lead para E.164 apenas com dígitos, aplique SHA-256 e monte o payload da API de Conversões do Meta com event_name (Purchase para compra, e o nome de evento de lead qualificado definido no conjunto de dados), event_time do momento da mudança de etapa, event_id, user_data com telefone em hash, e custom_data com value e currency só para compra. Envie ao conjunto de dados meta_dataset_id do cliente, usando o token cifrado lido só no servidor. Se o cliente estiver em modo teste, inclua o test_event_code. Grave status enviado ou erro, a resposta do Meta e incremente tentativas. Repita falhas até 5 vezes com espera de 1, 5, 15, 60 e 240 minutos. Teste com 2 eventos sintéticos e um token inválido.
```

### Painel de eventos e leads sem código

```
Crie a tela Eventos com filtros por cliente, tipo (lead qualificado ou compra) e status (pendente, enviado, erro), e período. Mostre telefone mascarado (apenas os 4 últimos dígitos), valor, moeda, código da campanha, tentativas e a mensagem de erro do Meta. Adicione o botão Reenviar nos eventos com erro, que volta o status para pendente e chama a função de envio. Adicione um cartão Leads sem código de campanha por cliente, com a lista de oportunidades em que o campo veio vazio. Adicione um cartão de etapas sem mapeamento, para mostrar etapas do RD Station que chegaram e não existem em mapeamento_etapas. Respeite RLS por proprietário em todas as consultas.
```

## Economia estimada

Ainda sem base para calcular.

Estimativa não validada. Confira as premissas com o cliente.

Premissas desta conta:

- Não há dado sobre horas gastas hoje, então não dá para estimar economia em horas com base.
- Medir por 2 semanas quanto tempo a agência gasta cruzando vendas do RD Station com campanhas, por cliente.
- Medir quantos leads qualificados e quantas compras cada cliente registra por mês, dentro de 1.000 conversas.
- Incluir no piloto o tempo de revisão humana dos eventos com erro no painel.
- O ganho principal é atribuição de vendas ao Meta, que não se mede em horas e não está garantido.

## Riscos

- **Sem ctwa_clid, o vínculo com o anúncio depende do atendente digitar o código da campanha, e leads sem código perdem a atribuição.**
  - Mitigação: Tornar o campo obrigatório no RD Station, mostrar no painel os leads sem código e treinar os atendentes antes do piloto.
  - Prioridade: alta
- **O Meta pode aceitar os eventos com baixa taxa de correspondência, já que o telefone em hash é o único dado de ligação.**
  - Mitigação: Medir a correspondência no Test Events durante o piloto e só prometer melhora de otimização depois de ver o resultado do cliente piloto.
  - Prioridade: alta
- **O plano do RD Station de algum cliente pode não oferecer webhook de mudança de etapa.**
  - Mitigação: Manter a consulta agendada a cada 15 minutos como caminho de apoio e confirmar o plano de cada cliente antes do cadastro.
  - Prioridade: média
- **O telefone com hash é dado pessoal e o cliente pode não ter avisado o lead sobre uso em publicidade.**
  - Mitigação: Confirmar o aviso ao lead com cada cliente, mascarar telefone no painel, não registrar em log e definir o prazo de exclusão dos eventos.
  - Prioridade: média
- **Reenvio ou mudança de etapa repetida pode contar a mesma compra duas vezes no Meta.**
  - Mitigação: Usar event_id igual a id da oportunidade mais tipo, com índice único no banco, e enviar o mesmo event_id nos reenvios.
  - Prioridade: média
- **Cada cliente tem um funil diferente, e uma etapa nova sem mapeamento deixa de gerar evento sem ninguém perceber.**
  - Mitigação: Listar no painel as etapas recebidas sem mapeamento e revisar o mapeamento com o cliente a cada mudança de funil.
  - Prioridade: baixa

## Fora do escopo

- Migrar o atendimento para a WhatsApp Cloud API: os clientes recusaram sair do app do celular.
- Capturar o ctwa_clid ou ler mensagens do WhatsApp: a plataforma não vê as conversas.
- Cadastrar o lead no RD Station automaticamente: o atendente continua cadastrando e preenchendo o código.
- Gerenciar campanhas, orçamentos ou públicos no Meta Ads.
- Garantir melhora de otimização, custo por lead ou taxa de correspondência no Meta.
- Declarar conformidade com a LGPD: o aviso ao lead e a base legal são de cada cliente.

> O que está nesta lista não faz parte da entrega. Combinar a fronteira antes é o que evita a discussão de escopo na terceira semana.

## Decisões tomadas

- **2026-11-06 · Onde vive:** o projeto é construído como um módulo da plataforma Arthea (este repositório, publicado na Vercel), e não no Lovable. Usa o banco, o login da agência e a conexão com o Meta que a plataforma já tem. Não há projeto novo no Supabase. Onde este documento cita "Lovable", leia "plataforma Arthea"; o custo "Lovable: app, banco e funções" passa a ser o consumo da hospedagem e do banco atuais da plataforma.
- **2026-11-06 · Isolamento por dono:** no lugar do RLS do Supabase, cada consulta do servidor filtra pelo usuário dono do cliente. A etapa 9 testa isso.
- **2026-11-06 · Vários CRMs:** a leitura do CRM nasce como peça trocável, com a mesma interface para qualquer CRM. O piloto usa só o RD Station; outros CRMs entram um de cada vez, quando pedidos.
- **2026-11-06 · Cliente ligado:** cada cliente do rastreamento é ligado a um cliente que já existe na área Clientes da plataforma, em vez de ter cadastro próprio.

## Visão do produto (contexto, não é escopo deste plano)

A Arthea vende tráfego pago com rastreamento de leads, tudo dentro do painel da Arthea:

- **Tráfego pago com rastreamento:** este módulo. Mostra qual lead é qualificado e qual virou venda, e devolve isso ao Meta.
- **CRM:** se o cliente já tem CRM próprio (RD Station, Kommo etc.), o rastreamento lê dele. Se não tem, a Arthea constrói um CRM para ele, que entra no rastreamento como mais um CRM. Projeto à parte, depois do piloto.
- **O CRM é do cliente, não da Arthea:** é um produto separado da plataforma Arthea e do portal do cliente. O portal mostra o que a agência entrega; o CRM pertence 100% ao cliente, que acessa e usa. A decidir: se cada cliente recebe a própria cópia, nas contas dele (GitHub, hospedagem, banco), ou se fica hospedado pela Arthea com os dados em nome do cliente. O CRM atual da plataforma é o da própria agência e não é a base desse produto.
- **Agentes de IA:** no futuro, agentes de IA inspirados nas soluções do Subido, construídos do zero dentro da plataforma.
- **Tudo é da Arthea:** código, banco e dados ficam no GitHub e na hospedagem da Arthea. Nada depende do Subido nem do Lovable para funcionar. O Subido serve de referência e planejamento; não se copia código, marca ou material deles.
