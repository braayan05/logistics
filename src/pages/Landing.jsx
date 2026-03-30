import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Globe, Shield, Clock, ArrowRight } from 'lucide-react';
import '../styles/pages.css';

const Landing = () => {
  return (
    <div className="landing-page fade-in">
      {/* Navigation */}
      <nav className="landing-nav glass">
        <div className="container flex items-center justify-between" style={{ height: '72px' }}>
          <div className="flex items-center gap-2">
            <Globe className="text-accent" size={28} />
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              Logistics<span className="text-accent">World</span>
            </span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="btn btn-ghost">Iniciar Sesión</Link>
            <Link to="/register" className="btn btn-primary">Registrarse</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-content">
            <div className="badge badge-warning mb-6">Plataforma Logística Integral</div>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Lleva tu negocio <br />
              <span className="text-accent">más lejos, más rápido.</span>
            </h1>
            <p className="text-secondary mb-8" style={{ fontSize: '1.25rem', maxWidth: '600px' }}>
              La solución completa para gestionar tus envíos, almacenes e importaciones desde un solo lugar. Con seguimiento en tiempo real y facturación electrónica.
            </p>
            <div className="flex gap-4">
              <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                Comenzar Ahora <ArrowRight size={20} />
              </Link>
              <a href="#servicios" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                Ver Servicios
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features/Services */}
      <section id="servicios" className="services-section container mt-8 mb-8" style={{ padding: '6rem 1rem' }}>
        <div className="text-center mb-8">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Todo lo que necesitas</h2>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>Descubre nuestro catálogo de servicios logísticos diseñados para empresas y personas naturales.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="card service-card relative">
            <div className="icon-wrapper mb-4 text-info"><Truck size={40} /></div>
            <h3 className="mb-2">Transporte Nacional</h3>
            <p className="text-secondary">Cobertura total en el territorio colombiano con monitoreo GPS 24/7 y confirmación de entrega.</p>
          </div>
          <div className="card service-card relative">
            <div className="icon-wrapper mb-4 text-warning"><Globe size={40} /></div>
            <h3 className="mb-2">Freight Forwarding</h3>
            <p className="text-secondary">Gestión de importaciones y exportaciones aéreas y marítimas con trámites aduaneros integrados.</p>
          </div>
          <div className="card service-card relative">
            <div className="icon-wrapper mb-4 text-success"><Shield size={40} /></div>
            <h3 className="mb-2">Almacenamiento</h3>
            <p className="text-secondary">Bodegas inteligentes con control de inventario en tiempo real, picking y packing automatizados.</p>
          </div>
          <div className="card service-card relative">
            <div className="icon-wrapper mb-4 text-error"><Clock size={40} /></div>
            <h3 className="mb-2">Última Milla</h3>
            <p className="text-secondary">Entregas el mismo día para comercio electrónico, paquetería express y documentos urgentes.</p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem 0', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container text-secondary">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="text-accent" size={24} />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>LogisticsWorld</span>
          </div>
          <p>© 2026 Logistics World. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
