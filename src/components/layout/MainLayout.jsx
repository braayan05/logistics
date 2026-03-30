import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Package, User, LayoutDashboard, FileText, Settings, LogOut, Clock, Globe, CreditCard, LifeBuoy, MapPin, Warehouse, Ship } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export const MainLayout = () => {
  const { user, logout, isRole, hasAnyRole } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['CLIENTE_B2B', 'CLIENTE_B2C', 'OPERADOR'] },
    { path: '/admin', icon: LayoutDashboard, label: 'Admin Panel', roles: ['ADMIN'] },
    { path: '/servicios', icon: Package, label: hasAnyRole(['ADMIN', 'OPERADOR']) ? 'Gestión Operativa' : 'Mis Servicios', roles: ['CLIENTE_B2B', 'CLIENTE_B2C', 'ADMIN', 'OPERADOR'] },
    { path: '/rastreo', icon: MapPin, label: 'Rastreo GPS', roles: ['CLIENTE_B2B', 'CLIENTE_B2C', 'ADMIN', 'OPERADOR'] },
    { path: '/cotizaciones', icon: FileText, label: 'Cotizaciones', roles: ['CLIENTE_B2B', 'CLIENTE_B2C', 'ADMIN', 'OPERADOR'] },
    { path: '/inventario', icon: Warehouse, label: 'Inventario', roles: ['CLIENTE_B2B', 'ADMIN', 'OPERADOR'] },
    { path: '/facturas', icon: CreditCard, label: 'Pagos y Facturas', roles: ['CLIENTE_B2B', 'CLIENTE_B2C', 'ADMIN', 'OPERADOR'] },
    { path: '/documentos', icon: Ship, label: 'Freight Docs', roles: ['ADMIN', 'OPERADOR'] },
    { path: '/soporte', icon: LifeBuoy, label: 'Ayuda y Soporte', roles: ['CLIENTE_B2B', 'CLIENTE_B2C', 'OPERADOR', 'ADMIN'] },
    { path: '/usuarios', icon: User, label: 'Usuarios', roles: ['ADMIN'] },
    { path: '/configuracion', icon: Settings, label: 'Configuración', roles: ['ADMIN'] }
  ];

  const renderNavItems = () => {
    return menuItems
      .filter(item => hasAnyRole(item.roles))
      .map(item => (
        <NavLink 
          key={item.path} 
          to={item.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ));
  };

  return (
    <div className="app-container fade-in">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to={hasAnyRole(['ADMIN']) ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <Globe className="sidebar-brand-accent" size={24} />
            <span className="sidebar-brand-text">Logistics<span className="sidebar-brand-accent">World</span></span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {renderNavItems()}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="top-navbar">
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{user?.nombre} {user?.apellido}</span>
              <span className="user-role">{user?.rol?.replace('_', ' ')}</span>
            </div>
            <button onClick={logout} className="btn btn-ghost" title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const GuestRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || (user.rol === 'ADMIN' ? '/admin' : '/dashboard');
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};
