import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, MapPin, Save, Loader2, Plus, Trash2, Building2 } from 'lucide-react';
import api from '../services/api';

const Configuracion = () => {
  const [tab, setTab] = useState('tarifas');
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [newZona, setNewZona] = useState({ nombre: '', departamento: '' });
  const [newTarifa, setNewTarifa] = useState({ zonaOrigenId: '', tipoServicio: '', precioBase: '', precioPorKg: '', precioPorM3: '' });

  const tiposServicio = [
    { value: 'transporte_nacional', label: 'Transporte Nacional' },
    { value: 'transporte_internacional', label: 'Transporte Internacional' },
    { value: 'paqueteria', label: 'Paquetería' },
    { value: 'almacenamiento', label: 'Almacenamiento' },
    { value: 'freight_forwarding', label: 'Freight Forwarding' },
    { value: 'ultima_milla', label: 'Última Milla' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/zonas');
        setZonas(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const crearZona = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/zonas', newZona);
      setZonas([...zonas, { ...res.data, tarifas: [] }]);
      setNewZona({ nombre: '', departamento: '' });
      showFeedback('success', 'Zona creada exitosamente');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Error al crear zona');
    } finally {
      setSaving(false);
    }
  };

  const crearTarifa = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        zonaOrigenId: parseInt(newTarifa.zonaOrigenId),
        tipoServicio: newTarifa.tipoServicio,
        precioBase: parseFloat(newTarifa.precioBase),
        precioPorKg: parseFloat(newTarifa.precioPorKg),
        precioPorM3: newTarifa.precioPorM3 ? parseFloat(newTarifa.precioPorM3) : null
      };
      await api.post('/admin/tarifas', data);
      // Refresh zonas
      const res = await api.get('/admin/zonas');
      setZonas(res.data);
      setNewTarifa({ zonaOrigenId: '', tipoServicio: '', precioBase: '', precioPorKg: '', precioPorM3: '' });
      showFeedback('success', 'Tarifa creada exitosamente');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Error al crear tarifa');
    } finally {
      setSaving(false);
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const formatDinero = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v || 0);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={28} className="text-accent" /> Configuración del Sistema
          </h1>
          <p className="text-secondary">Gestión de tarifas, zonas y parámetros operativos.</p>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: feedback.type === 'success' ? '#10B981' : '#EF4444', border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { id: 'tarifas', label: 'Tarifas', icon: DollarSign },
          { id: 'zonas', label: 'Zonas', icon: MapPin },
          { id: 'sistema', label: 'Sistema', icon: Building2 }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, background: tab === t.id ? 'rgba(255,215,0,0.15)' : 'transparent', color: tab === t.id ? 'var(--color-accent)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* Tarifas */}
      {tab === 'tarifas' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Formulario nueva tarifa */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Nueva Tarifa</h3>
            <form onSubmit={crearTarifa}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Zona Origen *</label>
                  <select className="form-select" required value={newTarifa.zonaOrigenId} onChange={e => setNewTarifa({...newTarifa, zonaOrigenId: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre} ({z.departamento})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo Servicio *</label>
                  <select className="form-select" required value={newTarifa.tipoServicio} onChange={e => setNewTarifa({...newTarifa, tipoServicio: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {tiposServicio.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Precio Base (COP) *</label><input className="form-input" type="number" required value={newTarifa.precioBase} onChange={e => setNewTarifa({...newTarifa, precioBase: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Precio/Kg (COP) *</label><input className="form-input" type="number" required value={newTarifa.precioPorKg} onChange={e => setNewTarifa({...newTarifa, precioPorKg: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Precio/m³ (COP)</label><input className="form-input" type="number" value={newTarifa.precioPorM3} onChange={e => setNewTarifa({...newTarifa, precioPorM3: e.target.value})} /></div>
              </div>
              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Tarifa
              </button>
            </form>
          </div>

          {/* Tabla de tarifas existentes */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Tarifas Configuradas</h3>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr><th>Zona</th><th>Tipo Servicio</th><th>Precio Base</th><th>Precio/Kg</th><th>Precio/m³</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {zonas.flatMap(z => (z.tarifas || []).map(t => (
                    <tr key={t.id}>
                      <td className="font-medium">{z.nombre}</td>
                      <td style={{ textTransform: 'capitalize' }}>{t.tipoServicio.replace(/_/g, ' ')}</td>
                      <td>{formatDinero(t.precioBase)}</td>
                      <td>{formatDinero(t.precioPorKg)}</td>
                      <td>{t.precioPorM3 ? formatDinero(t.precioPorM3) : '-'}</td>
                      <td><span className={`badge ${t.vigente ? 'status-ACEPTADA' : 'status-RECHAZADA'}`}>{t.vigente ? 'Vigente' : 'Inactiva'}</span></td>
                    </tr>
                  )))}
                  {zonas.every(z => !z.tarifas?.length) && (
                    <tr><td colSpan="6" className="text-center p-8 text-secondary">No hay tarifas configuradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Zonas */}
      {tab === 'zonas' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Nueva Zona</h3>
            <form onSubmit={crearZona}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" required value={newZona.nombre} onChange={e => setNewZona({...newZona, nombre: e.target.value})} placeholder="Ej: Bogotá" /></div>
                <div className="form-group"><label className="form-label">Departamento *</label><input className="form-input" required value={newZona.departamento} onChange={e => setNewZona({...newZona, departamento: e.target.value})} placeholder="Ej: Cundinamarca" /></div>
              </div>
              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Crear Zona
              </button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {zonas.map(z => (
              <div key={z.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="font-medium" style={{ fontSize: '1.1rem' }}>{z.nombre}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{z.departamento}</p>
                  </div>
                  <span className="badge status-INFO" style={{ fontSize: '0.7rem' }}>{z.tarifas?.length || 0} tarifas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sistema */}
      {tab === 'sistema' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Información del Sistema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Empresa</p><p className="font-medium">Logistics World S.A.S</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>NIT</p><p className="font-medium">900.123.456-7</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Moneda</p><p className="font-medium">COP (Peso Colombiano)</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Zona Horaria</p><p className="font-medium">America/Bogota (UTC-5)</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Versión</p><p className="font-medium">v1.0.0</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Resolución DIAN FE</p><p className="font-medium">000165/2023</p></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Pasarela de Pagos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Proveedor</p><p className="font-medium">Wompi (Simulación)</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Estado</p><span className="badge status-ACEPTADA">Activo</span></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Métodos</p><p className="font-medium">PSE, Tarjeta, Transferencia, Efectivo</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Modo</p><span className="badge status-PENDIENTE">Sandbox</span></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Integración GPS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Proveedor de Mapas</p><p className="font-medium">OpenStreetMap (Leaflet)</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Estado</p><span className="badge status-ACEPTADA">Activo</span></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Actualización</p><p className="font-medium">Cada 10 seg (RNF03)</p></div>
              <div><p className="text-secondary" style={{ fontSize: '0.8rem' }}>Modo</p><span className="badge status-PENDIENTE">Simulación</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;
