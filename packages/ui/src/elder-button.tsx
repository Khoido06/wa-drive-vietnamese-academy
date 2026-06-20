"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

interface ElderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "ghost";
  loading?: boolean;
}

export function ElderButton({
  children,
  variant = "primary",
  loading,
  className = "",
  disabled,
  ...props
}: ElderButtonProps) {
  const variantClass = {
    primary: "btn--primary",
    secondary: "btn--secondary",
    success: "btn--success",
    ghost: "btn--ghost",
  }[variant];

  return (
    <button
      className={`btn ${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
