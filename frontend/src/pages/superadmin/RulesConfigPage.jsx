import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import { CheckCircle2, Save } from 'lucide-react';

export const RulesConfigPage = () => {
  const [_rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [minDuration, setMinDuration] = useState(30);
  const [maxDuration, setMaxDuration] = useState(120);
  const [stepMinutes, setStepMinutes] = useState(30);
  const [allowAutoApproval, setAllowAutoApproval] = useState(0);
  const [cancellationCutoff, setCancellationCutoff] = useState(30);
  const [officeStart, setOfficeStart] = useState('09:00');
  const [officeEnd, setOfficeEnd] = useState('18:00');
  const [operatingDays, setOperatingDays] = useState('Mon,Tue,Wed,Thu,Fri');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/rules');
      if (res.rules) {
        setRules(res.rules);
        setMinDuration(res.rules.min_duration_minutes);
        setMaxDuration(res.rules.max_duration_minutes);
        setStepMinutes(res.rules.step_minutes);
        setAllowAutoApproval(res.rules.allow_auto_approval);
        setCancellationCutoff(res.rules.cancellation_cutoff_minutes);
        setOfficeStart(res.rules.office_start_time);
        setOfficeEnd(res.rules.office_end_time);
        setOperatingDays(res.rules.operating_days);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = {
        min_duration_minutes: parseInt(minDuration),
        max_duration_minutes: parseInt(maxDuration),
        step_minutes: parseInt(stepMinutes),
        allow_auto_approval: parseInt(allowAutoApproval),
        cancellation_cutoff_minutes: parseInt(cancellationCutoff),
        office_start_time: officeStart,
        office_end_time: officeEnd,
        operating_days: operatingDays
      };

      await apiRequest('/rules', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setSuccessMsg('Booking rules and office hours updated successfully!');
      fetchRules();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: '#64748B', textAlign: 'center', padding: '3rem' }}>Loading system rules configuration...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Configurable Booking Rules & Office Hours</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Super Admin dynamic system settings governing cabin booking duration, cancellation policy, and operating hours.
        </p>
      </div>

      {successMsg && (
        <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#166534', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Duration Rules */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            ⏱ Duration & Time Slot Constraints
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Minimum Booking Duration (Minutes)</label>
              <select className="form-select" value={minDuration} onChange={(e) => setMinDuration(e.target.value)}>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes (1 Hour)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Booking Duration (Minutes)</label>
              <select className="form-select" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)}>
                <option value="60">60 Minutes (1 Hour)</option>
                <option value="120">120 Minutes (2 Hours)</option>
                <option value="180">180 Minutes (3 Hours)</option>
                <option value="240">240 Minutes (4 Hours)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Time Step Increments</label>
              <select className="form-select" value={stepMinutes} onChange={(e) => setStepMinutes(e.target.value)}>
                <option value="15">15 Minute Intervals</option>
                <option value="30">30 Minute Intervals</option>
                <option value="60">60 Minute Intervals</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cancellation Cutoff Window (Minutes before start)</label>
              <input type="number" className="form-input" value={cancellationCutoff} onChange={(e) => setCancellationCutoff(e.target.value)} min="0" />
            </div>
          </div>
        </div>

        {/* Section 2: Office Operating Hours */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            🏢 Facility Office Hours & Operating Days
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Office Start Time</label>
              <input type="time" className="form-input" value={officeStart} onChange={(e) => setOfficeStart(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Office End Time</label>
              <input type="time" className="form-input" value={officeEnd} onChange={(e) => setOfficeEnd(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Operating Days</label>
            <input type="text" className="form-input" value={operatingDays} onChange={(e) => setOperatingDays(e.target.value)} placeholder="Mon,Tue,Wed,Thu,Fri" />
          </div>
        </div>

        {/* Section 3: Approval Mode */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            🛡️ Central Admin Approval Workflow Mode
          </h3>

          <div className="form-group">
            <label className="form-label">Auto-Approval Policy Setting</label>
            <select className="form-select" value={allowAutoApproval} onChange={(e) => setAllowAutoApproval(e.target.value)}>
              <option value="0">DISABLED (Default: Central Admin Team MUST manually approve every request)</option>
              <option value="1">ENABLED (Auto-confirm requests if no conflict exists)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} disabled={saving}>
            <Save size={18} /> {saving ? 'Saving Settings...' : 'Save System Rules'}
          </button>
        </div>
      </form>
    </div>
  );
};
