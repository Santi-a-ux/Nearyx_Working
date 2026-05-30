"use client";
import { IconBell } from "@/components/icons/TmIcons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type NotificationSummary = {
  unreadMessages: number;
};

const staticItems = [
  {
    title: "Explora tutores activos",
    description: "Revisa los tutores con mejor coincidencia en tu zona y temática.",
    tone: "bg-[var(--brand-soft)] text-[var(--primary)]",
  },
  {
    title: "Actualiza tu perfil",
    description: "Una foto y una bio claras mejoran la visibilidad en el mapa.",
    tone: "bg-[var(--muted)] text-[var(--foreground)]",
  },
];

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<NotificationSummary>({ unreadMessages: 0 });
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function loadSummary() {
      setLoading(true);
      try {
        const response = await fetch("/api/chat/unread-count", { credentials: "include" });
        const data = await response.json().catch(() => ({ count: 0 }));

        if (!active) return;

        if (response.ok) {
          setSummary({ unreadMessages: Number(data.count) || 0 });
        } else {
          setSummary({ unreadMessages: 0 });
        }
      } catch {
        if (active) {
          setSummary({ unreadMessages: 0 });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const panelWidth = 288;
      const viewportGap = 12;
      const left = Math.min(
        Math.max(rect.right - panelWidth, viewportGap),
        Math.max(viewportGap, window.innerWidth - panelWidth - viewportGap)
      );

      setPanelStyle({
        top: rect.bottom + 10,
        left,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      active = false;
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative rounded-md p-2 hover:bg-[var(--background)]"
      >
        <span style={{ color: "var(--primary)" }}>
          <IconBell className="w-5 h-5" />
        </span>
      </button>

      {open && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <div ref={panelRef}>
              <Card
                className={cn(
                  "fixed z-[80] w-80 overflow-hidden border-border/60 bg-popover text-popover-foreground shadow-2xl",
                  "animate-in fade-in-0 zoom-in-95 duration-150"
                )}
                style={{ top: panelStyle.top, left: panelStyle.left }}
              >
                <CardHeader className="border-b border-border/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-semibold">Notificaciones</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">Resumen rápido de tu actividad</p>
                    </div>
                    <Badge variant={summary.unreadMessages > 0 ? "default" : "outline"}>
                      {loading ? "Cargando" : `${summary.unreadMessages} sin leer`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <IconBell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {summary.unreadMessages > 0
                            ? `Tienes ${summary.unreadMessages} mensaje${summary.unreadMessages === 1 ? "" : "s"} pendiente${summary.unreadMessages === 1 ? "" : "s"}`
                            : "No tienes mensajes pendientes"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {summary.unreadMessages > 0
                            ? "Abre mensajes para responder a estudiantes o tutores activos."
                            : "Cuando lleguen mensajes nuevos aparecerán aquí con su prioridad."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full justify-center"
                        onClick={() => {
                          window.location.href = "/messages";
                        }}
                      >
                        Ir a mensajes
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Sugerencias
                    </p>
                    {staticItems.map((item) => (
                      <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                        <div className={cn("mt-0.5 rounded-lg px-2 py-1 text-xs font-medium", item.tone)}>
                          {item.title.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}