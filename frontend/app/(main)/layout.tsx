// app/(dashboard)/layout.tsx  — estructura tipo GitHub

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { fetchApi } from "@/lib/api";
import { logoutAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import Image from "next/image";

interface SessionUser {
  user_id?: string;
  display_name?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
}

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [userProfile, authUser] = await Promise.all([
    fetchApi<SessionUser>("/users/me").catch(() => null),
    fetchApi<SessionUser>("/auth/me").catch(() => null),
  ]);

  const resolvedUserId = userProfile?.user_id || authUser?.user_id || "";
  const userLabel =
    userProfile?.display_name ||
    authUser?.display_name ||
    authUser?.email?.split("@")[0] ||
    userProfile?.email ||
    "Usuario";
  const avatarSeed = resolvedUserId || userLabel;
  const avatarUrl = userProfile?.avatar_url;

  return (
    <SidebarProvider>
      {/*
        ── CAMBIO CLAVE ──────────────────────────────────────────
        Antes: <AppSidebar /> y <main> eran hermanos en flex-row
               y el <header> vivía DENTRO de <main>, así que solo
               ocupaba el ancho restante después del sidebar.

        Ahora: Un wrapper flex-col ocupa toda la pantalla.
               El <header> es el PRIMER hijo → abarca el 100% del ancho.
               El segundo hijo es flex-row con sidebar + contenido.
        ─────────────────────────────────────────────────────────
      */}
      <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">

        {/* ── TOPBAR full-width ── */}
        <header
          className="flex h-[58px] w-full shrink-0 items-center justify-between border-b px-5"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "rgba(56,36,13,0.16)",
            zIndex: 50,
          }}
        >
          {/* Izquierda: logo + Dashboard */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[6px]"
              style={{
                backgroundColor: "rgba(56,36,13,0.04)",
                border: "1px solid rgba(56,36,13,0.12)",
              }}
            >
              <Image src="/nearyx-cafe.svg" alt="Nearyx" width={20} height={20} />
            </div>

            <span
              className="hidden md:block"
              style={{
                color: "#38240D",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Dashboard
            </span>
          </div>

          {/* Derecha: notificaciones + usuario */}
          <div
            className="flex items-center pl-3"
            style={{
              borderLeft: "1px solid rgba(253,251,212,0.12)",
              paddingLeft: "12px",
            }}
          >

            <div
              className="flex items-center rounded-[6px] border"
              style={{
                backgroundColor: "#38240D",
                borderColor: "rgba(253,251,212,0.12)",
                padding: "0 12px",
                gap: "10px",
              }}
            >
              <NotificationsBell />

              <Avatar
                className="h-8 w-8"
                style={{ border: "2px solid rgba(253,251,212,0.4)" }}
              >
                <AvatarImage
                  src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  alt={userLabel}
                  className="h-full w-full rounded-full object-cover"
                />
                <AvatarFallback>{userLabel.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <span className="hidden text-[10px] sm:inline" style={{ color: "rgba(253,251,212,0.72)" }}>
                  Sesión
                </span>
                <span
                  className="block max-w-[120px] truncate text-xs font-semibold"
                  style={{ color: "var(--text-primary)" }}
                  title={userLabel}
                >
                  {userLabel}
                </span>
              </div>

              <form action={logoutAction}>
                <Button
                  type="submit"
                  size="sm"
                  className="h-6 rounded-[6px] border px-2 text-[10px] transition-all"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "rgba(253,251,212,0.25)",
                    color: "var(--text-primary)",
                  }}
                >
                  Salir
                </Button>
              </form>
            </div>
          </div>
        </header>

        {/* ── FILA: sidebar + contenido ── */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />

          <main className="flex-1 overflow-auto p-6 relative bg-[var(--bg)] text-[var(--surface-1)]">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
}