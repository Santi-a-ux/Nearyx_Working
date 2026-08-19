"use client";

import { useState } from "react";
import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/profile/verification-badge";
import { VerificationRequestDialog } from "@/components/profile/verification-request-dialog";
import {
  VERIFICATION_STATUS,
  normalizeVerificationStatus,
  type VerificationRequest,
} from "@/lib/verification";
import { cn } from "@/lib/utils";

interface VerificationStatusActionsProps {
  status?: string | null;
  request?: VerificationRequest | null;
}

/**
 * Estado de verificación en el perfil propio. "Sin verificar" y "rechazada"
 * abren el formulario; "en revisión" y "verificado" solo informan.
 */
export function VerificationStatusActions({ status, request }: VerificationStatusActionsProps) {
  const [open, setOpen] = useState(false);
  const normalized = normalizeVerificationStatus(status);
  const meta = VERIFICATION_STATUS[normalized];

  if (normalized === "verified") {
    return <VerificationBadge />;
  }

  if (normalized === "pending") {
    return (
      <Badge className={cn("h-8 gap-1.5 rounded-xl px-3", meta.className)}>
        <Clock className="h-3 w-3" />
        {meta.label}
      </Badge>
    );
  }

  const isRejected = normalized === "rejected";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "gap-2 rounded-xl",
          isRejected
            ? "border-semantic-error/30 bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/15"
            : "border-border bg-muted text-muted-foreground hover:bg-muted/70"
        )}
      >
        {isRejected ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        {isRejected ? "Corregir y reenviar" : meta.label}
      </Button>

      <VerificationRequestDialog
        open={open}
        onOpenChange={setOpen}
        previousRequest={isRejected ? request : null}
      />
    </>
  );
}
