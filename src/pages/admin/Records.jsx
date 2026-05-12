import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  Sparkles,
  ChevronDown,
  Loader2,
  TrendingUp,
  CreditCard,
  User,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { aiService } from '../../lib/ai';
import { enrichBookings } from '../../lib/enrichBookings';

const AdminRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, vehicles(*), mechanics(*)')
        .in('status', ['delivered', 'user_cancelled', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];
      await enrichBookings(rows, { profiles: true });
      setRecords(rows);
    } catch (err) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const generateAiReport = async () => {
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    try {
      const report = await aiService.getMonthlyReport(records);
      setAiReport(report);
    } catch (err) {
      setAiReport('System failed to process records. Try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanent data erasure?')) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Record purged');
      fetchRecords();
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  const filteredRecords = records.filter(r => 
    (r.booking_ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.profiles?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.vehicles?.nickname || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse space-y-8"><div className="h-64 bg-white/5 rounded-2xl"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
            <FileText className="text-secondary w-8 h-8" /> OPERATIONAL RECORDS
          </h1>
          <p className="text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Encrypted Archive & Mission Logs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={generateAiReport} className="btn-primary flex items-center gap-2 bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary hover:text-white shadow-glow-blue">
            <Sparkles size={18} /> GENERATE ANALYTICS
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Filter archive by ref, customer, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-secondary/50"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Displaying {filteredRecords.length} of {records.length} logs</span>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-panel overflow-hidden border-white/5 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#050505] border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Reference</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Target Vehicle</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Operative</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Final Cost</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white mb-1">{item.booking_ref}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white">{item.profiles?.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-300">{item.vehicles?.nickname}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-mono">{item.vehicles?.number}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {item.mechanics?.name || '---'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white">₹{(item.final_cost || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-widest border ${
                      item.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      item.status === 'user_cancelled' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {item.status.replace('user_', '')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md" onClick={() => setIsAiModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-secondary/30 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-white/10 bg-secondary/5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 text-secondary uppercase">
                <Sparkles /> Strategic Analysis Report
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-500 hover:text-white">
                <ChevronDown size={24} />
              </button>
            </div>
            <div className="p-8">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] animate-pulse">Aggregating Data Signals...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl leading-relaxed text-gray-300 text-sm font-medium">
                    {aiReport}
                  </div>
                  <button onClick={() => setIsAiModalOpen(false)} className="w-full btn-secondary py-4 uppercase font-bold tracking-widest">Acknowledge</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecords;
