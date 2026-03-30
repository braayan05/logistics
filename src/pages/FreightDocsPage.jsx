import React, { useState, useEffect } from 'react';
import { Ship, FileText, Search, Loader2, AlertCircle, Plane, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FreightDocs from '../components/FreightDocs';

const FreightDocsPage = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await api.get('/servicios');
        setServicios(res.data);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServicios();
  }, []);

  const serviciosFiltrados = servicios.filter(s =>
    s.numero?.toLowerCase().includes(buscar.toLowerCase()) ||
    s.cotizacion?.origen?.toLowerCase().includes(buscar.toLowerCase()) ||
    s.cotizacion?.destino?.toLowerCase().includes(buscar.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>;

  // Si hay un servicio seleccionado, mostrar FreightDocs
  if (selectedServicio) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ship size={28} className="text-accent" /> Freight Docs
            </h1>
            <p className="text-secondary">
              Generando documentos para <span className="text-accent font-medium">{selectedServicio.numero}</span>
              {' '} — {selectedServicio.cotizacion?.origen} → {selectedServicio.cotizacion?.destino}
            </p>
          </div>
          <button 
            onClick={() => setSelectedServicio(null)} 
            className="btn btn-secondary"
          >
            ← Cambiar Servicio
          </button>
        </div>
        <FreightDocs servicio={selectedServicio} />
      </div>
    );
  }

  // Selección de servicio
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ship size={28} className="text-accent" /> Freight Docs
          </h1>
          <p className="text-secondary">Genera documentos profesionales de comercio exterior vinculados a un servicio.</p>
        </div>
      </div>

      {/* Document Types Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '3px solid #3B82F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.12)', borderRadius: '8px', padding: '0.5rem', color: '#3B82F6' }}><Plane size={20} /></div>
            <h3 className="font-medium" style={{ fontSize: '1rem' }}>Air Waybill (AWB)</h3>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
            Documento de transporte aéreo en formato IATA estándar. Incluye datos del remitente, destinatario, información de vuelo, cargos y detalle de mercancía.
          </p>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '3px solid #0E7482' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(14,116,130,0.12)', borderRadius: '8px', padding: '0.5rem', color: '#0E7482' }}><Ship size={20} /></div>
            <h3 className="font-medium" style={{ fontSize: '1rem' }}>Bill of Lading (B/L)</h3>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
            Conocimiento de embarque marítimo. Registro de contenedores, buque, puertos, descripción de mercancía, flete e Incoterms para exportación e importación.
          </p>
        </div>
      </div>

      {/* Service Selection */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} className="text-accent" /> Selecciona un Servicio
          </h2>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} className="text-secondary" style={{ position: 'absolute', top: '10px', left: '10px' }} />
            <input 
              className="form-input" 
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }} 
              placeholder="Buscar por número o ruta..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </div>
        </div>

        {serviciosFiltrados.length === 0 ? (
          <div className="text-center p-8">
            <AlertCircle size={40} className="text-secondary mb-4 mx-auto" style={{ opacity: 0.4 }} />
            <p className="text-secondary">No hay servicios disponibles para generar documentos.</p>
            <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Crea una cotización y contrata un servicio primero.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {serviciosFiltrados.map(srv => (
              <div
                key={srv.id}
                onClick={() => setSelectedServicio(srv)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="font-medium text-accent" style={{ fontSize: '0.95rem' }}>{srv.numero}</span>
                  <span className={`badge ${srv.estado === 'EN_TRANSITO' ? 'status-INFO' : srv.estado === 'ENTREGADO' || srv.estado === 'CERRADO' ? 'status-ACEPTADA' : 'status-PENDIENTE'}`} style={{ fontSize: '0.7rem' }}>
                    {srv.estado?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  {srv.cotizacion?.origen || 'N/A'} → {srv.cotizacion?.destino || 'N/A'}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                  <span className="text-secondary">
                    <Package size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    {srv.cotizacion?.tipoServicio?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                  {srv.cotizacion?.peso && (
                    <span className="text-secondary">{srv.cotizacion.peso} kg</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreightDocsPage;
