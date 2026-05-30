"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const toneClasses = [
  "bg-[var(--primary)]",
  "bg-[var(--semantic-success)]",
  "bg-violet-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-cyan-600",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return `${first}${second}`.toUpperCase();
}

function getToneIndex(name: string) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return sum % toneClasses.length;
}

export function UserAvatar({
  name,
  size = "md",
  className,
  avatarUrl,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  avatarUrl?: string;
}) {
  const tone = toneClasses[getToneIndex(name)];
  const initials = getInitials(name);
  const sizeClasses = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-10 text-sm";

  return (
    <Avatar className={cn(sizeClasses, "shrink-0 border border-white", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={cn("font-semibold text-white", tone)}>{initials}</AvatarFallback>
    </Avatar>
  );
}