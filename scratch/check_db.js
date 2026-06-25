
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
    console.log("Checking Supabase Users and Profiles...");
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
        console.error("Error listing users:", usersError);
        return;
    }
    
    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(`- ${u.email} (${u.id})`));

    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    if (profilesError) {
        console.error("Error listing profiles:", profilesError);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);
    profiles.forEach(p => console.log(`- ${p.id}: ${p.role} (${p.full_name})`));
}

checkUsers();
