import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Sparkles, 
  Search, 
  Car, 
  Clock, 
  Send, 
  AlertCircle, 
  DollarSign, 
  ShieldCheck, 
  Zap,
  Edit3,
  Loader2,
  Inbox
} from 'lucide-react';
import { aiService } from '../../lib/ai';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminEstimation = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPendingEstimations();
  }, []);

  const fetchPendingEstimations = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, vehicles(*)')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to sync incoming signals');
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const handleAiEstimate = async (booking) => {
    setSelectedBooking(booking);
    setIsAnalyzing(true);
    setIsEditing(false);
    
    try {
      // AI generates a base cost based on vehicle and issue
      const result = await aiService.analyzeIssue(
        booking.vehicles.brand,
        booking.vehicles.model,
        booking.issue_description
      );
      
      // Extract costs from the AI response (matching server/services/aiService.js names)
      const min = result.estimatedCostMin || 0;
      const max = result.estimatedCostMax || 0;
      const baseCost = Math.floor((min + max) / 2) || 500;
      
      setEstimate({
        analysis: result.problemSummary || result.conditionAssessment || 'Manual inspection recommended.',
        recommendedService: result.recommendedService || 'General Service',
        severity: result.urgencyLevel || 'medium',
        finalCost: baseCost
      });
      toast.success('Neural analysis complete');
    } catch (err) {
      toast.error('Neural link failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendEstimateToUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const isDevAdmin = localStorage.getItem('dev_admin') === 'true';

    try {
      // Update booking with the Final Cost and move status to cost_sent
      await axios.patch(`/api/admin/bookings/${selectedBooking.id}`, {
        status: 'cost_sent',
        final_cost: estimate.finalCost,
        // We still store min/max as the same value for compatibility if needed
        estimated_cost_min: estimate.finalCost,
        estimated_cost_max: estimate.finalCost
      }, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'x-dev-admin': isDevAdmin
        }
      });

      // Add status update
      await axios.post('/api/admin/status-updates', {
        booking_id: selectedBooking.id,
        status: 'cost_sent',
        message: `Financial Matrix Generated: The mission value has been set at ₹${estimate.finalCost.toLocaleString()}. Please authorize to proceed.`,
        updated_by: 'admin'
      }, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'x-dev-admin': isDevAdmin
        }
      });

      toast.success('Financial signals transmitted to user');
      setEstimate(null);
      setSelectedBooking(null);
      fetchPendingEstimations();
    } catch (err) {
      toast.error('Transmission failed');
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase tracking-widest font-bold animate-pulse">Syncing Financial Matrix...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase text-white italic">Cost Synthesizer</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Convert mission anomalies into financial data</p>
        </div>
        <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow-purple"></div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">AI Matrix Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {bookings.map(booking => (
            <div key={booking.id} className={`glass-panel p-6 border-white/5 transition-all duration-500 hover:border-primary/30 ${selectedBooking?.id === booking.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Car size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase italic">{booking.vehicles?.nickname}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{booking.vehicles?.brand} {booking.vehicles?.model}</span>
                      <span className="text-[10px] text-gray-600 font-mono">[{booking.booking_ref}]</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleAiEstimate(booking)}
                  disabled={isAnalyzing}
                  className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-glow-purple hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isAnalyzing && selectedBooking?.id === booking.id ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                </button>
              </div>
              <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400 italic">"{booking.issue_description}"</p>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="py-32 text-center glass-panel border-dashed border-white/10 opacity-20">
              <Inbox size={48} className="mx-auto mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No signals awaiting financial synthesis</p>
            </div>
          )}
        </div>

        {/* Estimation Sidebar */}
        <div className="lg:col-span-1">
          {estimate ? (
            <div className="glass-panel p-8 border-primary/30 bg-primary/5 space-y-8 sticky top-8 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                  <Sparkles className="text-primary" size={20} />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-white">Neural Result</h2>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-dark/60 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Diagnostic Analysis</p>
                  <p className="text-xs text-gray-200 leading-relaxed italic">"{estimate.analysis}"</p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl text-center relative group">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mb-2">Final Mission Value</p>
                    
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-white">₹</span>
                        <input 
                          type="number"
                          value={estimate.finalCost}
                          onChange={(e) => setEstimate({...estimate, finalCost: parseInt(e.target.value)})}
                          className="bg-transparent border-b border-primary text-3xl font-bold text-white w-32 text-center outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h3 className="text-4xl font-bold text-white tracking-tighter">₹{estimate.finalCost.toLocaleString()}</h3>
                    )}

                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="absolute top-2 right-2 p-2 bg-white/5 rounded-lg text-gray-500 hover:text-primary transition-colors"
                    >
                      {isEditing ? <ShieldCheck size={16} className="text-green-500" /> : <Edit3 size={16} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Recommended</p>
                      <p className="text-[10px] text-white font-bold truncate">{estimate.recommendedService}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Severity</p>
                      <p className={`text-[10px] font-bold uppercase ${estimate.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>{estimate.severity}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={sendEstimateToUser}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Transmit Mission Data
                </button>
                <p className="text-[8px] text-center text-gray-600 uppercase tracking-widest px-4 font-bold">Transmitting this data will notify the user and await mission authorization.</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center glass-panel border-dashed border-white/10 opacity-20 text-center">
              <AlertCircle size={32} className="mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Select a signal for analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEstimation;
