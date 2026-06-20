/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@anthropic-ai/sdk"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async rewrites() {
    // Subdomínio mindfulness.arthea.com.br serve o app /mindfulness na raiz.
    // O usuário acessa mindfulness.arthea.com.br/painel e o Next.js, por
    // baixo, renderiza /mindfulness/painel. Rotas /api/* passam direto —
    // a app já chama /api/mindfulness/* com path absoluto.
    //
    // Subdomínio consulta.clinicabrescancin.com.br serve o app
    // /clinicabrescancin na raiz. /admin entra em /clinicabrescancin/admin.
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "mindfulness.arthea.com.br" }],
          destination: "/mindfulness",
        },
        {
          source: "/painel",
          has: [{ type: "host", value: "mindfulness.arthea.com.br" }],
          destination: "/mindfulness/painel",
        },
        {
          source: "/painel/:path*",
          has: [{ type: "host", value: "mindfulness.arthea.com.br" }],
          destination: "/mindfulness/painel/:path*",
        },
        {
          source: "/",
          has: [{ type: "host", value: "consulta.clinicabrescancin.com.br" }],
          destination: "/clinicabrescancin",
        },
        {
          source: "/admin",
          has: [{ type: "host", value: "consulta.clinicabrescancin.com.br" }],
          destination: "/clinicabrescancin/admin",
        },
        {
          source: "/admin/:path*",
          has: [{ type: "host", value: "consulta.clinicabrescancin.com.br" }],
          destination: "/clinicabrescancin/admin/:path*",
        },
        // Subdomínio analises.arthea.com.br serve /analises/[slug] na raiz.
        // O lead acessa analises.arthea.com.br/nome-do-cliente.
        {
          source: "/:slug",
          has: [{ type: "host", value: "analises.arthea.com.br" }],
          destination: "/analises/:slug",
        },
        // URL limpa pras aulas estáticas em public/aulas — sem o .html no fim.
        {
          source: "/aulas/arte-da-presenca",
          destination: "/aulas/arte-da-presenca.html",
        },
      ],
    };
  },
  async headers() {
    // Páginas de aulas não devem aparecer em buscadores (acesso por link).
    return [
      {
        source: "/aulas/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Reorganização do painel da agência (mai/2026) — mantém URLs antigas funcionando
      { source: "/dashboard", destination: "/crm", permanent: false },
      { source: "/dashboard/:path*", destination: "/crm/:path*", permanent: false },
      { source: "/leads", destination: "/crm/leads", permanent: false },
      { source: "/leads/:path*", destination: "/crm/leads/:path*", permanent: false },
      { source: "/pipeline", destination: "/crm/pipeline", permanent: false },
      { source: "/pipeline/:path*", destination: "/crm/pipeline/:path*", permanent: false },
      { source: "/conversations", destination: "/crm/conversations", permanent: false },
      { source: "/conversations/:path*", destination: "/crm/conversations/:path*", permanent: false },
      { source: "/tarefas", destination: "/crm/tarefas", permanent: false },
      { source: "/tarefas/:path*", destination: "/crm/tarefas/:path*", permanent: false },
      { source: "/relatorios", destination: "/crm/relatorios", permanent: false },
      { source: "/relatorios/:path*", destination: "/crm/relatorios/:path*", permanent: false },
      { source: "/automations", destination: "/crm/automacoes", permanent: false },
      { source: "/automations/:path*", destination: "/crm/automacoes/:path*", permanent: false },
      { source: "/configuracoes", destination: "/sistema", permanent: false },
      { source: "/configuracoes/automacoes", destination: "/crm/automacoes", permanent: false },
      { source: "/configuracoes/automacoes/:path*", destination: "/crm/automacoes/:path*", permanent: false },
      { source: "/configuracoes/templates", destination: "/crm/templates", permanent: false },
      { source: "/configuracoes/templates/:path*", destination: "/crm/templates/:path*", permanent: false },
      { source: "/configuracoes/servicos", destination: "/sistema/servicos", permanent: false },
      { source: "/configuracoes/servicos/:path*", destination: "/sistema/servicos/:path*", permanent: false },
      { source: "/configuracoes/usuarios", destination: "/sistema/usuarios", permanent: false },
      { source: "/configuracoes/usuarios/:path*", destination: "/sistema/usuarios/:path*", permanent: false },
      { source: "/portal-clientes", destination: "/clientes/portal", permanent: false },
      { source: "/portal-clientes/:path*", destination: "/clientes/portal/:path*", permanent: false },
      { source: "/meta", destination: "/sistema/integracoes/meta", permanent: false },
      { source: "/meta/:path*", destination: "/sistema/integracoes/meta/:path*", permanent: false },
      // Integrações migradas de /clientes/* pra /sistema/integracoes/* (jun/2026)
      // — configuração técnica de agência mora em Sistema, não em Clientes.
      { source: "/clientes/meta", destination: "/sistema/integracoes/meta", permanent: false },
      { source: "/clientes/meta/:path*", destination: "/sistema/integracoes/meta/:path*", permanent: false },
      { source: "/clientes/google-ads", destination: "/sistema/integracoes/google-ads", permanent: false },
      { source: "/clientes/google-ads/:path*", destination: "/sistema/integracoes/google-ads/:path*", permanent: false },
      { source: "/services", destination: "/sistema/servicos", permanent: false },
      { source: "/settings", destination: "/sistema", permanent: false },
    ];
  },
};

export default nextConfig;
