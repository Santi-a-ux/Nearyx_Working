"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { UserAvatar } from "@/components/user-avatar";

export function MainTopbar({
  userLabel,
  avatarUrl,
  logoutAction,
}: {
  userLabel: string;
  avatarUrl?: string | null;
  logoutAction: () => Promise<void>;
}) {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
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
  }, []);

  const updateSearch = (value: string) => {
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
    <header className="fixed inset-x-0 top-0 z-50 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-[#95C9FC] bg-white px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex flex-none items-center gap-2">
          <img src="/nearyx-azul.svg" alt="Nearyx" className="h-9 w-auto max-w-[9rem] object-contain" />
          <p className="truncate text-base font-bold uppercase tracking-[0.14em] text-[#1E3A5F]">Nearyx</p>
        </div>
      </div>

      <form
        className="mx-auto hidden w-full max-w-[38rem] md:block"
        onSubmit={(event) => {
          event.preventDefault();
          updateSearch(searchValue);
        }}
      >
          <label className="flex items-center gap-3 rounded-full border border-[#95C9FC] bg-[#C6E2FE] px-4 py-2.5 shadow-sm focus-within:border-[#95C9FC] focus-within:ring-2 focus-within:ring-[rgba(149,201,252,0.25)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#5f7b96]">
            <path fill="currentColor" d="M10.5 4a6.5 6.5 0 1 0 4.06 11.57l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
          </svg>
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

      <div className="flex items-center justify-end gap-2 justify-self-end">
        <NotificationsBell />
        <div className="flex items-center gap-2 rounded-full border border-[#95C9FC] bg-[#95C9FC] px-2 py-1.5">
          <UserAvatar name={userLabel} size="sm" className="border-transparent" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-bold text-[var(--foreground)]">{userLabel}</p>
            <p className="text-[10px] text-[var(--success)]">En línea</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="h-9 rounded-lg border border-[#95C9FC] bg-[#95C9FC] px-3 text-[#10314f] hover:bg-[rgba(149,201,252,0.88)] hover:text-[#10314f]">
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}