import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Clock, Truck, Search, Loader2, Radio, Play } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const truckIcon = new L.DivIcon({
  html: '<div style="background:#FFD700;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid #1e293b;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;">🚛</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const eventIcon = (evento) => {
  const colors = { 'RECOGIDO': '#10B981', 'PUNTO_CONTROL': '#3B82F6', 'ENTREGADO': '#FFD700', 'EN_RUTA': '#64748B' };
  const icons = { 'RECOGIDO': '📦', 'PUNTO_CONTROL': '📍', 'ENTREGADO': '✅', 'EN_RUTA': '•' };
  return new L.DivIcon({
    html: `<div style="background:${colors[evento] || '#64748B'};border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid #1e293b;font-size:12px;">${icons[evento] || '•'}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.latitud, p.longitud]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

const Rastreo = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [buscar, setBuscar] = useState('');
  const isAdmin = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await api.get('/servicios');
        const activos = res.data.filter(s => ['EN_TRANSITO', 'EN_PREPARACION', 'CONTRATADO', 'ENTREGADO'].includes(s.estado));
        setServicios(activos);
        if (activos.length > 0) {
          loadTracking(activos[0].id);
          setSelectedService(activos[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServicios();
  }, []);

  const loadTracking = async (servicioId) => {
    setLoadingTrack(true);
    try {
      const res = await api.get(`/tracking/${servicioId}`);
      setTrackingData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrack(false);
    }
  };

  const simularRuta = async (servicioId) => {
    try {
      await api.post(`/tracking/${servicioId}/simular`);
      loadTracking(servicioId);
    } catch (err) {
      console.error(err);
    }
  };

  const selectService = (id) => {
    setSelectedService(id);
    loadTracking(id);
  };

  const formatFecha = (f) => new Intl.DateTimeFormat('es-CO', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(f));

  const serviciosFiltrados = servicios.filter(s =>
    s.numero.toLowerCase().includes(buscar.toLowerCase()) ||
    s.cotizacion?.origen?.toLowerCase().includes(buscar.toLowerCase()) ||
    s.cotizacion?.destino?.toLowerCase().includes(buscar.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={28} className="text-accent" /> Rastreo GPS
          </h1>
          <p className="text-secondary">Seguimiento en tiempo real de tus envíos en el mapa.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
        {/* Panel lateral de servicios */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} className="text-secondary" style={{ position: 'absolute', top: '10px', left: '10px' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                placeholder="Buscar guía o ruta..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {serviciosFiltrados.length === 0 ? (
              <div className="text-center p-6 text-secondary">
                <Truck size={32} className="mb-2 mx-auto" style={{ opacity: 0.3 }} />
                <p>No hay envíos activos</p>
              </div>
            ) : serviciosFiltrados.map(srv => (
              <div
                key={srv.id}
                onClick={() => selectService(srv.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  background: selectedService === srv.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                  border: selectedService === srv.id ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className="font-medium text-accent" style={{ fontSize: '0.875rem' }}>{srv.numero}</span>
                  <span className={`badge ${srv.estado === 'EN_TRANSITO' ? 'status-INFO' : 'status-PENDIENTE'}`} style={{ fontSize: '0.7rem' }}>
                    {srv.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {srv.cotizacion?.origen} → {srv.cotizacion?.destino}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          {loadingTrack ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              <MapContainer
                center={[4.7110, -74.0721]}
                zoom={6}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {trackingData?.ubicaciones?.length > 0 && (
                  <>
                    <FitBounds positions={trackingData.ubicaciones} />
                    
                    {/* Línea de ruta */}
                    <Polyline
                      positions={trackingData.ubicaciones.map(u => [u.latitud, u.longitud])}
                      color="#FFD700"
                      weight={3}
                      opacity={0.8}
                      dashArray="8"
                    />

                    {/* Marcadores de eventos */}
                    {trackingData.ubicaciones.map((u, i) => (
                      <Marker
                        key={u.id}
                        position={[u.latitud, u.longitud]}
                        icon={i === trackingData.ubicaciones.length - 1 ? truckIcon : eventIcon(u.evento)}
                      >
                        <Popup>
                          <div style={{ color: '#1e293b', minWidth: '180px' }}>
                            <strong>{u.evento?.replace(/_/g, ' ') || 'En Ruta'}</strong>
                            <br />
                            <span style={{ fontSize: '0.85rem' }}>{u.direccion || `${u.latitud.toFixed(4)}, ${u.longitud.toFixed(4)}`}</span>
                            <br />
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{formatFecha(u.creadoEn)}</span>
                            {u.velocidad && <><br /><span style={{ fontSize: '0.8rem' }}>⚡ {u.velocidad.toFixed(0)} km/h</span></>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}
              </MapContainer>

              {/* Info overlay */}
              {trackingData?.servicio && (
                <div style={{
                  position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
                  background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
                  borderRadius: '12px', padding: '1rem 1.25rem', zIndex: 1000,
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Navigation size={16} className="text-accent" />
                        <span className="font-medium">{trackingData.servicio.cotizacion?.origen} → {trackingData.servicio.cotizacion?.destino}</span>
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                        {trackingData.ubicaciones?.length || 0} puntos registrados
                        {trackingData.ubicaciones?.length > 0 && (
                          <> · Última actualización: {formatFecha(trackingData.ubicaciones[trackingData.ubicaciones.length - 1].creadoEn)}</>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isAdmin && (
                        <button onClick={() => simularRuta(selectedService)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                          <Play size={14} /> Simular Ruta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(!trackingData?.ubicaciones || trackingData.ubicaciones.length === 0) && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  background: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', padding: '2rem',
                  textAlign: 'center', zIndex: 1000
                }}>
                  <Radio size={40} className="text-accent mb-4 mx-auto" />
                  <h3 className="mb-2">Sin datos GPS</h3>
                  <p className="text-secondary mb-4" style={{ fontSize: '0.875rem' }}>
                    No hay datos de ubicación para este servicio.
                  </p>
                  {isAdmin && (
                    <button onClick={() => simularRuta(selectedService)} className="btn btn-primary">
                      <Play size={16} /> Generar Ruta de Demostración
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rastreo;
