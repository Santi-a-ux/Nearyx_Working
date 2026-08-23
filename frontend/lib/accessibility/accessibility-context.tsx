"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "nearyx:accessibility";

export const FONT_SCALE_STEPS = [87.5, 100, 112.5, 125, 137.5, 150] as const;
export type FontScale = (typeof FONT_SCALE_STEPS)[number];

const DEFAULT_FONT_SCALE: FontScale = 100;

type AccessibilityState = {
	fontScale: FontScale;
	highContrast: boolean;
};

type AccessibilityContextValue = AccessibilityState & {
	setFontScale: (scale: FontScale) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  toggleHighContrast: () => void;
  resetAccessibility: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function isFontScale(value: unknown): value is FontScale {
  return typeof value === "number" && (FONT_SCALE_STEPS as readonly number[]).includes(value);
}

function readStoredState(): AccessibilityState {
  if (typeof window === "undefined") {
    return { fontScale: DEFAULT_FONT_SCALE, highContrast: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fontScale: DEFAULT_FONT_SCALE, highContrast: false };

    const parsed = JSON.parse(raw) as Partial<AccessibilityState>;
    return {
      fontScale: isFontScale(parsed.fontScale) ? parsed.fontScale : DEFAULT_FONT_SCALE,
      highContrast: parsed.highContrast === true,
    };
  } catch {
    return { fontScale: DEFAULT_FONT_SCALE, highContrast: false };
  }
}

function applyToDocument(state: AccessibilityState) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.fontSize = `${state.fontScale}%`;
  root.classList.toggle("high-contrast", state.highContrast);
  root.dataset.fontScale = String(state.fontScale);
}

export const ACCESSIBILITY_INIT_SCRIPT = `
(function () {
  try {
    var raw = window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var state = raw ? JSON.parse(raw) : null;
    var scale = state && ${JSON.stringify([...FONT_SCALE_STEPS])}.indexOf(state.fontScale) !== -1 ? state.fontScale : ${DEFAULT_FONT_SCALE};
    var highContrast = !!(state && state.highContrast === true);
    var root = document.documentElement;
    root.style.fontSize = scale + "%";
    root.classList.toggle("high-contrast", highContrast);
    root.dataset.fontScale = String(scale);
  } catch (e) {}
})();
`;

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>({
    fontScale: DEFAULT_FONT_SCALE,
    highContrast: false,
  });

  useEffect(() => {
    setState(readStoredState());
  }, []);

  useEffect(() => {
    applyToDocument(state);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
			
    }
  }, [state]);

  const setFontScale = useCallback((scale: FontScale) => {
    setState((prev) => ({ ...prev, fontScale: scale }));
  }, []);

  const increaseFontScale = useCallback(() => {
    setState((prev) => {
      const currentIndex = FONT_SCALE_STEPS.indexOf(prev.fontScale);
      const nextIndex = Math.min(currentIndex + 1, FONT_SCALE_STEPS.length - 1);
      return { ...prev, fontScale: FONT_SCALE_STEPS[nextIndex] };
    });
  }, []);

  const decreaseFontScale = useCallback(() => {
    setState((prev) => {
      const currentIndex = FONT_SCALE_STEPS.indexOf(prev.fontScale);
      const nextIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, fontScale: FONT_SCALE_STEPS[nextIndex] };
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setState((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const resetAccessibility = useCallback(() => {
    setState({ fontScale: DEFAULT_FONT_SCALE, highContrast: false });
  }, []);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      ...state,
      setFontScale,
      increaseFontScale,
      decreaseFontScale,
      toggleHighContrast,
      resetAccessibility,
    }),
    [state, setFontScale, increaseFontScale, decreaseFontScale, toggleHighContrast, resetAccessibility]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility debe usarse dentro de un AccessibilityProvider");
  }
  return context;
}