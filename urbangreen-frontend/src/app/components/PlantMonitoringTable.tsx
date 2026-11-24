import { Sprout } from 'lucide-react';
import { Plant } from '../../lib/api';

const statusColors: Record<string, string> = {
  healthy: 'text-[#22C55E] bg-[#22C55E]/10',
  attention: 'text-[#F59E0B] bg-[#F59E0B]/10',
  critical: 'text-[#EF4444] bg-[#EF4444]/10',
};

const statusLabels: Record<string, string> = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  critical: 'Critical',
};

interface PlantMonitoringTableProps {
  plants: Plant[];
  onPlantUpdated?: (plant: Plant) => void;
}

export function PlantMonitoringTable({ plants }: PlantMonitoringTableProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-foreground mb-6">Plant Monitoring</h3>

      {plants.length === 0 ? (
        <div className="py-8 text-center">
          <Sprout className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No plants yet. Add plants on the Plants page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground pb-4 font-medium">Plant Name</th>
                <th className="text-left text-muted-foreground pb-4 font-medium">Species</th>
                <th className="text-left text-muted-foreground pb-4 font-medium">Zone</th>
                <th className="text-left text-muted-foreground pb-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => (
                <tr key={plant.id} className="border-b border-border/50 last:border-0">
                  <td className="py-4 text-foreground">{plant.name}</td>
                  <td className="py-4 text-muted-foreground">{plant.species || '\u2014'}</td>
                  <td className="py-4 text-muted-foreground">{plant.zone?.name || '\u2014'}</td>
                  <td className="py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${statusColors[plant.status] || ''}`}>
                      {statusLabels[plant.status] || plant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}