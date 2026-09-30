import React, { useState, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Download } from 'lucide-react';

export const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [cabins, setCabins] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [cabinFilter, setCabinFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchData();
  }, [cabinFilter, companyFilter, statusFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/bookings?';
      if (cabinFilter) url += `cabin_id=${cabinFilter}&`;
      if (companyFilter) url += `company_id=${companyFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (dateFilter) url += `date=${dateFilter}&`;

      const res = await apiRequest(url);
      setBookings(res.bookings || []);

      const cabinRes = await apiRequest('/cabins');
      setCabins(cabinRes.cabins || []);

      const compRes = await apiRequest('/companies');
      setCompanies(compRes.companies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE_URL}/reports/export-csv`, '_blank');
  };

  const filteredBookings = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.booking_code || '').toLowerCase().includes(q) ||
           (b.company_name || '').toLowerCase().includes(q) ||
           (b.user_name || '').toLowerCase().includes(q) ||
           (b.purpose || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Facility Bookings Database</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Search, filter, and audit all company booking records across the facility.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={18} /> Export CSV Report
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Search Query</label>
          <input
            type="text"
            className="form-input"
            placeholder="Search Code, HR, Company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Cabin Filter</label>
          <select className="form-select" value={cabinFilter} onChange={(e) => setCabinFilter(e.target.value)}>
            <option value="">All Cabins</option>
            {cabins.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Company Filter</label>
          <select className="form-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Status Filter</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Date Filter</label>
          <input type="date" className="form-input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Loading database...</p>
        ) : filteredBookings.length === 0 ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>No bookings found matching filters.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Company</th>
                <th>Cabin</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Purpose</th>
                <th>HR Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{b.booking_code}</td>
                  <td style={{ color: '#2563EB', fontWeight: 600 }}>{b.company_name}</td>
                  <td>{b.cabin_name}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.start_time} - {b.end_time}</td>
                  <td>{b.purpose}</td>
                  <td>{b.user_name}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBooking(b)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={`Booking Code: ${selectedBooking?.booking_code}`}>
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={selectedBooking.status} />
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Submitted: {new Date(selectedBooking.created_at).toLocaleString()}</span>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Company:</span>
                  <strong style={{ color: '#2563EB', fontWeight: 600 }}>{selectedBooking.company_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>HR User:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.user_name} ({selectedBooking.user_email})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Cabin:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.cabin_name} ({selectedBooking.cabin_location})</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Time Slot:</span>
                  <strong style={{ color: '#0F172A', fontWeight: 600 }}>{selectedBooking.booking_date} ({selectedBooking.start_time} - {selectedBooking.end_time})</strong>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Meeting Purpose:</span>
                <p style={{ color: '#0F172A', fontWeight: 500 }}>{selectedBooking.purpose}</p>
              </div>

              {selectedBooking.notes && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Notes:</span>
                  <p style={{ color: '#334155', fontSize: '0.8rem' }}>{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.internal_notes && (
                <div style={{ marginTop: '0.75rem', background: '#EFF6FF', padding: '0.65rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <span style={{ color: '#1E40AF', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>Internal Admin Note:</span>
                  <p style={{ color: '#0F172A', fontSize: '0.8rem' }}>{selectedBooking.internal_notes}</p>
                </div>
              )}

              {selectedBooking.rejection_reason && (
                <div style={{ marginTop: '0.75rem', background: '#FEE2E2', padding: '0.65rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <span style={{ color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>Rejection Reason:</span>
                  <p style={{ color: '#991B1B', fontSize: '0.8rem' }}>{selectedBooking.rejection_reason}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
