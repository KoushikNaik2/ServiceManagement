import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Check, X, AlertTriangle, MessageSquare, Inbox, ShieldCheck, Clock, UserPlus, Phone, Camera, Briefcase, MapPin, Zap, ArrowRight, Wrench, PackageCheck, Send
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState({});
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchRequests();
    fetchMechanics();
  }, []);

  const fetchRequests = async () => {
    try {
      // 1. Fetch Bookings and Vehicles
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, vehicles(*), mechanics(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Fetch Profiles separately to avoid Join errors
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);

      const enriched = bookings.map(b => ({
        ...b,
        profiles: profiles?.find(p => p.id === b.user_id) || { name: 'User' }
      }));

      setRequests(enriched);
    } catch (err) {
      console.error('❌ SIGNAL FETCH ERROR:', err);
      toast.error('Signal sync failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanics = async () => {
    const { data } = await supabase.from('mechanics').select('*').eq('status', 'available');
    setMechanics(data || []);
  };

  const handleStatusUpdate = async (requestId, newStatus, customMessage = '') => {
    const { data: { session } } = await supabase.auth.getSession();
    const isDevAdmin = localStorage.getItem('dev_admin') === 'true';

    try {
      await axios.patch(`/api/admin/bookings/${requestId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': isDevAdmin }
      });

      const messages = {
        accepted: 'Signal Received: Unit cleared for assignment.',
        in_progress: 'Operational: Mission in progress.',
        ready: 'Quality Check: Unit ready for handoff.',
        delivered: 'Accomplished: Unit delivered.'
      };

      await axios.post('/api/admin/status-updates', {
        booking_id: requestId,
        status: newStatus,
        message: customMessage || messages[newStatus] || `Phase: ${newStatus}`,
        updated_by: 'admin'
      }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': isDevAdmin }
      });

      toast.success(`Phase: ${newStatus}`);
      fetchRequests();
    } catch (err) {
      console.error('❌ STATUS ERROR:', err);
      toast.error('Update failed');
    }
  };

  const handleAssign = async (requestId) => {
    const mechanicId = selectedMechanics[requestId];
    if (!mechanicId) return toast.error('Select an operative');
    const { data: { session } } = await supabase.auth.getSession();
    try {
      await axios.patch(`/api/admin/bookings/${requestId}`, { mechanic_id: mechanicId, status: 'picked_up' }, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': true }
      });
      toast.success('Operative Assigned');
      handleStatusUpdate(requestId, 'picked_up', 'Lead Operative Assigned: Mission commenced.');
    } catch (err) { toast.error('Assignment failed'); }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'pending') return requests.filter(r => r.status === 'pending');
    if (activeTab === 'active') return requests.filter(r => !['pending', 'delivered', 'rejected', 'user_cancelled'].includes(r.status));
    if (activeTab === 'completed') return requests.filter(r => r.status === 'delivered');
    return requests;
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase font-bold animate-pulse">Syncing Requests...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white italic"><Zap className="inline mr-2 text-primary" /> MISSION REQUESTS</h1>
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
          {['pending', 'active', 'completed'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-1.5 rounded-md text-[10px] font-bold uppercase ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-500'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {getFilteredRequests().map((req) => (
          <div key={req.id} className="glass-panel p-8 border-white/5">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex justify-between">
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative group">
                    {req.vehicle_photo || req.vehicles?.image_url ? (
                      <img src={req.vehicle_photo || req.vehicles?.image_url} alt="Intel" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><Camera size={48} /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white uppercase italic">{req.profiles?.name}</h3>
                    <p className="text-[10px] text-primary font-bold uppercase">{req.vehicles?.brand} {req.vehicles?.model}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Mission Ref</p>
                    <p className="text-xs font-mono text-white">[{req.booking_ref}]</p>
                  </div>
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-xs text-gray-400 italic">"{req.issue_description}"</div>

                <div className="flex flex-col gap-4 pt-4">
                  {req.status === 'pending' && (
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'accepted')} 
                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-glow-purple flex items-center justify-center gap-2"
                      >
                        <Zap size={18} /> ACCEPT SIGNAL
                      </button>
                      <button 
                        onClick={async () => {
                          if(!window.confirm('Abort this mission request?')) return;
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            await axios.patch(`/api/admin/bookings/${req.id}`, 
                              { status: 'rejected' },
                              { headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': 'true' } }
                            );
                            toast.success('Mission Aborted');
                            fetchRequests();
                          } catch (err) {
                            toast.error('Abort failed');
                          }
                        }}
                        className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <X size={18} /> REJECT
                      </button>
                    </div>
                  )}
                  {req.status === 'confirmed' && (
                    <div className="flex gap-4 w-full">
                      <select className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" value={selectedMechanics[req.id] || ''} onChange={(e) => setSelectedMechanics({...selectedMechanics, [req.id]: e.target.value})}>
                        <option value="">Select Operative</option>
                        {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAssign(req.id)} 
                          className="px-6 py-3 bg-secondary text-dark rounded-xl text-[10px] font-bold uppercase shadow-glow-blue flex items-center gap-2"
                        >
                          <UserPlus size={16} /> Deploy
                        </button>
                        <button 
                          onClick={async () => {
                            if(!window.confirm('Abort this mission request?')) return;
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              await axios.patch(`/api/admin/bookings/${req.id}`, 
                                { status: 'rejected' },
                                { headers: { Authorization: `Bearer ${session.access_token}`, 'x-dev-admin': 'true' } }
                              );
                              toast.success('Mission Aborted');
                              fetchData();
                            } catch (err) {
                              toast.error('Abort failed');
                            }
                          }}
                          className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                  {!['pending', 'confirmed', 'delivered'].includes(req.status) && (
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 animate-pulse">Operational Phase Active</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRequests;
