import Link from "next/link";
import { Network, ArrowUpRight } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { appCardClass } from "@/lib/surface-styles";

export interface NetworkRecommendation {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
  specialties?: string[];
  categories?: string[];
  common_topics?: string[];
  score: number;
  connection_count: number;
  reason: string;
}

export interface NetworkRecommendations {
  user_id: string;
  people: NetworkRecommendation[];
  tutors: NetworkRecommendation[];
}

function RecommendationItem({ item }: { item: NetworkRecommendation }) {
  const name = item.display_name || "Perfil disponible";
  const topics = [...(item.common_topics || []), ...(item.specialties || [])].slice(0, 3);

  return (
    <div className="flex min-w-0 items-center gap-3 border-t border-border/60 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <UserAvatar name={name} size="md" avatarUrl={item.avatar_url} />
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${item.user_id}`} className="flex items-center gap-1 text-sm font-bold text-[#10314F] hover:text-primary">
          <span className="truncate">{name}</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.reason}</p>
        {topics.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {topics.map((topic) => <Badge key={topic} variant="secondary" className="px-2 py-0 text-[10px]">{topic}</Badge>)}
          </div>
        )}
      </div>
      <span className="shrink-0 text-xs font-bold text-primary">{Math.round(item.score)}%</span>
    </div>
  );
}

export function ProfileNetwork({ network }: { network: NetworkRecommendations | null }) {
  if (!network || (network.people.length === 0 && network.tutors.length === 0)) return null;

  return (
    <section className={`mt-6 ${appCardClass} p-6`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#E0EFFF] p-2 text-[#2563EB]"><Network className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#10314F]/55">Red de contactos</p>
          <h2 className="mt-1 text-xl font-bold text-[#10314F]">Recomendaciones de su red</h2>
          <p className="mt-1 text-sm text-muted-foreground">Priorizadas por conexiones y temas en común.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {network.people.length > 0 && <div><h3 className="mb-3 text-sm font-bold text-[#10314F]">Personas conectadas</h3>{network.people.slice(0, 6).map((item) => <RecommendationItem key={item.user_id} item={item} />)}</div>}
        {network.tutors.length > 0 && <div><h3 className="mb-3 text-sm font-bold text-[#10314F]">Tutores de su red</h3>{network.tutors.slice(0, 6).map((item) => <RecommendationItem key={item.user_id} item={item} />)}</div>}
      </div>
    </section>
  );
}