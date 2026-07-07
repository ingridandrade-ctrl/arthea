"use client";

export type Platform = "meta" | "google";

export function PlatformTabs({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (p: Platform) => void;
}) {
  return (
    <div className="inline-flex gap-1 p-1 bg-card border border-border rounded-full mb-5">
      <TabButton active={value === "meta"} onClick={() => onChange("meta")}>
        Meta Ads
      </TabButton>
      <TabButton active={value === "google"} onClick={() => onChange("google")}>
        Google Ads
      </TabButton>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition ${
        active
          ? "bg-muted text-foreground shadow-inner"
          : "text-foreground/70 hover:text-foreground"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-brand" : "bg-foreground/40"}`}
      />
      {children}
    </button>
  );
}
