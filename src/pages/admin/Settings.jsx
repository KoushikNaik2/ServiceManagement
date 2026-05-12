import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Settings, 
  Store, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  Bot, 
  Save, 
  Loader2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ToggleLeft as Toggle,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    shop_name: 'ServicePoint',
    shop_phone: '',
    shop_email: '',
    shop_address: '',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    maintenance_mode: false,
    auto_assign_mechanic: false
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.data) {
        setSettings({
          shop_name: response.data.shop_name || '',
          shop_phone: response.data.shop_phone || '',
          shop_email: response.data.shop_email || '',
          shop_address: response.data.shop_address || '',
          working_hours_start: response.data.working_hours_start || '09:00',
          working_hours_end: response.data.working_hours_end || '18:00',
          maintenance_mode: !!response.data.maintenance_mode,
          auto_assign_mechanic: !!response.data.auto_assign_mechanic
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const config = { headers: { Authorization: `Bearer ${session.access_token}` } };
      await axios.patch('/api/admin/settings', settings, config);
      toast.success('Command Center settings updated');
    } catch (err) {
      console.error('❌ SETTINGS SAVE ERROR:', err.response?.data || err);
      const serverError = err.response?.data?.error || 'Update failed';
      toast.error(serverError);
      alert(`ADMIN SETTINGS ERROR: ${serverError}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-secondary" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
            <Settings className="text-secondary w-8 h-8" /> COMMAND CENTER CONFIG
          </h1>
          <p className="text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Global System Parameters & Operational Logic</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary bg-secondary hover:bg-secondary-glow shadow-glow-blue flex items-center gap-2 px-8"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          SAVE CONFIGURATION
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shop Info */}
          <div className="glass-panel p-8 border-white/5 bg-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Store className="text-secondary" size={18} /> Facility Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Establishment Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="text" 
                      value={settings.shop_name}
                      onChange={(e) => setSettings({...settings, shop_name: e.target.value})}
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Comms Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="email" 
                      value={settings.shop_email}
                      onChange={(e) => setSettings({...settings, shop_email: e.target.value})}
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Hotline Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="tel" 
                      value={settings.shop_phone}
                      onChange={(e) => setSettings({...settings, shop_phone: e.target.value})}
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Physical Coordinates</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="text" 
                      value={settings.shop_address}
                      onChange={(e) => setSettings({...settings, shop_address: e.target.value})}
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Controls */}
        <div className="space-y-8">
          <div className="glass-panel p-6 border-white/5 bg-[#050505]">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-2">Operational Controls</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Maintenance Mode</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Suspend all new missions</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.maintenance_mode ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.maintenance_mode ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Auto-Assign Units</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Bypass manual operative selection</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, auto_assign_mechanic: !settings.auto_assign_mechanic})}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.auto_assign_mechanic ? 'bg-secondary shadow-glow-blue' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.auto_assign_mechanic ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-secondary/20 bg-secondary/5">
            <h2 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Sparkles size={12} /> Neural Configuration
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">AI Engine</span>
                <span className="text-[10px] font-bold text-white tracking-widest">Groq Llama-3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Smart Suggestions</span>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Optimized</span>
              </div>
              <div className="p-3 bg-dark/50 rounded-lg border border-white/5 text-[9px] text-gray-500 leading-relaxed uppercase tracking-widest italic">
                AI integration provides real-time cost synthesis and mission diagnostics.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
