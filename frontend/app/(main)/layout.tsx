import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { fetchApi } from "@/lib/api";
import { logoutAction } from "@/lib/auth";
import { MainTopbar } from "@/components/layout/main-topbar";
import type { ReactNode } from "react";

interface SessionUser {
  user_id?: string;
  display_name?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
}

export default async function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [userProfile, authUser] = await Promise.all([
    fetchApi<SessionUser>("/users/me").catch(() => null),
    fetchApi<SessionUser>("/auth/me").catch(() => null),
  ]);

  const userLabel =
    userProfile?.display_name ||
    authUser?.display_name ||
    authUser?.email?.split("@")[0] ||
    userProfile?.email ||
    "Usuario";
  const avatarUrl = userProfile?.avatar_url;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainTopbar userLabel={userLabel} avatarUrl={avatarUrl} logoutAction={logoutAction} />
      <AppSidebar role={authUser?.role} />
      <main className="min-h-screen pt-14 pl-[220px]">
        <div className="min-h-[calc(100vh-3.5rem)] bg-background p-4 text-foreground lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}