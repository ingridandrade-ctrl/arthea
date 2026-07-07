import { Sparkles } from "lucide-react";

// Card de "Análise" — insights curados pelo admin.
// Nesse PR 3 é placeholder; o carregamento real de ClientInsight (status=APPROVED)
// vem no PR 4 junto com a tela de curadoria.
export function InsightsCard() {
  return (
    <div className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden min-h-[280px]">
      {/* Halo — único da página, marca o card de análise */}
      <div
        className="absolute -top-1/3 -right-1/5 w-[340px] h-[340px] pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(60,176,166,0.28), transparent 55%), radial-gradient(circle at 70% 60%, rgba(238,156,122,0.16), transparent 60%)",
          filter: "blur(20px)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur border border-border flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand" strokeWidth={1.9} />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Análise
            <span className="text-[11px] text-muted-foreground font-medium ml-2">
              · aprovada pela Arthea
            </span>
          </h3>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 pt-4">
          <div className="text-[13px] text-foreground/80 max-w-[260px] leading-relaxed">
            Nenhuma análise publicada ainda.
          </div>
          <div className="text-[11.5px] text-muted-foreground max-w-[280px] leading-relaxed">
            A curadoria de análises (fila admin + geração automática) chega no
            próximo PR. Depois disso, este card mostra os sinais que você
            aprovar.
          </div>
        </div>
      </div>
    </div>
  );
}
