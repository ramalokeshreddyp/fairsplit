import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Group, Expense, Member } from '@/lib/types';
import { sampleGroups } from '@/lib/sample-data';

interface AppContextType {
  groups: Group[];
  addGroup: (group: Omit<Group, 'id' | 'createdAt' | 'expenses'>) => string;
  deleteGroup: (groupId: string) => void;
  addExpense: (groupId: string, expense: Omit<Expense, 'id' | 'groupId'>) => void;
  editExpense: (groupId: string, expenseId: string, expense: Omit<Expense, 'id' | 'groupId'>) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  getGroup: (id: string) => Group | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(sampleGroups);

  const addGroup = useCallback((group: Omit<Group, 'id' | 'createdAt' | 'expenses'>) => {
    const id = `grp-${Date.now()}`;
    setGroups(prev => [...prev, { ...group, id, createdAt: new Date().toISOString(), expenses: [] }]);
    return id;
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const addExpense = useCallback((groupId: string, expense: Omit<Expense, 'id' | 'groupId'>) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, expenses: [...g.expenses, { ...expense, id: `exp-${Date.now()}`, groupId }] }
        : g
    ));
  }, []);

  const editExpense = useCallback((groupId: string, expenseId: string, expense: Omit<Expense, 'id' | 'groupId'>) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, expenses: g.expenses.map(e => e.id === expenseId ? { ...expense, id: expenseId, groupId } : e) }
        : g
    ));
  }, []);

  const deleteExpense = useCallback((groupId: string, expenseId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, expenses: g.expenses.filter(e => e.id !== expenseId) }
        : g
    ));
  }, []);

  const getGroup = useCallback((id: string) => groups.find(g => g.id === id), [groups]);

  return (
    <AppContext.Provider value={{ groups, addGroup, deleteGroup, addExpense, editExpense, deleteExpense, getGroup }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
