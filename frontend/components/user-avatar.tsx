"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackClass, avatarFrameClass, type AvatarFrameSize } from "@/lib/avatar-styles";
import { cn } from "@/lib/utils";

const sizeConfig: Record<
  "xs" | "sm" | "md" | "mlg" | "lg" | "xl" | "profile" | "profileLg",
  { box: string; frame: AvatarFrameSize }
> = {
  xs: { box: "size-8 text-xs", frame: "xs" },
  sm: { box: "size-8 text-xs", frame: "xs" },
  md: { box: "size-10 text-sm", frame: "sm" },
  mlg: { box: "size-11 text-sm", frame: "sm" },
  lg: { box: "size-14 text-lg", frame: "md" },
  xl: { box: "size-12 text-sm", frame: "sm" },
  profile: { box: "size-28 text-2xl", frame: "xl" },
  profileLg: { box: "size-32 text-2xl", frame: "xl" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return `${first}${second}`.toUpperCase();
}

export function UserAvatar({
  name,
  size = "md",
  className,
  avatarUrl,
  framed = true,
}: {
  name: string;
  size?: keyof typeof sizeConfig;
  className?: string;
  avatarUrl?: string;
  /** Desactiva borde/anillo (p. ej. dentro de otro contenedor ya enmarcado). */
  framed?: boolean;
}) {
  const { box, frame } = sizeConfig[size];
  const initials = getInitials(name);
  const seed = encodeURIComponent(name || "user");

  return (
    <Avatar
      className={cn(
        box,
        "shrink-0",
        framed && avatarFrameClass(frame),
        className
      )}
    >
      <AvatarImage
        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
        alt={name}
      />
      <AvatarFallback className={avatarFallbackClass}>{initials}</AvatarFallback>
    </Avatar>
  );
}
