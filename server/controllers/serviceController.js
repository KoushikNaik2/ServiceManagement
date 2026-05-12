import supabase from '../config/supabase.js';
import { getMaintenanceSuggestions } from '../services/aiService.js';

const ACTIVE_USER_CANCEL_STATUSES = ['pending', 'accepted', 'cost_sent'];

const appendStatusUpdate = async ({ bookingId, status, message, updatedBy = 'system' }) => {
  const { error } = await supabase.from('status_updates').insert({
    booking_id: bookingId,
    status,
    message,
    updated_by: updatedBy
  });
  if (error) throw error;
};

export const bookService = async (req, res) => {
  try {
    const {
      vehicleId,
      issueDescription,
      aiProblemSummary,
      aiCondition,
      aiRecommendedService,
      pickupAddress,
      pickupCity,
      pickupPincode,
      userPhone,
      pickupScheduledDate,
      pickupScheduledTime,
      estimatedCostMin,
      estimatedCostMax
    } = req.body;

    if (!vehicleId || !issueDescription || !pickupAddress || !pickupCity || !pickupPincode || !userPhone) {
      return res.status(400).json({ message: 'Missing required booking fields.' });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ message: 'Target unit not found in database.' });
    }

    if (vehicle.user_id !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized for this vehicle.' });
    }

    const { data: createdBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user.id,
        vehicle_id: vehicleId,
        issue_description: issueDescription,
        ai_problem_summary: aiProblemSummary || null,
        ai_condition: aiCondition || null,
        ai_recommended_service: aiRecommendedService || null,
        pickup_address: pickupAddress,
        pickup_city: pickupCity,
        pickup_pincode: pickupPincode,
        user_phone: userPhone,
        pickup_scheduled_date: pickupScheduledDate || null,
        pickup_scheduled_time: pickupScheduledTime || null,
        estimated_cost_min: estimatedCostMin || null,
        estimated_cost_max: estimatedCostMax || null,
        status: 'pending'
      })
      .select('*, vehicles:vehicle_id(*)')
      .single();

    if (insertError) throw insertError;

    await appendStatusUpdate({
      bookingId: createdBooking.id,
      status: 'pending',
      message: 'Service request submitted. Awaiting admin review.',
      updatedBy: 'system'
    });

    req.app.get('io')?.emit('booking_updated', createdBooking);
    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('BookService Controller Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyServices = async (req, res) => {
  try {
    const { data: services, error } = await supabase
      .from('bookings')
      .select('*, vehicles:vehicle_id(*), mechanics:assigned_mechanic_id(*), status_updates(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const analyzeServiceRequest = async (req, res) => {
  const { vehicleId, issueDescription } = req.body;
  try {
    let vehicle = null;
    if (vehicleId) {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      vehicle = data;
    }
    
    const result = await getMaintenanceSuggestions(vehicle, issueDescription);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelServiceRequest = async (req, res) => {
  try {
    const { data: service, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !service) return res.status(404).json({ message: 'Booking not found' });
    
    if (service.user_id !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!ACTIVE_USER_CANCEL_STATUSES.includes(service.status)) {
      return res.status(400).json({ message: 'Booking can no longer be cancelled at this stage.' });
    }

    const { data: updatedService, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'user_cancelled'
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await appendStatusUpdate({
      bookingId: updatedService.id,
      status: 'user_cancelled',
      message: 'Booking cancelled by user.',
      updatedBy: 'system'
    });

    req.app.get('io')?.emit('booking_updated', updatedService);
    res.json({ message: 'Booking cancelled', service: updatedService });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteServiceRequest = async (req, res) => {
  try {
    const { data: service, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !service) return res.status(404).json({ message: 'Booking not found' });
    
    if (service.user_id !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: 'Record purged' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAllPending = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'user_cancelled' })
      .eq('user_id', req.user.id)
      .in('status', ACTIVE_USER_CANCEL_STATUSES)
      .select('id');

    if (error) throw error;

    if (Array.isArray(data) && data.length > 0) {
      const updates = data.map((b) => ({
        booking_id: b.id,
        status: 'user_cancelled',
        message: 'Booking cancelled by user.',
        updated_by: 'system'
      }));
      await supabase.from('status_updates').insert(updates);
    }

    req.app.get('io')?.emit('bookings_bulk_cancelled', { userId: req.user.id });
    res.json({ message: 'Pending bookings cancelled.', count: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
