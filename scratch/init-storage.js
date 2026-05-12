import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initStorage() {
  console.log('🚀 Initializing ServicePoint Storage Hangar...');
  
  // 1. Create Bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('media', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (bucketError) {
    if (bucketError.message.includes('already exists')) {
      console.log('✅ Hangar "media" already exists.');
    } else {
      console.error('❌ Failed to create hangar:', bucketError.message);
      return;
    }
  } else {
    console.log('✅ Hangar "media" created successfully.');
  }

  console.log('\n✨ Storage is now MISSION READY.');
}

initStorage();
