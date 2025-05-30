import React, { useState } from 'react';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Dashboard1 from './dashboards/Dashboard1';
import Dashboard2 from './dashboards/Dashboard2';
import ClientDataView from './dashboards/clientDataView';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './dashboards/Reports';

function App() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide sidebar on login page
  const hideSidebar = location.pathname === '/login';

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {!hideSidebar && (
          <Sidebar open={open} onToggle={handleDrawerToggle} onNavigate={navigate} />
        )}
        <Box 
          component="main" 
          sx={{
            flexGrow: 1,
            p: 0,
            backgroundColor: '#fff',
            overflow: 'auto',
          }} 
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Dash1" element={
              <ProtectedRoute>
                <Dashboard1 navigateToDashboard={navigate} />
              </ProtectedRoute>
            } />
            <Route path="/Dash2" element={
              <ProtectedRoute>
                <Dashboard2 />
              </ProtectedRoute>
            } />
            <Route path="/ClientDataView" element={
              <ProtectedRoute>
                <ClientDataView navigateToDashboard={navigate} />
              </ProtectedRoute>
            } />
            <Route path="/Reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
          </Routes>
        </Box>
      </Box>
    </>
  );
}

export default App;