import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { Modal } from '../../components/Modal';
import { 
  Plus, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Mail, 
  Phone, 
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Company fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Combined Initial HR User fields
  const [createHR, setCreateHR] = useState(true);
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('password123');

  // Modal & Delete Confirmation states
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [addHRCompany, setAddHRCompany] = useState(null);
  const [newHRName, setNewHRName] = useState('');
  const [newHREmail, setNewHREmail] = useState('');
  const [newHRPassword, setNewHRPassword] = useState('password123');
  const [addingHR, setAddingHR] = useState(false);
  const [addHRError, setAddHRError] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      let url = '/companies';
      if (statusFilter) url += `?status=${statusFilter}`;
      const res = await apiRequest(url);
      setCompanies(res.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setName('');
    setEmail('');
    setPhone('');
    setStatus('ACTIVE');
    setCreateHR(true);
    setHrName('');
    setHrEmail('');
    setHrPassword('password123');
    setError('');
    setModalOpen(true);
  };

  const handleCompanyNameChange = (val) => {
    setName(val);
    if (!editingCompany && val) {
      setHrName(`${val} HR Manager`);
    }
  };

  const handleCompanyEmailChange = (val) => {
    setEmail(val);
    if (!editingCompany && val) {
      setHrEmail(val);
    }
  };

  const openEditModal = (comp) => {
    setEditingCompany(comp);
    setName(comp.name);
    setEmail(comp.email);
    setPhone(comp.phone || '');
    setStatus(comp.status);
    setCreateHR(false);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingCompany) {
        await apiRequest(`/companies/${editingCompany.id}`, 'PUT', { name, email, phone, status });
        showToast(`Company '${name}' updated successfully.`);
      } else {
        const payload = {
          name,
          email,
          phone,
          status,
          create_hr: createHR,
          hr_name: hrName || `${name} HR Manager`,
          hr_email: hrEmail || email,
          hr_password: hrPassword || 'password123'
        };

        const res = await apiRequest('/companies', 'POST', payload);
        showToast(res.message || 'Company and active HR user account created successfully!');
      }

      setModalOpen(false);
      fetchCompanies();
    } catch (err) {
      setError(err.message || 'Failed to save company.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (comp) => {
    const nextStatus = comp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiRequest(`/companies/${comp.id}`, 'PUT', { status: nextStatus });
      showToast(`Company '${comp.name}' set to ${nextStatus}.`);
      fetchCompanies();
    } catch (err) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    setDeleteLoading(true);
    try {
      await apiRequest(`/companies/${deletingCompany.id}`, 'DELETE');
      showToast(`Company '${deletingCompany.name}' and all associated user accounts deleted successfully.`);
      setDeletingCompany(null);
      fetchCompanies();
    } catch (err) {
      showToast(err.message || 'Failed to delete company.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddHRModal = (comp) => {
    setAddHRCompany(comp);
    setNewHRName(`${comp.name} HR Manager`);
    setNewHREmail(comp.email);
    setNewHRPassword('password123');
    setAddHRError('');
  };

  const handleCreateHRForCompany = async (e) => {
    e.preventDefault();
    if (!addHRCompany) return;
    setAddHRError('');
    setAddingHR(true);

    try {
      const res = await apiRequest('/users', 'POST', {
        name: newHRName || `${addHRCompany.name} HR Manager`,
        email: newHREmail || addHRCompany.email,
        password: newHRPassword || 'password123',
        role: 'COMPANY_HR',
        company_id: addHRCompany.id
      });

      showToast(res.message || `HR User Account created successfully!`);
      setAddHRCompany(null);
      fetchCompanies();
    } catch (err) {
      setAddHRError(err.message || 'Failed to create HR account.');
    } finally {
      setAddingHR(false);
    }
  };

  const filtered = companies.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
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
            Tenant Companies Directory
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '2px' }}>
            Manage facility tenant companies, monitor HR accounts, and onboard new organizations.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={18} /> Add New Company
        </Button>
      </div>

      {/* Filter Header Bar */}
      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search company by name or official email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="form-select" style={{ width: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Companies</option>
            <option value="ACTIVE">ACTIVE ONLY</option>
            <option value="INACTIVE">INACTIVE ONLY</option>
          </select>
        </div>
      </Card>

      {/* Main Companies Table */}
      <Card title={`Registered Organizations (${filtered.length})`}>
        {loading ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton style={{ height: '45px' }} />
            <Skeleton style={{ height: '45px' }} />
            <Skeleton style={{ height: '45px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Companies Found"
            description="No tenant companies match your search criteria."
            actionLabel="Add New Company"
            onAction={openCreateModal}
          />
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -1.25rem -1.25rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company ID</th>
                  <th>Company Name</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>HR Accounts</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const hasZeroHR = (c.hr_count || 0) === 0;

                  return (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                          #COMP-{String(c.id).padStart(3, '0')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.9rem' }}>{c.name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#334155' }}>
                          <Mail size={13} color="#64748B" /> {c.email}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#64748B' }}>
                          <Phone size={13} color="#94A3B8" /> {c.phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {hasZeroHR ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #FCA5A5' }}>
                            ⚠️ 0 HR Accounts
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>
                            {c.hr_count} HR Account(s)
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                          {c.total_bookings || 0} Bookings
                        </span>
                      </td>
                      <td>
                        {c.status === 'ACTIVE' ? (
                          <span className="badge badge-confirmed">ACTIVE</span>
                        ) : (
                          <span className="badge badge-rejected">INACTIVE</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(c)}>
                            <Edit3 size={13} /> Edit
                          </Button>

                          <Button 
                            variant={hasZeroHR ? 'primary' : 'secondary'} 
                            size="sm" 
                            style={!hasZeroHR ? { color: '#2563EB', borderColor: '#BFDBFE', background: '#EFF6FF' } : {}}
                            onClick={() => openAddHRModal(c)}
                          >
                            <UserPlus size={13} /> + HR User
                          </Button>

                          <Button
                            variant={c.status === 'ACTIVE' ? 'ghost' : 'success'}
                            size="sm"
                            onClick={() => handleToggleStatus(c)}
                          >
                            {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeletingCompany(c)}
                            title="Delete Company"
                          >
                            <Trash2 size={13} /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Company Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCompany ? `Edit Company: ${editingCompany.name}` : 'Add New Company & HR Account'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ color: '#991B1B', fontSize: '0.85rem', background: '#FEE2E2', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}

          {/* Section 1: Company Profile */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.35rem', marginBottom: '1rem' }}>
              1. Organization Profile
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={name}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  placeholder="e.g. Acme Innovations Ltd"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Contact Email *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={email}
                  onChange={(e) => handleCompanyEmailChange(e.target.value)}
                  placeholder="contact@acme.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ACTIVE">ACTIVE (Can book cabins)</option>
                  <option value="INACTIVE">INACTIVE (Disables HR login & booking access)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Combined Initial HR Account (For New Companies) */}
          {!editingCompany && (
            <div style={{ background: '#F8FAFC', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '0.85rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={18} /> 2. Initial Company HR Admin Account
                </span>
                <label style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={createHR} onChange={(e) => setCreateHR(e.target.checked)} />
                  Create HR User Account
                </label>
              </div>

              {createHR && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">HR Manager Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required={createHR}
                      value={hrName}
                      onChange={(e) => setHrName(e.target.value)}
                      placeholder="e.g. Irfan"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">HR Login Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      required={createHR}
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      placeholder="irfan@company.com"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">HR Initial Password *</label>
                    <input
                      type="text"
                      className="form-input"
                      required={createHR}
                      value={hrPassword}
                      onChange={(e) => setHrPassword(e.target.value)}
                      placeholder="password123"
                    />
                  </div>

                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '0.75rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>HR account will be created as <strong>ACTIVE</strong> immediately. No email required!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} isDisabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingCompany ? 'Save Company Changes' : 'Create Company & HR Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL FOR COMPANY */}
      <Modal
        isOpen={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        title={`Confirm Delete Company: ${deletingCompany?.name}`}
      >
        {deletingCompany && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1rem', marginBottom: '0.35rem' }}>
                <ShieldAlert size={22} color="#991B1B" />
                <span>Permanent Deletion Warning</span>
              </div>
              <p>
                Are you sure you want to permanently delete <strong>{deletingCompany.name}</strong>?
              </p>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                <li>This will delete <strong>{deletingCompany.name}</strong> from the database.</li>
                <li>All <strong>{deletingCompany.hr_count || 0} HR User Account(s)</strong> belonging to this company will be deleted.</li>
                <li>All <strong>{deletingCompany.total_bookings || 0} booking records</strong> will be purged.</li>
                <li>This action <strong>cannot be undone</strong>.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setDeletingCompany(null)} isDisabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} isLoading={deleteLoading}>
                Yes, Delete Company & HR Accounts
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add HR Modal for Existing Company */}
      <Modal
        isOpen={!!addHRCompany}
        onClose={() => setAddHRCompany(null)}
        title={`Create HR Account for ${addHRCompany?.name}`}
      >
        <form onSubmit={handleCreateHRForCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {addHRError && (
            <div style={{ color: '#991B1B', fontSize: '0.85rem', background: '#FEE2E2', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              {addHRError}
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: '#475569' }}>
            Create a new Company HR User account authorized to book meeting cabins on behalf of <strong style={{ color: '#0F172A' }}>{addHRCompany?.name}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">HR Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={newHRName}
              onChange={(e) => setNewHRName(e.target.value)}
              placeholder="e.g. Irfan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">HR Login Email *</label>
            <input
              type="email"
              className="form-input"
              required
              value={newHREmail}
              onChange={(e) => setNewHREmail(e.target.value)}
              placeholder="irfan@company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">HR Login Password *</label>
            <input
              type="text"
              className="form-input"
              required
              value={newHRPassword}
              onChange={(e) => setNewHRPassword(e.target.value)}
              placeholder="password123"
            />
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '0.75rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#16A34A" />
            <span>HR account will be created as <strong>ACTIVE</strong> immediately.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setAddHRCompany(null)} isDisabled={addingHR}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addingHR}>
              Create HR User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

