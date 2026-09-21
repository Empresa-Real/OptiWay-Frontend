

// ─── Badge ─────────────────────────────────────────────────────────────

const Badge = ({ variant, children }: { variant: "success" | "warning" | "danger" | "neutral" | "info"; children: React.ReactNode }) => {
  const styles = {
    success: "bg-[var(--success-light)] text-[var(--success)]",
    warning: "bg-[var(--warning-light)] text-[var(--warning)]",
    danger: "bg-[var(--danger-light)] text-[var(--danger)]",
    neutral: "bg-gray-100 text-gray-600",
    info: "bg-[var(--accent-light)] text-[var(--accent)]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

// ─── Btn ───────────────────────────────────────────────────────────────

const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
}) => {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondary: "bg-white border border-[var(--border)] text-[var(--text)] hover:bg-gray-50",
    ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-gray-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

// ─── Input ─────────────────────────────────────────────────────────────

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-white text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition ${props.className ?? ""}`}
  />
);

// ─── Select ────────────────────────────────────────────────────────────

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition ${props.className ?? ""}`}
  />
);

// ─── Label ─────────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">{children}</label>
);

// ─── Card ──────────────────────────────────────────────────────────────

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg ${className}`}>{children}</div>
);

// ─── SectionHeader ─────────────────────────────────────────────────────

const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h1>
      {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── EmptyState ────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

// ─── Modal ─────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-base font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Table ─────────────────────────────────────────────────────────────

const Table = ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-[var(--border)]">
          {headers.map((h) => (
            <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length}>
              <EmptyState message="Sin registros" />
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[var(--text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export { Badge, Btn, Input, Select, Label, Card, SectionHeader, EmptyState, Modal, Table };
