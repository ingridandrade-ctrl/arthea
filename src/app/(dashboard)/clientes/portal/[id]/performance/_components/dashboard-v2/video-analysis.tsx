import { Play, Video } from "lucide-react";
import type { MetaAd } from "./use-dashboard-data";

type Status = "ok" | "warn" | "bad";

// Faixas baseadas no relatório de pesquisa (Motion benchmarks 2026).
function classifyHook(v: number): Status {
  const pct = v * 100;
  if (pct >= 35) return "ok";
  if (pct >= 25) return "warn";
  return "bad";
}
function classifyHold(v: number): Status {
  const pct = v * 100;
  if (pct >= 50) return "ok";
  if (pct >= 30) return "warn";
  return "bad";
}
function classifyThruPlay(v: number): Status {
  const pct = v * 100;
  if (pct >= 20) return "ok";
  if (pct >= 10) return "warn";
  return "bad";
}

const STATUS_BG: Record<Status, string> = {
  ok: "bg-success/10 border-success/30",
  warn: "bg-warning/12 border-warning/30",
  bad: "bg-destructive/12 border-destructive/30",
};

export function VideoAnalysis({ ads }: { ads: MetaAd[] }) {
  const topAds = ads.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Análise de vídeo · por criativo
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Hook, hold e ThruPlay por ad — cores mostram o benchmark
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          Top {topAds.length}
        </span>
      </div>

      {topAds.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhum criativo em vídeo com dados no período.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {topAds.map((ad) => (
            <VideoRow key={ad.adId} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoRow({ ad }: { ad: MetaAd }) {
  const thumb = ad.creative?.thumbnail || ad.creative?.imageUrl;
  const hookStatus = classifyHook(ad.hookRate);
  const holdStatus = classifyHold(ad.holdRate);
  const thruStatus = classifyThruPlay(ad.thruPlayRate);
  const avgSec = ad.videoAvgTimeWatched;

  return (
    <div className="grid grid-cols-[80px_1fr] gap-4 py-4 items-center">
      <div className="aspect-[4/5] rounded-lg overflow-hidden relative bg-gradient-to-br from-brand to-brand/40 flex items-center justify-center">
        {thumb ? (
          <img
            src={thumb}
            alt={ad.adName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <Video className="w-6 h-6 text-white/70" strokeWidth={1.6} />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-4 h-4 text-white/90" fill="currentColor" strokeWidth={0} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-foreground leading-tight line-clamp-2">
          {ad.adName}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {ad.campaignName}
          {ad.costPerResult > 0 && (
            <> · R$ {ad.costPerResult.toFixed(2)} por resultado</>
          )}
          {ad.results > 0 && <> · {Math.round(ad.results)} resultados</>}
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-2.5">
          <MiniMetric label="Hook (3s)" value={`${(ad.hookRate * 100).toFixed(0)}%`} status={hookStatus} />
          <MiniMetric label="Hold (25%)" value={`${(ad.holdRate * 100).toFixed(0)}%`} status={holdStatus} />
          <MiniMetric label="ThruPlay" value={`${(ad.thruPlayRate * 100).toFixed(0)}%`} status={thruStatus} />
          <MiniMetric label="Tempo médio" value={avgSec > 0 ? `${avgSec.toFixed(0)}s` : "—"} status="ok" />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, status }: { label: string; value: string; status: Status }) {
  return (
    <div className={`px-2.5 py-1.5 rounded-lg border ${STATUS_BG[status]}`}>
      <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-[16px] font-semibold text-foreground leading-none mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}
