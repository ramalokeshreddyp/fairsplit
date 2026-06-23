import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { calculateGroupAnalytics } from '@/lib/fairness-engine';
import { FairnessGauge } from '@/components/FairnessGauge';
import { SettlementList } from '@/components/SettlementList';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Receipt, X, Pencil, Download } from 'lucide-react';
import { exportGroupToPDF } from '@/lib/export-pdf';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(174, 72%, 50%)', 'hsl(350, 80%, 60%)', 'hsl(38, 92%, 55%)',
  'hsl(210, 80%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(280, 60%, 55%)',
];

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getGroup, addExpense, editExpense, deleteExpense, deleteGroup } = useApp();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<import('@/lib/types').Expense | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const group = getGroup(id ?? '');
  const analytics = useMemo(() => group ? calculateGroupAnalytics(group) : null, [group]);

  if (!group || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Group not found</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const contributionData = analytics.fairnessScores.map(f => ({
    name: f.memberName,
    paid: f.totalPaid,
    benefited: f.totalBenefited,
  }));

  const hasExpenses = group.expenses.length > 0;

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold truncate">{group.name}</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{group.members.length} members · {group.expenses.length} expenses</p>
          </div>
          <ThemeToggle />
          {hasExpenses && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => exportGroupToPDF(group)}
              title="Export to PDF"
            >
              <Download className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { if (confirm('Delete this group and all its expenses?')) { deleteGroup(group.id); navigate('/'); } }}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
          {[
            { label: 'Total', value: `₹${analytics.totalExpenses.toFixed(0)}`, icon: DollarSign },
            { label: 'Avg/Person', value: `₹${analytics.averagePerPerson.toFixed(0)}`, icon: TrendingUp },
            { label: 'Top Payer', value: analytics.topPayer.name, icon: TrendingUp },
            { label: 'Settlements', value: `${analytics.settlements.length}`, icon: TrendingDown },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 md:p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1">
                <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">{stat.label}</span>
              </div>
              <p className="font-display font-bold text-sm sm:text-base md:text-lg truncate">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Empty state for no expenses */}
        {!hasExpenses && !showAddExpense && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Receipt className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h2 className="font-display font-bold text-lg md:text-xl mb-2">No expenses yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs mb-5">
              Add your first expense to start tracking spending and fairness for this group.
            </p>
            <Button onClick={() => setShowAddExpense(true)} className="glow-primary">
              <Plus className="w-4 h-4 mr-2" /> Add First Expense
            </Button>
          </motion.div>
        )}

        {/* Add/Edit Expense Forms */}
        {showAddExpense && (
          <div className="mb-4 md:mb-6">
            <AddExpenseForm
              group={group}
              onSubmit={expense => { addExpense(group.id, expense); setShowAddExpense(false); }}
              onCancel={() => setShowAddExpense(false)}
            />
          </div>
        )}
        {editingExpense && (
          <div className="mb-4 md:mb-6">
            <AddExpenseForm
              group={group}
              initialData={editingExpense}
              onSubmit={expense => { editExpense(group.id, editingExpense.id, expense); setEditingExpense(null); }}
              onCancel={() => setEditingExpense(null)}
            />
          </div>
        )}

        {hasExpenses && (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Fairness Section */}
            <div className="space-y-4 md:space-y-6">
              <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
                <h2 className="font-display font-semibold mb-3 md:mb-4 text-sm md:text-base">Group Fairness</h2>
                <div className="flex justify-center mb-3 md:mb-4">
                  <FairnessGauge score={analytics.groupFairnessScore} size={120} label="Group Score" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {analytics.fairnessScores.map(f => (
                    <div key={f.memberId} className="flex items-center gap-2 md:gap-3 p-2 rounded-lg bg-secondary/30">
                      <FairnessGauge score={f.fairnessScore} size={36} />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">{f.memberName}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {f.netBalance >= 0 ? '+' : ''}{f.netBalance.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
                <h2 className="font-display font-semibold mb-3 md:mb-4 text-sm md:text-base">Settlements</h2>
                <SettlementList settlements={analytics.settlements} />
              </div>
            </div>

            {/* Charts + Expenses */}
            <div className="space-y-4 md:space-y-6">
              <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
                <h2 className="font-display font-semibold mb-3 md:mb-4 text-sm md:text-base">Contribution vs Benefit</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={contributionData}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Bar dataKey="paid" fill="hsl(174, 72%, 50%)" radius={[4, 4, 0, 0]} name="Paid" />
                    <Bar dataKey="benefited" fill="hsl(350, 80%, 60%)" radius={[4, 4, 0, 0]} name="Benefited" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
                <h2 className="font-display font-semibold mb-3 md:mb-4 text-sm md:text-base">By Category</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Expense List */}
              <div className="p-4 md:p-5 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="font-display font-semibold text-sm md:text-base">Expenses</h2>
                  <Button size="sm" onClick={() => { setShowAddExpense(true); setEditingExpense(null); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {group.expenses.map(exp => {
                    const payer = group.members.find(m => m.id === exp.paidById);
                    return (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-secondary/30 group/item"
                      >
                        {exp.receiptUrl ? (
                          <button
                            onClick={() => setViewingReceipt(exp.receiptUrl!)}
                            className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                          >
                            <img src={exp.receiptUrl} alt="Receipt" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-md bg-secondary/50 flex items-center justify-center">
                            <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">{exp.description}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{payer?.name} · {exp.category} · {exp.splitType}</p>
                        </div>
                        <span className="font-display font-bold text-xs md:text-sm shrink-0">₹{exp.amount.toFixed(0)}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 shrink-0"
                            onClick={() => { setEditingExpense(exp); setShowAddExpense(false); }}
                          >
                            <Pencil className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 shrink-0"
                            onClick={() => deleteExpense(group.id, exp.id)}
                          >
                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Lightbox */}
      {viewingReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div className="relative max-w-lg w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost" size="icon"
              className="absolute -top-3 -right-3 z-10 bg-card border border-border rounded-full"
              onClick={() => setViewingReceipt(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img src={viewingReceipt} alt="Receipt" className="max-h-[80vh] w-auto mx-auto rounded-xl border border-border object-contain" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
