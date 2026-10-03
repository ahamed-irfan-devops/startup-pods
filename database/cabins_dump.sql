-- PostgreSQL Dump: Configured Cabins & Booking Rules

-- 1. Insert/Update Booking Rules
INSERT INTO booking_rules (id, min_duration_minutes, max_duration_minutes, step_minutes, allow_auto_approval, cancellation_cutoff_minutes, office_start_time, office_end_time, operating_days)
VALUES (1, 30, 120, 30, 0, 30, '09:00', '18:00', 'Mon,Tue,Wed,Thu,Fri,Sat')
ON CONFLICT (id) DO UPDATE SET operating_days = EXCLUDED.operating_days;

-- 2. Insert/Update Cabins
INSERT INTO cabins (name, location, capacity, status, description, amenities, image_url)
VALUES 
  ('DUBAI', 'Floor 3', 12, 'AVAILABLE', 'High-level executive meeting room .', '["Whiteboard","Air Conditioning"]', NULL),
  ('PARIS', 'Floor 3', 6, 'AVAILABLE', 'Meeting Room', '["Whiteboard","Air Conditioning"]', NULL),
  ('Training Room 1', 'Floor 3', 20, 'AVAILABLE', 'Large capacity space for company presentations and key meetings.', '["Projector","Smart Tv","Whiteboard","Air Conditioning"]', NULL),
  ('Training Room 2', 'Floor 3', 35, 'AVAILABLE', 'High Tech Conference Space ', '["Whiteboard","Air Conditioning","Projector"]', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (name) DO UPDATE SET
  location = EXCLUDED.location,
  capacity = EXCLUDED.capacity,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  image_url = EXCLUDED.image_url;
