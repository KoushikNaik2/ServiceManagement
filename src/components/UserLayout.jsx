import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Car, 
  Wrench, 
  Activity, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bot
} from 'lucide-react';
import AIAssistant from './AIAssistant';

const UserLayout = () => {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Car, label: 'My Vehicles', path: '/vehicles' },
    { icon: Wrench, label: 'Book Service', path: '/book' },
    { icon: Activity, label: 'Live Status', path: '/status' },
    { icon: History, label: 'Service History', path: '/history' },
    { icon: Settings, label: 'Preferences', path: '/preferences' },
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
          <span className="text-xl font-bold text-white tracking-tighter">SERVICE<span className="text-primary">POINT</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex flex-col h-full">
          <NavLink to="/" className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/50 shadow-glow-purple">
              <Wrench className="text-primary w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">SERVICE<span className="text-primary">POINT</span></span>
          </NavLink>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                end={item.path === '/'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-glow-purple' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}

            {(profile?.role === 'admin' || localStorage.getItem('dev_admin') === 'true') && (
              <NavLink to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-secondary hover:bg-secondary/10 border border-transparent hover:border-secondary/30 mt-8">
                <Bot size={20} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Switch to Admin Panel</span>
              </NavLink>
            )}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{profile?.name?.charAt(0) || 'U'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{profile?.name || 'User'}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Standard Account</p>
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
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-glow-green"></div>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Neural Link Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
          <Outlet />
        </div>

        <AIAssistant />
      </main>
    </div>
  );
};

export default UserLayout;
