const STORAGE_KEY = "contrast";

export function isHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setHighContrast(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Sin localStorage disponible: el modo sigue funcionando durante la sesión
  }
  if (enabled) {
    document.documentElement.setAttribute("data-contrast", "high");
  } else {
    document.documentElement.removeAttribute("data-contrast");
  }
}

export function toggleContrast(): void {
  setHighContrast(!isHighContrast());
}

export function applyStoredContrast(): void {
  if (typeof window === "undefined") return;
  if (isHighContrast()) {
    document.documentElement.setAttribute("data-contrast", "high");
  }
}