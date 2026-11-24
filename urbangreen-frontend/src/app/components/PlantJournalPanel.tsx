import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Sprout, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getJournal, createJournalEntry, updateJournalEntry, deleteJournalEntry,
  JournalEntry, Plant,
} from '../../lib/api';

const stages = [
  { value: 'seed', label: 'Seed' },
  { value: 'germination', label: 'Germination' },
  { value: 'seedling', label: 'Seedling' },
  { value: 'vegetative', label: 'Vegetative' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting' },
  { value: 'harvest', label: 'Harvest' },
];

const NONE = 'none';

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

interface PlantJournalPanelProps {
  plant: Plant | null;
  open: boolean;
  onClose: () => void;
  currentUser?: { id?: number; role: string } | null;
}

export function PlantJournalPanel({ plant, open, onClose, currentUser }: PlantJournalPanelProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [entryDate, setEntryDate] = useState(todayString());
  const [stage, setStage] = useState(NONE);
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [isHarvest, setIsHarvest] = useState(false);
  const [harvestAmount, setHarvestAmount] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('kg');

  const loadEntries = async () => {
    if (!plant) return;
    setLoading(true);
    try {
      const res = await getJournal(plant.id);
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to load journal', err);
      toast.error('Failed to load journal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && plant) {
      setShowForm(false);
      setEditing(null);
      loadEntries();
    }
  }, [open, plant?.id]);

  const resetForm = () => {
    setEntryDate(todayString());
    setStage(NONE);
    setHeight('');
    setNotes('');
    setIsHarvest(false);
    setHarvestAmount('');
    setHarvestUnit('kg');
  };

  const openAddForm = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (entry: JournalEntry) => {
    setEditing(entry);
    setEntryDate(entry.entry_date);
    setStage(entry.growth_stage || NONE);
    setHeight(entry.height_cm !== null ? String(entry.height_cm) : '');
    setNotes(entry.notes || '');
    setIsHarvest(entry.is_harvest);
    setHarvestAmount(entry.harvest_amount !== null ? String(entry.harvest_amount) : '');
    setHarvestUnit(entry.harvest_unit || 'kg');
    setShowForm(true);
  };

  const canModify = (entry: JournalEntry) => isAdmin || (currentUser?.id !== undefined && entry.user_id === currentUser.id);

  const handleSave = async () => {
    if (!plant) return;
    if (!entryDate) {
      toast.error('Date is required');
      return;
    }
    const payload = {
      entry_date: entryDate,
      growth_stage: stage === NONE ? null : stage,
      height_cm: height ? Number(height) : null,
      notes: notes || null,
      is_harvest: isHarvest,
      harvest_amount: isHarvest && harvestAmount ? Number(harvestAmount) : null,
      harvest_unit: isHarvest ? harvestUnit || null : null,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateJournalEntry(editing.id, payload);
        toast.success('Entry updated');
      } else {
        await createJournalEntry(plant.id, payload);
        toast.success('Entry added');
      }
      setShowForm(false);
      setEditing(null);
      await loadEntries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await deleteJournalEntry(entry.id);
      setEntries(entries.filter((e) => e.id !== entry.id));
      toast.success('Entry deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete entry');
    }
  };

  const stageLabel = (value: string | null) => stages.find((s) => s.value === value)?.label || null;

  const totalHarvest = entries
    .filter((e) => e.is_harvest && e.harvest_amount !== null)
    .reduce((sum, e) => sum + (e.harvest_amount || 0), 0);
  const harvestUnitShown = entries.find((e) => e.is_harvest && e.harvest_unit)?.harvest_unit || '';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Sprout className="w-5 h-5 text-[#22C55E]" />
            {plant?.name} {'\u00B7'} Growth Journal
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            {totalHarvest > 0 ? ` ${'\u00B7'} ${totalHarvest} ${harvestUnitShown} harvested` : ''}
          </p>
          {!showForm && (
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-4 p-4 bg-background rounded-lg border border-border max-h-[45vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="j-date" className="text-muted-foreground mb-2 block">Date</Label>
                <Input
                  id="j-date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-card border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Growth stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {stages.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="j-height" className="text-muted-foreground mb-2 block">Height (cm)</Label>
                <Input
                  id="j-height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-card border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="j-notes" className="text-muted-foreground mb-2 block">Notes</Label>
              <Input
                id="j-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. First flowers appeared"
                className="bg-card border-border text-foreground"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isHarvest}
                onChange={(e) => setIsHarvest(e.target.checked)}
              />
              This entry is a harvest
            </label>
            {isHarvest && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="j-amount" className="text-muted-foreground mb-2 block">Amount</Label>
                  <Input
                    id="j-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={harvestAmount}
                    onChange={(e) => setHarvestAmount(e.target.value)}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="j-unit" className="text-muted-foreground mb-2 block">Unit</Label>
                  <Input
                    id="j-unit"
                    value={harvestUnit}
                    onChange={(e) => setHarvestUnit(e.target.value)}
                    placeholder="kg, pcs, g"
                    className="bg-card border-border text-foreground"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50 text-sm"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        )}

        <div className="max-h-[45vh] overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading journal...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No entries yet. Add the first one.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-foreground text-sm">{entry.entry_date}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stageLabel(entry.growth_stage) && (
                        <span className="px-3 py-1 rounded-full text-xs text-[#22C55E] bg-[#22C55E]/10">
                          {stageLabel(entry.growth_stage)}
                        </span>
                      )}
                      {entry.height_cm !== null && (
                        <span className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                          {entry.height_cm} cm
                        </span>
                      )}
                      {entry.is_harvest && (
                        <span className="px-3 py-1 rounded-full text-xs text-[#F59E0B] bg-[#F59E0B]/10">
                          Harvest{entry.harvest_amount !== null ? `: ${entry.harvest_amount} ${entry.harvest_unit || ''}` : ''}
                        </span>
                      )}
                    </div>
                    {entry.notes && <p className="text-muted-foreground text-sm mt-2">{entry.notes}</p>}
                    {entry.author && <p className="text-muted-foreground text-xs mt-2">by {entry.author}</p>}
                  </div>
                  {canModify(entry) && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditForm(entry)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(entry)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-[#EF4444]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}