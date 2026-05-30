"use client";

import {
  IconHome,
  IconExplore,
  IconMessages,
  IconProfile,
} from "@/components/icons/TmIcons";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Inicio",       url: "/dashboard",  icon: IconHome },
  { title: "Explorar",     url: "/explore",    icon: IconExplore },
  { title: "Mensajes",     url: "/messages",   icon: IconMessages },
  { title: "Mis Reservas", url: "/bookings",   icon: CalendarDays },
  { title: "Perfil",       url: "/profile/me", icon: IconProfile },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      // Empuja el contenedor fixed para que arranque debajo del header (h-[58px])
      className="[&>[data-slot=sidebar-container]]:top-[58px] [&>[data-slot=sidebar-container]]:h-[calc(100svh-58px)] [&>[data-slot=sidebar-container]]:border-r [&>[data-slot=sidebar-container]]:border-[rgba(253,251,212,0.08)]"
    >
      <SidebarContent className="bg-[#2B1B09] px-2 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="sr-only">Nearyx</SidebarGroupLabel>

          <SidebarGroupContent className="pt-1">
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  pathname?.startsWith(item.url + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <Link
                      href={item.url}
                      title={collapsed ? item.title : ""}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                        flex h-9 items-center rounded-[6px] transition-all duration-150
                        ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                        ${
                          isActive
                            ? "bg-[var(--surface-hover)] font-medium text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                        }
                      `}
                    >
                      <div className="flex items-center justify-center">
                        <item.icon />
                      </div>

                      {!collapsed && (
                        <span className="truncate text-sm">{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}