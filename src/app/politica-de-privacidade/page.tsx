import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade · Arthea",
  description:
    "Política de privacidade do Arthea CRM — como coletamos, usamos e protegemos dados pessoais.",
};

const LAST_UPDATED = "11 de maio de 2026";
const CONTACT_EMAIL = "privacidade@arthea.com.br";
const COMPANY_NAME = "Arthea";

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2A2A2A]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/login"
          className="text-sm text-[#1D7070] hover:underline"
        >
          ← Voltar
        </Link>

        <h1 className="text-3xl font-bold mt-6 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-10">
          Última atualização: {LAST_UPDATED}
        </p>

        <div className="space-y-8 [&_a]:text-[#1D7070] [&_a]:underline [&_a:hover]:opacity-80 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono">
          <Section title="1. Quem somos">
            <p>
              O {COMPANY_NAME} é uma plataforma de CRM e gestão de marketing digital
              utilizada por agências para administrar leads, clientes, contratos
              financeiros e campanhas publicitárias. Esta política descreve como
              coletamos, utilizamos, armazenamos e protegemos as informações pessoais
              tratadas pela plataforma.
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p>Coletamos os seguintes tipos de dados:</p>
            <ul>
              <li>
                <strong>Dados de cadastro:</strong> nome, e-mail, senha (criptografada),
                função no sistema (admin, gerente, agente ou cliente).
              </li>
              <li>
                <strong>Dados de leads e clientes:</strong> nome, telefone, e-mail,
                empresa, origem, tags, notas e histórico de interações inseridos pela
                equipe da agência.
              </li>
              <li>
                <strong>Dados de conversas:</strong> mensagens trocadas via WhatsApp
                Business API (Meta) entre a agência e os leads/clientes.
              </li>
              <li>
                <strong>Dados financeiros:</strong> contratos, faturas, despesas e
                transações cadastradas no módulo financeiro.
              </li>
              <li>
                <strong>Dados de campanhas publicitárias:</strong> métricas (gasto,
                impressões, cliques, conversões), nomes de campanhas, contas de
                anúncios e formulários de Lead Ads obtidos via Meta Marketing API.
              </li>
              <li>
                <strong>Dados técnicos:</strong> endereço IP, tipo de navegador, logs
                de acesso e cookies de sessão.
              </li>
            </ul>
          </Section>

          <Section title="3. Como usamos os dados">
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul>
              <li>Autenticar e identificar os usuários da plataforma.</li>
              <li>Permitir o relacionamento entre agência e seus clientes.</li>
              <li>Exibir métricas e relatórios sobre campanhas e operação.</li>
              <li>Enviar mensagens automatizadas via WhatsApp quando configurado.</li>
              <li>
                Cumprir obrigações legais e contratuais aplicáveis à atividade da
                agência.
              </li>
            </ul>
            <p>
              <strong>Não vendemos, alugamos ou compartilhamos</strong> dados pessoais
              com terceiros para fins de marketing.
            </p>
          </Section>

          <Section title="4. Integração com a Meta (Facebook, Instagram e WhatsApp)">
            <p>
              O {COMPANY_NAME} se integra com as APIs da Meta Platforms, Inc. para
              oferecer funcionalidades específicas:
            </p>
            <ul>
              <li>
                <strong>WhatsApp Business Cloud API:</strong> envio e recebimento de
                mensagens entre a agência e contatos autorizados. As mensagens são
                armazenadas em nosso banco de dados para histórico.
              </li>
              <li>
                <strong>Marketing API (Facebook/Instagram Ads):</strong> leitura de
                contas de anúncios, campanhas, conjuntos de anúncios, criativos e
                métricas de desempenho (gasto, impressões, alcance, cliques, CPM, CPC,
                CTR, ações). Esses dados são acessados sob autorização explícita do
                usuário via OAuth (Facebook Login for Business) e são utilizados
                exclusivamente para exibir relatórios dentro da plataforma.
              </li>
              <li>
                <strong>Lead Ads (Geração de cadastros):</strong> quando uma campanha
                de Lead Ads é configurada, recebemos via webhook os dados de
                formulários preenchidos (nome, e-mail, telefone e demais campos
                cadastrados pelo anunciante) e os adicionamos ao CRM como novos leads.
              </li>
              <li>
                <strong>Páginas:</strong> listagem de páginas do Facebook às quais o
                usuário tem acesso, para vincular formulários de Lead Ads.
              </li>
            </ul>
            <p>
              <strong>Permissões solicitadas no OAuth da Meta:</strong>{" "}
              <code>ads_management</code>, <code>ads_read</code>,{" "}
              <code>business_management</code>, <code>leads_retrieval</code>,{" "}
              <code>pages_show_list</code>, <code>pages_read_engagement</code>.
            </p>
            <p>
              O token de acesso emitido pela Meta é armazenado de forma segura no
              banco de dados do {COMPANY_NAME} e é utilizado apenas para chamadas às
              APIs da Meta autorizadas pelo usuário. O usuário pode revogar o acesso a
              qualquer momento em{" "}
              <a
                href="https://www.facebook.com/settings?tab=business_tools"
                target="_blank"
                rel="noreferrer"
              >
                Configurações do Facebook → Integrações de Negócios
              </a>{" "}
              ou diretamente dentro do {COMPANY_NAME}, na tela "Meta Ads" → "Desconectar".
            </p>
          </Section>

          <Section title="5. Exclusão de dados (Data Deletion)">
            <p>
              Os usuários podem solicitar a exclusão dos seus dados pessoais a qualquer
              momento enviando um e-mail para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Atenderemos
              solicitações em até 30 dias.
            </p>
            <p>
              Quando uma conexão com a Meta é removida na tela "Meta Ads", todos os
              tokens, contas de anúncios sincronizadas e formulários vinculados são
              excluídos permanentemente do nosso banco em cascata.
            </p>
            <p>
              Para solicitações via Meta (URL de Data Deletion Request exigida no App
              Review), encaminhe o pedido para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> informando o
              ID do usuário Meta. Confirmaremos o recebimento em até 48 horas e
              concluiremos a exclusão em até 30 dias.
            </p>
          </Section>

          <Section title="6. Cookies e tecnologias semelhantes">
            <p>
              Utilizamos cookies essenciais para manter a sessão do usuário logado e
              cookies temporários durante o fluxo OAuth com a Meta (validação de
              estado anti-CSRF). Não utilizamos cookies de rastreamento publicitário
              de terceiros.
            </p>
          </Section>

          <Section title="7. Compartilhamento de dados">
            <p>Os dados podem ser compartilhados com:</p>
            <ul>
              <li>
                <strong>Provedores de infraestrutura:</strong> Vercel (hospedagem),
                Neon (banco de dados PostgreSQL), Anthropic (processamento de IA via
                Claude API) — todos com cláusulas contratuais de proteção de dados.
              </li>
              <li>
                <strong>Meta Platforms, Inc.:</strong> exclusivamente nas chamadas de
                API autorizadas pelo usuário.
              </li>
              <li>
                <strong>Autoridades públicas:</strong> quando legalmente exigido (ex.:
                ordem judicial).
              </li>
            </ul>
          </Section>

          <Section title="8. Retenção">
            <p>
              Os dados são retidos enquanto a conta da agência estiver ativa. Em caso
              de encerramento de contrato, os dados são removidos em até 90 dias,
              salvo obrigação legal de retenção (ex.: documentos fiscais por 5 anos).
            </p>
          </Section>

          <Section title="9. Segurança">
            <p>
              Adotamos medidas técnicas e organizacionais razoáveis para proteger os
              dados, incluindo: senhas armazenadas com hash bcrypt, comunicação
              criptografada via HTTPS/TLS, autenticação JWT para sessões, acesso ao
              banco de dados restrito por VPC e variáveis de ambiente protegidas.
            </p>
          </Section>

          <Section title="10. Direitos dos titulares (LGPD)">
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº
              13.709/2018), você tem direito a:
            </p>
            <ul>
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar os dados que mantemos sobre você.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>
                Solicitar anonimização, bloqueio ou eliminação de dados desnecessários
                ou tratados em desconformidade com a LGPD.
              </li>
              <li>Solicitar portabilidade dos dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato com{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="11. Alterações nesta política">
            <p>
              Esta política pode ser atualizada periodicamente. Em caso de mudanças
              materiais, comunicaremos os usuários ativos por e-mail e atualizaremos a
              data de "última atualização" no topo deste documento.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Dúvidas, solicitações ou reclamações relacionadas a esta política devem
              ser encaminhadas para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[#0D4A4A] mt-8 mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
