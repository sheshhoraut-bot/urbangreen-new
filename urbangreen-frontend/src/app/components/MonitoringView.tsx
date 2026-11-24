import { useState, useEffect } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  getZones, getPlants, getPlantSpecies, getZoneReadings,
  Zone, Plant, PlantSpecies, ZoneReading,
} from '../../lib/api';

type MetricKey = 'temperature' | 'humidity' | 'soil_moisture' | 'ph';

type Metric = {
  key: MetricKey;
  label: string;
  unit: string;
  minKey: keyof PlantSpecies;
  maxKey: keyof PlantSpecies;
};

type Range = { lo: number | null; hi: number | null };

const metrics: Metric[] = [
  { key: 'temperature', label: 'Temperature', unit: '\u00B0C', minKey: 'temp_min', maxKey: 'temp_max' },
  { key: 'humidity', label: 'Humidity', unit: '%', minKey: 'humidity_min', maxKey: 'humidity_max' },
  { key: 'soil_moisture', label: 'Soil moisture', unit: '%', minKey: 'soil_moisture_min', maxKey: 'soil_moisture_max' },
  { key: 'ph', label: 'pH', unit: '', minKey: 'ph_min', maxKey: 'ph_max' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

export function MonitoringView() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [speciesList, setSpeciesList] = useState<PlantSpecies[]>([]);
  const [readings, setReadings] = useState<ZoneReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [zonesRes, plantsRes, readingsRes] = await Promise.all([
        getZones(),
        getPlants(),
        getZoneReadings(undefined, 30),
      ]);
      setZones(zonesRes.data);
      setPlants(plantsRes.data);
      setReadings(readingsRes.data);
    } catch (err) {
      console.error('Failed to load monitoring data', err);
      toast.error('Failed to load monitoring data');
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Zones refreshed');
  };

  const speciesInZone = (zoneId: number) => {
    const names = new Set(
      plants
        .filter((p) => p.zone_id === zoneId && p.species)
        .map((p) => (p.species as string).trim().toLowerCase())
    );
    return speciesList.filter((s) => names.has(s.name.toLowerCase()));
  };

  const zoneCards = zones.map((zone) => {
    const latest = readings.find((r) => r.zone_id === zone.id) || null;
    const zoneSpecies = speciesInZone(zone.id);
    const plantCount = plants.filter((p) => p.zone_id === zone.id).length;

    const rows = metrics.map((m) => {
      const value = latest ? latest[m.key] : null;
      const checks = zoneSpecies
        .map((s) => {
          const range = rangeFor(s, m);
          return range ? { name: s.name, status: statusFor(value, range) } : null;
        })
        .filter((c): c is { name: string; status: string | null } => c !== null && c.status !== null);
      const out = checks.filter((c) => c.status !== 'ok');
      return { metric: m, value, checks, out };
    });

    const issues = rows.filter((r) => r.out.length > 0).length;
    const checked = rows.filter((r) => r.checks.length > 0).length;

    let overall: 'none' | 'ok' | 'attention' = 'none';
    if (issues > 0) overall = 'attention';
    else if (checked > 0) overall = 'ok';

    return { zone, latest, plantCount, rows, issues, overall };
  });

  const attentionCount = zoneCards.filter((c) => c.overall === 'attention').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Monitoring</h2>
          <p className="text-muted-foreground">
            {attentionCount > 0
              ? `${attentionCount} ${attentionCount === 1 ? 'zone needs' : 'zones need'} attention`
              : 'Latest logged conditions in each zone'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading zones...</p>
      ) : zones.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No zones yet. Create a zone to start monitoring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zoneCards.map(({ zone, latest, plantCount, rows, issues, overall }) => (
            <div key={zone.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#22C55E]/20 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-foreground truncate">{zone.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {plantCount} {plantCount === 1 ? 'plant' : 'plants'}
                    </p>
                  </div>
                </div>
                {overall === 'attention' && (
                  <span className="shrink-0 px-3 py-1 rounded-full text-xs text-[#EF4444] bg-[#EF4444]/10">
                    {issues} out of range
                  </span>
                )}
                {overall === 'ok' && (
                  <span className="shrink-0 px-3 py-1 rounded-full text-xs text-[#22C55E] bg-[#22C55E]/10">
                    All in range
                  </span>
                )}
              </div>

              {latest ? (
                <>
                  <div className="space-y-3">
                    {rows.map(({ metric, value, checks, out }) => (
                      <div key={metric.key}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">
                              {value !== null ? `${value}${metric.unit}` : '\u2014'}
                            </span>
                            {checks.length > 0 && out.length === 0 && (
                              <span className="px-2 py-1 rounded-full text-xs text-[#22C55E] bg-[#22C55E]/10">In range</span>
                            )}
                          </div>
                        </div>
                        {out.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-2 mt-2">
                            {out.map((c) => (
                              <span
                                key={c.name}
                                className={`px-2 py-1 rounded-full text-xs ${
                                  c.status === 'high'
                                    ? 'text-[#EF4444] bg-[#EF4444]/10'
                                    : 'text-[#38BDF8] bg-[#38BDF8]/10'
                                }`}
                              >
                                {c.status === 'high' ? 'Too high' : 'Too low'} for {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs mt-4 pt-4 border-t border-border">
                    Logged {formatDateTime(latest.recorded_at)}
                    {latest.author ? ` by ${latest.author}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No readings in the last 30 days. Log one on the Readings page.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}