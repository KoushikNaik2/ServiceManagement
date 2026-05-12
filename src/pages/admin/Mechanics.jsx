import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Star, 
  Wrench, 
  CheckCircle2, 
  Clock,
  X,
  Loader2,
  Filter,
  Search,
  Zap,
  Briefcase,
  ShieldAlert,
  Mail,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../../lib/upload';

const AdminMechanics = () => {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'General', // Synchronized with DB
    status: 'available',
    years_experience: 0,
    profile_photo: ''
  });

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from('mechanics')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setMechanics(data || []);
    } catch (err) {
      toast.error('Failed to load mechanics');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Syncing profile photo...');
    try {
      const publicUrl = await uploadFile(file);
      setFormData({ ...formData, profile_photo: publicUrl });
      toast.success('Photo synchronized', { id: toastId });
    } catch (err) {
      toast.error('Uplink failed. Ensure "media" bucket exists.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (mechanic = null) => {
    if (mechanic) {
      setEditingMechanic(mechanic);
      setFormData({
        name: mechanic.name,
        email: mechanic.email || '',
        phone: mechanic.phone,
        specialty: mechanic.specialty || mechanic.specialization || 'General',
        status: mechanic.status,
        years_experience: mechanic.years_experience,
        profile_photo: mechanic.profile_photo || ''
      });
    } else {
      setEditingMechanic(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: 'General',
        status: 'available',
        years_experience: 0,
        profile_photo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const isDevAdmin = localStorage.getItem('dev_admin') === 'true';
    const config = {
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'x-dev-admin': isDevAdmin
      }
    };

    try {
      const payload = {
        ...formData,
        specialization: formData.specialty // Sending both to be bulletproof
      };

      if (editingMechanic) {
        await axios.patch(`/api/admin/mechanics/${editingMechanic.id}`, payload, config);
        toast.success('Mechanic Profile Updated');
      } else {
        await axios.post('/api/admin/mechanics', payload, config);
        toast.success('New Operative Registered');
      }

      setIsModalOpen(false);
      fetchMechanics();
    } catch (err) {
      console.error('❌ FULL SUBMISSION ERROR:', err.response?.data || err);
      toast.error(err.response?.data?.error || 'Registration failed. Check Terminal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mechanic) => {
    if (mechanic.status === 'busy') {
      toast.error('Cannot remove operative during active mission');
      return;
    }

    if (!confirm(`Purge operative ${mechanic.name} from the roster?`)) return;

    const { data: { session } } = await supabase.auth.getSession();
    const isDevAdmin = localStorage.getItem('dev_admin') === 'true';

    try {
      await axios.delete(`/api/admin/mechanics/${mechanic.id}`, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'x-dev-admin': isDevAdmin
        }
      });
      toast.success('Operative purged');
      fetchMechanics();
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  const filteredMechanics = mechanics.filter(m => {
    if (activeFilter === 'All') return true;
    return m.status === activeFilter.toLowerCase().replace(' ', '_');
  });

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500 uppercase tracking-widest font-bold animate-pulse">Syncing Operative Database...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3 italic">
            <Users className="text-secondary w-8 h-8" /> EXTRACTION UNITS
          </h1>
          <p className="text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Operative Personnel & Field Experts</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-secondary text-white rounded-xl shadow-glow-blue flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
        >
          <Plus size={18} /> REGISTER OPERATIVE
        </button>
      </div>

      <div className="flex bg-[#050505] rounded-lg p-1 border border-white/10 w-fit">
        {['All', 'Available', 'Busy', 'Off Duty'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeFilter === tab ? 'bg-secondary text-dark shadow-glow-blue' : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMechanics.map((mech) => (
          <div key={mech.id} className="glass-panel group border-white/5 hover:border-secondary/30 transition-all duration-500 overflow-hidden relative">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-2xl shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                  {mech.profile_photo ? (
                    <img src={mech.profile_photo} alt={mech.name} className="w-full h-full object-cover" />
                  ) : (
                    mech.name.charAt(0)
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(mech)} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(mech)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight uppercase italic">{mech.name}</h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{mech.specialty || mech.specialization} Specialist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-gray-500" />
                      <span className="text-[10px] text-gray-400 font-medium">{mech.email || 'no-email@servicepoint.ai'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                  <div>
                    <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest mb-1">Missions</p>
                    <p className="text-sm font-bold text-white">{mech.total_jobs_completed || 0}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest mb-1">Experience</p>
                    <p className="text-sm font-bold text-white">{mech.years_experience} Yrs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="text-yellow-500 fill-yellow-500" size={14} />
                    <span className="text-xs font-bold text-white">{mech.avg_rating || '5.0'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      mech.status === 'available' ? 'bg-green-500 shadow-glow-green animate-pulse' : 
                      mech.status === 'busy' ? 'bg-secondary shadow-glow-blue' : 'bg-gray-600'
                    }`}></div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      mech.status === 'available' ? 'text-green-500' : 
                      mech.status === 'busy' ? 'text-secondary' : 'text-gray-600'
                    }`}>
                      {mech.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <a 
                  href={`tel:${mech.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/20 hover:border-secondary/30 hover:text-secondary transition-all mt-4"
                >
                  <Phone size={14} /> Establish Comms
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mechanic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-secondary/5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-3 italic">
                <Users className="text-secondary" /> {editingMechanic ? 'EDIT OPERATIVE' : 'REGISTER OPERATIVE'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-secondary/50 outline-none transition-all" placeholder="Vikram Singh" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-secondary/50 outline-none transition-all" placeholder="vikram@ai.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Phone *</label>
                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-secondary/50 outline-none transition-all" placeholder="98765..." />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Field Specialty</label>
                  <textarea value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-secondary/50 outline-none transition-all h-20 resize-none" placeholder="e.g. Master Engine Tuner" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Experience (Yrs)</label>
                    <input type="number" value={formData.years_experience} onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-secondary/50 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Current Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-secondary/50 outline-none transition-all">
                      <option value="available">Available for Mission</option>
                      <option value="busy">Busy / In Mission</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="away">Away / On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Profile Photo (Gallery)</label>
                <div className="relative group aspect-square w-48 mx-auto bg-white/5 border-2 border-dashed border-white/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center hover:border-secondary/30 transition-all">
                  {formData.profile_photo ? (
                    <>
                      <img src={formData.profile_photo} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="cursor-pointer px-4 py-2 bg-secondary text-dark rounded-lg text-[10px] font-bold uppercase tracking-widest">Change Photo</label>
                      </div>
                    </>
                  ) : (
                    <>
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="text-secondary animate-spin" size={32} />
                          <p className="text-[8px] font-bold text-secondary uppercase tracking-widest">Syncing...</p>
                        </div>
                      ) : (
                        <>
                          <Camera className="text-gray-500 mb-2" size={32} />
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center px-4">Choose from Gallery</p>
                        </>
                      )}
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-bold text-gray-600 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting || isUploading} className="flex-2 py-4 bg-secondary text-dark rounded-xl text-xs font-bold uppercase tracking-widest shadow-glow-blue hover:scale-[1.02] transition-all disabled:opacity-50 px-8">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : editingMechanic ? 'Update Profile' : 'Initialize Operative'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMechanics;
