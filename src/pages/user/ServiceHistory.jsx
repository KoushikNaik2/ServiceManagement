import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  FileText, 
  Star, 
  Filter, 
  Sparkles,
  ChevronDown,
  Loader2,
  TrendingUp,
  CreditCard,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { aiService } from '../../lib/ai';
import { enrichBookings } from '../../lib/enrichBookings';

const ServiceHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [stats, setStats] = useState({
    totalServices: 0,
    totalSpent: 0,
    avgCost: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, activeTab, history]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['delivered', 'user_cancelled', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];
      await enrichBookings(rows, { mechanics: true });
      setHistory(rows);
      
      // Calculate stats
      const completed = rows.filter((b) => b.status === 'delivered');
      const totalSpent = completed.reduce((sum, b) => sum + (b.final_cost || 0), 0);
      setStats({
        totalServices: completed.length,
        totalSpent,
        avgCost: completed.length > 0 ? Math.round(totalSpent / completed.length) : 0
      });
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let data = [...history];
    
    if (activeTab !== 'All') {
      const statusMap = {
        'Completed': ['delivered'],
        'Cancelled': ['user_cancelled'],
        'Rejected': ['rejected']
      };
      data = data.filter(b => statusMap[activeTab].includes(b.status));
    }

    if (searchTerm) {
      data = data.filter(b => 
        (b.booking_ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.vehicles?.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.ai_recommended_service || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHistory(data);
  };

  const generateAiReport = async () => {
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    try {
      const report = await aiService.getMonthlyReport(history);
      setAiReport(report);
    } catch (err) {
      setAiReport('Failed to generate report. Please try again later.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanent data erasure: Confirm deletion of this record?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record purged');
      fetchHistory();
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  const clearAll = async () => {
    if (!confirm('EXTREME WARNING: Purge all historical records? This cannot be undone.')) return;
    if (!confirm('FINAL CONFIRMATION: Are you absolutely sure?')) return;
    
    try {
      const { error } = await supabase.from('bookings').delete().eq('user_id', user.id).in('status', ['delivered', 'user_cancelled', 'rejected']);
      if (error) throw error;
      toast.success('All history records purged');
      fetchHistory();
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  if (loading) return <div className="animate-pulse space-y-8"><div className="h-64 bg-white/5 rounded-2xl"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
            <History className="text-primary w-8 h-8" /> ARCHIVED MISSIONS
          </h1>
          <p className="text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Historical Data & Analytics Logs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={generateAiReport} className="btn-primary flex items-center gap-2 bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-white shadow-glow-purple">
            <Sparkles size={18} /> AI ANALYSIS
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-white/5 bg-white/5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Target className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Missions</p>
            <p className="text-2xl font-bold text-white tracking-tighter">{stats.totalServices}</p>
          </div>
        </div>
        <div className="glass-panel p-6 border-white/5 bg-white/5 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
            <CreditCard className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Expenditure</p>
            <p className="text-2xl font-bold text-white tracking-tighter">₹{stats.totalSpent.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-panel p-6 border-white/5 bg-white/5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <TrendingUp className="text-purple-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Avg Mission Cost</p>
            <p className="text-2xl font-bold text-white tracking-tighter">₹{stats.avgCost.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex bg-dark rounded-lg p-1 border border-white/10">
          {['All', 'Completed', 'Cancelled', 'Rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === tab ? 'bg-primary text-white shadow-glow-purple' : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <button onClick={clearAll} className="text-xs font-bold text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors px-4 py-2">
          Purge All Records
        </button>
      </div>

      {/* History Table */}
      <div className="glass-panel overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Ref & Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Target</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Mission Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Operative</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Cost</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white mb-1">{item.booking_ref}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-white">{item.vehicles?.nickname}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{item.vehicles?.number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-primary">{item.ai_recommended_service}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-300">
                    {item.mechanics?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white">₹{(item.final_cost || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-widest border ${
                      item.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      item.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {item.status === 'delivered' ? 'Completed' : item.status === 'user_cancelled' ? 'Cancelled' : 'Rejected'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-gray-600">
                    <div className="flex flex-col items-center">
                      <History size={48} className="mb-4 opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-widest">No matching mission logs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Report Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/80 backdrop-blur-md" onClick={() => setIsAiModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-dark-card border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-primary/5">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                <Sparkles className="text-primary" /> AI ANALYTICS REPORT
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-white">
                <ChevronDown size={24} />
              </button>
            </div>
            <div className="p-8">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
                  </div>
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">Processing Mission Data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl leading-relaxed text-gray-200">
                    {aiReport}
                  </div>
                  <button onClick={() => setIsAiModalOpen(false)} className="w-full btn-primary">ACKNOWLEDGE</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
