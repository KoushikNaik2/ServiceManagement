
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("Checking profiles table schema...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    if (data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("Table is empty, can't determine schema easily this way.");
    }
}

checkSchema();
