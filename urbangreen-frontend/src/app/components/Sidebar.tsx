import { LayoutDashboard, Activity, MapPin, Sprout, FileText, Settings, Users, ClipboardList, Leaf, Thermometer, Package } from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  currentUser?: { role: string } | null;
}

export function Sidebar({ activeItem, onItemClick, currentUser }: SidebarProps) {
  const isAdmin = currentUser?.role === 'admin';
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'plants', label: 'Plants', icon: Sprout },
    { id: 'plant-library', label: 'Plant Library', icon: Leaf },
    { id: 'readings', label: 'Readings', icon: Thermometer },
    { id: 'care-tasks', label: 'Care Tasks', icon: ClipboardList },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
    ...(isAdmin ? [{ id: 'users', label: 'Users', icon: Users }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-60 h-screen bg-sidebar flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#22C55E] rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl">{'\u{1F331}'}</span>
          </div>
          <span className="text-sidebar-foreground tracking-wide text-lg">URBANGREEN+</span>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border-l-4 border-[#22C55E]'
                  : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#E2E8F0]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}