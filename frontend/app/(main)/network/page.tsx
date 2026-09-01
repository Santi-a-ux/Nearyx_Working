import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchApi } from "@/lib/api";
import NetworkGraphBackground from "@/components/NetworkGraphBackground";
import { buttonVariants } from "@/components/ui/button";

interface UserProfile {
  user_id: string;
}

export default async function NetworkGraphPage() {
  const userProfile = await fetchApi<UserProfile>("/users/me").catch(() => null);

  if (!userProfile?.user_id) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Red no disponible</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">No pudimos cargar tu red</h2>
          <Link href="/profile/me" className={`${buttonVariants({ variant: "default" })} mt-6`}>
          Volver a mi perfil
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full">
      <Link
        href="/profile/me"
        className="fixed left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#10314F] shadow-sm backdrop-blur-md hover:bg-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al perfil
      </Link>
      <NetworkGraphBackground userId={userProfile.user_id} verticalOffset={40} />
    </div>
  );
}