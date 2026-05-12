-- CLEANUP (Run this to reset policies if you get 500 errors)
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins have full access to vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins have full access to bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view status updates for their bookings" ON status_updates;
DROP POLICY IF EXISTS "Admins have full access to status_updates" ON status_updates;
DROP POLICY IF EXISTS "Admins have full access to mechanics" ON mechanics;
DROP POLICY IF EXISTS "Users can view mechanics" ON mechanics;
DROP POLICY IF EXISTS "Users can view mechanics for their bookings" ON mechanics;

-- 1. PROFILES TABLE (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  fuel_type TEXT CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
  current_km INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MECHANICS TABLE
CREATE TABLE IF NOT EXISTS mechanics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  rating DECIMAL(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref TEXT DEFAULT 'SRV-' || upper(substring(gen_random_uuid()::text from 1 for 6)),
  user_id UUID REFERENCES auth.users NOT NULL,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  mechanic_id UUID REFERENCES mechanics ON DELETE SET NULL,
  issue_description TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cost_sent', 'assigned', 'picked_up', 'inspection', 'repair', 'testing', 'completed', 'delivered', 'user_cancelled')),
  ai_recommended_service TEXT,
  ai_condition TEXT,
  ai_urgency TEXT,
  estimated_cost_min INTEGER,
  estimated_cost_max INTEGER,
  final_cost INTEGER,
  cost_breakdown JSONB,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TO BECOME ADMIN: Run this with your User ID (found in Auth or Profiles table)
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';

-- 5. STATUS UPDATES TABLE (Neural Feed)
CREATE TABLE IF NOT EXISTS status_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTION TO CHECK IF USER IS ADMIN (Avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES (Simplified for development)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own data
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own vehicles" ON vehicles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bookings" ON bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view status updates for their bookings" ON status_updates FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.user_id = auth.uid())
);

-- Allow admins to see everything
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to vehicles" ON vehicles FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to mechanics" ON mechanics FOR ALL USING (is_admin());
-- Needed for nested selects like bookings(..., mechanics(name)) from the user app
CREATE POLICY "Users can view mechanics for their bookings" ON mechanics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.mechanic_id = mechanics.id
      AND bookings.user_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to bookings" ON bookings FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to status_updates" ON status_updates FOR ALL USING (is_admin());

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
