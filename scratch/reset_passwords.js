
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetPasswords() {
    const users = [
        { email: 'admin@servicepoint.com', id: '7e7b8062-5fc6-4ad4-b096-f7a9fcb4d47e', newPassword: 'admin123' },
        { email: 'user@gmail.com', id: 'c05c56d7-8603-4182-96f2-9f7c97aa863a', newPassword: 'user123' }
    ];

    for (const user of users) {
        console.log(`Resetting password for ${user.email}...`);
        const { error } = await supabase.auth.admin.updateUserById(user.id, { password: user.newPassword });
        if (error) {
            console.error(`Failed to reset password for ${user.email}:`, error.message);
        } else {
            console.log(`Successfully reset password for ${user.email} to: ${user.newPassword}`);
        }
    }
}

resetPasswords();
