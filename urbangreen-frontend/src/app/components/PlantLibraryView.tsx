import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  getPlantSpecies, createPlantSpecies, updatePlantSpecies, deletePlantSpecies,
  PlantSpecies,
} from '../../lib/api';

interface PlantLibraryViewProps {
  currentUser?: { role: string } | null;
}

const emptyForm = {
  name: '',
  scientific_name: '',
  temp_min: '',
  temp_max: '',
  humidity_min: '',
  humidity_max: '',
  soil_moisture_min: '',
  soil_moisture_max: '',
  ph_min: '',
  ph_max: '',
  water_every_days: '',
  care_notes: '',
};

type FormState = typeof emptyForm;

function range(min: number | null, max: number | null, unit: string) {
  if (min === null && max === null) return '\u2014';
  if (min !== null && max !== null) return `${min}\u2013${max}${unit}`;
  if (min !== null) return `${min}${unit}+`;
  return `up to ${max}${unit}`;
}

function toNumber(value: string) {
  return value.trim() === '' ? null : Number(value);
}

export function PlantLibraryView({ currentUser }: PlantLibraryViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [species, setSpecies] = useState<PlantSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlantSpecies | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadSpecies = async () => {
    try {
      const res = await getPlantSpecies();
      setSpecies(res.data);
    } catch (err) {
      console.error('Failed to load plant library', err);
      toast.error('Failed to load plant library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecies();
  }, []);

  const setField = (key: keyof FormState, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const openAddDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: PlantSpecies) => {
    setEditing(item);
    setForm({
      name: item.name,
      scientific_name: item.scientific_name || '',
      temp_min: item.temp_min !== null ? String(item.temp_min) : '',
      temp_max: item.temp_max !== null ? String(item.temp_max) : '',
      humidity_min: item.humidity_min !== null ? String(item.humidity_min) : '',
      humidity_max: item.humidity_max !== null ? String(item.humidity_max) : '',
      soil_moisture_min: item.soil_moisture_min !== null ? String(item.soil_moisture_min) : '',
      soil_moisture_max: item.soil_moisture_max !== null ? String(item.soil_moisture_max) : '',
      ph_min: item.ph_min !== null ? String(item.ph_min) : '',
      ph_max: item.ph_max !== null ? String(item.ph_max) : '',
      water_every_days: item.water_every_days !== null ? String(item.water_every_days) : '',
      care_notes: item.care_notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Species name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      scientific_name: form.scientific_name.trim() || null,
      temp_min: toNumber(form.temp_min),
      temp_max: toNumber(form.temp_max),
      humidity_min: toNumber(form.humidity_min),
      humidity_max: toNumber(form.humidity_max),
      soil_moisture_min: toNumber(form.soil_moisture_min),
      soil_moisture_max: toNumber(form.soil_moisture_max),
      ph_min: toNumber(form.ph_min),
      ph_max: toNumber(form.ph_max),
      water_every_days: toNumber(form.water_every_days),
      care_notes: form.care_notes.trim() || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await updatePlantSpecies(editing.id, payload);
        toast.success('Species updated');
      } else {
        await createPlantSpecies(payload);
        toast.success('Species added');
      }
      setDialogOpen(false);
      await loadSpecies();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
      toast.error(firstError || err.response?.data?.message || 'Failed to save species');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: PlantSpecies) => {
    if (!confirm(`Delete "${item.name}" from the library?`)) return;
    try {
      await deletePlantSpecies(item.id);
      setSpecies(species.filter((s) => s.id !== item.id));
      toast.success('Species deleted');
    } catch (err) {
      console.error('Failed to delete species', err);
      toast.error('Failed to delete species');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Plant Library</h2>
          <p className="text-muted-foreground">Ideal growing conditions for each species</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Species
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading library...</p>
      ) : species.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <Leaf className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {isAdmin ? 'No species yet. Add the first one.' : 'The library is empty.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {species.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#22C55E]/20 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#22C55E]" />
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditDialog(item)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-foreground mb-1">{item.name}</h3>
              <p className="text-muted-foreground text-sm italic mb-4">{item.scientific_name || '\u2014'}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className="text-foreground">{range(item.temp_min, item.temp_max, '\u00B0C')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Humidity</span>
                  <span className="text-foreground">{range(item.humidity_min, item.humidity_max, '%')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soil moisture</span>
                  <span className="text-foreground">{range(item.soil_moisture_min, item.soil_moisture_max, '%')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">pH</span>
                  <span className="text-foreground">{range(item.ph_min, item.ph_max, '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water</span>
                  <span className="text-foreground">
                    {item.water_every_days ? `every ${item.water_every_days} days` : '\u2014'}
                  </span>
                </div>
              </div>

              {item.care_notes && (
                <p className="text-muted-foreground text-sm mt-4 pt-4 border-t border-border">{item.care_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Edit Species' : 'Add Species'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="sp-name" className="text-muted-foreground mb-2 block">Name</Label>
              <Input
                id="sp-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Tomato"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="sp-sci" className="text-muted-foreground mb-2 block">Scientific name (optional)</Label>
              <Input
                id="sp-sci"
                value={form.scientific_name}
                onChange={(e) => setField('scientific_name', e.target.value)}
                placeholder="e.g. Solanum lycopersicum"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground mb-2 block">Temp min ({'\u00B0'}C)</Label>
                <Input type="number" step="0.1" value={form.temp_min} onChange={(e) => setField('temp_min', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Temp max ({'\u00B0'}C)</Label>
                <Input type="number" step="0.1" value={form.temp_max} onChange={(e) => setField('temp_max', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Humidity min (%)</Label>
                <Input type="number" min="0" max="100" value={form.humidity_min} onChange={(e) => setField('humidity_min', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Humidity max (%)</Label>
                <Input type="number" min="0" max="100" value={form.humidity_max} onChange={(e) => setField('humidity_max', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Soil moisture min (%)</Label>
                <Input type="number" min="0" max="100" value={form.soil_moisture_min} onChange={(e) => setField('soil_moisture_min', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Soil moisture max (%)</Label>
                <Input type="number" min="0" max="100" value={form.soil_moisture_max} onChange={(e) => setField('soil_moisture_max', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">pH min</Label>
                <Input type="number" min="0" max="14" step="0.1" value={form.ph_min} onChange={(e) => setField('ph_min', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">pH max</Label>
                <Input type="number" min="0" max="14" step="0.1" value={form.ph_max} onChange={(e) => setField('ph_max', e.target.value)} className="bg-background border-border text-foreground" />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground mb-2 block">Water every (days)</Label>
              <Input type="number" min="1" value={form.water_every_days} onChange={(e) => setField('water_every_days', e.target.value)} className="bg-background border-border text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Care notes (optional)</Label>
              <Input
                value={form.care_notes}
                onChange={(e) => setField('care_notes', e.target.value)}
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
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Species'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}