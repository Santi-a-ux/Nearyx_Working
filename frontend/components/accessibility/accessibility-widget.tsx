"use client";

import { useEffect, useRef, useState } from "react";
import { Contrast, PersonStanding, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { FONT_SCALE_STEPS, type FontScale, useAccessibility } from "@/lib/accessibility/accessibility-context";

const FONT_SCALE_LABELS: Record<FontScale, string> = {
  87.5: "Pequeño",
  100: "Normal",
  112.5: "Grande",
  125: "Muy grande",
  137.5: "Extra grande",
  150: "Máximo",
};

export function AccessibilityWidget() {
  const {
    fontScale,
    highContrast,
    setFontScale,
    toggleHighContrast,
    resetAccessibility,
  } = useAccessibility();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2">
      {open ? (
        <div
          role="dialog"
          aria-label="Opciones de accesibilidad"
          className="w-64 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <p className="mb-3 text-sm font-semibold">Accesibilidad</p>

          <label
            htmlFor="a11y-font-size"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Tamaño de texto
          </label>
          <select
            id="a11y-font-size"
            value={fontScale}
            onChange={(event) => setFontScale(Number(event.target.value) as FontScale)}
            className="mb-3 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {FONT_SCALE_STEPS.map((step) => (
              <option key={step} value={step}>
                {FONT_SCALE_LABELS[step]} ({Math.round(step)}%)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={cn(
              "mb-2 flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors",
              highContrast
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            <span className="flex items-center gap-2">
              <Contrast className="h-4 w-4" aria-hidden />
              Alto contraste
            </span>
            <span className="text-xs">{highContrast ? "Activado" : "Desactivado"}</span>
          </button>

          <button
            type="button"
            onClick={resetAccessibility}
            className="flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Restablecer
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Abrir opciones de accesibilidad"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <PersonStanding className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}