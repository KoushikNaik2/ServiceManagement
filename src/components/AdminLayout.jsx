import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, 
  Inbox, 
  Calculator, 
  Activity, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldAlert,
  Bot
} from 'lucide-react';

const AdminLayout = () => {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingCount();
    
    const channel = supabase.channel('sidebar_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingCount(count || 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin' },
    { icon: Inbox, label: 'Requests', path: '/admin/requests', badge: pendingCount },
    { icon: Calculator, label: 'Estimation', path: '/admin/estimation' },
    { icon: Activity, label: 'Live Status', path: '/admin/status' },
    { icon: FileText, label: 'Records', path: '/admin/records' },
    { icon: Users, label: 'Mechanics', path: '/admin/mechanics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-dark overflow-hidden font-outfit">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative z-50 w-72 h-full bg-[#050505] border-r border-white/5 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-6 lg:hidden">
          <span className="text-xl font-bold text-white tracking-tighter">SERVICE<span className="text-secondary">POINT</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex flex-col h-full">
          <NavLink to="/admin" className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center border border-secondary/50 shadow-glow-blue">
              <ShieldAlert className="text-secondary w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">SERVICE<span className="text-secondary">POINT</span></span>
          </NavLink>
          <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                end={item.path === '/admin'} 
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-glow-blue' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-secondary text-dark text-[10px] font-bold rounded-full shadow-glow-blue">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
            
            <div className="mt-8 pt-4 border-t border-white/5">
              <p className="px-4 mb-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Navigation</p>
              <NavLink to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/50 bg-primary/5">
                <Bot size={20} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Switch to User View</span>
              </NavLink>
            </div>
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">{profile?.name?.charAt(0) || 'A'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{profile?.name || 'Admin'}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Commander Access</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#050505]/50 backdrop-blur-md border-b border-white/5 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-lg border border-white/10 text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <NavLink 
              to="/" 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all group"
            >
              <Activity size={14} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Return to Operations</span>
            </NavLink>
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Command Center Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-glow-blue"></div>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Secure Uplink Verified</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

