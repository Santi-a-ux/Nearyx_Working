"use client";

import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    dashboard: "Inicio",
    explore: "Explorar",
    messages: "Mensajes",
    profile: "Perfil",
    tutor: "Tutor",
    onboarding: "Onboarding",
    me: "Mi perfil",
  };

  return (
    <nav className="text-sm text-muted-foreground">
      {segments.length === 0 ? (
        <span>Inicio</span>
      ) : (
        <span>
          {segments.map((seg, idx) => (
            <span key={idx} className="capitalize">{labels[seg] ?? seg.replace(/-/g, ' ')}{idx < segments.length - 1 ? ' / ' : ''}</span>
          ))}
        </span>
      )}
    </nav>
  );
}
