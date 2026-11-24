import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, CheckCircle2, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getCareTasks, createCareTask, updateCareTask, deleteCareTask, completeCareTask,
  getPlants, getZones, listUsers,
  CareTask, Plant, Zone, AppUser,
} from '../../lib/api';

const taskTypes = [
  { value: 'watering', label: 'Watering' },
  { value: 'fertilizing', label: 'Fertilizing' },
  { value: 'pruning', label: 'Pruning' },
  { value: 'pest_check', label: 'Pest Check' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'other', label: 'Other' },
];

const filters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
];

const NONE = 'none';

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

interface CareTasksViewProps {
  currentUser?: { id: number; role: string } | null;
}

export function CareTasksView({ currentUser }: CareTasksViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CareTask | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('watering');
  const [notes, setNotes] = useState('');
  const [plantId, setPlantId] = useState(NONE);
  const [zoneId, setZoneId] = useState(NONE);
  const [assignedTo, setAssignedTo] = useState(NONE);
  const [dueDate, setDueDate] = useState(todayString());
  const [repeatDays, setRepeatDays] = useState('');

  const loadTasks = async () => {
    try {
      const res = await getCareTasks();
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load care tasks', err);
      toast.error('Failed to load care tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [plantsRes, zonesRes] = await Promise.all([getPlants(), getZones()]);
      setPlants(plantsRes.data);
      setZones(zonesRes.data);
      const usersRes = await listUsers();
      const list = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data ?? [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load task options', err);
    }
  };

  useEffect(() => {
    loadTasks();
    if (isAdmin) loadOptions();
  }, []);

  const openAddDialog = () => {
    setEditingTask(null);
    setTitle('');
    setType('watering');
    setNotes('');
    setPlantId(NONE);
    setZoneId(NONE);
    setAssignedTo(NONE);
    setDueDate(todayString());
    setRepeatDays('');
    setDialogOpen(true);
  };

  const openEditDialog = (task: CareTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setType(task.type);
    setNotes(task.notes || '');
    setPlantId(task.plant_id ? String(task.plant_id) : NONE);
    setZoneId(task.zone_id ? String(task.zone_id) : NONE);
    setAssignedTo(task.assigned_to ? String(task.assigned_to) : NONE);
    setDueDate(task.due_date);
    setRepeatDays(task.repeat_days ? String(task.repeat_days) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!dueDate) {
      toast.error('Due date is required');
      return;
    }
    const payload = {
      title,
      type,
      notes: notes || undefined,
      plant_id: plantId === NONE ? null : Number(plantId),
      zone_id: zoneId === NONE ? null : Number(zoneId),
      assigned_to: assignedTo === NONE ? null : Number(assignedTo),
      due_date: dueDate,
      repeat_days: repeatDays ? Number(repeatDays) : null,
    };
    setSaving(true);
    try {
      if (editingTask) {
        await updateCareTask(editingTask.id, payload);
        toast.success('Task updated');
      } else {
        await createCareTask(payload);
        toast.success('Task created');
      }
      setDialogOpen(false);
      await loadTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (task: CareTask) => {
    try {
      await completeCareTask(task.id);
      toast.success('Task completed');
      await loadTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleDelete = async (task: CareTask) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteCareTask(task.id);
      setTasks(tasks.filter((t) => t.id !== task.id));
      toast.success('Task deleted');
    } catch (err) {
      console.error('Failed to delete task', err);
      toast.error('Failed to delete task');
    }
  };

  const visibleTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'overdue') return t.is_overdue;
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const overdueCount = tasks.filter((t) => t.is_overdue).length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  const typeLabel = (value: string) => taskTypes.find((t) => t.value === value)?.label || value;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Care Tasks</h2>
          <p className="text-muted-foreground">
            {pendingCount} pending {'\u00B7'} {overdueCount} overdue
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === f.value
                ? 'bg-[#22C55E] text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading tasks...</p>
      ) : visibleTasks.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {isAdmin ? 'No tasks here. Add a task to get started.' : 'No tasks assigned to you.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTasks.map((task) => (
            <div key={task.id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs text-[#38BDF8] bg-[#38BDF8]/10">
                  {typeLabel(task.type)}
                </span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditDialog(task)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(task)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-foreground mb-1">{task.title}</h3>
              <p className="text-muted-foreground text-sm mb-1">
                {task.plant || task.zone || 'General'}
                {task.assignee ? ` ${'\u00B7'} ${task.assignee}` : ''}
              </p>
              <p className="text-muted-foreground text-sm mb-3 flex items-center gap-2">
                Due {task.due_date}
                {task.repeat_days ? (
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> every {task.repeat_days}d
                  </span>
                ) : null}
              </p>
              {task.notes && <p className="text-muted-foreground text-sm mb-3">{task.notes}</p>}

              <div className="flex items-center justify-between">
                {task.status === 'completed' ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs text-[#22C55E] bg-[#22C55E]/10">
                    Completed
                  </span>
                ) : task.is_overdue ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs text-[#EF4444] bg-[#EF4444]/10">
                    Overdue
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-xs text-[#F59E0B] bg-[#F59E0B]/10">
                    Pending
                  </span>
                )}
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleComplete(task)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="task-title" className="text-muted-foreground mb-2 block">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Water tomatoes"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Plant (optional)</Label>
              <Select value={plantId} onValueChange={setPlantId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {plants.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Zone (optional)</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Assign to</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due" className="text-muted-foreground mb-2 block">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="task-repeat" className="text-muted-foreground mb-2 block">Repeat every (days, optional)</Label>
              <Input
                id="task-repeat"
                type="number"
                min="1"
                value={repeatDays}
                onChange={(e) => setRepeatDays(e.target.value)}
                placeholder="e.g. 2"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="task-notes" className="text-muted-foreground mb-2 block">Notes (optional)</Label>
              <Input
                id="task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}