import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import CalendarShare from './pages/CalendarShare';
import CalendarSettings from './pages/CalendarSettings';
import ProfileSettings from './pages/ProfileSettings';
import Login from './pages/Login';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Examples from './pages/Examples';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/examples" element={<Examples />} />
              <Route path="/calendar/:id/share" element={<CalendarShare />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route path="/calendar/:id" element={<Calendar />} />
              <Route
                path="/calendar/:id/settings"
                element={
                  <PrivateRoute>
                    <CalendarSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/settings"
                element={
                  <PrivateRoute>
                    <ProfileSettings />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}