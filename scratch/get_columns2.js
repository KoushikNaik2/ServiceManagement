import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgdxihhxgdswklilhwte.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZHhpaGh4Z2Rzd2tsaWxod3RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM5MTM1MiwiZXhwIjoyMDkzOTY3MzUyfQ.CaJ-1FMNL2sBdrk2_ghcA239N20Pzj7u6Q3apCBaUIU'
);

async function testMechanics() {
  // Try different column combos
  const combos = [
    { name: 'p', phone_number: '000', specialization: 'General', status: 'Available' },
    { name: 'p', contact: '000', specialization: 'General', status: 'Available' },
    { name: 'p', specialization: 'General', status: 'Available' },
  ];

  for (const combo of combos) {
    const { data, error } = await supabase
      .from('mechanics')
      .insert(combo)
      .select()
      .single();
    
    if (error) {
      console.log(`Failed with keys [${Object.keys(combo)}]: ${error.message}`);
    } else {
      console.log('SUCCESS! Columns:', Object.keys(data).join(', '));
      await supabase.from('mechanics').delete().eq('id', data.id);
      break;
    }
  }

  // Get service_requests columns
  const testUserId = 'a0f3aa3a-b9ef-42ee-aaec-992d143f9141';
  const { data: veh } = await supabase
    .from('vehicles')
    .insert({ user_id: testUserId, nickname: 'coltest', brand: 'X', model: 'Y', year: 2024, number: 'COL-TEST-001', fuel_type: 'Petrol', current_km: 0 })
    .select()
    .single();

  if (veh) {
    const { data: sr, error: srErr } = await supabase
      .from('service_requests')
      .insert({
        user_id: testUserId,
        vehicle_id: veh.id,
        service_type: 'Test',
        issue_description: 'test issue',
        status: 'Pending'
      })
      .select()
      .single();
    
    if (srErr) {
      console.log('\nSR insert failed:', srErr.message);
    } else {
      console.log('\nService request columns:', Object.keys(sr).join(', '));
      await supabase.from('service_requests').delete().eq('id', sr.id);
    }
    await supabase.from('vehicles').delete().eq('id', veh.id);
  }

  // Also create settings table
  console.log('\n--- Creating missing tables via direct inserts ---');
  
  // Create settings and service_types if not exists
  // They don't exist, so the admin controller will fail. 
  // We need to create them via SQL editor or handle gracefully.
  console.log('Settings and service_types tables are MISSING - need SQL creation');
}

testMechanics().catch(e => console.error(e));
