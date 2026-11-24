import { Droplet, Lightbulb, Wind, Thermometer } from 'lucide-react';
import { Device, toggleDevice } from '../../lib/api';
interface ControlPanelProps {
  devices: Device[];
  onDeviceToggled: (device: Device) => void;
}
const iconByType: Record<string, typeof Droplet> = {
  water_pump: Droplet,
  grow_lights: Lightbulb,
  ventilation_fan: Wind,
  climate_control: Thermometer,
};
const labelByType: Record<string, string> = {
  water_pump: 'Water Pump',
  grow_lights: 'Grow Lights',
  ventilation_fan: 'Ventilation Fan',
  climate_control: 'Climate Control',
};
export function ControlPanel({ devices, onDeviceToggled }: ControlPanelProps) {
  const handleToggle = async (deviceId: number) => {
    try {
      const res = await toggleDevice(deviceId);
      onDeviceToggled(res.data);
    } catch (err) {
      console.error('Failed to toggle device', err);
    }
  };
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-card-foreground mb-6">Control Panel</h3>
      <div className="space-y-4">
        {devices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No devices yet. Add one to get started.</p>
        ) : (
          devices.map((device) => {
            const Icon = iconByType[device.type] || Droplet;
            const label = labelByType[device.type] || device.name;
            const isActive = device.is_active;
            return (
              <div key={device.id} className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isActive ? 'bg-[#22C55E]/20' : 'bg-muted/30'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-all ${
                        isActive ? 'text-[#22C55E]' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <span className="text-card-foreground">{device.name || label}</span>
                </div>
                <button
                  onClick={() => handleToggle(device.id)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    isActive ? 'bg-[#22C55E]' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                      isActive ? 'left-8' : 'left-1'
                    } ${isActive ? 'shadow-[0_0_10px_rgba(34,197,94,0.5)]' : ''}`}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}