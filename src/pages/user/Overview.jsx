import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Car, CheckCircle2, Zap, TrendingUp, Sparkles, Activity, Loader2, WifiOff } from 'lucide-react';
import { aiService } from '../../lib/ai';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-panel p-6 border-white/5 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 transition-all duration-500`} style={{background: `var(--color-${color}, rgba(139,92,246,0.1))`}}></div>
    <div className="flex items-center gap-4 relative z-10">
      <div className="p-3 bg-white/10 rounded-xl border border-white/20">
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-bold text-white tracking-tighter mt-1">{value}</h3>
      </div>
    </div>
  </div>
);

const UserOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeVehicles: 0, inProgress: 0, completed: 0, healthScore: 85 });
  const [vehicles, setVehicles] = useState([]);
  const [feed, setFeed] = useState([]);
  const [aiInsight, setAiInsight] = useState('');
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'loading' | 'ok' | 'error'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      const [vRes, bRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('user_id', user.id),
        supabase.from('bookings').select('*').eq('user_id', user.id)
      ]);

      if (vRes.error) throw vRes.error;
      if (bRes.error) throw bRes.error;

      const vehicleData = vRes.data || [];
      const bookingData = bRes.data || [];

      // Fetch activity feed — filter by booking_id matching user's bookings
      const bookingIds = bookingData.map(b => b.id);
      let feedData = [];
      if (bookingIds.length > 0) {
        const { data: fd } = await supabase
          .from('status_updates')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false })
          .limit(8);
        feedData = fd || [];
      }

      const inProgress = bookingData.filter(b => !['delivered', 'user_cancelled', 'rejected'].includes(b.status)).length;
      const completed = bookingData.filter(b => b.status === 'delivered').length;

      setVehicles(vehicleData);
      setStats({ activeVehicles: vehicleData.length, inProgress, completed, healthScore: 85 });
      setFeed(feedData);

      if (vehicleData.length > 0) {
        fetchAiInsight(vehicleData, bookingData);
      }
    } catch (err) {
      console.error('Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsight = async (vData, bData) => {
    setAiStatus('loading');
    try {
      const insight = await aiService.getInsight(vData, bData);
      setAiInsight(insight || '');
      setAiStatus('ok');
    } catch (err) {
      console.warn('AI insight unavailable:', err.message);
      setAiStatus('error');
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-xs uppercase tracking-widest font-bold">Synchronizing neural data...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* AI Insight Banner */}
      {aiStatus === 'loading' && (
        <div className="glass-panel p-4 border-primary/20 bg-primary/5 flex items-center gap-3 animate-pulse">
          <Loader2 className="text-primary animate-spin flex-shrink-0" size={18} />
          <p className="text-xs text-gray-400 uppercase tracking-widest">Neural AI synthesizing vehicle insight...</p>
        </div>
      )}
      {aiStatus === 'ok' && aiInsight && (
        <div className="glass-panel p-4 border-primary/30 bg-primary/5 flex items-start gap-3">
          <Sparkles className="text-primary flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-gray-200 italic leading-relaxed">"{aiInsight}"</p>
        </div>
      )}
      {aiStatus === 'error' && (
        <div className="glass-panel p-4 border-orange-500/20 bg-orange-500/5 flex items-center gap-3">
          <WifiOff className="text-orange-500 flex-shrink-0" size={18} />
          <p className="text-xs text-orange-400 uppercase tracking-widest">Neural link offline — AI insight unavailable. Check server connection.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Car} label="Active Vehicles" value={stats.activeVehicles} color="primary" />
        <StatCard icon={Zap} label="In Progress" value={stats.inProgress} color="secondary" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="green" />
        <StatCard icon={TrendingUp} label="Health Score" value={`${stats.healthScore}%`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vehicle Roster */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Car className="text-primary" size={20} /> Units Roster
          </h2>
          {vehicles.length === 0 ? (
            <div className="glass-panel p-8 border-white/5 text-center text-gray-600 italic">
              No vehicles registered. Add one in the "My Vehicles" section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map(v => (
                <div key={v.id} className="glass-panel p-5 border-white/5 hover:border-primary/30 transition-all">
                  <h3 className="font-bold text-white">{v.nickname}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{v.brand} {v.model}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Plate</span>
                    <span className="text-[10px] text-primary font-mono">{v.number}</span>
                    <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{v.ai_health_status || 'Good'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Activity className="text-secondary" size={20} /> Neural Feed
          </h2>
          <div className="glass-panel border-white/5 p-4 h-[300px] overflow-y-auto space-y-4 scrollbar-thin">
            {feed.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 italic text-xs text-center">
                No activity signals yet. Book a service to begin.
              </div>
            ) : (
              feed.map(item => (
                <div key={item.id} className="relative pl-6 border-l border-white/10 pb-4 last:pb-0">
                  <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-secondary rounded-full shadow-glow-blue"></div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{(item.status || '').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.message}</p>
                  <p className="text-[9px] text-gray-600 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default UserOverview;
