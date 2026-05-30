"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Map, MessageCircle, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Inicio",       url: "/dashboard",  icon: Home },
  { title: "Explorar",     url: "/explore",    icon: Map },
  { title: "Mensajes",     url: "/messages",   icon: MessageCircle },
  { title: "Mis Reservas", url: "/bookings",   icon: CalendarDays },
  { title: "Perfil",       url: "/profile/me", icon: UserCircle },
];

export function AppSidebar({}: {}) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-[220px] flex-col border-r border-[var(--border)] bg-white px-3 py-4">
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`);

          return (
            <Link
              key={item.title}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-[9px] text-sm font-semibold transition-colors",
                isActive
                  ? "bg-[#95C9FC] text-[#10314f] shadow-sm"
                  : "text-[#1E3A5F] hover:bg-[rgba(149,201,252,0.18)] hover:text-[#10314f]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
