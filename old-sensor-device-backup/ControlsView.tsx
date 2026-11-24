import { useState, useEffect } from 'react';
import { Droplet, Lightbulb, Wind, Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import { getDevices, toggleDevice, updateDeviceSettings, Device } from '../../lib/api';

export function ControlsView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDevices()
      .then((res) => setDevices(res.data))
      .catch((err) => {
        console.error('Failed to load devices', err);
        toast.error('Failed to load devices');
      })
      .finally(() => setLoading(false));
  }, []);

  const findDevice = (type: string) => devices.find((d) => d.type === type);

  const handleToggle = async (device: Device) => {
    try {
      const res = await toggleDevice(device.id);
      setDevices(devices.map((d) => (d.id === res.data.id ? res.data : d)));
    } catch (err) {
      console.error('Failed to toggle device', err);
      toast.error('Failed to toggle device');
    }
  };

  const handleSettingChange = async (device: Device, key: string, value: number | string) => {
    const newSettings = { ...(device.settings || {}), [key]: value };
    setDevices(devices.map((d) => (d.id === device.id ? { ...d, settings: newSettings } : d)));
    try {
      await updateDeviceSettings(device.id, newSettings);
    } catch (err) {
      console.error('Failed to save setting', err);
      toast.error('Failed to save setting');
    }
  };

  const waterPump = findDevice('water_pump');
  const growLights = findDevice('grow_lights');
  const fan = findDevice('ventilation_fan');
  const heater = findDevice('climate_control');

  if (loading) {
    return <p className="text-muted-foreground">Loading devices...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2">System Controls</h2>
        <p className="text-muted-foreground">Manage all automated systems and schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Pump */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                waterPump?.is_active ? 'bg-[#38BDF8]/20' : 'bg-muted/30'
              }`}>
                <Droplet className={`w-6 h-6 ${waterPump?.is_active ? 'text-[#38BDF8]' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-foreground">Water Pump</h3>
                <p className="text-muted-foreground text-sm">{waterPump?.name || 'Main irrigation'}</p>
              </div>
            </div>
            {waterPump && (
              <button
                onClick={() => handleToggle(waterPump)}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  waterPump.is_active ? 'bg-[#38BDF8]' : 'bg-muted'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  waterPump.is_active ? 'left-8 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'left-1'
                }`} />
              </button>
            )}
          </div>

          {waterPump ? (
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Schedule</label>
                <input
                  type="time"
                  value={(waterPump.settings?.schedule as string) || '08:00'}
                  onChange={(e) => handleSettingChange(waterPump, 'schedule', e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-foreground">{waterPump.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No water pump device set up yet.</p>
          )}
        </div>

        {/* Grow Lights */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                growLights?.is_active ? 'bg-[#F59E0B]/20' : 'bg-muted/30'
              }`}>
                <Lightbulb className={`w-6 h-6 ${growLights?.is_active ? 'text-[#F59E0B]' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-foreground">Grow Lights</h3>
                <p className="text-muted-foreground text-sm">{growLights?.name || 'LED lighting'}</p>
              </div>
            </div>
            {growLights && (
              <button
                onClick={() => handleToggle(growLights)}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  growLights.is_active ? 'bg-[#F59E0B]' : 'bg-muted'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  growLights.is_active ? 'left-8 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'left-1'
                }`} />
              </button>
            )}
          </div>

          {growLights ? (
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Turn On At</label>
                <input
                  type="time"
                  value={(growLights.settings?.schedule as string) || '06:00'}
                  onChange={(e) => handleSettingChange(growLights, 'schedule', e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-foreground">{growLights.is_active ? 'On' : 'Off'}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No grow lights device set up yet.</p>
          )}
        </div>

        {/* Ventilation Fan */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                fan?.is_active ? 'bg-[#22C55E]/20' : 'bg-muted/30'
              }`}>
                <Wind className={`w-6 h-6 ${fan?.is_active ? 'text-[#22C55E]' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-foreground">Ventilation Fan</h3>
                <p className="text-muted-foreground text-sm">{fan?.name || 'Air circulation'}</p>
              </div>
            </div>
            {fan && (
              <button
                onClick={() => handleToggle(fan)}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  fan.is_active ? 'bg-[#22C55E]' : 'bg-muted'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  fan.is_active ? 'left-8 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'left-1'
                }`} />
              </button>
            )}
          </div>

          {fan ? (
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  Fan Speed: {(fan.settings?.speed as number) ?? 50}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(fan.settings?.speed as number) ?? 50}
                  onChange={(e) => handleSettingChange(fan, 'speed', Number(e.target.value))}
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #22C55E 0%, #22C55E ${(fan.settings?.speed as number) ?? 50}%, var(--background) ${(fan.settings?.speed as number) ?? 50}%, var(--background) 100%)`
                  }}
                />
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-foreground">{fan.is_active ? 'Running' : 'Stopped'}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No ventilation fan device set up yet.</p>
          )}
        </div>

        {/* Climate Control */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                heater?.is_active ? 'bg-[#EF4444]/20' : 'bg-muted/30'
              }`}>
                <Thermometer className={`w-6 h-6 ${heater?.is_active ? 'text-[#EF4444]' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-foreground">Climate Control</h3>
                <p className="text-muted-foreground text-sm">{heater?.name || 'Temperature regulation'}</p>
              </div>
            </div>
            {heater && (
              <button
                onClick={() => handleToggle(heater)}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  heater.is_active ? 'bg-[#EF4444]' : 'bg-muted'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  heater.is_active ? 'left-8 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'left-1'
                }`} />
              </button>
            )}
          </div>

          {heater ? (
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  Target Temperature: {(heater.settings?.target_temp as number) ?? 24}Â°C
                </label>
                <input
                  type="range"
                  min="15"
                  max="35"
                  value={(heater.settings?.target_temp as number) ?? 24}
                  onChange={(e) => handleSettingChange(heater, 'target_temp', Number(e.target.value))}
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-foreground">{heater.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No climate control device set up yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}