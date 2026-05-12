import supabase from '../config/supabase.js';

const ACTIVE_JOB_STATUSES = ['assigned', 'picked_up', 'inspection', 'repair', 'testing'];

const appendStatusUpdate = async ({ bookingId, status, message, updatedBy = 'admin' }) => {
  const { error } = await supabase.from('status_updates').insert({
    booking_id: bookingId,
    status,
    message,
    updated_by: updatedBy
  });
  if (error) throw error;
};

const withProfiles = async (bookings) => {
  const userIds = [...new Set((bookings || []).map((b) => b.user_id).filter(Boolean))];
  if (userIds.length === 0) return bookings || [];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, phone').in('id', userIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  return (bookings || []).map((b) => ({ ...b, profile: profileMap.get(b.user_id) || null }));
};

export const getDashboardStats = async (req, res) => {
  try {
    const { count: activeProtocols } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: repairingUnits } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ACTIVE_JOB_STATUSES);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startIso = startOfToday.toISOString();

    const { count: missionDone } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'delivered')
      .gte('delivered_at', startIso);
    
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('final_cost, delivered_at')
      .eq('status', 'delivered');

    const totalCredits = revenueData?.reduce((acc, curr) => acc + (curr.final_cost || 0), 0) || 0;

    const monthlyRevenueMap = {};
    revenueData?.forEach(item => {
      const month = new Date(item.delivered_at).getMonth() + 1;
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + (item.final_cost || 0);
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap).map(month => ({
      _id: parseInt(month),
      revenue: monthlyRevenueMap[month]
    })).sort((a, b) => a._id - b._id);

    res.json({
      activeProtocols,
      repairingUnits,
      missionDone,
      totalCredits,
      monthlyRevenue
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllServiceRequests = async (req, res) => {
  try {
    const { data: services, error } = await supabase
      .from('bookings')
      .select('*, vehicles:vehicle_id(*), mechanics:assigned_mechanic_id(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(await withProfiles(services));
  } catch (error) {
    console.error('getAllServiceRequests Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateServiceStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const {
      status,
      rejectionReason,
      assignedMechanicId,
      estimatedCostMin,
      estimatedCostMax,
      finalCost,
      costBreakdown,
      adminNotes
    } = req.body;

    const { data: existing, error: fetchError } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (fetchError || !existing) return res.status(404).json({ message: 'Booking not found' });

    const now = new Date().toISOString();
    const patch = {};
    let statusMessage = '';

    if (adminNotes !== undefined) patch.admin_notes = adminNotes;

    if (status === 'accepted') {
      patch.status = 'accepted';
      patch.accepted_at = now;
      statusMessage = 'Your service request has been accepted! Our team is preparing a cost estimate.';
    } else if (status === 'rejected') {
      patch.status = 'rejected';
      patch.rejection_reason = rejectionReason || 'Not specified';
      statusMessage = `Your request was rejected. Reason: ${patch.rejection_reason}`;
    } else if (status === 'cost_sent') {
      patch.status = 'cost_sent';
      patch.estimated_cost_min = estimatedCostMin ?? existing.estimated_cost_min;
      patch.estimated_cost_max = estimatedCostMax ?? existing.estimated_cost_max;
      patch.final_cost = finalCost ?? existing.final_cost;
      patch.cost_breakdown = costBreakdown ?? existing.cost_breakdown;
      patch.cost_sent_at = now;
      statusMessage = 'Cost estimate sent! Please review and confirm.';
    } else if (status === 'assigned') {
      if (!assignedMechanicId) return res.status(400).json({ message: 'assignedMechanicId is required for assignment.' });
      patch.status = 'assigned';
      patch.assigned_mechanic_id = assignedMechanicId;
      patch.assigned_at = now;
      patch.mechanic_dispatched_at = now;

      await supabase.from('mechanics').update({ status: 'busy' }).eq('id', assignedMechanicId);
      if (existing.assigned_mechanic_id && existing.assigned_mechanic_id !== assignedMechanicId) {
        await supabase.from('mechanics').update({ status: 'available' }).eq('id', existing.assigned_mechanic_id);
      }
      const { data: mech } = await supabase.from('mechanics').select('name, phone').eq('id', assignedMechanicId).single();
      statusMessage = `Mechanic ${mech?.name || 'assigned'}${mech?.phone ? ` (📞 ${mech.phone})` : ''} has been assigned and will call before pickup.`;
    } else if (status === 'picked_up') {
      patch.status = 'picked_up';
      patch.picked_up_at = now;
      statusMessage = 'Your vehicle has been picked up and is now at our service center.';
    } else if (status === 'inspection') {
      patch.status = 'inspection';
      patch.inspection_at = now;
      statusMessage = 'Our team is inspecting your vehicle.';
    } else if (status === 'repair') {
      patch.status = 'repair';
      patch.repair_at = now;
      statusMessage = 'Repairs are now in progress on your vehicle.';
    } else if (status === 'testing') {
      patch.status = 'testing';
      patch.testing_at = now;
      statusMessage = 'Your vehicle is undergoing quality testing.';
    } else if (status === 'completed') {
      patch.status = 'completed';
      patch.final_cost = finalCost ?? existing.final_cost;
      patch.completed_at = now;
      statusMessage = `Service completed! ₹${patch.final_cost || 0} charged. Your vehicle will be delivered back to your address.`;
      if (existing.assigned_mechanic_id) {
        const { data: mechanic } = await supabase
          .from('mechanics')
          .select('total_jobs_completed')
          .eq('id', existing.assigned_mechanic_id)
          .single();
        await supabase
          .from('mechanics')
          .update({
            status: 'available',
            total_jobs_completed: (mechanic?.total_jobs_completed || 0) + 1
          })
          .eq('id', existing.assigned_mechanic_id);
      }
    } else if (status === 'delivered') {
      patch.status = 'delivered';
      patch.delivered_at = now;
      statusMessage = 'Your vehicle has been delivered back to your address. Thank you for choosing ServicePoint! 🎉';
    } else if (status) {
      patch.status = status;
    }

    const { data: service, error } = await supabase
      .from('bookings')
      .update(patch)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    if (patch.status) {
      await appendStatusUpdate({
        bookingId: service.id,
        status: patch.status,
        message: statusMessage || `Status updated to ${patch.status}.`,
        updatedBy: 'admin'
      });
    }

    req.app.get('io')?.emit('booking_updated', service);
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteServiceRequest = async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Record purged from archive' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    let { data: settings, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('admin_settings')
        .insert({ shop_name: 'ServicePoint' })
        .select()
        .single();
      if (createError) throw createError;
      settings = newSettings;
    } else if (error) {
      throw error;
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { data: current, error: currentError } = await supabase.from('admin_settings').select('id').single();
    if (currentError) throw currentError;
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .update(req.body)
      .eq('id', current.id)
      .select()
      .single();

    if (error) throw error;
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceTypes = async (req, res) => {
  try {
    const { data: types, error } = await supabase
      .from('service_pricing')
      .select('*');

    if (error) throw error;
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateServiceType = async (req, res) => {
  try {
    const { data: type, error } = await supabase
      .from('service_pricing')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createServiceType = async (req, res) => {
  try {
    const { data: type, error } = await supabase
      .from('service_pricing')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
