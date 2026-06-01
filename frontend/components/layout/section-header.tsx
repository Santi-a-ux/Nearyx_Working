import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      {eyebrow ? <p className="text-label text-muted-foreground">{eyebrow}</p> : null}
      <h2 className={cn("text-display-md font-display font-semibold tracking-tight text-foreground", titleClassName)}>
        {title}
      </h2>
      {description ? <p className="text-body-lg max-w-2xl text-muted-foreground">{description}</p> : null}
    </header>
  );
}
