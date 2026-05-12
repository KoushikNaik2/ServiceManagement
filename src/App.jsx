import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import UserLayout from './components/UserLayout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserOverview from './pages/user/Overview';
import MyVehicles from './pages/user/MyVehicles';
import BookService from './pages/user/BookService';
import LiveStatus from './pages/user/LiveStatus';
import ServiceHistory from './pages/user/ServiceHistory';
import Preferences from './pages/user/Preferences';
import AdminDashboard from './pages/admin/Dashboard';
import Requests from './pages/admin/Requests';
import Estimation from './pages/admin/Estimation';
import AdminLiveStatus from './pages/admin/LiveStatus';
import Records from './pages/admin/Records';
import Mechanics from './pages/admin/Mechanics';
import Settings from './pages/admin/Settings';

const ProtectedRoute = ({ children, role }) => {
  const { user, profile, loading } = useAuth();
  const isDevAdmin = localStorage.getItem('dev_admin') === 'true';
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-dark">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (role === 'admin' && !isDevAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  if (role === 'user' && isDevAdmin) {
    // If we are in dev admin mode but on a user route, it's fine.
  }
  
  return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
          <Route index element={<UserOverview />} />
          <Route path="vehicles" element={<MyVehicles />} />
          <Route path="book" element={<BookService />} />
          <Route path="status" element={<LiveStatus />} />
          <Route path="history" element={<ServiceHistory />} />
          <Route path="preferences" element={<Preferences />} />
        </Route>
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="requests" element={<Requests />} />
          <Route path="estimation" element={<Estimation />} />
          <Route path="status" element={<AdminLiveStatus />} />
          <Route path="records" element={<Records />} />
          <Route path="mechanics" element={<Mechanics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;
