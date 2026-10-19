import { useState } from "react";
import { Input, Label, Btn } from "../components/ui";
import { updatePassword } from "../services/auth";

export default function SetPassword({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (result.success) {
        setSuccess("Contraseña configurada con éxito. Redirigiendo...");
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setError(result.error || "El enlace no es válido o ya expiró.");
      }
    } catch (err: any) {
      setError(err?.message || "El enlace no es válido o ya expiró.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 p-10" style={{ background: "#1A1D23" }}>
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-base tracking-tight block leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Opti-Way
              </span>
              <span className="text-white/40 text-[11px] uppercase tracking-wider block">
                SupplyCore
              </span>
            </div>
          </div>
          <h2 className="text-white text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Configura tu contraseña
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Establece una contraseña segura para activar tu cuenta o restaurar tu acceso al sistema.
          </p>
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/40 text-xs font-medium">Opti-Way · Versión 1.0</p>
          <p className="text-white/25 text-xs mt-0.5">SupplyCore Logistics Platform</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Configura tu contraseña
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Ingresa y confirma tu nueva clave de acceso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                minLength={8}
                disabled={loading || !!success}
                required
              />
            </div>

            <div>
              <Label>Confirmar contraseña</Label>
              <Input
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmation}
                onChange={(e) => {
                  setConfirmation(e.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                minLength={8}
                disabled={loading || !!success}
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <Btn type="submit" size="md" disabled={loading || !!success} className="w-full justify-center">
              {loading ? "Guardando..." : "Guardar contraseña"}
            </Btn>

            {onCancel && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
