import { redirect } from "next/navigation";

// Home do modo Clientes — por enquanto manda direto pro Portal.
// Quando tivermos overview agregado (todas as frentes, próximos checkpoints,
// alertas), substitui aqui.
export default function ClientesHome() {
  redirect("/clientes/portal");
}
