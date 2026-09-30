import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Plus, Wrench, Edit3, Trash2, AlertTriangle } from 'lucide-react';

export const CabinsPage = () => {
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCabin, setEditingCabin] = useState(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [status, setStatus] = useState('AVAILABLE');
  const [description, setDescription] = useState('');
  const [amenitiesStr, setAmenitiesStr] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmCabin, setDeleteConfirmCabin] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCabins();
  }, []);

  const fetchCabins = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/cabins');
      setCabins(res.cabins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCabin(null);
    setName('');
    setLocation('');
    setCapacity(10);
    setStatus('AVAILABLE');
    setDescription('');
    setAmenitiesStr('4K Display, Whiteboard, Video Conf');
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCabin(c);
    setName(c.name);
    setLocation(c.location);
    setCapacity(c.capacity);
    setStatus(c.status);
    setDescription(c.description || '');
    setAmenitiesStr(Array.isArray(c.amenities) ? c.amenities.join(', ') : '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const amenities = amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (editingCabin) {
        await apiRequest(`/cabins/${editingCabin.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, location, capacity: parseInt(capacity), status, description, amenities })
        });
      } else {
        await apiRequest('/cabins', {
          method: 'POST',
          body: JSON.stringify({ name, location, capacity: parseInt(capacity), status, description, amenities })
        });
      }

      setModalOpen(false);
      fetchCabins();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async (c) => {
    const nextStatus = c.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await apiRequest(`/cabins/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      fetchCabins();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCabin = async () => {
    if (!deleteConfirmCabin) return;
    setDeleting(true);
    try {
      await apiRequest(`/cabins/${deleteConfirmCabin.id}`, {
        method: 'DELETE'
      });
      setDeleteConfirmCabin(null);
      setModalOpen(false);
      fetchCabins();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Shared Meeting Cabins</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Configure cabin amenities, capacity limits, location details, status mode, or delete cabins.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add New Cabin
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Loading cabins...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {cabins.map(c => (
            <div key={c.id} className="glass-card glass-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0F172A' }}>{c.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.location}</span>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>{c.description}</p>

              <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                <strong>Capacity:</strong> {c.capacity} People
              </div>

              {/* Amenities tags */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '4px' }}>
                {Array.isArray(c.amenities) && c.amenities.map((item, idx) => (
                  <span key={idx} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', color: '#475569', fontWeight: 500 }}>
                    ✦ {item}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditModal(c)}>
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  className={`btn btn-sm ${c.status === 'MAINTENANCE' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => toggleMaintenance(c)}
                >
                  <Wrench size={14} /> {c.status === 'MAINTENANCE' ? 'Set Available' : 'Maint'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteConfirmCabin(c)}
                  title="Delete cabin"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Cabin Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCabin ? `Edit Cabin: ${editingCabin.name}` : 'Add New Shared Cabin'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Cabin Name</label>
            <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cabin Executive" />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Floor</label>
            <input type="text" className="form-input" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Floor 3 - Executive Suite" />
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Capacity</label>
            <input type="number" className="form-input" min="1" max="100" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="MAINTENANCE">MAINTENANCE (Prevents HR booking)</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="High tech conference space..."></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Amenities (Comma separated)</label>
            <input type="text" className="form-input" value={amenitiesStr} onChange={(e) => setAmenitiesStr(e.target.value)} placeholder="4K Display, Zoom Cam, Whiteboard" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <div>
              {editingCabin && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteConfirmCabin(editingCabin)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={14} /> Delete Cabin
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Cabin'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmCabin}
        onClose={() => setDeleteConfirmCabin(null)}
        title={`Confirm Delete Cabin: ${deleteConfirmCabin?.name}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.95rem' }}>Warning: Permanent Action</h4>
              <p style={{ color: '#991B1B', fontSize: '0.85rem', marginTop: '4px', lineHeight: 1.4 }}>
                Are you sure you want to delete <strong style={{ color: '#991B1B' }}>{deleteConfirmCabin?.name}</strong>? Deleting this cabin will cancel all associated bookings and remove it permanently from the system.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirmCabin(null)} disabled={deleting}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteCabin} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Confirm Delete Cabin'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
