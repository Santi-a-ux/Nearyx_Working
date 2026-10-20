"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useScreenReader } from "@/components/providers/ScreenReaderContext";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { speak, stop } = useScreenReader();

  useEffect(() => {
    if (open) speak(`${title}. ${description}`);
  }, [open, title, description, speak]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] w-[min(92vw,26rem)] overflow-y-auto sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-lg leading-snug">{title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            onFocus={() => speak(`Botón. ${cancelLabel}.`)}
            onBlur={stop}
            className="w-full border-2 sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={loading}
            aria-busy={loading}
            onClick={() => void onConfirm()}
            onFocus={() => speak(`Botón. ${confirmLabel}.`)}
            onBlur={stop}
            className="w-full border-2 sm:w-auto"
          >
            {loading ? "Procesando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}