import { useEffect, useState } from "react";
import { isHighContrast, toggleContrast } from "../contrast";

export function ContrastToggle({ variant = "sidebar" }: { variant?: "sidebar" | "page" }) {
  const [high, setHigh] = useState(isHighContrast());

  useEffect(() => {
    setHigh(isHighContrast());
  }, []);

  const isPage = variant === "page";

  return (
    <button
      onClick={() => toggleContrast()}
      aria-label="Modo alto contraste"
      aria-pressed={high ? "true" : "false"}
      className={`flex items-center gap-2 text-xs transition ${
        isPage
          ? "text-[var(--text)] hover:text-[var(--accent)]"
          : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-70)]"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border relative overflow-hidden ${
          isPage ? "border-[var(--border)]" : "border-[var(--sidebar-border)]"
        }`}
      >
        <div
          className={`h-4 absolute left-0 top-0 ${high ? "w-4" : "w-2"} ${
            isPage ? "bg-[var(--text)]" : "bg-[var(--sidebar-text)]"
          }`}
        />
      </div>
      <span>Modo alto contraste</span>
    </button>
  );
}