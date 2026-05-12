import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for testing
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, vehicles(*)')
      .limit(1);
    
    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('Supabase Data:', data);
    }
  } catch (err) {
    console.error('Catch Error:', err);
  }
}

testSupabase();
