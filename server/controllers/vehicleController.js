import supabase from '../config/supabase.js';

export const getVehicles = async (req, res) => {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addVehicle = async (req, res) => {
  try {
    const plateNumber = req.body.plateNumber || req.body.number;
    
    if (!plateNumber) {
      return res.status(400).json({ message: 'Plate number is required.' });
    }

    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('plate_number', plateNumber)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingVehicle) {
      return res.status(400).json({ message: 'This plate number is already registered in our system' });
    }

    const { data: vehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        nickname: req.body.nickname,
        brand: req.body.brand,
        model: req.body.model,
        year: req.body.year,
        plate_number: plateNumber,
        fuel_type: req.body.fuelType,
        current_km: req.body.currentKm,
        last_service_date: req.body.lastServiceDate,
        last_service_type: req.body.lastServiceType,
        known_issues: req.body.knownIssues,
        user_id: req.user.id
      })
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    if (vehicle.user_id !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatePayload = {};
    if (req.body.nickname !== undefined) updatePayload.nickname = req.body.nickname;
    if (req.body.brand !== undefined) updatePayload.brand = req.body.brand;
    if (req.body.model !== undefined) updatePayload.model = req.body.model;
    if (req.body.year !== undefined) updatePayload.year = req.body.year;
    if (req.body.number !== undefined) updatePayload.plate_number = req.body.number;
    if (req.body.plateNumber !== undefined) updatePayload.plate_number = req.body.plateNumber;
    if (req.body.fuelType !== undefined) updatePayload.fuel_type = req.body.fuelType;
    if (req.body.currentKm !== undefined) updatePayload.current_km = req.body.currentKm;
    if (req.body.lastServiceDate !== undefined) updatePayload.last_service_date = req.body.lastServiceDate;
    if (req.body.lastServiceType !== undefined) updatePayload.last_service_type = req.body.lastServiceType;
    if (req.body.knownIssues !== undefined) updatePayload.known_issues = req.body.knownIssues;

    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (vehicle.user_id !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Validation: Do not allow deletion if vehicle has an active service booking
    const { data: activeBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', req.params.id)
      .in('status', ['pending', 'accepted', 'cost_sent', 'user_confirmed', 'assigned', 'picked_up', 'inspection', 'repair', 'testing', 'completed'])
      .maybeSingle();

    if (bookingError) throw bookingError;

    if (activeBooking) {
      return res.status(400).json({ message: 'Cannot remove — this vehicle has an active service request' });
    }

    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: 'Vehicle unit decommissioned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
