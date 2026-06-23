import { useState } from 'react';
import type { GroupMode, Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const MODES: { value: GroupMode; label: string; emoji: string }[] = [
  { value: 'trip', label: 'Trip', emoji: '✈️' },
  { value: 'hostel', label: 'Hostel', emoji: '🏠' },
  { value: 'event', label: 'Event', emoji: '🎉' },
  { value: 'shared-living', label: 'Shared Living', emoji: '🏢' },
];

interface CreateGroupFormProps {
  onSubmit: (group: { name: string; mode: GroupMode; members: Member[] }) => void;
  onCancel: () => void;
}

export function CreateGroupForm({ onSubmit, onCancel }: CreateGroupFormProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<GroupMode>('trip');
  const [members, setMembers] = useState<string[]>(['', '']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMembers = members.filter(m => m.trim());
    if (!name.trim() || validMembers.length < 2) return;

    onSubmit({
      name: name.trim(),
      mode,
      members: validMembers.map((m, i) => ({ id: `mem-${Date.now()}-${i}`, name: m.trim() })),
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-5 p-6 rounded-xl bg-card border border-border"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">Create Group</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>

      <div>
        <Label>Group Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Trip 2024" />
      </div>

      <div>
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {MODES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === m.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <span className="text-lg mr-2">{m.emoji}</span>
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Members</Label>
        <div className="space-y-2 mt-1">
          {members.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={m}
                onChange={e => {
                  const next = [...members];
                  next[i] = e.target.value;
                  setMembers(next);
                }}
                placeholder={`Member ${i + 1}`}
              />
              {members.length > 2 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setMembers(members.filter((_, j) => j !== i))}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setMembers([...members, ''])}>
            <Plus className="w-4 h-4 mr-1" /> Add Member
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full">Create Group</Button>
    </motion.form>
  );
}
