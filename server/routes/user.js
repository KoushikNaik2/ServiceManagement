import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Middleware to verify user identity
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Signal Interrupted: No Auth Token' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Signal Jammed: Invalid Session' });
  req.user = user;
  next();
};

router.use(authenticateUser);

// User Profile Stats
router.get('/stats', async (req, res) => {
  try {
    const { count: vehicles } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id);
    const { count: active } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).neq('status', 'delivered').neq('user_cancelled', true);
    
    res.json({
      totalVehicles: vehicles || 0,
      activeMissions: active || 0,
      totalSpent: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Booking Operations
router.post('/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookings').insert([{
      ...req.body,
      user_id: req.user.id
    }]).select().single();
    
    if (error) {
      console.error('❌ DATABASE ERROR (Booking):', error);
      throw error;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vehicles').insert([{
      ...req.body,
      user_id: req.user.id
    }]).select().single();
    
    if (error) {
      console.error('❌ DATABASE ERROR (Vehicles):', JSON.stringify(error, null, 2));
      return res.status(400).json({ 
        error: error.message, 
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    res.json(data);
  } catch (err) {
    console.error('❌ SERVER ERROR (Vehicles):', err);
    res.status(500).json({ error: err.message });
  }
});

// Final Mission Decision (Accept/Reject Cost)
router.post('/bookings/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const { id } = req.params;

    console.log(`📡 [ACTION] Processing ${action} for Booking: ${id}`);

    // Verify ownership
    const { data: booking, error: fetchError } = await supabase.from('bookings').select('user_id').eq('id', id).single();
    if (fetchError || !booking) {
      console.error('❌ FETCH ERROR:', fetchError);
      return res.status(404).json({ error: 'Mission not found' });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access Denied: Mission ownership mismatch' });
    }

    const newStatus = action === 'accept' ? 'confirmed' : 'user_cancelled';
    const message = action === 'accept' ? 
      'Mission Authorized: User has confirmed the financial matrix and cleared the unit for operations.' : 
      'Mission Aborted: User has rejected the financial estimation.';

    // Update Booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ UPDATE ERROR:', updateError);
      throw updateError;
    }

    // Log the Decision - Safely handle if status_updates fails
    try {
      await supabase.from('status_updates').insert([{
        booking_id: id,
        status: newStatus,
        message: message,
        updated_by: 'user'
      }]);
    } catch (logErr) {
      console.warn('⚠️ LOGGING FAILED:', logErr.message);
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error('❌ MISSION DECISION ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ message: 'Vehicle decommissioned' });
  } catch (err) {
    console.error('❌ DELETE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
