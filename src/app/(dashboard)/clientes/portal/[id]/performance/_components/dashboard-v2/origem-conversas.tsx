import { MessageCircle, ClipboardList, AtSign, Phone } from "lucide-react";
import type { MetaFullSummary } from "./use-dashboard-data";

const nfBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmt = (v: number) => nfBR.format(Math.round(v));

// Breakdown das ações de conversa no perfil Serviços.
// Meta API entrega isso via actions[]. Aqui expomos 4 canais.
export function OrigemConversas({ summary }: { summary: MetaFullSummary }) {
  // conversations no summary já vem de onsite_conversion.messaging_conversation_started_7d
  // leads vem de lead + fb_pixel_lead + onsite_conversion.lead_grouped
  const wa = summary.conversations;
  const form = summary.leads;
  const dm = 0; // TODO: precisa isolar mensagens IG DM vs WhatsApp na resolver
  const call = 0; // TODO: click_to_call_native_call_placed — raro

  const items = [
    { icon: MessageCircle, label: "Mensagens WhatsApp", value: fmt(wa), muted: wa === 0 },
    { icon: ClipboardList, label: "Formulário (Lead Ads)", value: fmt(form), muted: form === 0 },
    { icon: AtSign, label: "DM AtSign", value: fmt(dm), muted: true, note: "em breve" },
    { icon: Phone, label: "Cliques em ligar", value: fmt(call), muted: true, note: "raro no Meta" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Origem das conversas
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Breakdown por ação · Meta
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className={`p-4 rounded-xl border border-border ${
                it.muted ? "bg-muted/30" : "bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className={`w-3.5 h-3.5 ${it.muted ? "text-muted-foreground/60" : "text-brand"}`}
                  strokeWidth={1.9}
                />
                <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                  {it.label}
                </span>
              </div>
              <div
                className={`text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums ${
                  it.muted ? "text-foreground/50" : "text-foreground"
                }`}
              >
                {it.value}
              </div>
              {it.note && (
                <div className="text-[10.5px] text-muted-foreground mt-2">{it.note}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
