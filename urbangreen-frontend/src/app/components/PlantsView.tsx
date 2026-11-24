import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Sprout, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlantJournalPanel } from './PlantJournalPanel';
import {
  getPlants, createPlant, updatePlant, deletePlant, getZones, getPlantSpecies,
  Plant, Zone, PlantSpecies,
} from '../../lib/api';

const statusColors: Record<string, string> = {
  healthy: 'text-[#22C55E] bg-[#22C55E]/10',
  attention: 'text-[#F59E0B] bg-[#F59E0B]/10',
  critical: 'text-[#EF4444] bg-[#EF4444]/10',
};

const CUSTOM = 'custom';

interface PlantsViewProps {
  currentUser?: { id?: number; role: string } | null;
}

export function PlantsView({ currentUser }: PlantsViewProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [speciesList, setSpeciesList] = useState<PlantSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [journalPlant, setJournalPlant] = useState<Plant | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [speciesChoice, setSpeciesChoice] = useState<string>(CUSTOM);
  const [zoneId, setZoneId] = useState<string>('');
  const [status, setStatus] = useState('healthy');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [plantsRes, zonesRes] = await Promise.all([getPlants(), getZones()]);
      setPlants(plantsRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error('Failed to load plants', err);
      toast.error('Failed to load plants');
    } finally {
      setLoading(false);
    }

    try {
      const speciesRes = await getPlantSpecies();
      setSpeciesList(speciesRes.data);
    } catch (err) {
      console.error('Failed to load plant library', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const findSpecies = (value: string | null | undefined) => {
    if (!value) return undefined;
    return speciesList.find((s) => s.name.toLowerCase() === value.trim().toLowerCase());
  };

  const openAddDialog = () => {
    setEditingPlant(null);
    setName('');
    setSpecies('');
    setSpeciesChoice(CUSTOM);
    setZoneId(zones[0] ? String(zones[0].id) : '');
    setStatus('healthy');
    setDialogOpen(true);
  };

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setName(plant.name);
    setSpecies(plant.species || '');
    const match = findSpecies(plant.species);
    setSpeciesChoice(match ? String(match.id) : CUSTOM);
    setZoneId(String(plant.zone_id));
    setStatus(plant.status);
    setDialogOpen(true);
  };

  const handleSpeciesChoice = (value: string) => {
    setSpeciesChoice(value);
    if (value !== CUSTOM) {
      const chosen = speciesList.find((s) => String(s.id) === value);
      if (chosen) setSpecies(chosen.name);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Plant name is required');
      return;
    }
    if (!zoneId) {
      toast.error('Please select a zone');
      return;
    }
    setSaving(true);
    try {
      if (editingPlant) {
        const res = await updatePlant(editingPlant.id, { name, species, zone_id: Number(zoneId), status });
        setPlants(plants.map((p) => (p.id === editingPlant.id ? res.data : p)));
        toast.success('Plant updated');
      } else {
        const res = await createPlant({ name, species, zone_id: Number(zoneId), status });
        setPlants([...plants, res.data]);
        toast.success('Plant created');
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save plant';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plant: Plant) => {
    if (!confirm(`Delete "${plant.name}"?`)) return;
    try {
      await deletePlant(plant.id);
      setPlants(plants.filter((p) => p.id !== plant.id));
      toast.success('Plant deleted');
    } catch (err) {
      console.error('Failed to delete plant', err);
      toast.error('Failed to delete plant');
    }
  };

  const idealLine = (plant: Plant) => {
    const match = findSpecies(plant.species);
    if (!match) return null;
    const parts: string[] = [];
    if (match.temp_min !== null && match.temp_max !== null) {
      parts.push(`${match.temp_min}\u2013${match.temp_max}\u00B0C`);
    }
    if (match.water_every_days) {
      parts.push(`water every ${match.water_every_days}d`);
    }
    return parts.length > 0 ? `Ideal: ${parts.join(' \u00B7 ')}` : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Plants</h2>
          <p className="text-muted-foreground">Manage your plants across all zones</p>
        </div>
        <button
          onClick={openAddDialog}
          disabled={zones.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Plant
        </button>
      </div>

      {zones.length === 0 && !loading && (
        <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg text-[#F59E0B] text-sm">
          You need to create a Zone first before adding plants.
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading plants...</p>
      ) : plants.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <Sprout className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No plants yet. Add your first plant to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <div key={plant.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#22C55E]/20 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditDialog(plant)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(plant)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </button>
                </div>
              </div>
              <h3 className="text-foreground mb-1">{plant.name}</h3>
              <p className="text-muted-foreground text-sm mb-1">
                {plant.species || 'Unknown species'} {'\u00B7'} {plant.zone?.name || '\u2014'}
              </p>
              {idealLine(plant) && (
                <p className="text-muted-foreground text-xs mb-3">{idealLine(plant)}</p>
              )}
              <div className={`flex items-center justify-between ${idealLine(plant) ? '' : 'mt-3'}`}>
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${statusColors[plant.status] || ''}`}>
                  {plant.status}
                </span>
                <button
                  onClick={() => setJournalPlant(plant)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Journal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlantJournalPanel
        plant={journalPlant}
        open={journalPlant !== null}
        onClose={() => setJournalPlant(null)}
        currentUser={currentUser}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingPlant ? 'Edit Plant' : 'Add Plant'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="plant-name" className="text-muted-foreground mb-2 block">Plant Name</Label>
              <Input
                id="plant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tomato Plant A"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Species</Label>
              <Select value={speciesChoice} onValueChange={handleSpeciesChoice}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {speciesList.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Other (type manually)</SelectItem>
                </SelectContent>
              </Select>
              {speciesChoice === CUSTOM && (
                <Input
                  id="plant-species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  placeholder="e.g. Solanum lycopersicum"
                  className="bg-background border-border text-foreground mt-2"
                />
              )}
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Zone</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="attention">Needs Attention</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
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
              {saving ? 'Saving...' : editingPlant ? 'Save Changes' : 'Create Plant'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}