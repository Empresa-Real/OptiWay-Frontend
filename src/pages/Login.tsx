import { useState } from "react";
import type { User } from "../types";
import { Input, Label, Btn } from "../components/ui";
import { login } from "../services/auth";

export default function Login({
  onLogin,
  users = [],
}: {
  onLogin: (user: User) => void;
  users?: User[];
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        if (result.user.role === "planner") {
          setError("El rol Planificador no tiene pantalla asignada en el frontend por el momento.");
          return;
        }
        onLogin(result.user);
      } else {
        setError(result.error || "No se pudo iniciar sesión. Verifica tus credenciales.");
      }
    } catch (err: any) {
      setError(err?.message || "Error al conectar con el servicio de autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 p-10" style={{ background: "#1A1D23" }}>
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-base tracking-tight block leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>Opti-Way</span>
              <span className="text-white/40 text-[11px] uppercase tracking-wider block">SupplyCore</span>
            </div>
          </div>
          <h2 className="text-white text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Sistema de gestión de cadena de suministro
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Administra tu catálogo, operación y personal desde un solo lugar.
          </p>
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/40 text-xs font-medium">Opti-Way · Versión 1.0</p>
          <p className="text-white/25 text-xs mt-0.5">SupplyCore Logistics Platform</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Iniciar sesión</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Accede con tu cuenta institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}
            <Btn type="submit" size="md" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}