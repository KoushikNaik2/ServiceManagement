import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Please confirm your email first — check your inbox for a verification link.', { duration: 6000 });
      } else if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid credentials')) {
        toast.error('Incorrect email or password. Please try again.');
      } else {
        toast.error(error.message);
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)]"></div>
      <div className="glass-panel w-full max-w-md p-10 border-white/5 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/50 shadow-glow-purple mb-4">
            <Shield className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white">SERVICE<span className="text-primary">POINT</span></h1>
          <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">Access Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Identity (Email)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all" placeholder="name@domain.com" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Access Key (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] shadow-glow-purple hover:bg-primary/80 transition-all flex items-center justify-center gap-2 mt-6">
            {loading ? 'Verifying...' : <>Initiate Access <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          New Operative? <Link to="/register" className="text-primary font-bold hover:text-primary-glow transition-all">Create Account</Link>
        </p>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-[0.2em]">Developer Access</p>
          <button 
            type="button"
            onClick={() => {
              const current = localStorage.getItem('dev_admin') === 'true';
              localStorage.setItem('dev_admin', !current);
              window.location.reload();
            }}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              localStorage.getItem('dev_admin') === 'true' 
                ? 'bg-secondary text-white shadow-glow-blue' 
                : 'bg-white/5 text-gray-500 border border-white/10'
            }`}
          >
            {localStorage.getItem('dev_admin') === 'true' ? 'Mode: ADMIN' : 'Mode: USER'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Login;
