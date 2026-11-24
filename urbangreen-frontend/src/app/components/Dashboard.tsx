import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { OverviewCard } from './OverviewCard';
import { PlantMonitoringTable } from './PlantMonitoringTable';
import { MonitoringView } from './MonitoringView';
import { UsersView } from './UsersView';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';
import { ZonesView } from './ZonesView';
import { PlantsView } from './PlantsView';
import { NotificationsView } from './NotificationsView';
import { CareTasksView } from './CareTasksView';
import { PlantLibraryView } from './PlantLibraryView';
import { ReadingsView } from './ReadingsView';
import { InventoryView } from './InventoryView';
import { MapPin, Sprout, ClipboardList, AlertTriangle } from 'lucide-react';
import { getZones, getPlants, getCareTasks, getZoneReadings, Plant, CareTask, ZoneReading } from '../../lib/api';

interface DashboardProps {
  onLogout: () => void;
  currentUser: { id: number; email: string; name: string; role: string; phone: string | null; status: string } | null;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Dashboard({ onLogout, currentUser, onUpdatePassword }: DashboardProps) {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [zoneCount, setZoneCount] = useState(0);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [readings, setReadings] = useState<ZoneReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeMenuItem !== 'dashboard') return;

    let cancelled = false;

    async function loadDashboardData() {
      try {
        const [zonesRes, plantsRes, tasksRes, readingsRes] = await Promise.all([
          getZones(),
          getPlants(),
          getCareTasks(),
          getZoneReadings(undefined, 7),
        ]);
        if (cancelled) return;
        setZoneCount(zonesRes.meta?.total ?? zonesRes.data.length);
        setPlants(plantsRes.data);
        setTasks(tasksRes.data);
        setReadings(readingsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeMenuItem]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const overdueCount = tasks.filter((t) => t.is_overdue).length;
  const upcomingTasks = pendingTasks.slice(0, 5);
  const recentReadings = readings.slice(0, 5);

  const getPageTitle = () => {
    switch (activeMenuItem) {
      case 'dashboard': return 'Dashboard';
      case 'monitoring': return 'Monitoring';
      case 'reports': return 'Reports';
      case 'users': return 'Users';
      case 'settings': return 'Settings';
      case 'zones': return 'Zones';
      case 'plants': return 'Plants';
      case 'care-tasks': return 'Care Tasks';
      case 'plant-library': return 'Plant Library';
      case 'readings': return 'Readings';
      case 'inventory': return 'Inventory';
      case 'notifications': return 'Notifications';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} currentUser={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={getPageTitle()} onLogout={onLogout} currentUser={currentUser} onNavigate={setActiveMenuItem} />
        <main className="flex-1 overflow-auto p-8">
          {activeMenuItem === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <OverviewCard icon={MapPin} label="Total Zones" value={loading ? '...' : String(zoneCount)} iconColor="#22C55E" />
                <OverviewCard icon={Sprout} label="Total Plants" value={loading ? '...' : String(plants.length)} iconColor="#22C55E" />
                <OverviewCard icon={ClipboardList} label="Pending Tasks" value={loading ? '...' : String(pendingTasks.length)} iconColor="#38BDF8" />
                <OverviewCard icon={AlertTriangle} label="Overdue Tasks" value={loading ? '...' : String(overdueCount)} iconColor="#EF4444" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-card rounded-2xl border border-border">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-foreground">Upcoming tasks</h3>
                    <button
                      onClick={() => setActiveMenuItem('care-tasks')}
                      className="text-[#22C55E] text-sm hover:text-[#16A34A]"
                    >
                      View all
                    </button>
                  </div>
                  {loading ? (
                    <p className="p-5 text-muted-foreground text-sm">Loading...</p>
                  ) : upcomingTasks.length === 0 ? (
                    <p className="p-5 text-muted-foreground text-sm">No pending tasks.</p>
                  ) : (
                    upcomingTasks.map((task, i) => (
                      <div
                        key={task.id}
                        className={`p-5 flex items-center justify-between gap-3 ${i !== upcomingTasks.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className="text-foreground text-sm">{task.title}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {task.plant || task.zone || 'General'}
                            {task.assignee ? ` \u00B7 ${task.assignee}` : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-3 py-1 rounded-full text-xs ${
                            task.is_overdue
                              ? 'text-[#EF4444] bg-[#EF4444]/10'
                              : 'text-[#F59E0B] bg-[#F59E0B]/10'
                          }`}
                        >
                          {task.is_overdue ? 'Overdue' : 'Due'} {task.due_date}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-foreground">Recent readings</h3>
                    <button
                      onClick={() => setActiveMenuItem('readings')}
                      className="text-[#22C55E] text-sm hover:text-[#16A34A]"
                    >
                      View all
                    </button>
                  </div>
                  {loading ? (
                    <p className="p-5 text-muted-foreground text-sm">Loading...</p>
                  ) : recentReadings.length === 0 ? (
                    <p className="p-5 text-muted-foreground text-sm">No readings logged this week.</p>
                  ) : (
                    recentReadings.map((reading, i) => (
                      <div
                        key={reading.id}
                        className={`p-5 ${i !== recentReadings.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <p className="text-foreground text-sm">
                          {reading.zone || 'Zone'} {'\u00B7'} {formatDateTime(reading.recorded_at)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {reading.temperature !== null && (
                            <span className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                              Temp {reading.temperature}{'\u00B0'}C
                            </span>
                          )}
                          {reading.humidity !== null && (
                            <span className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                              Humidity {reading.humidity}%
                            </span>
                          )}
                          {reading.soil_moisture !== null && (
                            <span className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                              Soil {reading.soil_moisture}%
                            </span>
                          )}
                          {reading.ph !== null && (
                            <span className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                              pH {reading.ph}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <PlantMonitoringTable
                plants={plants}
                onPlantUpdated={(updated) => setPlants(plants.map((p) => (p.id === updated.id ? updated : p)))}
              />
            </>
          )}
          {activeMenuItem === 'monitoring' && <MonitoringView />}
          {activeMenuItem === 'reports' && <ReportsView currentUser={currentUser} />}
          {activeMenuItem === 'users' && <UsersView />}
          {activeMenuItem === 'zones' && <ZonesView currentUser={currentUser} />}
          {activeMenuItem === 'plants' && <PlantsView currentUser={currentUser} />}
          {activeMenuItem === 'care-tasks' && <CareTasksView currentUser={currentUser} />}
          {activeMenuItem === 'plant-library' && <PlantLibraryView currentUser={currentUser} />}
          {activeMenuItem === 'readings' && <ReadingsView currentUser={currentUser} />}
          {activeMenuItem === 'inventory' && <InventoryView currentUser={currentUser} />}
          {activeMenuItem === 'notifications' && <NotificationsView />}
          {activeMenuItem === 'settings' && (
            <SettingsView
              onLogout={onLogout}
              currentUser={currentUser}
              onUpdatePassword={onUpdatePassword}
            />
          )}
        </main>
      </div>
    </div>
  );
}