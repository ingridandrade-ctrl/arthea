# Plano de execução

> Rastreamento de vendas do WhatsApp para Meta Ads

> **Nota de 2026-11-06:** o módulo vive na plataforma Arthea, e não no Lovable. Onde uma etapa diz "Lovable", leia "plataforma Arthea". Onde diz "RLS por proprietário", leia "isolamento por dono nas consultas do servidor". O login da agência já existe e é reaproveitado. A leitura do CRM nasce preparada para vários CRMs, começando pelo RD Station. Detalhes em CLAUDE.md e em "Decisões tomadas" no PROJETO.md.

## Fase 1 · Fundação

### 01. Definir códigos de campanha e coletar acessos do piloto

Com o cliente piloto, definir um código curto por campanha, colocar na mensagem pré-preenchida de cada anúncio e criar no RD Station o campo personalizado Código da campanha. Reunir o token do RD Station e o acesso ao conjunto de dados do Meta, combinando um canal seguro para recebê-los.

Quem faz: a pessoa, fora do projeto. Não execute esta etapa: diga o que ela precisa fazer e espere.

Ferramentas: RD Station CRM, Meta Business Manager

### 02. Criar esqueleto com login, banco e telas de cliente

Criar login para usuários da agência e as tabelas clientes, mapeamento_etapas, eventos e leads_espelho, todas com RLS por proprietário. Criar a tela de cadastro de cliente com ID do conjunto de dados do Meta, campo de código da campanha e campo de valor do RD Station.

Ferramentas: Lovable

### 03. Guardar credenciais e mapear etapas por cliente

Guardar o token do RD Station e o token do Meta de cada cliente cifrados no banco do projeto, legíveis só pelas funções do servidor, sem aparecer no front-end. Criar a tela que mapeia cada etapa do funil do cliente para Nenhum, Lead qualificado ou Compra.

Ferramentas: Lovable

## Fase 2 · Construção

### 04. Criar o webhook do RD Station com validação

Criar o endpoint que recebe a mudança de etapa, rejeita chamadas sem o segredo compartilhado do cliente e busca a oportunidade na API do RD Station. Testar com um payload sintético, uma chamada sem segredo e um cliente inexistente.

Ferramentas: Lovable, RD Station CRM

### 05. Montar o evento com hash e deduplicação

Aplicar o mapeamento de etapas, normalizar o telefone para E.164, gerar o hash SHA-256 e gravar o evento com event_id igual a id da oportunidade mais tipo. Leads sem código de campanha seguem o fluxo, marcados como sem código.

Ferramentas: Lovable

### 06. Enviar eventos à API de Conversões com repetição

Criar a função que envia Compra com valor e moeda, e Lead qualificado, ao conjunto de dados do cliente. Aceitar o código de teste do Test Events, gravar a resposta do Meta e repetir falhas até 5 vezes com espera crescente antes de marcar como erro.

Ferramentas: Lovable, API de Conversões do Meta

### 07. Criar consulta agendada de apoio ao webhook

Criar um job a cada 15 minutos que lista no RD Station as oportunidades alteradas, compara com leads_espelho e gera os eventos que o webhook não entregou, usando o mesmo event_id para não duplicar.

Ferramentas: Lovable, RD Station CRM

### 08. Criar painel de eventos enviados e com erro

Criar o painel com filtro por cliente, tipo e status, lista de erros com a mensagem do Meta, contagem de leads sem código de campanha e botão de reenvio. Mostrar telefone mascarado.

Ferramentas: Lovable

## Fase 3 · Validação

### 09. Testar acesso cruzado e logs

Com dois usuários sintéticos, confirmar que um não lê clientes, tokens nem eventos do outro. Confirmar que nenhum log, resposta de erro ou tela expõe token ou telefone completo.

Ferramentas: Lovable

### 10. Validar no Test Events e rodar o piloto

Enviar eventos de teste de um cliente piloto, conferir no Test Events do Meta o recebimento, o valor e a taxa de correspondência, e registrar o resultado. Só então ligar os envios reais para o piloto, durante 2 semanas, comparando com as vendas do RD Station.

Quem faz: a pessoa, fora do projeto. Não execute esta etapa: diga o que ela precisa fazer e espere.

Ferramentas: Meta Events Manager, API de Conversões do Meta

### 11. Treinar atendentes e ligar os demais clientes

Treinar os atendentes a preencher o código da campanha no cadastro e a mover a oportunidade de etapa no momento certo. Depois do piloto, cadastrar os outros clientes, até 5, um por vez, com o mapeamento de etapas de cada um.

Quem faz: a pessoa, fora do projeto. Não execute esta etapa: diga o que ela precisa fazer e espere.

Ferramentas: RD Station CRM
