import supabase from '../config/supabase.js';

export const getMechanics = async (req, res) => {
  try {
    const { data: mechanics, error } = await supabase
      .from('mechanics')
      .select('*');

    if (error) throw error;
    res.json(mechanics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMechanic = async (req, res) => {
  try {
    const normalizedStatus =
      (req.body.status || 'available').toString().trim().toLowerCase().replace(/\s+/g, '_');

    const mechanicPayload = {
      name: req.body.name,
      specialization: req.body.specialization || req.body.specialty,
      phone: req.body.phone || req.body.contact,
      years_experience: req.body.yearsExperience ?? req.body.years_experience ?? 0,
      status: normalizedStatus
    };

    const { data: mechanic, error } = await supabase
      .from('mechanics')
      .insert(mechanicPayload)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mechanic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMechanic = async (req, res) => {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('mechanics')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !current) return res.status(404).json({ message: 'Mechanic not found' });
    if (current.status === 'busy') {
      return res.status(400).json({ message: 'Complete the active job before editing this mechanic' });
    }

    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = req.body.name;
    if (req.body.specialty !== undefined) updatePayload.specialization = req.body.specialty;
    if (req.body.specialization !== undefined) updatePayload.specialization = req.body.specialization;
    if (req.body.contact !== undefined) updatePayload.phone = req.body.contact;
    if (req.body.phone !== undefined) updatePayload.phone = req.body.phone;
    if (req.body.status !== undefined) updatePayload.status = req.body.status.toString().trim().toLowerCase().replace(/\s+/g, '_');
    if (req.body.yearsExperience !== undefined) updatePayload.years_experience = req.body.yearsExperience;

    const { data: mechanic, error } = await supabase
      .from('mechanics')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(mechanic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMechanic = async (req, res) => {
  try {
    const { data: mechanic, error: fetchError } = await supabase
      .from('mechanics')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !mechanic) return res.status(404).json({ message: 'Mechanic not found' });
    if (mechanic.status === 'busy') {
      return res.status(400).json({ message: 'Cannot remove — mechanic has an active job assigned.' });
    }

    await supabase
      .from('bookings')
      .update({ assigned_mechanic_id: null, status: 'user_confirmed' })
      .eq('assigned_mechanic_id', req.params.id)
      .in('status', ['assigned', 'picked_up', 'inspection', 'repair', 'testing']);

    const { error } = await supabase
      .from('mechanics')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Mechanic removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
