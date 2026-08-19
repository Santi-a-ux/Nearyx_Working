import { Badge } from "@/components/ui/badge";
import { IconVerified } from "@/components/icons/TmIcons";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  className?: string;
  label?: string;
}

/**
 * Insignia pública de "Tutor verificado". Solo debe renderizarse cuando
 * verification_status === "verified".
 */
export function VerificationBadge({ className, label = "Tutor verificado" }: VerificationBadgeProps) {
  return (
    <Badge variant="verified" className={cn("gap-1 px-2.5", className)}>
      <IconVerified size={12} />
      {label}
    </Badge>
  );
}
