import { redirect } from "next/navigation";
import { usuarioDoRastreamento } from "@/lib/rastreamento/acesso";
import { FormCliente } from "../_components/form-cliente";
import { opcoesDoFormulario } from "../_dados";

export default async function NovoClienteRastreamentoPage() {
  const user = await usuarioDoRastreamento();
  if (!user) redirect("/inicio");
  const { clientes, crms } = await opcoesDoFormulario();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Novo cliente no rastreamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          As chaves do CRM e do Meta entram depois, numa etapa própria.
        </p>
      </div>
      <FormCliente
        clientes={clientes}
        crms={crms}
        inicial={{
          nome: "",
          clientUserId: "",
          crm: "rd_station",
          metaDatasetId: "",
          crmCampoCodigo: "",
          crmCampoValor: "",
          ativo: true,
        }}
      />
    </div>
  );
}
