import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart3, Inbox, Zap, TrendingUp, AlertCircle, Sparkles, Activity, Clock, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { aiService } from '../../lib/ai';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ pending: 0, active: 0, completedToday: 0, revenueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => { 
    fetchDashboardData(); 
    fetchRecentLogs();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isDevAdmin = localStorage.getItem('dev_admin') === 'true';
      const response = await axios.get('/api/admin/stats', {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'x-dev-admin': isDevAdmin
        }
      });
      
      setStats(response.data);
      setRevenueData([
        {name: 'Mon', rev: response.data.revenueToday * 0.1}, 
        {name: 'Tue', rev: response.data.revenueToday * 0.15}, 
        {name: 'Wed', rev: response.data.revenueToday * 0.2}, 
        {name: 'Thu', rev: response.data.revenueToday * 0.18}, 
        {name: 'Fri', rev: response.data.revenueToday * 0.25}, 
        {name: 'Sat', rev: response.data.revenueToday * 0.12}, 
        {name: 'Sun', rev: response.data.revenueToday}
      ]);

      // Generate AI Insight
      const insight = await aiService.getDashboardInsight(response.data);
      setAiInsight(insight);

    } catch (err) { 
      console.error('Dashboard Fetch Error:', err); 
      // Fallback
      const { data: bookings } = await supabase.from('bookings').select('status, final_cost');
      if (bookings) {
        setStats({
          pending: bookings.filter(b => b.status === 'pending').length,
          active: bookings.filter(b => !['pending', 'delivered', 'user_cancelled', 'rejected'].includes(b.status)).length,
          completedToday: bookings.filter(b => b.status === 'delivered').length,
          revenueToday: bookings.reduce((sum, b) => sum + (b.final_cost || 0), 0)
        });
      }
    } finally { 
      setLoading(false); 
    }
  };

  const fetchRecentLogs = async () => {
    const { data } = await supabase
      .from('status_updates')
      .select('*, bookings(booking_ref, vehicles(nickname))')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentLogs(data || []);
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase font-bold animate-pulse">Synchronizing Telemetry...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter uppercase text-white italic flex items-center gap-3">
          <Activity className="text-secondary" /> Operational Dashboard
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Core Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-secondary/20 bg-secondary/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Inbox size={80} /></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Signals</p>
          <h3 className="text-3xl font-bold text-white">{(stats?.pending || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 border-primary/20 bg-primary/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Zap size={80} /></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Deployments</p>
          <h3 className="text-3xl font-bold text-white">{(stats?.active || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 border-green-500/20 bg-green-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={80} /></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Missions Completed</p>
          <h3 className="text-3xl font-bold text-white">{(stats?.completedToday || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Daily Extraction Value</p>
          <h3 className="text-3xl font-bold text-white text-secondary">₹{(stats?.revenueToday || 0).toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 border-white/5 bg-white/5">
          <h2 className="text-xl font-bold mb-8 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={20} className="text-secondary" /> Revenue Flow (Weekly)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} />
                <Area type="monotone" dataKey="rev" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {aiInsight && (
            <div className="mt-8 p-6 bg-secondary/5 border border-secondary/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <Sparkles size={14} /> Strategic Insight
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed italic font-medium">"{aiInsight}"</p>
            </div>
          )}
        </div>

        <div className="glass-panel p-8 border-white/5 bg-white/5 flex flex-col">
          <h2 className="text-xl font-bold mb-8 uppercase tracking-widest flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Recent Mission Updates
          </h2>
          <div className="space-y-6 flex-1">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="relative pl-6 border-l border-white/10 group">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary shadow-glow-purple group-hover:scale-125 transition-transform"></div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                  {log.bookings?.booking_ref} • {log.bookings?.vehicles?.nickname}
                </p>
                <p className="text-xs text-white font-medium mb-1">{log.message}</p>
                <p className="text-[8px] text-gray-600 font-bold uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-700">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-[10px] uppercase font-bold tracking-widest italic">No active signals detected</p>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            View All Records
          </button>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;

