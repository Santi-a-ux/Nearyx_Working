import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SiteNavProps {
  className?: string;
}

const navLinks = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "/register", label: "Para expertos" },
  { href: "/register", label: "Para estudiantes" },
] as const;

export function SiteNav({ className }: SiteNavProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md",
        className,
      )}
    >
      <Link href="/" className="flex items-center gap-3">
        <img src="/nearyx-azul.svg" alt="Nearyx" className="h-8 w-auto object-contain" />
        <span className="font-display text-lg font-semibold tracking-tight">Nearyx</span>
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-body text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Entrar
        </Link>
        <Link href="/register" className={buttonVariants({ variant: "brand", size: "sm" })}>
          Empezar
        </Link>
      </div>
    </nav>
  );
}
