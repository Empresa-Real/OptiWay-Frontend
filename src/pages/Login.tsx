import { useState } from "react";
import type { User } from "../types";
import { credentials, seedUsers } from "../data/seed";
import { Input, Label, Btn } from "../components/ui";

export default function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cred = credentials[email.trim().toLowerCase()];
    if (!cred || cred.password !== password) {
      setError("Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.");
      return;
    }
    const user = seedUsers.find((u) => u.id === cred.userId);
    if (user) onLogin(user);
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
            <span className="text-white font-semibold text-base tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>SupplyCore</span>
          </div>
          <h2 className="text-white text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Sistema de gestión de cadena de suministro
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Administra tu catálogo, operación y personal desde un solo lugar.
          </p>
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/30 text-xs">Sprint 1 · Versión 1.0</p>
          <p className="text-white/20 text-xs mt-0.5">Proyecto académico</p>
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
                required
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}
            <Btn type="submit" size="md">Iniciar sesión</Btn>
          </form>

          <div className="mt-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Cuentas de prueba</p>
            <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
              <div className="flex justify-between"><span>ana@empresa.com</span><span className="font-mono">admin123</span></div>
              <div className="flex justify-between"><span>carlos@empresa.com</span><span className="font-mono">tienda123</span></div>
              <div className="flex justify-between"><span>roberto@empresa.com</span><span className="font-mono">cd123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
