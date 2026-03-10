import type { ApplicationStatus } from '../types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; border: string }> = {
  applied:      { label: "Applied",           color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  interviewing: { label: "Interviewing",      color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  waiting:      { label: "Awaiting Decision", color: "#5b21b6", bg: "#f5f3ff", border: "#ddd6fe" },
  rejected:     { label: "Rejected",          color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
  offer:        { label: "OFFER!!!",          color: "#14532d", bg: "#f0fdf4", border: "#bbf7d0" },
};

interface Props {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.applied;
  return (
    <span
      className="status-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}
