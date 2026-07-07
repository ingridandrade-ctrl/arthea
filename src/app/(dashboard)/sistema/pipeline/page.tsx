import { redirect } from "next/navigation";

// Página movida: a edição de etapas agora acontece dentro do Kanban
// em /crm/pipeline (botão "Editar etapas" no topo, por serviço).
export default function PipelineSettingsRedirect() {
  redirect("/crm/pipeline");
}
