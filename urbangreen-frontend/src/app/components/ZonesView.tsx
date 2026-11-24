import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getZones, createZone, updateZone, deleteZone, Zone } from '../../lib/api';

interface ZonesViewProps {
  currentUser?: { role: string } | null;
}

export function ZonesView({ currentUser }: ZonesViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadZones = async () => {
    try {
      const res = await getZones();
      setZones(res.data);
    } catch (err) {
      console.error('Failed to load zones', err);
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const openAddDialog = () => {
    setEditingZone(null);
    setName('');
    setDescription('');
    setDialogOpen(true);
  };

  const openEditDialog = (zone: Zone) => {
    setEditingZone(zone);
    setName(zone.name);
    setDescription(zone.description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Zone name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingZone) {
        const res = await updateZone(editingZone.id, { name, description });
        setZones(zones.map((z) => (z.id === editingZone.id ? res.data : z)));
        toast.success('Zone updated');
      } else {
        const res = await createZone({ name, description, status: 'active' });
        setZones([...zones, res.data]);
        toast.success('Zone created');
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save zone';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone: Zone) => {
    if (!confirm(`Delete "${zone.name}"? This can be restored later if needed.`)) return;
    try {
      await deleteZone(zone.id);
      setZones(zones.filter((z) => z.id !== zone.id));
      toast.success('Zone deleted');
    } catch (err) {
      console.error('Failed to delete zone', err);
      toast.error('Failed to delete zone');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Zones</h2>
          <p className="text-muted-foreground">Manage your greenhouse zones</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Zone
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading zones...</p>
      ) : zones.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No zones yet. Add your first zone to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#22C55E]/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#22C55E]" />
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditDialog(zone)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(zone)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-foreground mb-1">{zone.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{zone.description || 'No description'}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  {zone.plants_count ?? 0} {(zone.plants_count ?? 0) === 1 ? 'plant' : 'plants'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingZone ? 'Edit Zone' : 'Add Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="zone-name" className="text-muted-foreground mb-2 block">Zone Name</Label>
              <Input
                id="zone-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zone 1"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="zone-description" className="text-muted-foreground mb-2 block">Description</Label>
              <Input
                id="zone-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Main greenhouse section"
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
              {saving ? 'Saving...' : editingZone ? 'Save Changes' : 'Create Zone'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}