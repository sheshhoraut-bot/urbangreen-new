import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getSensors, createSensor, updateSensor, deleteSensor, toggleSensorStatus, getZones, Sensor, Zone } from '../../lib/api';

const sensorTypes = [
  { value: 'temperature', label: 'Temperature', defaultUnit: '\u00B0C' },
  { value: 'humidity', label: 'Humidity', defaultUnit: '%' },
  { value: 'soil_moisture', label: 'Soil Moisture', defaultUnit: '%' },
  { value: 'light', label: 'Light', defaultUnit: 'lux' },
  { value: 'ph', label: 'pH', defaultUnit: '' },
];

interface SensorsViewProps {
  currentUser?: { role: string } | null;
}

export function SensorsView({ currentUser }: SensorsViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('temperature');
  const [zoneId, setZoneId] = useState<string>('');
  const [unit, setUnit] = useState('\u00B0C');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [sensorsRes, zonesRes] = await Promise.all([getSensors(), getZones()]);
      setSensors(sensorsRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error('Failed to load sensors', err);
      toast.error('Failed to load sensors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddDialog = () => {
    setEditingSensor(null);
    setName('');
    setType('temperature');
    setUnit('\u00B0C');
    setZoneId(zones[0] ? String(zones[0].id) : '');
    setDialogOpen(true);
  };

  const openEditDialog = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setName(sensor.name);
    setType(sensor.type);
    setUnit(sensor.unit || '');
    setZoneId(String(sensor.zone_id));
    setDialogOpen(true);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    const found = sensorTypes.find((t) => t.value === value);
    if (found) setUnit(found.defaultUnit);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Sensor name is required');
      return;
    }
    if (!zoneId) {
      toast.error('Please select a zone');
      return;
    }
    setSaving(true);
    try {
      if (editingSensor) {
        const res = await updateSensor(editingSensor.id, { name, type, zone_id: Number(zoneId), unit });
        setSensors(sensors.map((s) => (s.id === editingSensor.id ? res.data : s)));
        toast.success('Sensor updated');
      } else {
        const res = await createSensor({ name, type, zone_id: Number(zoneId), unit });
        setSensors([...sensors, res.data]);
        toast.success('Sensor created');
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save sensor';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (sensor: Sensor) => {
    try {
      const res = await toggleSensorStatus(sensor.id);
      setSensors(sensors.map((s) => (s.id === sensor.id ? res.data : s)));
      toast.success(res.message);
    } catch (err) {
      console.error('Failed to toggle sensor status', err);
      toast.error('Failed to update sensor status');
    }
  };

  const handleDelete = async (sensor: Sensor) => {
    if (!confirm(`Delete "${sensor.name}"?`)) return;
    try {
      await deleteSensor(sensor.id);
      setSensors(sensors.filter((s) => s.id !== sensor.id));
      toast.success('Sensor deleted');
    } catch (err) {
      console.error('Failed to delete sensor', err);
      toast.error('Failed to delete sensor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Sensors</h2>
          <p className="text-muted-foreground">Manage your measurement points</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddDialog}
            disabled={zones.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Sensor
          </button>
        )}
      </div>

      {zones.length === 0 && !loading && (
        <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg text-[#F59E0B] text-sm">
          You need to create a Zone first before adding sensors.
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading sensors...</p>
      ) : sensors.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No sensors yet. Add your first sensor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#22C55E]/20 rounded-lg flex items-center justify-center">
                  <Radio className="w-5 h-5 text-[#22C55E]" />
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditDialog(sensor)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(sensor)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-foreground mb-1">{sensor.name}</h3>
              <p className="text-muted-foreground text-sm mb-3 capitalize">
                {sensor.type.replace('_', ' ')} {'\u00B7'} {sensor.zone?.name || '\u2014'}
              </p>
              <button
                onClick={() => handleToggleStatus(sensor)}
                className={`inline-block px-3 py-1 rounded-full text-xs transition-colors ${
                  sensor.status === 'online'
                    ? 'text-[#22C55E] bg-[#22C55E]/10 hover:bg-[#22C55E]/20'
                    : 'text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20'
                }`}
              >
                {sensor.status} {'\u00B7'} click to toggle
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingSensor ? 'Edit Sensor' : 'Add Sensor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="sensor-name" className="text-muted-foreground mb-2 block">Sensor Name</Label>
              <Input
                id="sensor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Temp Sensor 1"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Type</Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {saving ? 'Saving...' : editingSensor ? 'Save Changes' : 'Create Sensor'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}