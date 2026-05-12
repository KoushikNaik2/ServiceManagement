import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Zap, 
  Truck, 
  Search, 
  Wrench, 
  Activity, 
  ShieldCheck, 
  PackageCheck,
  Loader2,
  Clock,
  UserPlus,
  Phone,
  Car
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminLiveStatus = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState({});

  useEffect(() => {
    fetchActiveMissions();
    fetchMechanics();
    const channel = supabase.channel('admin_live_sync').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchActiveMissions()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMechanics = async () => {
    const { data } = await supabase.from('mechanics').select('*').eq('status', 'available');
    setMechanics(data || []);
  };

  const fetchActiveMissions = async () => {
    try {
      // 1. Fetch Bookings and Vehicles (Standard)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, vehicles(*)')
        .not('status', 'in', '("delivered","rejected","archived")')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Manual Profile and Mechanic Link (Bulletproof)
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const mechanicIds = [...new Set(bookings.map(b => b.mechanic_id).filter(id => id))];
      
      const [{ data: profiles }, { data: allMechanics }] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', userIds),
        supabase.from('mechanics').select('*').in('id', mechanicIds)
      ]);
      
      const enriched = bookings.map(b => ({
        ...b,
        profiles: profiles?.find(p => p.id === b.user_id) || { name: 'User' },
        mechanics: allMechanics?.find(m => m.id === b.mechanic_id) || null
      }));

      setMissions(enriched);
    } catch (err) {
      console.error('❌ PIPELINE ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (id) => {
    const mechanicId = selectedMechanics[id];
    if (!mechanicId) return toast.error('Select an operative');
    setUpdatingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      await axios.patch(`/api/admin/bookings/${id}`, { mechanic_id: mechanicId, status: 'picked_up' }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': true }
      });

      await axios.post('/api/admin/status-updates', {
        booking_id: id,
        status: 'picked_up',
        message: 'Lead Operative Assigned: Your vehicle is being secured for transport.',
        updated_by: 'admin'
      }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': true }
      });

      toast.success('Operative Deployed');
      fetchActiveMissions();
    } catch (err) {
      toast.error('Deployment failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const advanceMission = async (id, currentStatus) => {
    const phases = ['confirmed', 'picked_up', 'inspecting', 'repairing', 'testing', 'ready', 'delivered'];
    const currentIndex = phases.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === phases.length - 1) return;

    const nextStatus = phases[currentIndex + 1];
    setUpdatingId(id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`/api/admin/bookings/${id}`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': true }
      });

      const messages = {
        picked_up: 'Unit Secured: The vehicle has been successfully picked up.',
        inspecting: 'Deep Scan: Lead operative is performing a full tactical inspection.',
        repairing: 'Operational: Repairs have commenced.',
        testing: 'Calibration: Final testing and quality checks are in progress.',
        ready: 'Mission Ready: Unit is cleared for handoff.',
        delivered: 'Mission Accomplished: Unit delivered to the user.'
      };

      await axios.post('/api/admin/status-updates', {
        booking_id: id,
        status: nextStatus,
        message: messages[nextStatus],
        updated_by: 'admin'
      }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': true }
      });

      toast.success(`Phase: ${nextStatus.toUpperCase()}`);
      fetchActiveMissions();
    } catch (err) {
      toast.error('Transition failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase font-bold animate-pulse italic">Syncing Operational Pipeline...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold tracking-tighter text-white italic uppercase flex items-center gap-3">
        <Activity className="text-primary" /> Operational Pipeline
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {missions.map((mission) => {
          const phases = ['confirmed', 'picked_up', 'inspecting', 'repairing', 'testing', 'ready', 'delivered'];
          const currentIndex = phases.indexOf(mission.status);
          const nextPhase = currentIndex !== -1 && currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;

          return (
            <div key={mission.id} className="glass-panel p-8 border-white/5 bg-secondary/5">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-primary">
                    <Car size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase italic">{mission.vehicles?.nickname}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{mission.profiles?.name}</span>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-widest">• {mission.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {mission.status === 'confirmed' && !mission.mechanic_id ? (
                    <div className="flex gap-4">
                      <select 
                        value={selectedMechanics[mission.id] || ''} 
                        onChange={(e) => setSelectedMechanics({...selectedMechanics, [mission.id]: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      >
                        <option value="">Select Operative</option>
                        {mechanics.map(m => <option key={m.id} value={m.id}>{m.name} ({m.specialty})</option>)}
                      </select>
                      <button onClick={() => handleAssign(mission.id)} className="px-8 py-3 bg-secondary text-dark rounded-xl text-[10px] font-bold uppercase shadow-glow-blue flex items-center gap-2">
                        <UserPlus size={16} /> Deploy
                      </button>
                    </div>
                  ) : mission.mechanics ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-right">
                        <p className="text-[8px] text-gray-500 font-bold uppercase">Lead Operative</p>
                        <p className="text-[10px] text-white font-bold uppercase">{mission.mechanics.name}</p>
                      </div>
                      <a href={`tel:${mission.mechanics.phone}`} className="p-2 bg-secondary/10 text-secondary rounded-lg"><Phone size={14} /></a>
                    </div>
                  ) : null}

                  {nextPhase && (mission.mechanic_id || mission.status !== 'confirmed') ? (
                    <button onClick={() => advanceMission(mission.id, mission.status)} className="px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-glow-purple flex items-center gap-3">
                      Advance Stage <Zap size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLiveStatus;
