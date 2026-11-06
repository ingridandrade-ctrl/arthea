# Prompts prontos

> Rastreamento de vendas do WhatsApp para Meta Ads

## Esqueleto, login, tabelas e RLS

```
Crie um app para uma agência de marketing rastrear vendas feitas por WhatsApp e enviá-las ao Meta. Crie login para usuários da agência. Crie no banco do projeto as tabelas: clientes (id, user_id, nome, meta_dataset_id, rd_campo_codigo, rd_campo_valor, ativo), mapeamento_etapas (id, cliente_id, etapa_rd, tipo com valores nenhum, lead_qualificado ou compra), leads_espelho (id, cliente_id, rd_deal_id, telefone_hash, codigo_campanha, valor, moeda, etapa) e eventos (id, cliente_id, rd_deal_id, tipo, event_id único, status com valores pendente, enviado ou erro, tentativas, erro_msg, resposta_meta, criado_em). Ative RLS em todas, de modo que cada usuário só leia e altere linhas dos clientes que ele criou. Crie telas de lista e cadastro de clientes e a tela de mapeamento de etapas. Não use dados reais, use 2 clientes sintéticos. Não coloque nenhuma chave no front-end.
```

## Webhook do RD Station com validação

```
Crie uma função do servidor que recebe o webhook de mudança de etapa de oportunidade do RD Station. Identifique o cliente por um identificador na URL e compare o segredo compartilhado, guardado em segredos do servidor ou cifrado no banco, com o recebido; se não bater, responda 401 sem processar. Com o token do cliente, busque a oportunidade na API do RD Station e leia telefone, valor, moeda, etapa atual e o campo personalizado de código da campanha. Grave ou atualize leads_espelho. Procure a etapa em mapeamento_etapas e, se o tipo for diferente de nenhum, crie um evento pendente com event_id igual a rd_deal_id mais tipo, ignorando se já existir. Responda 200 rápido. Nunca registre token nem telefone completo em log. Teste com 3 payloads sintéticos: etapa de lead qualificado, etapa de compra e segredo errado.
```

## Envio à API de Conversões do Meta

```
Crie uma função do servidor que processa eventos pendentes e com erro. Para cada evento, normalize o telefone do lead para E.164 apenas com dígitos, aplique SHA-256 e monte o payload da API de Conversões do Meta com event_name (Purchase para compra, e o nome de evento de lead qualificado definido no conjunto de dados), event_time do momento da mudança de etapa, event_id, user_data com telefone em hash, e custom_data com value e currency só para compra. Envie ao conjunto de dados meta_dataset_id do cliente, usando o token cifrado lido só no servidor. Se o cliente estiver em modo teste, inclua o test_event_code. Grave status enviado ou erro, a resposta do Meta e incremente tentativas. Repita falhas até 5 vezes com espera de 1, 5, 15, 60 e 240 minutos. Teste com 2 eventos sintéticos e um token inválido.
```

## Painel de eventos e leads sem código

```
Crie a tela Eventos com filtros por cliente, tipo (lead qualificado ou compra) e status (pendente, enviado, erro), e período. Mostre telefone mascarado (apenas os 4 últimos dígitos), valor, moeda, código da campanha, tentativas e a mensagem de erro do Meta. Adicione o botão Reenviar nos eventos com erro, que volta o status para pendente e chama a função de envio. Adicione um cartão Leads sem código de campanha por cliente, com a lista de oportunidades em que o campo veio vazio. Adicione um cartão de etapas sem mapeamento, para mostrar etapas do RD Station que chegaram e não existem em mapeamento_etapas. Respeite RLS por proprietário em todas as consultas.
```
