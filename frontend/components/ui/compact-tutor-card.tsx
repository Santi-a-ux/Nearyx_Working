"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Props {
  user_id: string;
  name?: string;
  specialty?: string;
  avatar_url?: string;
  distance_km?: number;
}

export default function CompactTutorCard({ user_id, name, specialty, avatar_url, distance_km }: Props) {
  const display = name || "Perfil disponible";
  const distanceLabel = distance_km != null ? (distance_km < 1 ? `${Math.round(distance_km * 1000)}m` : `${distance_km.toFixed(1)} km`) : null;

  if (!user_id) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-2 hover:bg-white/8">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user_id}`} alt={display} />
        <AvatarFallback>{display.substring(0,2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white/80">{display}</div>
        <div className="truncate text-xs text-white/40">{specialty || "General"}</div>
        {distanceLabel && <div className="mt-0.5 text-[11px] font-semibold text-primary/80">{distanceLabel}</div>}
      </div>
      <Link href={`/profile/${user_id}`} className="shrink-0">
        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">Ver perfil</Button>
      </Link>
    </div>
  );
}
