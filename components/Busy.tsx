"use client";

export default function Busy({
  busy, children, className = "btn", onClick, disabled, type = "button",
}: {
  busy: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} className={className} onClick={onClick} disabled={busy || disabled} aria-busy={busy}>
      {busy && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
