import React, { useState, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '../../api';
import { Download, Building2, DoorClosed } from 'lucide-react';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/reports/summary');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE_URL}/reports/export-csv`, '_blank');
  };

  if (loading) {
    return <p style={{ color: '#64748B', textAlign: 'center', padding: '3rem' }}>Loading analytics reports...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Facility Utilization & Reports</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Analytics on cabin usage, company activity, status breakdown, and exportable reports.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={18} /> Download CSV Report
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Total Facility Bookings</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#0F172A', marginTop: '0.25rem' }}>
            {data?.metrics?.totalBookings || 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Active Shared Companies</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#2563EB', marginTop: '0.25rem' }}>
            {data?.metrics?.totalCompanies || 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Total Shared Cabins</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#6B21A8', marginTop: '0.25rem' }}>
            {data?.metrics?.totalCabins || 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Confirmed Today</div>
          <div className="hero-counter" style={{ fontSize: '2.2rem', color: '#166534', marginTop: '0.25rem' }}>
            {data?.metrics?.confirmedToday || 0}
          </div>
        </div>
      </div>

      {/* Grid of Analytical Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Bookings by Cabin Usage */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DoorClosed size={20} color="#2563EB" /> Most Frequently Used Cabins
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data?.cabinStats?.map((c, i) => {
              const max = Math.max(...data.cabinStats.map(x => x.booking_count || 1), 1);
              const pct = Math.round(((c.booking_count || 0) / max) * 100);

              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{c.cabin_name}</span>
                    <span style={{ color: '#64748B' }}>{c.booking_count} Bookings</span>
                  </div>
                  <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#2563EB', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Companies by Booking Volume */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="#166534" /> Top Companies by Booking Volume
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data?.companyStats?.map((comp, i) => {
              const max = Math.max(...data.companyStats.map(x => x.booking_count || 1), 1);
              const pct = Math.round(((comp.booking_count || 0) / max) * 100);

              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500, color: '#0F172A' }}>{comp.company_name}</span>
                    <span style={{ color: '#64748B' }}>{comp.booking_count} Bookings</span>
                  </div>
                  <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#166534', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Breakdown Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>
          Booking Status Distribution
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {data?.statusStats?.map((s, i) => (
            <div key={i} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{s.status}</span>
              <div className="hero-counter" style={{ fontSize: '1.75rem', color: '#0F172A', marginTop: '4px' }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
