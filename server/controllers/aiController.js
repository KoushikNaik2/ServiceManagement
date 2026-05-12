import supabase from '../config/supabase.js';
import { getMaintenanceSuggestions, getVehicleInsight, getMonthlyReport, getChatReply, getCostEstimate, getWorkloadSuggestion } from '../services/aiService.js';

export const diagnoseIssue = async (req, res) => {
  try {
    const { vehicleId, issueDescription, brand, model, year, fuelType, currentKm, lastServiceDate } = req.body;
    let vehicle = null;
    if (vehicleId) {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      vehicle = data;
    } else if (brand || model) {
      vehicle = { brand, model, year, fuelType, currentKm, lastServiceDate };
    }
    const result = await getMaintenanceSuggestions(vehicle, issueDescription);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuickInsight = async (req, res) => {
  try {
    let vehicles = req.body.vehicles;
    let history = req.body.serviceHistory;

    if (!vehicles) {
      const { data } = await supabase.from('vehicles').select('*').eq('user_id', req.user.id);
      vehicles = data || [];
    }
    if (!history) {
      const { data } = await supabase.from('bookings').select('*').eq('user_id', req.user.id).limit(20);
      history = data || [];
    }

    const insight = await getVehicleInsight(vehicles, history);
    res.json({ insight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { message, conversationHistory, userVehicles } = req.body;
    let vehicles = userVehicles;
    if (!vehicles) {
      const { data } = await supabase.from('vehicles').select('*').eq('user_id', req.user.id);
      vehicles = data || [];
    }
    
    const reply = await getChatReply(message, conversationHistory, vehicles);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateCostEstimate = async (req, res) => {
  try {
    const { vehicleDetails, serviceType, condition, specificIssues, issueDescription } = req.body;
    
    // Fetch base prices to use as context
    const { data: referencePrices } = await supabase
      .from('service_pricing')
      .select('*');

    const estimate = await getCostEstimate(
      vehicleDetails, 
      serviceType, 
      condition, 
      issueDescription || specificIssues, 
      referencePrices
    );

    res.json(estimate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateMonthlyReport = async (req, res) => {
  try {
    let records = req.body.records;

    if (!records || records.length === 0) {
      let query = supabase
        .from('bookings')
        .select('*, vehicles(*)')
        .in('status', ['completed', 'delivered']);
      
      if (req.user.role !== 'admin') {
        query = query.eq('user_id', req.user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      records = data;
    }

    const report = await getMonthlyReport(records);
    res.json({ report });
  } catch (error) {
    console.error('Monthly Report Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const workloadBalance = async (req, res) => {
  try {
    const { jobs, mechanics, requiredSpecialization } = req.body;
    const suggestion = await getWorkloadSuggestion(jobs, mechanics, requiredSpecialization);
    res.json({ suggestion });
  } catch (error) {
    console.error('Workload balance error:', error);
    res.status(500).json({ message: error.message });
  }
};
