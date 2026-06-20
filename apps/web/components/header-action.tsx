"use client";

import { FontSizeToggle } from "../lib/font-size";
import { AuthHeader } from "./auth-header";

export function HeaderAction() {
  return (
    <div className="header-actions">
      <AuthHeader />
      <FontSizeToggle />
    </div>
  );
}
