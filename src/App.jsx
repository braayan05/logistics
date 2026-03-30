import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout, ProtectedRoute, GuestRoute } from './components/layout/MainLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Usuarios from './pages/admin/Usuarios';

import NuevaCotizacion from './pages/NuevaCotizacion';
import Cotizaciones from './pages/Cotizaciones';
import CotizacionDetalle from './pages/CotizacionDetalle';
import Servicios from './pages/Servicios';
import ServicioDetalle from './pages/ServicioDetalle';
import Facturas from './pages/Facturas';
import FacturaDetalle from './pages/FacturaDetalle';
import Tickets from './pages/Tickets';
import TicketDetalle from './pages/TicketDetalle';
import Rastreo from './pages/Rastreo';
import Inventario from './pages/Inventario';
import Configuracion from './pages/Configuracion';
import FreightDocsPage from './pages/FreightDocsPage';

const Unauthorized = () => <div className="p-8 text-center text-error"><h3>403 Acceso Denegado</h3><p>No tienes permiso para ver esta página.</p></div>;
const NotFound = () => <div className="p-8 text-center"><h3>404 No Encontrado</h3><p>La página que buscas no existe.</p></div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          
          {/* Guest Routes (Only unauthenticated users) */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes - Client & Operator & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['CLIENTE_B2B', 'CLIENTE_B2C', 'OPERADOR', 'ADMIN']} />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/servicios/:id" element={<ServicioDetalle />} />
              <Route path="/cotizaciones" element={<Cotizaciones />} />
              <Route path="/cotizaciones/:id" element={<CotizacionDetalle />} />
              <Route path="/nueva-cotizacion" element={<NuevaCotizacion />} />
              <Route path="/facturas" element={<Facturas />} />
              <Route path="/facturas/:id" element={<FacturaDetalle />} />
              <Route path="/soporte" element={<Tickets />} />
              <Route path="/soporte/:id" element={<TicketDetalle />} />
              <Route path="/rastreo" element={<Rastreo />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/documentos" element={<FreightDocsPage />} />
            </Route>
          </Route>

          {/* Protected Routes - Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
