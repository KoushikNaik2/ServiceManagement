import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function resetPasswords() {
  const usersToReset = [
    { email: 'admin@servicepoint.com', id: '7e7b8062-5fc6-4ad4-b096-f7a9fcb4d47e' },
    { email: 'user@gmail.com', id: 'c05c56d7-8603-4182-96f2-9f7c97aa863a' }
  ];

  for (const u of usersToReset) {
    console.log(`Resetting password for ${u.email}...`);
    const { data, error } = await supabase.auth.admin.updateUserById(
      u.id,
      { password: 'password123' }
    );
    if (error) {
      console.error(`❌ Failed to reset ${u.email}:`, error.message);
    } else {
      console.log(`✅ Successfully reset password for ${u.email} to "password123"!`);
    }
  }
}

resetPasswords();
