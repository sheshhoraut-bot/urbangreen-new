import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTemperatureHistory } from '../../lib/api';
export function TemperatureChart() {
  const [data, setData] = useState<{ time: string; temp: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getTemperatureHistory()
      .then((res) => {
        const points = res.data.map((r: { value: string; recorded_at: string }) => ({
          time: new Date(r.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temp: parseFloat(r.value),
        }));
        setData(points);
      })
      .catch((err) => console.error('Failed to load temperature history', err))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-foreground mb-4">Temperature Over Time</h3>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground text-sm">No temperature readings yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
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
              dataKey="temp"
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
