import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Shield, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email: formData.email, 
      password: formData.password,
      options: { 
        data: { 
          name: formData.fullName, 
          phone: formData.phone 
        } 
      }
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else if (data?.user) {
      toast.success('Registration successful! Accessing base...');
      navigate('/login');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark relative overflow-hidden">
      <div className="glass-panel w-full max-w-md p-10 border-white/5 relative z-10">
        <h1 className="text-3xl font-bold tracking-tighter text-white text-center mb-2 uppercase">Create Operative</h1>
        <p className="text-xs text-gray-500 text-center uppercase tracking-widest font-bold mb-8">Join the ServicePoint Network</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-glow-purple hover:bg-primary/80 transition-all flex items-center justify-center gap-2 mt-6">
            <UserPlus size={18} /> Register Operative
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Already Registered? <Link to="/login" className="text-primary font-bold hover:text-primary-glow">Access Base</Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
