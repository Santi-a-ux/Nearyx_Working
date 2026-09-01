import Link from "next/link";
import { Network, ArrowUpRight } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { appCardClass } from "@/lib/surface-styles";

export interface NetworkNode {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
  specialties?: string[];
  categories?: string[];
}

export interface NetworkEdge {
  source: string;
  target: string;
  edge_type: "chat" | "booking";
}

export interface NetworkRecommendations {
  user_id: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const EDGE_LABEL: Record<string, string> = {
  chat: "Chat",
  booking: "Reserva",
};

function buildConnections(network: NetworkRecommendations) {
  const meId = network.user_id;
  const nodesById = new Map(network.nodes.map((n) => [n.user_id, n]));

  // Conexiones directas conmigo
  const direct = network.edges.filter((e) => e.source === meId || e.target === meId);
  const directIds = new Set(direct.map((e) => (e.source === meId ? e.target : e.source)));

  // Conexiones indirectas: aristas entre dos nodos que no soy yo, donde
  // al menos uno de los dos es mi contacto directo (así llega a mi grafo)
  const indirect = network.edges.filter(
    (e) => e.source !== meId && e.target !== meId && (directIds.has(e.source) || directIds.has(e.target))
  );

  const directItems = direct
    .map((e) => {
      const otherId = e.source === meId ? e.target : e.source;
      const node = nodesById.get(otherId);
      if (!node) return null;
      return { node, via: null as NetworkNode | null, edge_type: e.edge_type };
    })
    .filter((x): x is { node: NetworkNode; via: NetworkNode | null; edge_type: NetworkEdge["edge_type"] } => x !== null);

  const indirectItems = indirect
    .map((e) => {
      // El extremo que ya es mi contacto directo es el intermediario ("via")
      const viaId = directIds.has(e.source) ? e.source : e.target;
      const otherId = viaId === e.source ? e.target : e.source;
      if (directIds.has(otherId)) return null; // ya es directo, no lo dupliques como indirecto
      const node = nodesById.get(otherId);
      const via = nodesById.get(viaId);
      if (!node) return null;
      return { node, via: via || null, edge_type: e.edge_type };
    })
    .filter((x): x is { node: NetworkNode; via: NetworkNode | null; edge_type: NetworkEdge["edge_type"] } => x !== null);

  return { directItems, indirectItems };
}

function ConnectionItem({ node, via, edge_type }: { node: NetworkNode; via: NetworkNode | null; edge_type: string }) {
  const name = node.display_name || "Perfil disponible";
  const topics = [...(node.specialties || []), ...(node.categories || [])].slice(0, 3);
  const isIndirect = via !== null;

  return (
    <div
      className={`flex min-w-0 items-center gap-3 border-t border-border/60 py-3 first:border-t-0 first:pt-0 last:pb-0 ${
        isIndirect ? "opacity-70" : ""
      }`}
    >
      <div className={isIndirect ? "scale-90" : ""}>
        <UserAvatar name={name} size="md" avatarUrl={node.avatar_url} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/profile/${node.user_id}`}
            className={`flex items-center gap-1 text-sm font-bold hover:text-primary ${
              isIndirect ? "text-[#10314F]/70" : "text-[#10314F]"
            }`}
          >
            <span className="truncate">{name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
          {isIndirect && (
            <Badge variant="outline" className="border-dashed px-1.5 py-0 text-[9px] text-muted-foreground">
              Aún no conectado
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {via ? `Conectado vía ${via.display_name || "un contacto"}` : `Conexión directa (${EDGE_LABEL[edge_type] || edge_type})`}
        </p>
        {topics.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {topics.map((topic) => <Badge key={topic} variant="secondary" className="px-2 py-0 text-[10px]">{topic}</Badge>)}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileNetwork({ network }: { network: NetworkRecommendations | null }) {
  if (!network || network.edges.length === 0) return null;

  const { directItems, indirectItems } = buildConnections(network);
  if (directItems.length === 0 && indirectItems.length === 0) return null;

  return (
    <section className={`mt-6 ${appCardClass} p-6`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#E0EFFF] p-2 text-[#2563EB]"><Network className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#10314F]/55">Red de contactos</p>
          <h2 className="mt-1 text-xl font-bold text-[#10314F]">Tu red de conexiones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Solo conexiones reales por chat o reservas.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {directItems.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#10314F]">Conexiones directas</h3>
            {directItems.slice(0, 6).map(({ node, via, edge_type }) => (
              <ConnectionItem key={node.user_id} node={node} via={via} edge_type={edge_type} />
            ))}
          </div>
        )}
        {indirectItems.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#10314F]">Conexiones indirectas</h3>
            {indirectItems.slice(0, 6).map(({ node, via, edge_type }) => (
              <ConnectionItem key={node.user_id} node={node} via={via} edge_type={edge_type} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}