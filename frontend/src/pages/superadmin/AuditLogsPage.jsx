import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('30');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, daysFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (daysFilter) params.append('days', daysFilter);
      if (actionFilter) params.append('action', actionFilter);

      const url = `/audit-logs?${params.toString()}`;
      const res = await apiRequest(url);
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.user_name.toLowerCase().includes(q) ||
           l.action.toLowerCase().includes(q) ||
           (l.target_id || '').toLowerCase().includes(q) ||
           (l.new_value || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Facility Audit Trail</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Activity log recording user actions, booking status transitions, cabin updates, and system configuration edits. Records older than 30 days are automatically deleted.
        </p>
      </div>

      {/* Filter Header */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by user, action type, target ID, or diff text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: '170px' }} value={daysFilter} onChange={(e) => setDaysFilter(e.target.value)}>
          <option value="30">Last 30 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="60">Last 60 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>

        <select className="form-select" style={{ width: '200px' }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Action Types</option>
          <option value="BOOKING_SUBMITTED">BOOKING_SUBMITTED</option>
          <option value="BOOKING_APPROVED">BOOKING_APPROVED</option>
          <option value="BOOKING_REJECTED">BOOKING_REJECTED</option>
          <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
          <option value="COMPANY_CREATED">COMPANY_CREATED</option>
          <option value="COMPANY_UPDATED">COMPANY_UPDATED</option>
          <option value="RULES_UPDATED">RULES_UPDATED</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Loading audit trail records...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>No audit records match the query.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target Type</th>
                <th>Target ID</th>
                <th>IP Address</th>
                <th>Diff Payload</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{l.user_name}</td>
                  <td>
                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                      {l.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#2563EB' }}>{l.action}</td>
                  <td>{l.target_type}</td>
                  <td style={{ fontWeight: 600 }}>{l.target_id || '-'}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B' }}>{l.ip_address}</td>
                  <td style={{ fontSize: '0.75rem', color: '#334155', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.new_value}>
                    {l.new_value || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
