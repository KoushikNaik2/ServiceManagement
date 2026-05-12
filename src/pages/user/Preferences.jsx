import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  Mail, 
  Phone, 
  Bell, 
  Shield, 
  Trash2, 
  Save, 
  Lock,
  Loader2,
  Calendar,
  Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Preferences = () => {
  const { profile, user, fetchProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    notification_email: profile?.notification_email ?? true
  });

  useEffect(() => {
    if (profile && !hasLoaded) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        notification_email: profile.notification_email ?? true
      });
      setHasLoaded(true);
    }
  }, [profile, hasLoaded]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh the global auth state
      await fetchProfile(user.id);
      toast.success('System profile updated');
    } catch (err) {
      console.error('❌ PROFILE UPDATE ERROR:', err);
      toast.error('Update failed: ' + (err.message || 'Check database columns'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('DANGER ZONE: Type "DELETE" to permanently erase your operative profile and all vehicle data.');
    if (confirmation !== 'DELETE') return;

    toast.loading('Purging data...');
    try {
      // In a real app, you'd use a server-side function to delete the auth user too
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
          <Settings size={32} className="text-primary" /> SETTINGS
        </h1>
        <p className="text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Operative Profile & Security Configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="glass-panel p-8 border-white/5">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User className="text-primary" size={20} /> OPERATIVE IDENTITY
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Phone Line</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Primary Email (Read-Only)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="email" value={user?.email} readOnly className="input-field pl-10 opacity-50 cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

const Settings = ({ size, className }) => <Shield size={size} className={className} />;

export default Preferences;
