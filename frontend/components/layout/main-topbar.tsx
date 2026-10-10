"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Search, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { UserAvatar } from "@/components/user-avatar";
import { useScreenReader } from "@/components/providers/ScreenReaderContext";

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function MainTopbar({
  userLabel,
  avatarUrl,
  logoutAction,
}: {
  userLabel: string;
  avatarUrl?: string | null;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const showFeedSearch = isDashboardPath(pathname);
  const [searchValue, setSearchValue] = useState("");


  const { isActive, toggleReader } = useScreenReader();

  useEffect(() => {
    if (!showFeedSearch) {
      setSearchValue("");
      return;
    }

    const readCurrentQuery = () => {
      const currentParams = new URLSearchParams(window.location.search);
      setSearchValue(currentParams.get("q") || "");
    };

    readCurrentQuery();
    window.addEventListener("popstate", readCurrentQuery);
    window.addEventListener("nearyx-search", readCurrentQuery as EventListener);

    return () => {
      window.removeEventListener("popstate", readCurrentQuery);
      window.removeEventListener("nearyx-search", readCurrentQuery as EventListener);
    };
  }, [showFeedSearch]);

  useEffect(() => {
    if (showFeedSearch) return;

    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has("q")) return;

    currentParams.delete("q");
    const queryString = currentParams.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [showFeedSearch, pathname]);

  const updateSearch = (value: string) => {
    if (!showFeedSearch) return;

    const trimmed = value.trim();
    const nextParams = new URLSearchParams(window.location.search);

    if (trimmed) {
      nextParams.set("q", trimmed);
    } else {
      nextParams.delete("q");
    }

    const queryString = nextParams.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
    window.dispatchEvent(new Event("nearyx-search"));
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-[#8e939b] bg-[#8e939b] px-2 sm:px-4 ${showFeedSearch ? "md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4" : ""
        }`}
    >
      <div className="flex shrink-0 items-center gap-2">
        <img src="/nearyx-azul.svg" alt="Nearyx" className="h-8 w-auto max-w-[9rem] object-contain sm:h-9" />
        <p className="hidden truncate text-base font-bold uppercase tracking-[0.14em] text-[#000000] sm:block">Nearyx</p>
      </div>

      {showFeedSearch ? (
        <form
          className="mx-auto hidden w-full max-w-[38rem] md:block"
          onSubmit={(event) => {
            event.preventDefault();
            updateSearch(searchValue);
          }}
        >
          <label className="flex items-center gap-3 rounded-full border border-border bg-[#ffffff] px-4 py-2.5 shadow-sm focus-within:border-[#95C9FC] focus-within:ring-2 focus-within:ring-[rgba(149,201,252,0.25)]">
            <Search className="h-4 w-4 shrink-0 text-[#5f7b96]" aria-hidden />
            <Input
              value={searchValue}
              onChange={(event) => {
                const value = event.target.value;
                setSearchValue(value);
                updateSearch(value);
              }}
              placeholder="Buscar publicaciones por temática o palabra clave"
              aria-label="Buscar publicaciones"
              className="h-auto border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none placeholder:text-[#6d8298] focus-visible:ring-0"
            />
          </label>
        </form>
      ) : null}

      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:justify-self-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleReader}
          title={isActive ? "Desactivar lector de voz" : "Activar lector de voz"}
          aria-label={isActive ? "Desactivar lector de voz" : "Activar lector de voz"}
          className={`h-9 rounded-lg border border-border px-2 font-semibold transition-colors md:px-3 ${isActive
            ? "bg-[#22c55e] text-white hover:bg-[#16a34a] hover:text-white"
            : "bg-[#C6E2FE] text-[#000000] hover:bg-[rgba(149,201,252,0.88)]"
            }`}
        >
          {isActive ? <Volume2 className="h-4 w-4 animate-pulse md:mr-1.5" /> : <VolumeX className="h-4 w-4 md:mr-1.5" />}
          <span className="hidden md:inline">{isActive ? "Voz Activa" : "Activar Voz"}</span>
        </Button>

        <NotificationsBell />

        <div className="flex items-center gap-2 rounded-full border border-[#F8FBFF] bg-[#F8FBFF] px-1.5 py-1 sm:px-2 sm:py-1.5">
          <UserAvatar name={userLabel} size="sm" avatarUrl={avatarUrl || undefined} />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-bold text-[var(--foreground)]">{userLabel}</p>
            <p className="text-[10px] text-[var(--success)]">En línea</p>
          </div>
        </div>

        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            aria-label="Salir"
            className="h-9 rounded-lg border border-border bg-[#C6E2FE] px-2 text-[#000000] hover:bg-[rgba(149,201,252,0.88)] hover:text-[#10314f] sm:px-3"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
