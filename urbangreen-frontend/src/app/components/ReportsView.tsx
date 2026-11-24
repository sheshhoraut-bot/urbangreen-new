import { useState, useEffect } from 'react';
import { FileText, Download, MapPin, Sprout, Thermometer, ClipboardList, Plus, X, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { getReportHistory, generateReport, downloadReportFile, ReportLog } from '../../lib/api';

const typeOptions = [
  { value: 'zones', label: 'Zones', icon: MapPin, color: '#22C55E' },
  { value: 'plants', label: 'Plants', icon: Sprout, color: '#38BDF8' },
  { value: 'readings', label: 'Readings', icon: Thermometer, color: '#F59E0B' },
  { value: 'care_tasks', label: 'Care Tasks', icon: ClipboardList, color: '#A855F7' },
];

function typeInfo(type: string) {
  const found = typeOptions.find((t) => t.value === type);
  if (found) return found;
  // Older reports of removed types (sensors, devices) still appear in the history
  return { value: type, label: type, icon: FileText, color: '#94A3B8' };
}

function GenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (log: ReportLog) => void }) {
  const [type, setType] = useState('zones');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateReport(type);
      window.open(res.data.download_url, '_blank');
      onGenerated(res.data.log);
      toast.success(`Report generated: ${res.data.row_count} rows`);
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to generate report';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-foreground text-lg font-semibold">Generate Report</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground text-sm">Choose what data to export as a PDF file.</p>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map((t) => {
              const Icon = t.icon;
              const selected = type === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selected ? 'border-[#22C55E] bg-[#22C55E]/10' : 'border-border bg-background hover:border-muted'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" style={{ color: t.color }} />
                  <p className="text-foreground text-sm">{t.label}</p>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 h-10 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 h-10 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? 'Generating...' : (<><Plus className="w-4 h-4" /> Generate & Download</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReportsViewProps {
  currentUser?: { role: string } | null;
}

export function ReportsView({ currentUser }: ReportsViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadHistory = async () => {
    try {
      const res = await getReportHistory();
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load report history', err);
      toast.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDownload = async (report: ReportLog) => {
    setDownloadingId(report.id);
    try {
      const { blob, filename } = await downloadReportFile(report.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download report', err);
      const status = err.response?.status;
      if (status === 404) {
        toast.error('The file for this report no longer exists');
      } else if (status === 403) {
        toast.error('You can only download your own reports');
      } else {
        toast.error('Failed to download report');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const typeCounts = reports.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {showModal && (
        <GenerateModal onClose={() => setShowModal(false)} onGenerated={(log) => setReports([log, ...reports])} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Reports & Analytics</h2>
          <p className="text-muted-foreground">Export real system data as PDF</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors shadow-lg shadow-[#22C55E]/20"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Type</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Format</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Generated</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No reports generated yet.</td></tr>
              ) : reports.map((report, index) => {
                const info = typeInfo(report.type);
                const Icon = info.icon;
                return (
                  <tr key={report.id} className={`border-t border-border/50 hover:bg-background/50 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-background/20'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${info.color}20` }}>
                          <Icon className="w-5 h-5" style={{ color: info.color }} />
                        </div>
                        <span className="text-foreground capitalize">{report.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground uppercase text-sm">{report.format}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(report.generated_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <button
                          onClick={() => handleDownload(report)}
                          disabled={downloadingId === report.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-[#22C55E] hover:text-white transition-all disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          {downloadingId === report.id ? 'Downloading...' : 'Download'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-sm">Admin only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="text-foreground">Quick Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Reports Generated</span>
              <span className="text-foreground font-medium">{reports.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-[#22C55E]" />
            <h3 className="text-foreground">By Type</h3>
          </div>
          <div className="space-y-3">
            {typeOptions.map((t) => (
              <div key={t.value} className="flex justify-between items-center">
                <span className="text-sm px-2 py-0.5 rounded" style={{ color: t.color, backgroundColor: `${t.color}20` }}>{t.label}</span>
                <span className="text-foreground font-medium">{typeCounts[t.value] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}