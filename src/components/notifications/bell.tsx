"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read: boolean;
  createdAt: string;
};

const POLL_INTERVAL_MS = 30_000;

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Math.max(0, Date.now() - date.getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent fail; will retry on next poll
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchNotifications(true);
    const id = setInterval(() => fetchNotifications(false), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Refresh when opening so dropdown is up-to-date
  useEffect(() => {
    if (open) fetchNotifications(false);
  }, [open, fetchNotifications]);

  const handleNotificationClick = async (n: Notification) => {
    // Optimistic: mark as read locally
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await fetch(`/api/notifications/${n.id}/read`, { method: "PUT" });
      } catch {
        // ignore
      }
    }

    const leadId = n.data && typeof n.data === "object" ? (n.data as any).leadId : null;
    if (leadId) {
      setOpen(false);
      router.push(`/crm/leads/${leadId}`);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    // Optimistic
    setNotifications((prev) => prev.map((it) => ({ ...it, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-150"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" strokeWidth={1.6} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-[18px] text-center ring-2 ring-card">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notificações</p>
              {unreadCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markingAll}
              className={cn(
                "flex items-center gap-1 text-[11.5px] font-medium transition-colors",
                unreadCount === 0
                  ? "text-muted-foreground/60 cursor-default"
                  : "text-primary hover:text-primary/80",
              )}
            >
              <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.8} />
              Marcar todas como lidas
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma notificação por aqui.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {notifications.map((n) => {
                  const leadId =
                    n.data && typeof n.data === "object" ? (n.data as any).leadId : null;
                  const clickable = !n.read || !!leadId;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        disabled={!clickable && n.read}
                        className={cn(
                          "w-full text-left px-4 py-3 flex gap-3 transition-colors",
                          !n.read ? "bg-primary/[0.03]" : "bg-transparent",
                          clickable
                            ? "hover:bg-muted/50 cursor-pointer"
                            : "cursor-default",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 w-2 h-2 rounded-full flex-shrink-0",
                            n.read ? "bg-transparent" : "bg-primary",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-[13px] leading-snug truncate",
                                n.read ? "font-normal text-foreground/90" : "font-semibold text-foreground",
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10.5px] text-muted-foreground/80 flex-shrink-0 whitespace-nowrap">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          {n.body && (
                            <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2 whitespace-pre-line">
                              {n.body}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
