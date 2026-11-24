import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSensorReadingsById, SensorReadingPoint } from '../../lib/api';
interface SensorChartProps {
  sensorId: number;
  sensorName: string;
  unit: string | null;
}
export function SensorChart({ sensorId, sensorName, unit }: SensorChartProps) {
  const [data, setData] = useState<{ time: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getSensorReadingsById(sensorId)
      .then((res) => {
        const points = res.data.map((r: SensorReadingPoint) => ({
          time: new Date(r.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: parseFloat(r.value),
        }));
        setData(points);
      })
      .catch((err) => console.error(`Failed to load readings for sensor ${sensorId}`, err))
      .finally(() => setLoading(false));
  }, [sensorId]);
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-foreground mb-4">{sensorName}{unit ? ` (${unit})` : ''}</h3>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground text-sm">No readings yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)'
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ fill: '#22C55E', r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
