import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgdxihhxgdswklilhwte.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZHhpaGh4Z2Rzd2tsaWxod3RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM5MTM1MiwiZXhwIjoyMDkzOTY3MzUyfQ.CaJ-1FMNL2sBdrk2_ghcA239N20Pzj7u6Q3apCBaUIU'
);

async function getColumns() {
  // Insert a test vehicle to discover column names from the successful insert
  const testUserId = 'a0f3aa3a-b9ef-42ee-aaec-992d143f9141'; // test_user_01

  // Try common column name patterns
  const testPayloads = [
    { user_id: testUserId, nickname: 'probe', brand: 'TestBrand', model: 'TestModel', year: 2024, number: 'PROBE-001', fuel_type: 'Petrol', current_km: 100 },
  ];

  for (const payload of testPayloads) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.log('Insert with snake_case failed:', error.message);
      
      // Try camelCase
      const { data: d2, error: e2 } = await supabase
        .from('vehicles')
        .insert({ user_id: testUserId, nickname: 'probe', brand: 'TestBrand', model: 'TestModel', year: 2024, number: 'PROBE-001', fuelType: 'Petrol', currentKm: 100 })
        .select()
        .single();
      
      if (e2) {
        console.log('Insert with camelCase also failed:', e2.message);
      } else {
        console.log('CamelCase worked! Columns:', Object.keys(d2).join(', '));
        // Clean up
        await supabase.from('vehicles').delete().eq('id', d2.id);
      }
    } else {
      console.log('Snake_case worked! Columns:', Object.keys(data).join(', '));
      // Clean up
      await supabase.from('vehicles').delete().eq('id', data.id);
    }
  }

  // Also check service_requests columns
  const { data: srTest, error: srErr } = await supabase
    .from('service_requests')
    .insert({
      user_id: testUserId,
      vehicle_id: '00000000-0000-0000-0000-000000000000',
      service_type: 'test',
      status: 'Pending'
    })
    .select()
    .single();
  
  if (srErr) {
    console.log('\nService request snake_case insert failed:', srErr.message);
    // Try without vehicle_id as uuid
    const { data: sr2, error: sr2Err } = await supabase
      .from('service_requests')
      .insert({
        user_id: testUserId,
        service_type: 'test',
        status: 'Pending'
      })
      .select()
      .single();
    
    if (sr2Err) {
      console.log('Service request without vehicle_id failed:', sr2Err.message);
    } else {
      console.log('Service request columns:', Object.keys(sr2).join(', '));
      await supabase.from('service_requests').delete().eq('id', sr2.id);
    }
  } else {
    console.log('\nService request columns:', Object.keys(srTest).join(', '));
    await supabase.from('service_requests').delete().eq('id', srTest.id);
  }

  // Check mechanics columns
  const { data: mech, error: mechErr } = await supabase
    .from('mechanics')
    .insert({ name: 'probe', phone: '0000000000', specialization: 'General', status: 'Available' })
    .select()
    .single();
  
  if (mechErr) {
    console.log('\nMechanics insert failed:', mechErr.message);
  } else {
    console.log('\nMechanics columns:', Object.keys(mech).join(', '));
    await supabase.from('mechanics').delete().eq('id', mech.id);
  }
}

getColumns().catch(e => console.error(e));
