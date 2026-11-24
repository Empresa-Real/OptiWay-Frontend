import { useEffect, useState } from "react";
import type { User } from "../types";
import { Input, Label, Btn } from "../components/ui";
import { ContrastToggle } from "../components/ContrastToggle";
import { login } from "../services/auth";
import { getEstadisticasPublicas, type EstadisticasPublicas } from "../services/estadisticas";

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
  const [stats, setStats] = useState<EstadisticasPublicas | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEstadisticasPublicas()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // Estadísticas públicas opcionales en la pantalla de login
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success && result.user) {
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
    <div className="relative min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left Hero panel */}
      <div className="hidden lg:flex relative flex-col justify-between w-[54%] p-10 overflow-hidden" style={{ background: "var(--sidebar-bg)" }}>
        <img
          src="/hero-supplychain.svg"
          alt="Red logística Opti-Way"
          className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none select-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.45) 45%, rgba(15,23,42,0.92) 100%)",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
              </svg>
            </div>
            <div>
              <span className="text-[var(--sidebar-text)] font-semibold text-lg tracking-tight block leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>Opti-Way</span>
              <span className="text-[var(--sidebar-text-40)] text-[11px] uppercase tracking-wider block">SupplyCore</span>
            </div>
          </div>
          <h2 className="text-[var(--sidebar-text)] text-3xl font-semibold leading-tight max-w-lg mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Control inteligente de tu red logística
          </h2>
          <p className="text-[var(--sidebar-text-70)] text-sm leading-relaxed max-w-md">
            Conecta tiendas, centros de distribución y planificación de demanda desde una sola plataforma en tiempo real.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur-sm px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Tiendas</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stats.tiendas.toLocaleString("es-CO")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur-sm px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Centros</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stats.centrosDistribucion.toLocaleString("es-CO")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur-sm px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Stock total</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stats.unidadesStock.toLocaleString("es-CO")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur-sm px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">En tiendas</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stats.unidadesEnTiendas.toLocaleString("es-CO")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur-sm px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">En centros</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stats.unidadesEnCentros.toLocaleString("es-CO")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur-sm px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Registros</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stats.registrosInventario.toLocaleString("es-CO")}</p>
              </div>
            </div>
          )}
          <div className="border-t border-[var(--sidebar-border)] pt-5 flex items-center justify-between">
            <div>
              <p className="text-[var(--sidebar-text-40)] text-xs font-medium">Opti-Way · Versión 1.0</p>
              <p className="text-[var(--sidebar-text-25)] text-xs mt-0.5">SupplyCore Logistics Platform</p>
            </div>
            {stats && (
              <span className="text-xs text-slate-400">
                {stats.registrosInventario.toLocaleString("es-CO")} registros activos
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="absolute right-5 top-5 z-10">
        <ContrastToggle variant="page" />
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