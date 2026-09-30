import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { Modal } from '../../components/Modal';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Users as UsersIcon,
  Mail,
  Send
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('COMPANY_HR');
  const [companyId, setCompanyId] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [roleFilter]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/users';
      if (roleFilter) url += `?role=${roleFilter}`;
      const res = await apiRequest(url);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await apiRequest('/companies');
      setCompanies(res.companies || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('COMPANY_HR');
    setCompanyId(companies[0]?.id || '');
    setStatus('PENDING');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setCompanyId(u.company_id || '');
    setStatus(u.status);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingUser) {
        const payload = {
          name,
          email,
          password: password || undefined,
          role,
          company_id: role === 'COMPANY_HR' ? (companyId ? parseInt(companyId) : null) : null,
          status
        };
        await apiRequest(`/users/${editingUser.id}`, 'PUT', payload);
        showToast(`User '${name}' updated successfully.`);
      } else {
        const res = await apiRequest('/users', 'POST', {
          name,
          email,
          role,
          company_id: role === 'COMPANY_HR' ? (companyId ? parseInt(companyId) : null) : null
        });
        showToast(res.message || `User '${name}' created and invitation email sent to ${email}`);
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user account.');
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvitation = async (userToResend) => {
    try {
      const res = await apiRequest(`/users/${userToResend.id}/resend-invitation`, 'POST');
      showToast(res.message || `Invitation email resent to ${userToResend.email}`);
    } catch (err) {
      showToast(err.message || 'Failed to resend invitation email.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await apiRequest(`/users/${deletingUser.id}`, 'DELETE');
      showToast(`User account '${deletingUser.name}' deleted successfully.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.company_name || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Feedback */}
      {toast && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${toast.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
          color: toast.type === 'error' ? '#991B1B' : '#166534',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            System User Accounts
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '2px' }}>
            Super Admin creation and access control management of Super Admins, Central Admins, and Company HR users.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={18} /> Create New User
        </Button>
      </div>

      {/* Filter Header */}
      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by user name, login email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="form-select" style={{ width: '200px' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
            <option value="CENTRAL_ADMIN">CENTRAL CABIN ADMIN</option>
            <option value="COMPANY_HR">COMPANY HR</option>
          </select>
        </div>
      </Card>

      {/* Main Table */}
      <Card title={`System User Accounts (${filtered.length})`}>
        {loading ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton style={{ height: '45px' }} />
            <Skeleton style={{ height: '45px' }} />
            <Skeleton style={{ height: '45px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No Users Found"
            description="No user accounts match your search filters."
            actionLabel="Create User Account"
            onAction={openCreateModal}
          />
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -1.25rem -1.25rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Login Email</th>
                  <th>Role</th>
                  <th>Associated Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                        #USR-{String(u.id).padStart(3, '0')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{u.name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600 }}>{u.email}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.role === 'SUPER_ADMIN' ? '#F3E8FF' : u.role === 'CENTRAL_ADMIN' ? '#EFF6FF' : '#DCFCE7',
                        color: u.role === 'SUPER_ADMIN' ? '#6B21A8' : u.role === 'CENTRAL_ADMIN' ? '#1E40AF' : '#166534',
                        border: `1px solid ${u.role === 'SUPER_ADMIN' ? '#E9D5FF' : u.role === 'CENTRAL_ADMIN' ? '#BFDBFE' : '#BBF7D0'}`
                      }}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
                        {u.company_name || 'Central Facility Team'}
                      </span>
                    </td>
                    <td>
                      {u.status === 'PENDING' ? (
                        <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                          PENDING INVITATION
                        </span>
                      ) : u.status === 'ACTIVE' ? (
                        <span className="badge badge-confirmed">ACTIVE</span>
                      ) : (
                        <span className="badge badge-rejected">DISABLED</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {u.status === 'PENDING' && (
                          <Button variant="outline" size="sm" onClick={() => handleResendInvitation(u)} title="Resend Account Activation Email">
                            <Send size={13} /> Resend Invite
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openEditModal(u)}>
                          <Edit3 size={13} /> Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeletingUser(u)}>
                          <Trash2 size={13} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit User Account: ${editingUser.name}` : 'Invite New User Account'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ color: '#991B1B', fontSize: '0.85rem', background: '#FEE2E2', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Irfan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Login Email Address *</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="irfan@company.com"
            />
          </div>

          {!editingUser ? (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#1E40AF', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <Mail size={20} style={{ marginTop: '2px', flexShrink: 0, color: '#2563EB' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Email Activation Invitation</strong>
                An activation link will be automatically sent to <strong>{email || 'the specified email'}</strong>. The user will click the link and set their own secure password to activate their account.
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">
                New Password (Leave blank to keep existing)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem'
                  }}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">System Role *</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="COMPANY_HR">COMPANY HR (Tenant Cabin Booking Manager)</option>
              <option value="CENTRAL_ADMIN">CENTRAL CABIN ADMIN (Approval Operations)</option>
              <option value="SUPER_ADMIN">SUPER ADMIN (Full System Control)</option>
            </select>
          </div>

          {role === 'COMPANY_HR' && (
            <div className="form-group">
              <label className="form-label">Associated Tenant Company *</label>
              <select
                className="form-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value="">-- Select Tenant Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Account Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">ACTIVE (Authorized to log in)</option>
              <option value="INACTIVE">INACTIVE (Blocked from login)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} isDisabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingUser ? 'Save User Changes' : 'Create User Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL FOR USER */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title={`Confirm Delete User: ${deletingUser?.name}`}
      >
        {deletingUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1rem', marginBottom: '0.35rem' }}>
                <ShieldAlert size={22} color="#991B1B" />
                <span>Confirm User Deletion</span>
              </div>
              <p>
                Are you sure you want to permanently delete user account <strong>{deletingUser.name}</strong> ({deletingUser.email})?
              </p>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                <li>Role: <strong>{deletingUser.role}</strong></li>
                <li>Company: <strong>{deletingUser.company_name || 'Central Facility'}</strong></li>
                <li>This user will immediately lose login access.</li>
                <li>This action <strong>cannot be undone</strong>.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setDeletingUser(null)} isDisabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} isLoading={deleteLoading}>
                Yes, Delete User Account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

