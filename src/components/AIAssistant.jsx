import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Minimize2, Sparkles, User, Wrench, Car, Zap } from 'lucide-react';
import { aiService } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Neural link established. I am your ServicePoint Intelligence. How can I assist with your fleet today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({ vehicles: [], bookings: [] });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) fetchUserContext();
  }, [user?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchUserContext = async () => {
    try {
      const [vRes, bRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('user_id', user.id),
        supabase.from('bookings').select('*, vehicles(*)').eq('user_id', user.id)
      ]);
      setContext({ vehicles: vRes.data || [], bookings: bRes.data || [] });
    } catch (err) {
      console.error('Neural context acquisition failed:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build an enhanced prompt with context for better answers
      const enhancedContext = `
        User Vehicles: ${context.vehicles.map(v => `${v.brand} ${v.model} (${v.nickname})`).join(', ')}
        Recent Service History: ${context.bookings.slice(0, 3).map(b => `${b.vehicles?.nickname}: ${b.ai_recommended_service} (${b.status})`).join('; ')}
      `;
      
      const response = await aiService.chat(input, [...messages, { role: 'system', content: enhancedContext }]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      toast.error('Neural Link Interrupted');
      setMessages(prev => [...prev, { role: 'assistant', content: 'My neural processors are currently recalibrating. Please attempt uplink again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary rounded-full shadow-glow-purple flex items-center justify-center text-white hover:scale-110 transition-all z-50 group"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark animate-pulse"></div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-[#050505] border border-primary/30 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-glow-purple">
            <Bot size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Neural Link</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Llama-3 Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl flex gap-3 ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'}`}>
              {msg.role === 'assistant' && <Sparkles size={16} className="text-primary mt-1 flex-shrink-0" />}
              <div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setInput("What services do you offer?")} className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all">Services</button>
        <button onClick={() => setInput("Estimate oil change cost")} className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all">Cost Guide</button>
        <button onClick={() => setInput("My vehicle health")} className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all">Health Status</button>
      </div>

      {/* Footer */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-[#080808]">
        <div className="relative">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Transmit command to neural network..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-gray-600 font-medium"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1.5 p-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-purple"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[9px] text-center text-gray-600 mt-2 font-bold uppercase tracking-[0.2em]">Neural Encryption Active • ServicePoint AI</p>
      </form>
    </div>
  );
};

export default AIAssistant;
