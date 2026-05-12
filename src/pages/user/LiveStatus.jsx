import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  Wrench, 
  CheckCircle2, 
  ShieldCheck, 
  Car,
  Zap,
  Loader2,
  XCircle,
  IndianRupee,
  Phone,
  CreditCard,
  Activity,
  Truck,
  Search,
  PackageCheck,
  User
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LiveStatus = () => {
  const { user } = useAuth();
  const [activeMissions, setActiveMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [missionLogs, setMissionLogs] = useState({});

  useEffect(() => {
    if (user?.id) {
      fetchMissions();
      const channel = supabase.channel('live_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user?.id}` }, () => fetchMissions())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_updates' }, (p) => fetchLogs(p.new.booking_id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user?.id]);

  const fetchMissions = async () => {
    try {
      const { data: bookings } = await supabase.from('bookings').select('*, vehicles(*)').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (bookings) {
        const mechanicIds = [...new Set(bookings.map(b => b.mechanic_id).filter(id => id))];
        const { data: allMechanics } = await supabase.from('mechanics').select('*').in('id', mechanicIds);
        
        const enriched = bookings.map(b => {
          const mechanic = allMechanics?.find(m => m.id === b.mechanic_id);
          if (mechanic) console.log('🛡️ OPERATIVE DETECTED:', mechanic.name, 'PHONE:', mechanic.phone || mechanic.phone_number);
          return { ...b, mechanics: mechanic || null };
        });

        setActiveMissions(enriched);
        bookings.forEach(m => fetchLogs(m.id));
      }
    } catch (err) {
      console.error('❌ FETCH ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (id) => {
    const { data } = await supabase.from('status_updates').select('*').eq('booking_id', id).order('created_at', { ascending: true });
    setMissionLogs(prev => ({ ...prev, [id]: data || [] }));
  };

  const handlePayment = async () => {
    setActingOnId(paymentModal.id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      await axios.post(`/api/user/bookings/${paymentModal.id}/action`, { action: 'accept' }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      toast.success('Mission Authorized');
      setPaymentModal(null);
      fetchMissions();
    } catch (e) { toast.error('Payment failed'); }
    setActingOnId(null);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Signal Pending', icon: Clock },
      accepted: { color: 'text-primary', bg: 'bg-primary/10', label: 'Unit Accepted', icon: Zap },
      cost_sent: { color: 'text-secondary', bg: 'bg-secondary/10', label: 'Payment Required', icon: CreditCard },
      confirmed: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Authorized', icon: ShieldCheck },
      picked_up: { color: 'text-primary', bg: 'bg-primary/10', label: 'Unit Secured', icon: Truck },
      inspecting: { color: 'text-secondary', bg: 'bg-secondary/10', label: 'Deep Scan', icon: Search },
      repairing: { color: 'text-primary', bg: 'bg-primary/10', label: 'Operational Phase', icon: Wrench },
      testing: { color: 'text-secondary', bg: 'bg-secondary/10', label: 'Calibration', icon: Activity },
      ready: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Mission Ready', icon: PackageCheck },
      delivered: { color: 'text-gray-400', bg: 'bg-white/5', label: 'Accomplished', icon: CheckCircle2 },
      user_cancelled: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Aborted', icon: XCircle }
    };
    return configs[status] || configs.pending;
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase font-bold animate-pulse italic">Syncing Mission...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold text-white italic flex items-center gap-3 uppercase"><Activity className="text-primary" /> Mission Status</h1>
      <div className="space-y-8">
        {activeMissions.map((job) => {
          const config = getStatusConfig(job.status);
          const Icon = config.icon;
          const logs = missionLogs[job.id] || [];
          const operative = job.mechanics;

          return (
            <div key={job.id} className="glass-panel overflow-hidden border-white/5 bg-secondary/5">
              <div className="p-8 flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-80 space-y-4">
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative">
                    <div className="w-full h-full flex items-center justify-center opacity-20"><Car size={48} /></div>
                    <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${config.bg} ${config.color} border-white/10`}>
                      <Icon size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{config.label}</span>
                    </div>
                  </div>
                  
                  {job.status === 'cost_sent' && (
                    <button onClick={() => setPaymentModal(job)} className="w-full py-4 bg-secondary text-dark rounded-xl font-bold uppercase text-[10px] shadow-glow-blue flex items-center justify-center gap-2">
                      <CreditCard size={16} /> Pay ₹{(job.final_cost || 0).toLocaleString()}
                    </button>
                  )}

                  {operative && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-primary/10">
                        {operative.profile_photo ? (
                          <img src={operative.profile_photo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-bold"><User size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Lead Operative</p>
                        <p className="text-xs font-bold text-white uppercase italic">{operative.name}</p>
                        <p className="text-[10px] text-secondary font-mono mt-0.5">
                          {operative.phone || operative.phone_number || operative.contact || operative.mobile || 'No Contact Signal'}
                        </p>
                      </div>
                      {(operative.phone || operative.phone_number || operative.contact || operative.mobile) && (
                        <a href={`tel:${operative.phone || operative.phone_number || operative.contact || operative.mobile}`} className="p-2 bg-secondary/10 text-secondary rounded-lg border border-secondary/20 hover:bg-secondary/20">
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-white uppercase italic">{job.vehicles?.nickname || 'Unit'}</h3>
                      <p className="text-[10px] text-primary font-bold uppercase">{job.vehicles?.brand} {job.vehicles?.model}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest">[{job.booking_ref}]</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative pl-6 space-y-6 border-l border-white/10 ml-2">
                      {logs.map((log, idx) => (
                        <div key={log.id} className="relative">
                          <div className={`absolute -left-[29px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${idx === logs.length - 1 ? 'bg-primary shadow-glow-purple scale-125' : 'bg-gray-700'}`}></div>
                          <div>
                            <p className={`text-xs font-bold ${idx === logs.length - 1 ? 'text-white' : 'text-gray-500'}`}>{log.message}</p>
                            <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {paymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !actingOnId && setPaymentModal(null)}></div>
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 text-center border-b border-white/5 bg-secondary/5">
              <ShieldCheck className="text-secondary mx-auto mb-4" size={48} />
              <h2 className="text-2xl font-bold text-white uppercase italic tracking-tight">Authorize Payment</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Ref: {paymentModal.booking_ref}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Total Mission Value</p>
                <div className="flex items-center justify-center gap-2">
                  <IndianRupee className="text-secondary" size={24} />
                  <span className="text-4xl font-bold text-white">{(paymentModal.final_cost || 0).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handlePayment} disabled={actingOnId} className="w-full py-5 bg-secondary text-dark rounded-2xl font-bold uppercase text-xs shadow-glow-blue flex items-center justify-center gap-3 active:scale-95 transition-all">
                {actingOnId ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Pay & Authorize</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStatus;
