import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getZoneReadings, createZoneReading, updateZoneReading, deleteZoneReading,
  getZones, getPlants, getPlantSpecies,
  ZoneReading, Zone, Plant, PlantSpecies,
} from '../../lib/api';

type MetricKey = 'temperature' | 'humidity' | 'soil_moisture' | 'ph';

type Metric = {
  key: MetricKey;
  label: string;
  unit: string;
  minKey: keyof PlantSpecies;
  maxKey: keyof PlantSpecies;
  step: string;
};

type Range = { lo: number | null; hi: number | null };

const metrics: Metric[] = [
  { key: 'temperature', label: 'Temperature', unit: '\u00B0C', minKey: 'temp_min', maxKey: 'temp_max', step: '0.1' },
  { key: 'humidity', label: 'Humidity', unit: '%', minKey: 'humidity_min', maxKey: 'humidity_max', step: '1' },
  { key: 'soil_moisture', label: 'Soil moisture', unit: '%', minKey: 'soil_moisture_min', maxKey: 'soil_moisture_max', step: '1' },
  { key: 'ph', label: 'pH', unit: '', minKey: 'ph_min', maxKey: 'ph_max', step: '0.1' },
];

const ALL = 'all';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatShort(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toNumber(value: string) {
  return value.trim() === '' ? null : Number(value);
}

function rangeFor(species: PlantSpecies, m: Metric): Range | null {
  const lo = species[m.minKey] as number | null;
  const hi = species[m.maxKey] as number | null;
  if (lo === null && hi === null) return null;
  return { lo, hi };
}

function statusFor(value: number | null, range: Range) {
  if (value === null) return null;
  if (range.lo !== null && value < range.lo) return 'low';
  if (range.hi !== null && value > range.hi) return 'high';
  return 'ok';
}

function rangeText(range: Range, unit: string) {
  if (range.lo !== null && range.hi !== null) return `${range.lo}\u2013${range.hi}${unit}`;
  if (range.lo !== null) return `${range.lo}${unit}+`;
  return `up to ${range.hi}${unit}`;
}

function badge(status: string | null) {
  if (status === 'ok') return <span className="shrink-0 px-2 py-1 rounded-full text-xs text-[#22C55E] bg-[#22C55E]/10">In range</span>;
  if (status === 'low') return <span className="shrink-0 px-2 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">Too low</span>;
  if (status === 'high') return <span className="shrink-0 px-2 py-1 rounded-full text-xs text-[#EF4444] bg-[#EF4444]/10">Too high</span>;
  return null;
}

interface ReadingsViewProps {
  currentUser?: { id?: number; role: string } | null;
}

export function ReadingsView({ currentUser }: ReadingsViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [zones, setZones] = useState<Zone[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [speciesList, setSpeciesList] = useState<PlantSpecies[]>([]);
  const [readings, setReadings] = useState<ZoneReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState<string>(ALL);
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<MetricKey>('temperature');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ZoneReading | null>(null);
  const [saving, setSaving] = useState(false);
  const [formZone, setFormZone] = useState('');
  const [formTime, setFormTime] = useState(toLocalInput(new Date()));
  const [formValues, setFormValues] = useState<Record<MetricKey, string>>({
    temperature: '', humidity: '', soil_moisture: '', ph: '',
  });
  const [formNotes, setFormNotes] = useState('');

  const loadOptions = async () => {
    try {
      const [zonesRes, plantsRes] = await Promise.all([getZones(), getPlants()]);
      setZones(zonesRes.data);
      setPlants(plantsRes.data);
    } catch (err) {
      console.error('Failed to load zones or plants', err);
      toast.error('Failed to load zones');
    }
    try {
      const speciesRes = await getPlantSpecies();
      setSpeciesList(speciesRes.data);
    } catch (err) {
      console.error('Failed to load plant library', err);
    }
  };

  const loadReadings = async () => {
    try {
      const res = await getZoneReadings(zoneFilter === ALL ? undefined : Number(zoneFilter), days);
      setReadings(res.data);
    } catch (err) {
      console.error('Failed to load readings', err);
      toast.error('Failed to load readings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadReadings();
  }, [zoneFilter, days]);

  const resetForm = (zoneId: string) => {
    setFormZone(zoneId);
    setFormTime(toLocalInput(new Date()));
    setFormValues({ temperature: '', humidity: '', soil_moisture: '', ph: '' });
    setFormNotes('');
  };

  const openAddDialog = () => {
    setEditing(null);
    resetForm(zoneFilter !== ALL ? zoneFilter : zones[0] ? String(zones[0].id) : '');
    setDialogOpen(true);
  };

  const openEditDialog = (reading: ZoneReading) => {
    setEditing(reading);
    setFormZone(String(reading.zone_id));
    setFormTime(toLocalInput(new Date(reading.recorded_at)));
    setFormValues({
      temperature: reading.temperature !== null ? String(reading.temperature) : '',
      humidity: reading.humidity !== null ? String(reading.humidity) : '',
      soil_moisture: reading.soil_moisture !== null ? String(reading.soil_moisture) : '',
      ph: reading.ph !== null ? String(reading.ph) : '',
    });
    setFormNotes(reading.notes || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formZone) {
      toast.error('Please select a zone');
      return;
    }
    const values = {
      temperature: toNumber(formValues.temperature),
      humidity: toNumber(formValues.humidity),
      soil_moisture: toNumber(formValues.soil_moisture),
      ph: toNumber(formValues.ph),
    };
    if (Object.values(values).every((v) => v === null)) {
      toast.error('Enter at least one reading');
      return;
    }
    const payload = {
      zone_id: Number(formZone),
      recorded_at: formTime ? new Date(formTime).toISOString() : null,
      ...values,
      notes: formNotes.trim() || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateZoneReading(editing.id, payload);
        toast.success('Reading updated');
      } else {
        await createZoneReading(payload);
        toast.success('Reading logged');
      }
      setDialogOpen(false);
      await loadReadings();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
      toast.error(firstError || err.response?.data?.message || 'Failed to save reading');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reading: ZoneReading) => {
    if (!confirm('Delete this reading?')) return;
    try {
      await deleteZoneReading(reading.id);
      setReadings(readings.filter((r) => r.id !== reading.id));
      toast.success('Reading deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete reading');
    }
  };

  const canModify = (reading: ZoneReading) =>
    isAdmin || (currentUser?.id !== undefined && reading.user_id === currentUser.id);

  const selectedZone = zoneFilter !== ALL ? zones.find((z) => String(z.id) === zoneFilter) : undefined;

  // Library species of the plants growing in the selected zone
  const zoneSpecies: PlantSpecies[] = [];
  if (selectedZone) {
    const names = new Set(
      plants
        .filter((p) => p.zone_id === selectedZone.id && p.species)
        .map((p) => (p.species as string).trim().toLowerCase())
    );
    speciesList.forEach((s) => {
      if (names.has(s.name.toLowerCase())) zoneSpecies.push(s);
    });
  }

  const latest = readings.length > 0 ? readings[0] : null;
  const activeMetric = metrics.find((m) => m.key === metric)!;

  const chartData = [...readings]
    .filter((r) => r[metric] !== null && (zoneFilter === ALL || String(r.zone_id) === zoneFilter))
    .reverse()
    .map((r) => ({ time: formatShort(r.recorded_at), value: r[metric] as number }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Readings</h2>
          <p className="text-muted-foreground">Log and track the conditions in each zone</p>
        </div>
        <button
          onClick={openAddDialog}
          disabled={zones.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Log Reading
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All zones</SelectItem>
              {zones.map((z) => (
                <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {[7, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              days === d ? 'bg-[#22C55E] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {selectedZone && latest && String(latest.zone_id) === zoneFilter && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => {
              const value = latest[m.key];
              return (
                <div key={m.key} className="bg-card rounded-2xl p-5 border border-border">
                  <p className="text-muted-foreground text-sm mb-1">{m.label}</p>
                  <p className="text-foreground text-2xl mb-3">
                    {value !== null ? `${value}${m.unit}` : '\u2014'}
                  </p>
                  {value !== null && zoneSpecies.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      {zoneSpecies.map((s) => {
                        const range = rangeFor(s, m);
                        if (!range) return null;
                        return (
                          <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-muted-foreground">
                              {s.name} {rangeText(range, m.unit)}
                            </span>
                            {badge(statusFor(value, range))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs mt-2">
            Latest reading {formatDateTime(latest.recorded_at)}
            {zoneSpecies.length > 0
              ? ` \u00B7 compared with the Plant Library range of each plant type in this zone`
              : ' \u00B7 add plants with a library species to this zone to see ideal ranges'}
          </p>
        </div>
      )}

      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-foreground">Trend</h3>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  metric === m.key ? 'bg-[#22C55E] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {zoneFilter === ALL ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Select a zone to see its trend.</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No {activeMetric.label.toLowerCase()} readings in this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#64748B" strokeOpacity={0.3} />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} unit={activeMetric.unit} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#E2E8F0' }}
                formatter={(value) => [`${value}${activeMetric.unit}`, activeMetric.label]}
              />
              <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="text-foreground">History</h3>
        </div>
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading readings...</p>
        ) : readings.length === 0 ? (
          <div className="p-12 text-center">
            <Thermometer className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No readings yet. Log the first one.</p>
          </div>
        ) : (
          readings.map((reading, i) => (
            <div
              key={reading.id}
              className={`p-5 flex items-start justify-between gap-4 ${i !== readings.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="min-w-0">
                <p className="text-foreground text-sm">
                  {reading.zone || 'Zone'} {'\u00B7'} {formatDateTime(reading.recorded_at)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {metrics.map((m) =>
                    reading[m.key] !== null ? (
                      <span key={m.key} className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                        {m.label}: {reading[m.key]}{m.unit}
                      </span>
                    ) : null
                  )}
                </div>
                {reading.notes && <p className="text-muted-foreground text-sm mt-2">{reading.notes}</p>}
                {reading.author && <p className="text-muted-foreground text-xs mt-2">by {reading.author}</p>}
              </div>
              {canModify(reading) && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditDialog(reading)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(reading)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Edit Reading' : 'Log Reading'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-muted-foreground mb-2 block">Zone</Label>
              <Select value={formZone} onValueChange={setFormZone}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="r-time" className="text-muted-foreground mb-2 block">Date and time</Label>
              <Input
                id="r-time"
                type="datetime-local"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((m) => (
                <div key={m.key}>
                  <Label className="text-muted-foreground mb-2 block">
                    {m.label}{m.unit ? ` (${m.unit})` : ''}
                  </Label>
                  <Input
                    type="number"
                    step={m.step}
                    value={formValues[m.key]}
                    onChange={(e) => setFormValues({ ...formValues, [m.key]: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Fill in at least one. Leave the others empty.</p>
            <div>
              <Label htmlFor="r-notes" className="text-muted-foreground mb-2 block">Notes (optional)</Label>
              <Input
                id="r-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Measured at noon, after watering"
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
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Log Reading'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}