import { useState, useEffect } from 'react';
import { Plus, Users as UsersIcon, X, Shield, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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

  // Shared pieces so the table (desktop) and cards (mobile) stay in sync
  const Avatar = ({ user }: { user: AppUser }) => (
    <div
      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
        user.role === 'admin' ? 'bg-[#F59E0B]/20' : 'bg-[#22C55E]/20'
      }`}
    >
      {user.role === 'admin' ? (
        <Shield className="w-4 h-4 text-[#F59E0B]" />
      ) : (
        <User className="w-4 h-4 text-[#22C55E]" />
      )}
    </div>
  );

  const RoleBadge = ({ user }: { user: AppUser }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs capitalize ${
        user.role === 'admin' ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#22C55E] bg-[#22C55E]/10'
      }`}
    >
      {user.role}
    </span>
  );

  const StatusBadge = ({ user }: { user: AppUser }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs capitalize ${
        user.status === 'active' ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-muted-foreground bg-muted/10'
      }`}
    >
      {user.status}
    </span>
  );

  const Actions = ({ user, fullWidth = false }: { user: AppUser; fullWidth?: boolean }) => (
    <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
      <button
        onClick={() => handleRoleToggle(user)}
        disabled={changingRoleId === user.id}
        className={`px-3 py-2 md:py-1.5 bg-muted text-foreground rounded-lg hover:bg-[#22C55E] hover:text-white transition-all text-sm disabled:opacity-50 ${
          fullWidth ? 'flex-1' : ''
        }`}
      >
        {changingRoleId === user.id ? 'Updating...' : `Make ${user.role === 'admin' ? 'Operator' : 'Admin'}`}
      </button>
      <button
        onClick={() => handleDelete(user)}
        aria-label={`Delete ${user.name}`}
        className="group p-2 bg-muted hover:bg-[#EF4444] rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4 text-[#EF4444] group-hover:text-white" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground mb-1 sm:mb-2">User Management</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create and manage admin and operator accounts
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden max-h-[calc(100dvh-16rem)] overflow-y-auto overscroll-contain pb-4">
            {users.map((user) => (
              <div key={user.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={user} />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate">{user.name}</p>
                    <p className="text-muted-foreground text-sm truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge user={user} />
                  <StatusBadge user={user} />
                </div>
                <Actions user={user} fullWidth />
              </div>
            ))}
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border overflow-x-auto">
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
                  <tr
                    key={user.id}
                    className={`border-t border-border/50 ${index % 2 === 0 ? 'bg-card' : 'bg-background/20'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <span className="text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <RoleBadge user={user} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge user={user} />
                    </td>
                    <td className="px-6 py-4">
                      <Actions user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add User dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22C55E]/20 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-[#22C55E]" />
                </div>
                <h3 className="text-foreground text-lg font-semibold">Add User</h3>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
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
              <div className="flex gap-3 pt-2 pb-2 sm:pb-0">
                <button
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-11 sm:h-10 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-11 sm:h-10 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
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
