import { useEffect, useRef, useState } from 'react';
import type { Application } from '../types';

interface Props {
  applications: Application[];
}

function useAnimatedCount(target: number, duration = 600): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

interface CardProps {
  label: string;
  desc: string;
  value: number;
  colorClass: string;
}

function StatCard({ label, desc, value, colorClass }: CardProps) {
  const animated = useAnimatedCount(value);
  return (
    <div className={`counter-card ${colorClass}`}>
      <div className="counter-value">{animated}</div>
      <div className="counter-label">{label}</div>
      <div className="counter-desc">{desc}</div>
    </div>
  );
}

export function StatsCounter({ applications }: Props) {
  const total        = applications.length;
  const interviewing = applications.filter(a => a.status === 'interviewing').length;
  const waiting      = applications.filter(a => a.status === 'waiting').length;
  const rejected     = applications.filter(a => a.status === 'rejected').length;

  return (
    <div className="counters-section">
      <div className="counters-grid">
        <StatCard label="Total Applied"      desc="Application submitted"              value={total}        colorClass="card-applied" />
        <StatCard label="Interviewing"        desc="Actively in the interview process"  value={interviewing}  colorClass="card-interviewing" />
        <StatCard label="Awaiting Decision"   desc="Interviews done"                    value={waiting}       colorClass="card-waiting" />
        <StatCard label="Rejected"            desc="Their loss"                         value={rejected}      colorClass="card-rejected" />
      </div>
    </div>
  );
}
