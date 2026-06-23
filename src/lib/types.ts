export type SplitType = 'equal' | 'custom' | 'weighted';
export type GroupMode = 'trip' | 'hostel' | 'event' | 'shared-living';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  income?: number; // optional for income-sensitive fairness
}

export interface ExpenseSplit {
  memberId: string;
  amount?: number;    // for custom splits
  weight?: number;    // for weighted splits
  participated: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  splits: ExpenseSplit[];
  splitType: SplitType;
  category: string;
  date: string;
  receiptUrl?: string; // blob URL for local receipt image
  notes?: string;
}

export interface Group {
  id: string;
  name: string;
  mode: GroupMode;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
}

export interface FairnessScore {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalBenefited: number;
  netBalance: number;
  fairnessScore: number; // 0-100, 100 = perfectly fair
}

export interface Settlement {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface GroupAnalytics {
  totalExpenses: number;
  averagePerPerson: number;
  groupFairnessScore: number;
  fairnessScores: FairnessScore[];
  settlements: Settlement[];
  categoryBreakdown: { category: string; amount: number }[];
  topPayer: { name: string; amount: number };
  topBeneficiary: { name: string; amount: number };
}
