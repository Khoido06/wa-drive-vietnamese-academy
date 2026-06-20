"use client";

import { ReactNode } from "react";

interface ScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  hero?: boolean;
  headerAction?: ReactNode;
}

export function ScreenLayout({ title, subtitle, children, onBack, hero, headerAction }: ScreenLayoutProps) {
  return (
    <div className="app-shell">
      <header className={`app-header${hero ? "" : " app-header--compact"}`}>
        <div className="app-header__top">
          {onBack ? (
            <button type="button" className="app-header__back" onClick={onBack}>
              ← Quay lại
            </button>
          ) : (
            <span />
          )}
          {headerAction}
        </div>
        <h1 className="app-header__title">{title}</h1>
        {subtitle && <p className="app-header__subtitle">{subtitle}</p>}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
