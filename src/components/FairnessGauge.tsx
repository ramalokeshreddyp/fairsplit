import { motion } from 'framer-motion';

interface FairnessGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export function FairnessGauge({ score, size = 120, label }: FairnessGaugeProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--success))';
    if (s >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--accent))';
  };

  const fontSize = size <= 48 ? 'text-xs' : size <= 80 ? 'text-base' : 'text-2xl';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="-rotate-90" style={{ width: size, height: size }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={getColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold font-display text-foreground`}>{score}</span>
        </div>
      </div>
      {label && <span className="text-xs md:text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
