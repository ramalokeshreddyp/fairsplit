import { useRef, useState } from 'react';
import type { Group, Expense, SplitType, ExpenseSplit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ImagePlus, Trash2 } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Utilities', 'Rent', 'Shopping', 'Other'];

interface AddExpenseFormProps {
  group: Group;
  onSubmit: (expense: Omit<Expense, 'id' | 'groupId'>) => void;
  onCancel: () => void;
  initialData?: Expense;
}

export function AddExpenseForm({ group, onSubmit, onCancel, initialData }: AddExpenseFormProps) {
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [paidById, setPaidById] = useState(initialData?.paidById ?? group.members[0]?.id ?? '');
  const [splitType, setSplitType] = useState<SplitType>(initialData?.splitType ?? 'equal');
  const [category, setCategory] = useState(initialData?.category ?? 'Food');
  const [participants, setParticipants] = useState<Set<string>>(
    new Set(initialData ? initialData.splits.filter(s => s.participated).map(s => s.memberId) : group.members.map(m => m.id))
  );
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    initialData?.splitType === 'custom' ? Object.fromEntries(initialData.splits.filter(s => s.amount != null).map(s => [s.memberId, String(s.amount)])) : {}
  );
  const [weights, setWeights] = useState<Record<string, string>>(
    initialData?.splitType === 'weighted' ? Object.fromEntries(initialData.splits.filter(s => s.weight != null).map(s => [s.memberId, String(s.weight)])) : {}
  );
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(initialData?.receiptUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (receiptUrl) URL.revokeObjectURL(receiptUrl);
    setReceiptUrl(URL.createObjectURL(file));
  };

  const removeReceipt = () => {
    if (receiptUrl) URL.revokeObjectURL(receiptUrl);
    setReceiptUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!description || !amountNum || !paidById) return;

    const splits: ExpenseSplit[] = group.members.map(m => ({
      memberId: m.id,
      participated: participants.has(m.id),
      ...(splitType === 'custom' ? { amount: parseFloat(customAmounts[m.id] || '0') } : {}),
      ...(splitType === 'weighted' ? { weight: parseFloat(weights[m.id] || '1') } : {}),
    }));

    onSubmit({
      description,
      amount: amountNum,
      paidById,
      splitType,
      category,
      date: new Date().toISOString().split('T')[0],
      splits,
      receiptUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">{initialData ? 'Edit Expense' : 'Add Expense'}</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What was it for?" />
        </div>
        <div>
          <Label>Amount (₹)</Label>
          <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Paid by</Label>
          <Select value={paidById} onValueChange={setPaidById}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{group.members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Split type</Label>
          <Select value={splitType} onValueChange={v => setSplitType(v as SplitType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="equal">Equal</SelectItem>
              <SelectItem value="custom">Custom amounts</SelectItem>
              <SelectItem value="weighted">Weighted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Receipt Upload */}
      <div>
        <Label className="mb-2 block">Receipt (optional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {receiptUrl ? (
          <div className="relative inline-block">
            <img
              src={receiptUrl}
              alt="Receipt preview"
              className="h-24 w-auto rounded-lg border border-border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={removeReceipt}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <ImagePlus className="w-4 h-4" /> Attach Receipt
          </Button>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Participants</Label>
        <div className="space-y-2">
          {group.members.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <Checkbox
                checked={participants.has(m.id)}
                onCheckedChange={checked => {
                  const next = new Set(participants);
                  checked ? next.add(m.id) : next.delete(m.id);
                  setParticipants(next);
                }}
              />
              <span className="flex-1 text-sm">{m.name}</span>
              {splitType === 'custom' && participants.has(m.id) && (
                <Input
                  type="number" step="0.01" className="w-24"
                  placeholder="₹0.00"
                  value={customAmounts[m.id] ?? ''}
                  onChange={e => setCustomAmounts(p => ({ ...p, [m.id]: e.target.value }))}
                />
              )}
              {splitType === 'weighted' && participants.has(m.id) && (
                <Input
                  type="number" step="0.1" className="w-20"
                  placeholder="1.0"
                  value={weights[m.id] ?? ''}
                  onChange={e => setWeights(p => ({ ...p, [m.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">{initialData ? 'Save Changes' : 'Add Expense'}</Button>
    </form>
  );
}
