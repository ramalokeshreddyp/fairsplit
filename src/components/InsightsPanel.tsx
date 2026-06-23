import type { Insight, InsightType } from '@/lib/behavior-analysis';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TYPE_STYLES: Record<InsightType, string> = {
  alert: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-info bg-info/5',
  success: 'border-l-success bg-success/5',
};

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const navigate = useNavigate();

  if (insights.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border text-center">
        <p className="text-2xl mb-2">🎯</p>
        <p className="text-muted-foreground text-sm">No patterns detected yet. Add more expenses to unlock insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insights.map((insight, i) => (
        <motion.button
          key={insight.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          onClick={() => navigate(`/group/${insight.groupId}`)}
          className={`w-full text-left p-4 rounded-lg border-l-4 border border-border transition-all hover:scale-[1.01] ${TYPE_STYLES[insight.type]}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">{insight.emoji}</span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm leading-tight">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
