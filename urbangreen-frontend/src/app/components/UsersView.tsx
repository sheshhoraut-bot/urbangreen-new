import { useState, useEffect } from 'react';
import { Plus, Users as UsersIcon, X, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { listUsers, createUser, updateUserRole, deleteUser, AppUser } from '../../lib/api';

export function UsersView() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [changingRoleId, setChangingRoleId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await listUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddDialog = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('operator');
    setDialogOpen(true);
  };

const handleDelete = async (user: AppUser) => {
    if (!confirm(`Delete ${user.name}'s account? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      setUsers(users.filter((u) => u.id !== user.id));
      toast.success(`${user.name}'s account deleted`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    }
  };

  const handleRoleToggle = async (user: AppUser) => {
    const newRole = user.role === 'admin' ? 'operator' : 'admin';
    if (!confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    setChangingRoleId(user.id);
    try {
      const res = await updateUserRole(user.id, newRole);
      setUsers(users.map((u) => (u.id === user.id ? res.data : u)));
      toast.success(`${user.name} is now ${newRole}`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update role';
      toast.error(message);
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast.error('Please fill all fields (password min 8 characters)');
      return;
    }
    setSaving(true);
    try {
      const res = await createUser({
        name,
        email,
        password,
        password_confirmation: password,
        role,
      });
      setUsers([...users, res.data]);
      toast.success(`${role === 'admin' ? 'Admin' : 'Operator'} account created`);
      setDialogOpen(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">User Management</h2>
          <p className="text-muted-foreground">Create and manage admin and operator accounts</p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-background">
            <tr>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Name</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Email</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Role</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Status</th>
                <th className="text-left text-muted-foreground px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={`border-t border-border/50 ${index % 2 === 0 ? 'bg-card' : 'bg-background/20'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-[#F59E0B]/20' : 'bg-[#22C55E]/20'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-[#F59E0B]" />
                        ) : (
                          <User className="w-4 h-4 text-[#22C55E]" />
                        )}
                      </div>
                      <span className="text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                      user.role === 'admin' ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#22C55E] bg-[#22C55E]/10'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                      user.status === 'active' ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-muted-foreground bg-muted/10'
                    }`}>
                      {user.status}
                    </span>
                  </td>
               <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRoleToggle(user)}
                        disabled={changingRoleId === user.id}
                        className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-[#22C55E] hover:text-white transition-all text-sm disabled:opacity-50"
                      >
                        {changingRoleId === user.id ? 'Updating...' : `Make ${user.role === 'admin' ? 'Operator' : 'Admin'}`}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 bg-muted hover:bg-[#EF4444] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#EF4444] group-hover:text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22C55E]/20 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-[#22C55E]" />
                </div>
                <h3 className="text-foreground text-lg font-semibold">Add User</h3>
              </div>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole('operator')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'operator' ? 'border-[#22C55E] bg-[#22C55E]/10' : 'border-border bg-background'
                    }`}
                  >
                    <User className="w-4 h-4 mb-1 text-[#22C55E]" />
                    <p className="text-foreground text-sm">Operator</p>
                  </button>
                  <button
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'admin' ? 'border-[#F59E0B] bg-[#F59E0B]/10' : 'border-border bg-background'
                    }`}
                  >
                    <Shield className="w-4 h-4 mb-1 text-[#F59E0B]" />
                    <p className="text-foreground text-sm">Admin</p>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDialogOpen(false)} className="flex-1 h-10 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}