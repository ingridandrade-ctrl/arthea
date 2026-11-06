import { notFound, redirect } from "next/navigation";
import { usuarioDoRastreamento, clienteDoDono } from "@/lib/rastreamento/acesso";
import { FormCliente } from "../_components/form-cliente";
import { opcoesDoFormulario } from "../_dados";

export default async function EditarClienteRastreamentoPage({ params }: { params: { id: string } }) {
  const user = await usuarioDoRastreamento();
  if (!user) redirect("/inicio");
  const c = await clienteDoDono(user.id, params.id);
  if (!c) notFound();
  const { clientes, crms } = await opcoesDoFormulario();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{c.nome}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dados do rastreamento deste cliente.{c.teste ? " Cliente de teste." : ""}
        </p>
      </div>
      <FormCliente
        id={c.id}
        clientes={clientes}
        crms={crms}
        inicial={{
          nome: c.nome,
          clientUserId: c.clientUserId ?? "",
          crm: c.crm,
          metaDatasetId: c.metaDatasetId ?? "",
          crmCampoCodigo: c.crmCampoCodigo ?? "",
          crmCampoValor: c.crmCampoValor ?? "",
          ativo: c.ativo,
        }}
      />
    </div>
  );
}
