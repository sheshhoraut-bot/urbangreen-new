import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryItem,
  InventoryItem,
} from '../../lib/api';

const categories = [
  { value: 'seed', label: 'Seed' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' },
];

const ALL = 'all';

const emptyForm = {
  name: '',
  category: 'seed',
  quantity: '',
  unit: 'pcs',
  low_stock_level: '',
  notes: '',
};

type FormState = typeof emptyForm;

function categoryLabel(value: string) {
  return categories.find((c) => c.value === value)?.label || value;
}

function firstError(err: any, fallback: string) {
  const errors = err.response?.data?.errors;
  const first = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
  return first || err.response?.data?.message || fallback;
}

interface InventoryViewProps {
  currentUser?: { role: string } | null;
}

export function InventoryView({ currentUser }: InventoryViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'use' | 'restock'>('use');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadItems = async () => {
    try {
      const res = await getInventory();
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const setField = (key: keyof FormState, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const openAddDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      low_stock_level: String(item.low_stock_level),
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!form.unit.trim()) {
      toast.error('Unit is required (for example kg, pcs, L)');
      return;
    }
    if (form.quantity.trim() === '' || Number(form.quantity) < 0) {
      toast.error('Enter a quantity of 0 or more');
      return;
    }
    if (form.low_stock_level.trim() === '' || Number(form.low_stock_level) < 0) {
      toast.error('Enter a low-stock level of 0 or more');
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity),
      unit: form.unit.trim(),
      low_stock_level: Number(form.low_stock_level),
      notes: form.notes.trim() || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateInventoryItem(editing.id, payload);
        toast.success('Item updated');
      } else {
        await createInventoryItem(payload);
        toast.success('Item added');
      }
      setDialogOpen(false);
      await loadItems();
    } catch (err: any) {
      toast.error(firstError(err, 'Failed to save item'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}" from the inventory?`)) return;
    try {
      await deleteInventoryItem(item.id);
      setItems(items.filter((i) => i.id !== item.id));
      toast.success('Item deleted');
    } catch (err) {
      console.error('Failed to delete item', err);
      toast.error('Failed to delete item');
    }
  };

  const openAdjust = (item: InventoryItem, mode: 'use' | 'restock') => {
    setAdjustItem(item);
    setAdjustMode(mode);
    setAdjustAmount('');
  };

  const handleAdjust = async () => {
    if (!adjustItem) return;
    const amount = Number(adjustAmount);
    if (adjustAmount.trim() === '' || !(amount > 0)) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    setAdjusting(true);
    try {
      const change = adjustMode === 'use' ? -amount : amount;
      const res = await adjustInventoryItem(adjustItem.id, change);
      const updated: InventoryItem = res.data;
      setItems(items.map((i) => (i.id === updated.id ? updated : i)));
      if (updated.is_low_stock && !adjustItem.is_low_stock) {
        toast.warning(`${updated.name} is now low on stock`);
      } else {
        toast.success(res.message);
      }
      setAdjustItem(null);
    } catch (err: any) {
      toast.error(firstError(err, 'Failed to update stock'));
    } finally {
      setAdjusting(false);
    }
  };

  const visibleItems = items.filter((i) => filter === ALL || i.category === filter);
  const lowCount = items.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Inventory</h2>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} {'\u00B7'} {lowCount} low on stock
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ value: ALL, label: 'All' }, ...categories].map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === c.value
                ? 'bg-[#22C55E] text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading inventory...</p>
      ) : visibleItems.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {items.length === 0
              ? isAdmin
                ? 'No items yet. Add your first one.'
                : 'The inventory is empty.'
              : 'No items in this category.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="text-left text-muted-foreground px-6 py-4 font-medium">Item</th>
                  <th className="text-left text-muted-foreground px-6 py-4 font-medium">Category</th>
                  <th className="text-left text-muted-foreground px-6 py-4 font-medium">In stock</th>
                  <th className="text-left text-muted-foreground px-6 py-4 font-medium">Alert level</th>
                  <th className="text-left text-muted-foreground px-6 py-4 font-medium">Status</th>
                  <th className="text-left text-muted-foreground px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className="border-t border-border/50 hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-foreground">{item.name}</p>
                      {item.notes && <p className="text-muted-foreground text-xs mt-1">{item.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{categoryLabel(item.category)}</td>
                    <td className="px-6 py-4 text-foreground">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.low_stock_level} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_low_stock ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs text-[#EF4444] bg-[#EF4444]/10">
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs text-[#22C55E] bg-[#22C55E]/10">
                          In stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAdjust(item, 'use')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                          Use
                        </button>
                        <button
                          onClick={() => openAdjust(item, 'restock')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Restock
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEditDialog(item)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(item)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-[#EF4444]" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Use / restock dialog */}
      <Dialog open={adjustItem !== null} onOpenChange={(open) => { if (!open) setAdjustItem(null); }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {adjustMode === 'use' ? 'Use' : 'Restock'} {adjustItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              Currently {adjustItem?.quantity} {adjustItem?.unit} in stock.
            </p>
            <div>
              <Label htmlFor="adjust-amount" className="text-muted-foreground mb-2 block">
                {adjustMode === 'use' ? 'Amount used' : 'Amount added'} ({adjustItem?.unit})
              </Label>
              <Input
                id="adjust-amount"
                type="number"
                min="0"
                step="any"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setAdjustItem(null)}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjust}
              disabled={adjusting}
              className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
            >
              {adjusting ? 'Saving...' : adjustMode === 'use' ? 'Use stock' : 'Add stock'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit dialog (admin) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="inv-name" className="text-muted-foreground mb-2 block">Name</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Tomato seeds"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Category</Label>
              <Select value={form.category} onValueChange={(value) => setField('category', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inv-qty" className="text-muted-foreground mb-2 block">Quantity</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="inv-unit" className="text-muted-foreground mb-2 block">Unit</Label>
                <Input
                  id="inv-unit"
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                  placeholder="kg, pcs, L"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="inv-low" className="text-muted-foreground mb-2 block">
                Low-stock level (alert when at or below this)
              </Label>
              <Input
                id="inv-low"
                type="number"
                min="0"
                step="any"
                value={form.low_stock_level}
                onChange={(e) => setField('low_stock_level', e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="inv-notes" className="text-muted-foreground mb-2 block">Notes (optional)</Label>
              <Input
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Item'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}