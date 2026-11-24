import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Zap, Copy, Droplet, Lightbulb, Wind, Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDevices, createDevice, updateDevice, deleteDevice, toggleDevice, getZones, Device, Zone } from '../../lib/api';

const deviceTypes = [
  { value: 'water_pump', label: 'Water Pump', icon: Droplet },
  { value: 'grow_lights', label: 'Grow Lights', icon: Lightbulb },
  { value: 'ventilation_fan', label: 'Ventilation Fan', icon: Wind },
  { value: 'climate_control', label: 'Climate Control', icon: Thermometer },
];

interface DevicesViewProps {
  currentUser?: { role: string } | null;
}

export function DevicesView({ currentUser }: DevicesViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [devices, setDevices] = useState<Device[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('water_pump');
  const [zoneId, setZoneId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [devicesRes, zonesRes] = await Promise.all([getDevices(), getZones()]);
      setDevices(devicesRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error('Failed to load devices', err);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddDialog = () => {
    setEditingDevice(null);
    setName('');
    setType('water_pump');
    setZoneId(zones[0] ? String(zones[0].id) : '');
    setDialogOpen(true);
  };

  const openEditDialog = (device: Device) => {
    setEditingDevice(device);
    setName(device.name);
    setType(device.type);
    setZoneId(String(device.zone_id));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Device name is required');
      return;
    }
    if (!zoneId) {
      toast.error('Please select a zone');
      return;
    }
    setSaving(true);
    try {
      if (editingDevice) {
        const res = await updateDevice(editingDevice.id, { name, type, zone_id: Number(zoneId) });
        setDevices(devices.map((d) => (d.id === editingDevice.id ? res.data : d)));
        toast.success('Device updated');
        setDialogOpen(false);
      } else {
        const res = await createDevice({ name, type, zone_id: Number(zoneId) });
        setDevices([...devices, res.data]);
        setNewApiKey(res.data.api_key);
        toast.success('Device created');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save device';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (device: Device) => {
    if (!confirm(`Delete "${device.name}"?`)) return;
    try {
      await deleteDevice(device.id);
      setDevices(devices.filter((d) => d.id !== device.id));
      toast.success('Device deleted');
    } catch (err) {
      console.error('Failed to delete device', err);
      toast.error('Failed to delete device');
    }
  };

  const handleToggle = async (device: Device) => {
    try {
      const res = await toggleDevice(device.id);
      setDevices(devices.map((d) => (d.id === device.id ? res.data : d)));
    } catch (err) {
      console.error('Failed to toggle device', err);
      toast.error('Failed to toggle device');
    }
  };

  const copyApiKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      toast.success('API key copied to clipboard');
    }
  };

  const closeAndReset = () => {
    setDialogOpen(false);
    setNewApiKey(null);
  };

  const getTypeInfo = (t: string) => deviceTypes.find((dt) => dt.value === t) || deviceTypes[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Devices</h2>
          <p className="text-muted-foreground">Manage your controllable devices</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddDialog}
            disabled={zones.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        )}
      </div>

      {zones.length === 0 && !loading && (
        <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg text-[#F59E0B] text-sm">
          You need to create a Zone first before adding devices.
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading devices...</p>
      ) : devices.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No devices yet. Add your first device to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const typeInfo = getTypeInfo(device.type);
            const Icon = typeInfo.icon;
            return (
              <div key={device.id} className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    device.is_active ? 'bg-[#22C55E]/20' : 'bg-muted/30'
                  }`}>
                    <Icon className={`w-5 h-5 ${device.is_active ? 'text-[#22C55E]' : 'text-muted-foreground'}`} />
                  </div>
               {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditDialog(device)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(device)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                )}

                </div>
                <h3 className="text-foreground mb-1">{device.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{typeInfo.label} Â· {device.zone?.name || 'â€”'}</p>
                <button
                  onClick={() => handleToggle(device)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    device.is_active
                      ? 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {device.is_active ? 'On' : 'Off'} â€” Click to toggle
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeAndReset())}>
        <DialogContent className="bg-card border-border text-foreground">
          {newApiKey ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Device Created</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Save this API key now â€” it will not be shown again. You'll need it to configure your Arduino/ESP device.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
                <code className="text-[#22C55E] text-sm flex-1 break-all">{newApiKey}</code>
                <button onClick={copyApiKey} className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <DialogFooter>
                <button
                  onClick={closeAndReset}
                  className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
                >
                  Done
                </button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">{editingDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="device-name" className="text-muted-foreground mb-2 block">Device Name</Label>
                  <Input
                    id="device-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Water Pump A"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground mb-2 block">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((t) => (
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
                  onClick={closeAndReset}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingDevice ? 'Save Changes' : 'Create Device'}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}