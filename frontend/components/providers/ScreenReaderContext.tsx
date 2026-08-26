"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface ScreenReaderContextType {
  isActive: boolean;
  toggleReader: () => void;
  speak: (text: string) => void;
  stop: () => void;
}

const ScreenReaderContext =
  createContext<ScreenReaderContextType | undefined>(undefined);

export function ScreenReaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleReader = () => {
    if (!mounted) return;

    const newState = !isActive;
    setIsActive(newState);

    if (newState) {
      const utterance = new SpeechSynthesisUtterance(
        "Lector de pantalla activado"
      );

      utterance.lang = "es-CO";

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  const speak = useCallback(
    (text: string) => {
      if (!mounted || !isActive) return;

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-CO";

        window.speechSynthesis.speak(utterance);
      }
    },
    [isActive, mounted]
  );

  const stop = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return (
    <ScreenReaderContext.Provider
      value={{ isActive, toggleReader, speak, stop }}
    >
      {children}
    </ScreenReaderContext.Provider>
  );
}

export function useScreenReader() {
  const context = useContext(ScreenReaderContext);

  if (!context) {
    throw new Error(
      "useScreenReader debe usarse dentro de un ScreenReaderProvider"
    );
  }

  return context;
}