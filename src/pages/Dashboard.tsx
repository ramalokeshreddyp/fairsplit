import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { calculateGroupAnalytics } from '@/lib/fairness-engine';
import { analyzePatterns } from '@/lib/behavior-analysis';
import { FairnessGauge } from '@/components/FairnessGauge';
import { InsightsPanel } from '@/components/InsightsPanel';
import { CreateGroupForm } from '@/components/CreateGroupForm';
import { MobileLayout } from '@/components/MobileLayout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Plus, Users, ChevronRight, BarChart3, Lightbulb, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const MODE_EMOJI: Record<string, string> = { trip: '✈️', hostel: '🏠', event: '🎉', 'shared-living': '🏢' };

export default function Dashboard() {
  const { groups, addGroup } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const totalExpenses = groups.reduce((s, g) => s + g.expenses.reduce((es, e) => es + e.amount, 0), 0);
  const totalMembers = new Set(groups.flatMap(g => g.members.map(m => m.name))).size;
  const insights = useMemo(() => analyzePatterns(groups), [groups]);

  const isEmpty = groups.length === 0;

  return (
    <MobileLayout onCreateGroup={() => setShowCreate(true)}>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8 flex items-start justify-between"
          >
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold mb-1 md:mb-2">
                <span className="gradient-text">FairSplit</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-lg">Smart group expense tracking with fairness analysis</p>
            </div>
            <ThemeToggle />
          </motion.div>

          {/* Overview Stats */}
          {!isEmpty && (
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8" id="stats">
              {[
                { label: 'Groups', value: groups.length, icon: Users },
                { label: 'Total Tracked', value: `₹${totalExpenses.toFixed(0)}`, icon: BarChart3 },
                { label: 'People', value: totalMembers, icon: Users },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 md:p-4 rounded-xl glass-card"
                >
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
                  <p className="font-display font-bold text-lg sm:text-xl md:text-2xl truncate">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Create Group */}
          {showCreate ? (
            <div className="mb-6 md:mb-8">
              <CreateGroupForm
                onSubmit={data => { addGroup(data); setShowCreate(false); }}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          ) : (
            <Button onClick={() => setShowCreate(true)} className="mb-4 md:mb-6 glow-primary hidden md:inline-flex">
              <Plus className="w-4 h-4 mr-2" /> New Group
            </Button>
          )}

          {/* Empty State */}
          {isEmpty && !showCreate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-4"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Wallet className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl md:text-2xl mb-2">No groups yet</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-sm mb-6">
                Create your first group to start tracking shared expenses and see fairness insights.
              </p>
              <Button onClick={() => setShowCreate(true)} className="glow-primary">
                <Plus className="w-4 h-4 mr-2" /> Create Your First Group
              </Button>
            </motion.div>
          )}

          {/* Behavior Insights */}
          {insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 md:mb-8"
              id="insights"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-warning" />
                <h2 className="font-display font-semibold text-base md:text-lg">Behavior Insights</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">{insights.length}</span>
              </div>
              <InsightsPanel insights={insights} />
            </motion.div>
          )}

          {/* Groups List */}
          {!isEmpty && (
            <div className="space-y-2 md:space-y-3">
              {groups.map((group, i) => {
                const analytics = calculateGroupAnalytics(group);
                return (
                  <motion.button
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left group"
                  >
                    <span className="text-xl md:text-2xl shrink-0">{MODE_EMOJI[group.mode] ?? '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm sm:text-base md:text-lg truncate">{group.name}</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">
                        {group.members.length} members · {group.expenses.length} expenses · ₹{analytics.totalExpenses.toFixed(0)}
                      </p>
                    </div>
                    <FairnessGauge score={analytics.groupFairnessScore} size={40} />
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
