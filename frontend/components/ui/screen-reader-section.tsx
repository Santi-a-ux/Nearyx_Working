"use client";

import { ReactNode } from "react";
import { useScreenReader } from "@/components/providers/ScreenReaderContext";

interface ScreenReaderSectionProps {
  text: string;
  children: ReactNode;
  className?: string;
}

export function ScreenReaderSection({
  text,
  children,
  className = "",
}: ScreenReaderSectionProps) {
  const { speak, stop } = useScreenReader();

  return (
    <div
      tabIndex={0}
      aria-label={text}
      onFocus={() => speak(text)}
      onBlur={stop}
      className={`focus:outline-none focus:ring-2 focus:ring-primary rounded-md ${className}`}
    >
      {children}
    </div>
  );
}