import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDeviceActivityById } from '../../lib/api';
const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
interface DeviceActivityChartProps {
  deviceId: number;
  deviceName: string;
}
export function DeviceActivityChart({ deviceId, deviceName }: DeviceActivityChartProps) {
  const [data, setData] = useState<{ day: string; usage: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getDeviceActivityById(deviceId)
      .then((res) => {
        const counts: Record<string, number> = res.data;
        const points = dayOrder.map((day) => ({ day, usage: counts[day] || 0 }));
        setData(points);
      })
      .catch((err) => console.error(`Failed to load activity for device ${deviceId}`, err))
      .finally(() => setLoading(false));
  }, [deviceId]);
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-foreground mb-4">{deviceName} — Activations This Week</h3>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)'
              }}
            />
            <Bar dataKey="usage" fill="#38BDF8" radius={[8, 8, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
