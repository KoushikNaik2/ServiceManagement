import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lgdxihhxgdswklilhwte.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZHhpaGh4Z2Rzd2tsaWxod3RlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM5MTM1MiwiZXhwIjoyMDkzOTY3MzUyfQ.CaJ-1FMNL2sBdrk2_ghcA239N20Pzj7u6Q3apCBaUIU'
);

async function inspectSchema() {
  // Check vehicles columns by inserting a test row and seeing what sticks
  console.log('=== Inspecting table schemas ===\n');

  // Try to get one row from each table to see columns
  const tables = ['profiles', 'vehicles', 'service_requests', 'mechanics', 'settings', 'service_types'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`${table}: ERROR - ${error.message}`);
    } else if (data.length > 0) {
      console.log(`${table} columns:`, Object.keys(data[0]).join(', '));
    } else {
      console.log(`${table}: empty table`);
      // Try inserting a dummy to get column info from error
      const { error: insertErr } = await supabase
        .from(table)
        .insert({ _test_: true });
      if (insertErr) {
        console.log(`  insert error hint: ${insertErr.message}`);
      }
    }
  }

  // Check auth users
  console.log('\n=== Auth users ===');
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Auth list error:', authErr.message);
  } else {
    console.log(`Total auth users: ${authUsers.users.length}`);
    authUsers.users.forEach(u => {
      console.log(`  ${u.email} (${u.id}) confirmed: ${!!u.email_confirmed_at}`);
    });
  }

  // Check if admin_user_01 has a profile
  const adminUser = authUsers?.users?.find(u => u.email === 'admin_user_01@example.com');
  if (adminUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .maybeSingle();
    
    if (!profile) {
      console.log('\n*** admin_user_01 has NO profile! Creating one...');
      const { data: newProfile, error: createErr } = await supabase
        .from('profiles')
        .insert({
          id: adminUser.id,
          email: adminUser.email,
          name: 'Admin User',
          role: 'admin'
        })
        .select()
        .single();
      
      if (createErr) {
        console.error('Create admin profile error:', createErr.message);
      } else {
        console.log('Admin profile created:', newProfile.email, newProfile.role);
      }
    } else {
      console.log('\nadmin_user_01 profile exists, role:', profile.role);
      if (profile.role !== 'admin') {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', adminUser.id);
        console.log(upErr ? `Role update failed: ${upErr.message}` : 'Role updated to admin');
      }
    }
  }
}

inspectSchema().catch(e => console.error(e.message));
