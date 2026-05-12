import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Car, 
  Plus, 
  ShieldCheck, 
  Loader2, 
  Zap,
  Gauge,
  Fuel,
  Hash,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const MyVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    nickname: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    number: '',
    fuel_type: 'Petrol',
    current_km: 0
  });

  useEffect(() => {
    if (user?.id) fetchVehicles();
  }, [user?.id]);

  const fetchVehicles = async () => {
    const { data, error } = await supabase.from('vehicles').select('*').eq('user_id', user.id);
    if (error) toast.error('Failed to sync garage');
    else setVehicles(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Decommission this unit? This action is irreversible.')) return;
    setDeletingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      await axios.delete(`/api/user/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      toast.success('Unit Decommissioned');
      fetchVehicles();
    } catch (err) {
      toast.error('Decommission failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      await axios.post('/api/user/vehicles', formData, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      toast.success('Unit Registered');
      setIsModalOpen(false);
      fetchVehicles();
      resetForm();
    } catch (err) {
      toast.error('Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ nickname: '', brand: '', model: '', year: new Date().getFullYear(), number: '', fuel_type: 'Petrol', current_km: 0 });
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase font-bold animate-pulse italic">Scanning Garage...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white italic flex items-center gap-3 uppercase">
            <ShieldCheck className="text-primary" /> Active Garage
          </h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Authorized fleet management</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase shadow-glow-purple hover:scale-105 transition-all flex items-center gap-2">
          <Plus size={16} /> Add Vehicles
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="glass-panel group overflow-hidden border-white/5 hover:border-primary/20 transition-all duration-500">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">{v.brand} {v.model}</p>
                  <h3 className="text-2xl font-bold text-white uppercase italic tracking-tight">{v.nickname}</h3>
                </div>
                <button 
                  onClick={() => handleDelete(v.id)}
                  className="p-3 bg-white/5 text-gray-500 rounded-xl border border-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                  disabled={deletingId === v.id}
                >
                  {deletingId === v.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Hash size={8}/> Plate</p>
                  <p className="text-xs font-mono text-white">{v.number}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Gauge size={8}/> Mileage</p>
                  <p className="text-xs font-bold text-white">{v.current_km} KM</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Fuel size={8}/> Fuel</p>
                  <p className="text-xs font-bold text-white uppercase">{v.fuel_type}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Year</p>
                  <p className="text-xs font-bold text-white">{v.year}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <form onSubmit={handleSubmit} className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-primary/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase italic">Unit Registration</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Enroll vehicle into the neural network</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Zap className="text-primary" size={24} />
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Nickname</label>
                  <input required value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50" placeholder="e.g. GHOST" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Plate Number</label>
                  <input required value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50" placeholder="e.g. DL 1C 1234" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Brand</label>
                  <input required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50" placeholder="e.g. Honda" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Model</label>
                  <input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50" placeholder="e.g. Activa 6G" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Fuel Type</label>
                  <select value={formData.fuel_type} onChange={(e) => setFormData({...formData, fuel_type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50">
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Current KM</label>
                  <input type="number" required value={formData.current_km} onChange={(e) => setFormData({...formData, current_km: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50" />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-glow-purple flex items-center justify-center gap-3 mt-4">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Authorize Deployment</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyVehicles;
