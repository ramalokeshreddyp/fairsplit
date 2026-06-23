import type { Group, FairnessScore, Settlement, GroupAnalytics, Expense, Member } from './types';

function calculateMemberBalances(group: Group): Map<string, { paid: number; benefited: number }> {
  const balances = new Map<string, { paid: number; benefited: number }>();
  
  group.members.forEach(m => balances.set(m.id, { paid: 0, benefited: 0 }));

  group.expenses.forEach(expense => {
    const payer = balances.get(expense.paidById);
    if (payer) payer.paid += expense.amount;

    const participants = expense.splits.filter(s => s.participated);
    
    if (expense.splitType === 'equal') {
      const share = expense.amount / participants.length;
      participants.forEach(s => {
        const b = balances.get(s.memberId);
        if (b) b.benefited += share;
      });
    } else if (expense.splitType === 'custom') {
      participants.forEach(s => {
        const b = balances.get(s.memberId);
        if (b) b.benefited += (s.amount ?? 0);
      });
    } else if (expense.splitType === 'weighted') {
      const totalWeight = participants.reduce((sum, s) => sum + (s.weight ?? 1), 0);
      participants.forEach(s => {
        const b = balances.get(s.memberId);
        if (b) b.benefited += expense.amount * ((s.weight ?? 1) / totalWeight);
      });
    }
  });

  return balances;
}

export function calculateFairnessScores(group: Group): FairnessScore[] {
  const balances = calculateMemberBalances(group);
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
  
  return group.members.map(member => {
    const bal = balances.get(member.id) ?? { paid: 0, benefited: 0 };
    const netBalance = bal.paid - bal.benefited;
    
    // Fairness: how close is paid to benefited? 100 = perfect
    let fairnessScore = 100;
    if (totalExpenses > 0) {
      const deviation = Math.abs(netBalance) / (totalExpenses / group.members.length);
      fairnessScore = Math.max(0, Math.round(100 - deviation * 50));
    }

    return {
      memberId: member.id,
      memberName: member.name,
      totalPaid: Math.round(bal.paid * 100) / 100,
      totalBenefited: Math.round(bal.benefited * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      fairnessScore,
    };
  });
}

export function calculateSettlements(group: Group): Settlement[] {
  const balances = calculateMemberBalances(group);
  
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  group.members.forEach(member => {
    const bal = balances.get(member.id) ?? { paid: 0, benefited: 0 };
    const net = Math.round((bal.paid - bal.benefited) * 100) / 100;
    if (net < -0.01) debtors.push({ id: member.id, name: member.name, amount: -net });
    else if (net > 0.01) creditors.push({ id: member.id, name: member.name, amount: net });
  });

  // Greedy algorithm to minimize transactions
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = Math.min(debtors[di].amount, creditors[ci].amount);
    if (amount > 0.01) {
      settlements.push({
        fromId: debtors[di].id,
        fromName: debtors[di].name,
        toId: creditors[ci].id,
        toName: creditors[ci].name,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[di].amount -= amount;
    creditors[ci].amount -= amount;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  return settlements;
}

export function calculateGroupAnalytics(group: Group): GroupAnalytics {
  const fairnessScores = calculateFairnessScores(group);
  const settlements = calculateSettlements(group);
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);

  const categoryMap = new Map<string, number>();
  group.expenses.forEach(e => {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount);
  });

  const groupFairnessScore = fairnessScores.length > 0
    ? Math.round(fairnessScores.reduce((s, f) => s + f.fairnessScore, 0) / fairnessScores.length)
    : 100;

  const topPayer = fairnessScores.reduce((top, f) => f.totalPaid > top.amount ? { name: f.memberName, amount: f.totalPaid } : top, { name: '-', amount: 0 });
  const topBeneficiary = fairnessScores.reduce((top, f) => f.totalBenefited > top.amount ? { name: f.memberName, amount: f.totalBenefited } : top, { name: '-', amount: 0 });

  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    averagePerPerson: group.members.length > 0 ? Math.round((totalExpenses / group.members.length) * 100) / 100 : 0,
    groupFairnessScore,
    fairnessScores,
    settlements,
    categoryBreakdown: Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 })),
    topPayer,
    topBeneficiary,
  };
}
