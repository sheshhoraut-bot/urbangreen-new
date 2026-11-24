import { LucideIcon } from 'lucide-react';

interface OverviewCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  iconColor?: string;
}

export function OverviewCard({ icon: Icon, label, value, iconColor = '#22C55E' }: OverviewCardProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-2">{label}</p>
          <p className="text-card-foreground text-3xl">{value}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}