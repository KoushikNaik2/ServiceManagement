import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Middleware to verify admin (Simple version for dev)
const authenticateAdmin = (req, res, next) => {
  const isDevAdmin = req.headers['x-dev-admin'] === 'true';
  if (isDevAdmin) {
    req.user = { role: 'admin' };
    return next();
  }
  // Standard auth would go here
  next();
};

router.use(authenticateAdmin);

// Get Admin Stats
router.get('/stats', async (req, res) => {
  try {
    const { data: bookings } = await supabase.from('bookings').select('status, final_cost');
    const { count: vehicles } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    const stats = {
      totalBookings: bookings?.length || 0,
      activeMissions: bookings?.filter(b => !['delivered', 'user_cancelled', 'rejected'].includes(b.status)).length || 0,
      totalVehicles: vehicles || 0,
      totalUsers: users || 0,
      revenue: bookings?.reduce((acc, curr) => acc + (curr.final_cost || 0), 0) || 0
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mechanic Management
router.get('/mechanics', async (req, res) => {
  try {
    const { data, error } = await supabase.from('mechanics').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mechanics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mechanics')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      console.error('❌ MECHANIC REGISTRATION ERROR:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/mechanics/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('mechanics').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/mechanics/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('mechanics').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Booking Operations
router.patch('/bookings/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookings').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Status Updates (RESTORED)
router.post('/status-updates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('status_updates')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      console.error('❌ STATUS UPDATE ERROR:', error);
      throw error;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings Management
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    // If no settings exist yet, return defaults
    if (error && error.code === 'PGRST116') {
      return res.json({
        shop_name: 'ServicePoint',
        shop_phone: '',
        shop_email: '',
        shop_address: '',
        working_hours_start: '09:00',
        working_hours_end: '18:00',
        maintenance_mode: false,
        auto_assign_mechanic: false
      });
    }
    if (error) {
      console.error('❌ SETTINGS FETCH ERROR:', error);
      throw error;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.id;
    delete payload.updated_at;

    // Check if settings exist (ignore error if no row found)
    const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    
    let result;
    if (existing?.id) {
      result = await supabase.from('settings').update(payload).eq('id', existing.id).select().single();
    } else {
      result = await supabase.from('settings').insert([payload]).select().single();
    }

    if (result.error) {
      console.error('❌ SETTINGS DATABASE ERROR:', result.error);
      return res.status(400).json({ error: result.error.message });
    }
    res.json(result.data);
  } catch (err) {
    console.error('❌ SERVER SETTINGS ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
