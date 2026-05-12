import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgdxihhxgdswklilhwte.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZHhpaGh4Z2Rzd2tsaWxod3RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM5MTM1MiwiZXhwIjoyMDkzOTY3MzUyfQ.CaJ-1FMNL2sBdrk2_ghcA239N20Pzj7u6Q3apCBaUIU'
);

async function fixRLS() {
  console.log('=== Testing service_role access ===\n');

  // 1. Test read from profiles
  const { data: profiles, error: readErr } = await supabase
    .from('profiles')
    .select('*');
  
  if (readErr) {
    console.error('Read profiles error:', readErr.message);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => console.log(`  - ${p.email} (${p.role})`));
  }

  // 2. Test update profile to admin  
  const adminProfile = profiles?.find(p => p.email === 'admin_user_01@example.com');
  if (adminProfile) {
    console.log('\nPromoting admin_user_01 to admin role...');
    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminProfile.id)
      .select()
      .single();
    
    if (updateErr) {
      console.error('Update error:', updateErr.message, updateErr.details, updateErr.hint);
    } else {
      console.log('Updated role:', updated.role);
    }
  }

  // 3. Test vehicles table access
  const { data: vehicles, error: vehErr } = await supabase
    .from('vehicles')
    .select('*');
  
  if (vehErr) {
    console.error('\nVehicles read error:', vehErr.message);
  } else {
    console.log(`\nVehicles in DB: ${vehicles.length}`);
  }

  // 4. Test service_requests table
  const { data: services, error: svcErr } = await supabase
    .from('service_requests')
    .select('*');
  
  if (svcErr) {
    console.error('Service requests read error:', svcErr.message);
  } else {
    console.log(`Service requests in DB: ${services.length}`);
  }

  // 5. Test mechanics table
  const { data: mechanics, error: mechErr } = await supabase
    .from('mechanics')
    .select('*');
  
  if (mechErr) {
    console.error('Mechanics read error:', mechErr.message);
  } else {
    console.log(`Mechanics in DB: ${mechanics.length}`);
  }

  // 6. Now test the full login flow with the token
  console.log('\n=== Testing full auth flow ===\n');
  
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_user_01@example.com', password: 'test123456' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  
  if (loginData.token) {
    console.log('Token received ✓');
    console.log('User role:', loginData.role);
    
    // Test /api/auth/me
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const meData = await meRes.json();
    console.log('/api/auth/me status:', meRes.status, '- name:', meData.name);

    // Test vehicle add
    const vehAddRes = await fetch('http://localhost:5000/api/vehicles', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}` 
      },
      body: JSON.stringify({ nickname: 'TestCar', brand: 'Honda', model: 'Civic', year: 2024, number: 'KA-TEST-9999', fuelType: 'Petrol', currentKm: 5000 })
    });
    const vehAddData = await vehAddRes.json();
    console.log('Vehicle add status:', vehAddRes.status);
    if (vehAddRes.status === 201) {
      console.log('Vehicle added:', vehAddData.nickname, '✓');
    } else {
      console.log('Vehicle add error:', vehAddData.message);
    }

    // Test get vehicles
    const vehGetRes = await fetch('http://localhost:5000/api/vehicles', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const vehGetData = await vehGetRes.json();
    console.log('Get vehicles status:', vehGetRes.status, '- count:', vehGetData.length);
  } else {
    console.log('Login failed:', loginData.message);
  }

  // Admin login test
  console.log('\n=== Testing admin flow ===\n');
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin_user_01@example.com', password: 'admin123456', adminKey: 'SERVICEPOINT_ADMIN_2024' })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log('Admin login status:', adminLoginRes.status);
  console.log('Admin role:', adminLoginData.role);
  if (adminLoginData.message) console.log('Admin error:', adminLoginData.message, adminLoginData.error);

  console.log('\n=== Done ===');
}

fixRLS().catch(e => console.error('Script error:', e.message));
