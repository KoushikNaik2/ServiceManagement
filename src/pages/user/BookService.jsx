import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Car, Calendar, MapPin, AlertCircle, Sparkles, Send, Phone, Camera, Loader2, Info } from 'lucide-react';
import { aiService } from '../../lib/ai';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../../lib/upload';
import axios from 'axios';

const BookService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    issue_description: '',
    pickup_address: '', // Synchronized with DB
    phone_number: '',
    vehicle_photo: '',
    preferred_date: '',
  });

  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to sync fleet data');
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uplinking mission visual...');
    try {
      const publicUrl = await uploadFile(file);
      setFormData({ ...formData, vehicle_photo: publicUrl });
      toast.success('Visual intel captured', { id: toastId });
    } catch (err) {
      toast.error('Uplink failed. Ensure storage hangar is initialized.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!formData.vehicle_id || !formData.issue_description) {
      toast.error('Please select a vehicle and describe the issue');
      return;
    }

    setAiAnalyzing(true);
    const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
    
    try {
      const result = await aiService.analyzeIssue(
        vehicle.brand, 
        vehicle.model, 
        formData.issue_description
      );
      setAiInsight({
        analysis: result.problemSummary || result.conditionAssessment || 'Neural analysis complete. Proceed to transmit mission intel.',
        recommended: result.recommendedService,
        severity: result.urgencyLevel
      });
      toast.success('AI Analysis Complete');
    } catch (err) {
      toast.error('AI Analysis failed.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();

    try {
      const booking_ref = `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Use Backend API for secure booking
      await axios.post('/api/user/bookings', {
        vehicle_id: formData.vehicle_id,
        issue_description: formData.issue_description,
        pickup_address: formData.pickup_address, // Synchronized with DB
        address: formData.pickup_address, // Sending both to be safe
        phone_number: formData.phone_number,
        vehicle_photo: formData.vehicle_photo,
        preferred_date: formData.preferred_date,
        booking_ref,
        ai_recommended_service: aiInsight?.recommendedService || 'General Maintenance',
        ai_severity: aiInsight?.severity || 'medium',
        status: 'pending'
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      toast.success('Mission Request Transmitted');
      navigate('/status');
    } catch (err) {
      console.error('Submission Error:', err.response?.data);
      toast.error(err.response?.data?.error || 'Transmission failed. Check Terminal for Error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center animate-pulse text-gray-500 font-bold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3 italic">
            <Wrench className="text-primary" /> INITIALIZE MISSION
          </h1>
          <p className="text-gray-400 mt-1 text-sm uppercase tracking-widest font-bold opacity-60">Schedule maintenance or repair</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 space-y-6 border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Target Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select 
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    className="w-full bg-dark border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary/50 outline-none transition-all appearance-none"
                  >
                    <option value="">Choose Unit</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.nickname} ({v.brand} {v.model})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="tel" required value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full bg-dark border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary/50 outline-none transition-all" placeholder="9876543210" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Anomaly Brief (Description)</label>
              <textarea required rows="3" value={formData.issue_description} onChange={(e) => setFormData({...formData, issue_description: e.target.value})} className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-primary/50 outline-none transition-all resize-none" placeholder="Describe the issue..." />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vehicle Visual Intel (Gallery/Camera)</label>
              <div className="relative group h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-primary/30 transition-all">
                {formData.vehicle_photo ? (
                  <>
                    <img src={formData.vehicle_photo} alt="Preview" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-4 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase">Change Intel</div>
                    </div>
                  </>
                ) : (
                  <>
                    {isUploading ? <Loader2 className="animate-spin text-primary" /> : (
                      <>
                        <Camera className="text-gray-500 mb-1" size={24} />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Choose from Gallery</p>
                      </>
                    )}
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preferred Date</label>
                <input type="date" required value={formData.preferred_date} onChange={(e) => setFormData({...formData, preferred_date: e.target.value})} className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-primary/50 outline-none [color-scheme:dark]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pickup/Service Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" required value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})} className="w-full bg-dark border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary/50 outline-none transition-all" placeholder="Enter location" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={handleAiAnalysis} disabled={aiAnalyzing} className="flex-1 py-4 bg-primary/5 text-primary border border-primary/20 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-primary/10 transition-all">
                {aiAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Neural Analysis
              </button>
              <button type="submit" disabled={submitting || isUploading} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-glow-purple hover:scale-[1.02] transition-all">
                Transmit Mission
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          {aiInsight ? (
            <div className="glass-panel p-6 border-primary/20 bg-primary/5 space-y-4 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-3">
                <Sparkles className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">AI Diagnostic</h2>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed italic">"{aiInsight.analysis}"</p>
            </div>
          ) : (
            <div className="glass-panel p-8 flex flex-col items-center justify-center text-center border-dashed border-white/10 opacity-40">
              <Info size={32} className="mb-2 text-gray-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Analysis Pending</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookService;
