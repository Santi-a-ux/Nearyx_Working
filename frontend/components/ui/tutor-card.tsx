"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export interface TutorCardProps {
  id: string;
  user_id: string;
  display_name?: string;
  full_name?: string;
  headline?: string;
  bio?: string;
  hourly_rate?: number;
  rating?: number;
  location_name?: string;
  skills?: string[];
  avatar_url?: string;
  is_available?: boolean;
}

export function TutorCard({
  user_id,
  display_name,
  full_name,
  headline,
  bio,
  hourly_rate,
  rating,
  skills,
  avatar_url,
  is_available,
}: TutorCardProps) {
  const name = display_name || full_name || "Perfil disponible";

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/8 bg-white/5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:bg-white/8 hover:shadow-primary/10">
      <div className="flex gap-4 p-4">
        <div className="relative">
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user_id}`} alt={name} />
            <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {is_available ? (
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
          ) : null}
        </div>
        <div className="flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{name}</h3>
          <p className="line-clamp-1 text-xs text-white/50">{headline || bio || "Especialista disponible"}</p>
          <div className="mt-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white/80">{rating?.toFixed(1) || "5.0"}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills?.slice(0, 4).map((s) => (
              <Badge key={s} className="border border-primary/20 bg-primary/15 text-primary">{s}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/5 bg-white/3 p-3">
        <div className="font-semibold text-white">${hourly_rate || 20} <span className="font-normal text-white/50">/ hr</span></div>
        <div className="flex gap-2">
          <Link href={`/profile/${user_id}`}>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
              Ver Perfil
            </Button>
          </Link>
          <Link href={`/messages?userId=${user_id}`}>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Contactar
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
