import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const publicJs = path.join(projectRoot, 'public', 'js');

// 1. Create supabaseClient.js for frontend
const supabaseClientCode = `
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing frontend Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
fs.writeFileSync(path.join(publicJs, 'supabaseClient.js'), supabaseClientCode.trim());

// 2. Rewrite components to be standard exports, remove ReactDOM.render, and replace href with navigate/Link
const filesToConvert = [
  'index.jsx',
  'login.jsx',
  'register.jsx',
  'user-dashboard.jsx',
  'admin-dashboard.jsx',
  'book-service.jsx',
  'track-status.jsx',
  'history.jsx'
];

filesToConvert.forEach(file => {
  const filePath = path.join(publicJs, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add react-router-dom imports if needed
  if (!content.includes('react-router-dom')) {
    content = content.replace("import React", "import { useNavigate, Link } from 'react-router-dom';\nimport React");
  }

  // Replace ReactDOM.createRoot...
  content = content.replace(/ReactDOM\.createRoot.*?render\([^)]+\);/gs, '');

  // Add export default at the bottom
  const componentName = file === 'index.jsx' ? 'LandingPage' :
                        file === 'login.jsx' ? 'Login' :
                        file === 'register.jsx' ? 'Register' :
                        file === 'user-dashboard.jsx' ? 'UserDashboard' :
                        file === 'admin-dashboard.jsx' ? 'AdminDashboard' :
                        file === 'book-service.jsx' ? 'BookService' :
                        file === 'track-status.jsx' ? 'TrackStatus' :
                        file === 'history.jsx' ? 'History' : 'Component';

  if (!content.includes('export default')) {
    content += `\nexport default ${componentName};\n`;
  }

  // Replace `window.location.href = '/...html'` with navigate
  content = content.replace(/window\.location\.href\s*=\s*(['"`])\/([a-zA-Z0-9-]+)\.html(['"`])/g, "navigate('/$2')");
  
  // Replace <a href="/...html"> with <Link to="/...">
  content = content.replace(/<a href=(['"`])\/([a-zA-Z0-9-]+)\.html(['"`])/g, "<Link to='/$2'");
  content = content.replace(/<\/a>/g, "</Link>");

  // Ensure useNavigate is initialized if we added navigate
  if (content.includes('navigate(') && !content.includes('const navigate')) {
    const componentRegex = new RegExp(`const ${componentName} =.*?{`);
    content = content.replace(componentRegex, match => `${match}\n  const navigate = useNavigate();\n`);
  }

  fs.writeFileSync(filePath, content);
});

// 3. Create App.jsx
const appCode = `
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import LandingPage from './index.jsx';
import Login from './login.jsx';
import Register from './register.jsx';
import UserDashboard from './user-dashboard.jsx';
import AdminDashboard from './admin-dashboard.jsx';
import BookService from './book-service.jsx';
import TrackStatus from './track-status.jsx';
import History from './history.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      // Get role from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profile && profile.role === requiredRole) {
        setIsAllowed(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [requiredRole]);

  if (loading) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading Security clearance...</div>;
  }

  return isAllowed ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/user/overview" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
        <Route path="/user-dashboard" element={<Navigate to="/user/overview" replace />} />
        <Route path="/book-service" element={<ProtectedRoute requiredRole="user"><BookService /></ProtectedRoute>} />
        <Route path="/track-status" element={<ProtectedRoute requiredRole="user"><TrackStatus /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute requiredRole="user"><History /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
`;
fs.writeFileSync(path.join(publicJs, 'App.jsx'), appCode.trim());

// 4. Create main.jsx
const mainCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../css/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
fs.writeFileSync(path.join(publicJs, 'main.jsx'), mainCode.trim());

// 5. Update index.html
const indexPath = path.join(projectRoot, 'public', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace('src="./js/index.jsx"', 'src="./js/main.jsx"');
fs.writeFileSync(indexPath, indexHtml);

// 6. Update vite.config.js
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
const viteConfigCode = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
`;
fs.writeFileSync(viteConfigPath, viteConfigCode.trim());

console.log('SPA Migration complete!');
