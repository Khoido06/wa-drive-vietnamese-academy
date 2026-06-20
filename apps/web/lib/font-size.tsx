"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FontSize = "normal" | "large" | "xlarge";

interface FontContextValue {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  cycleFontSize: () => void;
  label: string;
}

const FontContext = createContext<FontContextValue | null>(null);

const SIZES: FontSize[] = ["normal", "large", "xlarge"];
const LABELS = { normal: "A", large: "A+", xlarge: "A++" };

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>("large"); // default large for elderly

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
    localStorage.setItem("wa_font_size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    const saved = localStorage.getItem("wa_font_size") as FontSize | null;
    if (saved && SIZES.includes(saved)) setFontSize(saved);
  }, []);

  const cycleFontSize = () => {
    const idx = SIZES.indexOf(fontSize);
    setFontSize(SIZES[(idx + 1) % SIZES.length] ?? "large");
  };

  return (
    <FontContext.Provider
      value={{ fontSize, setFontSize, cycleFontSize, label: LABELS[fontSize] }}
    >
      {children}
    </FontContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}

export function FontSizeToggle() {
  const { cycleFontSize, label } = useFontSize();
  return (
    <button
      type="button"
      className="font-toggle"
      onClick={cycleFontSize}
      aria-label="Thay đổi cỡ chữ"
      title="Thay đổi cỡ chữ"
    >
      {label}
    </button>
  );
}
