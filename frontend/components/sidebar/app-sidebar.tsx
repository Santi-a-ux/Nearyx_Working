"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Map, MessageCircle, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Inicio", url: "/dashboard", icon: Home },
  { title: "Explorar", url: "/explore", icon: Map },
  { title: "Bookings", url: "/bookings", icon: CalendarDays },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
  { title: "Perfil", url: "/profile/me", icon: UserCircle },
];

const adminItems = [
  { title: "Verificaciones", url: "/admin/verifications", icon: ShieldCheck },
];

export function AppSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const navItems = role === "admin" ? [...items, ...adminItems] : items;
  const isActive = (url: string) => pathname === url || pathname?.startsWith(`${url}/`);

  return (
    <>
      {/* Tablet y PC: barra lateral */}
      <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-[220px] flex-col border-r border-border bg-background px-3 py-4 md:flex">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              aria-current={isActive(item.url) ? "page" : undefined}
              className={cn(
                "text-body flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                isActive(item.url)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Celular: barra inferior */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.title}
            href={item.url}
            aria-current={isActive(item.url) ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium",
              isActive(item.url) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.title}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}