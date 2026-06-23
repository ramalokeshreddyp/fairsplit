import type { Group, FairnessScore } from './types';
import { calculateFairnessScores } from './fairness-engine';

export type InsightType = 'warning' | 'info' | 'success' | 'alert';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  emoji: string;
  memberId?: string;
  groupId: string;
  groupName: string;
}

export function analyzePatterns(groups: Group[]): Insight[] {
  const insights: Insight[] = [];

  groups.forEach(group => {
    if (group.expenses.length === 0) return;
    const scores = calculateFairnessScores(group);
    const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
    const avgPerPerson = totalExpenses / group.members.length;

    // 1. Consistent over-payer
    scores.forEach(s => {
      if (s.totalPaid > avgPerPerson * 1.4 && s.netBalance > avgPerPerson * 0.3) {
        insights.push({
          id: `overpay-${s.memberId}-${group.id}`,
          type: 'warning',
          title: `${s.memberName} is consistently over-paying`,
          description: `Paid ₹${s.totalPaid.toFixed(0)} but only benefited ₹${s.totalBenefited.toFixed(0)} in "${group.name}". They're owed ₹${s.netBalance.toFixed(2)}.`,
          emoji: '💸',
          memberId: s.memberId,
          groupId: group.id,
          groupName: group.name,
        });
      }
    });

    // 2. Free-rider detection
    scores.forEach(s => {
      if (s.totalBenefited > avgPerPerson * 0.5 && s.totalPaid < avgPerPerson * 0.2) {
        insights.push({
          id: `freerider-${s.memberId}-${group.id}`,
          type: 'alert',
          title: `${s.memberName} hasn't paid much`,
          description: `Benefited ₹${s.totalBenefited.toFixed(0)} but only paid ₹${s.totalPaid.toFixed(0)} in "${group.name}".`,
          emoji: '🚩',
          memberId: s.memberId,
          groupId: group.id,
          groupName: group.name,
        });
      }
    });

    // 3. Single payer dominance
    const maxPayer = scores.reduce((top, s) => s.totalPaid > top.totalPaid ? s : top, scores[0]);
    if (maxPayer && maxPayer.totalPaid > totalExpenses * 0.6 && group.expenses.length >= 3) {
      insights.push({
        id: `dominant-${maxPayer.memberId}-${group.id}`,
        type: 'info',
        title: `${maxPayer.memberName} covers most expenses`,
        description: `They've paid ${((maxPayer.totalPaid / totalExpenses) * 100).toFixed(0)}% of all expenses in "${group.name}". Consider rotating who pays.`,
        emoji: '👑',
        memberId: maxPayer.memberId,
        groupId: group.id,
        groupName: group.name,
      });
    }

    // 4. Well-balanced group
    const allFair = scores.every(s => s.fairnessScore >= 80);
    if (allFair && group.expenses.length >= 3) {
      insights.push({
        id: `balanced-${group.id}`,
        type: 'success',
        title: `"${group.name}" is well balanced!`,
        description: `All members have a fairness score above 80. Great teamwork!`,
        emoji: '✅',
        groupId: group.id,
        groupName: group.name,
      });
    }

    // 5. Category concentration
    const catMap = new Map<string, number>();
    group.expenses.forEach(e => catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount));
    catMap.forEach((amount, category) => {
      if (amount > totalExpenses * 0.6 && totalExpenses > 100) {
        insights.push({
          id: `catconc-${category}-${group.id}`,
          type: 'info',
          title: `Heavy "${category}" spending`,
          description: `${((amount / totalExpenses) * 100).toFixed(0)}% of expenses in "${group.name}" go to ${category}.`,
          emoji: '📊',
          groupId: group.id,
          groupName: group.name,
        });
      }
    });

    // 6. Large single expense warning
    group.expenses.forEach(exp => {
      if (exp.amount > totalExpenses * 0.5 && group.expenses.length >= 3) {
        const payer = group.members.find(m => m.id === exp.paidById);
        insights.push({
          id: `large-${exp.id}`,
          type: 'warning',
          title: `Large expense: "${exp.description}"`,
          description: `₹${exp.amount.toFixed(0)} paid by ${payer?.name ?? 'someone'} makes up ${((exp.amount / totalExpenses) * 100).toFixed(0)}% of total in "${group.name}".`,
          emoji: '⚠️',
          groupId: group.id,
          groupName: group.name,
        });
      }
    });
  });

  // Sort: alerts first, then warnings, info, success
  const priority: Record<InsightType, number> = { alert: 0, warning: 1, info: 2, success: 3 };
  insights.sort((a, b) => priority[a.type] - priority[b.type]);

  return insights;
}
