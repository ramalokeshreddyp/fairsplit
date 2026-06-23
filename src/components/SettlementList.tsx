import type { Settlement } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettlementListProps {
  settlements: Settlement[];
}

export function SettlementList({ settlements }: SettlementListProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="font-display text-lg">All settled up! 🎉</p>
        <p className="text-sm mt-1">No payments needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((s, i) => (
        <motion.div
          key={`${s.fromId}-${s.toId}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
        >
          <div className="flex-1">
            <span className="font-medium text-foreground">{s.fromName}</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <ArrowRight className="w-4 h-4" />
            <span className="font-bold font-display">₹{s.amount.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="flex-1 text-right">
            <span className="font-medium text-foreground">{s.toName}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
