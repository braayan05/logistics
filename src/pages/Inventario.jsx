import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Warehouse, ArrowDownUp, AlertTriangle, Plus, Search, Loader2, X, TrendingDown, TrendingUp, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const Inventario = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroBodega, setFiltroBodega] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [showModal, setShowModal] = useState(null); // 'producto', 'bodega', 'movimiento'
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const isAdmin = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, bodRes, movRes] = await Promise.all([
        api.get(`/inventario/productos${filtroBodega ? `?bodegaId=${filtroBodega}` : ''}${soloAlertas ? `${filtroBodega ? '&' : '?'}alerta=true` : ''}`),
        api.get('/inventario/bodegas'),
        api.get('/inventario/movimientos?limit=30')
      ]);
      setProductos(prodRes.data);
      setBodegas(bodRes.data);
      setMovimientos(movRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filtroBodega, soloAlertas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (showModal === 'producto') {
        await api.post('/inventario/productos', formData);
        setFeedback({ type: 'success', msg: 'Producto creado exitosamente' });
      } else if (showModal === 'bodega') {
        await api.post('/inventario/bodegas', formData);
        setFeedback({ type: 'success', msg: 'Bodega creada exitosamente' });
      } else if (showModal === 'movimiento') {
        const res = await api.post('/inventario/movimientos', formData);
        const alertMsg = res.data.alertas?.length > 0 ? ` ⚠️ ${res.data.alertas[0].mensaje}` : '';
        setFeedback({ type: 'success', msg: `Movimiento registrado.${alertMsg}` });
      }
      fetchAll();
      setTimeout(() => { setShowModal(null); setFormData({}); setFeedback(null); }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const openModal = (type) => {
    setFormData({});
    setFeedback(null);
    setShowModal(type);
  };

  const formatFecha = (f) => new Intl.DateTimeFormat('es-CO', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(f));
  const formatDinero = (v) => v ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v) : '-';

  const prodFiltrados = productos.filter(p =>
    p.sku.toLowerCase().includes(buscar.toLowerCase()) ||
    p.nombre.toLowerCase().includes(buscar.toLowerCase())
  );

  const alertCount = productos.filter(p => p.stockActual <= p.stockMinimo).length;

  const tabs = [
    { id: 'productos', label: 'Productos', icon: Package, count: productos.length },
    { id: 'bodegas', label: 'Bodegas', icon: Warehouse, count: bodegas.length },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowDownUp, count: movimientos.length },
  ];

  const exportarExcel = () => {
    let data = [];
    let name = "Inventario";
    if (tab === 'productos') {
      data = prodFiltrados.map(p => ({
        'SKU': p.sku,
        'Producto': p.nombre,
        'Categoría': p.categoria || '-',
        'Bodega': p.bodega?.nombre || '-',
        'Stock Actual': p.stockActual,
        'Unidad': p.unidadMedida,
        'Stock Mínimo': p.stockMinimo,
        'Stock Máximo': p.stockMaximo || '∞',
        'Precio Unit. (COP)': p.precioUnitario || 0,
        'Alerta': p.stockActual <= p.stockMinimo ? 'SI - Stock Bajo' : 'Normal'
      }));
      name = "Productos";
    } else if (tab === 'bodegas') {
      data = bodegas.map(b => ({
        'Nombre': b.nombre,
        'Tipo': b.tipo,
        'Ciudad': b.ciudad,
        'Dirección': b.direccion,
        'Ocupación (m3)': b.ocupacionM3,
        'Capacidad (m3)': b.capacidadM3,
        'Items (Categorías)': b._count?.productos || 0
      }));
      name = "Bodegas";
    } else {
      data = movimientos.map(m => ({
        'Fecha': new Date(m.creadoEn).toLocaleString('es-CO'),
        'SKU': m.producto?.sku,
        'Producto': m.producto?.nombre,
        'Tipo': m.tipo,
        'Cantidad': m.cantidad,
        'Stock Anterior': m.stockAnterior,
        'Stock Nuevo': m.stockNuevo,
        'Responsable': m.responsable,
        'Referencia': m.referencia || '-'
      }));
      name = "Movimientos";
    }

    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={28} className="text-accent" /> Gestión de Inventario
          </h1>
          <p className="text-secondary">Control de productos, bodegas y movimientos de stock.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportarExcel} className="btn btn-secondary flex items-center gap-2">
            <Download size={16} /> Exportar {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
          {isAdmin && (
            <>
              <button onClick={() => openModal('movimiento')} className="btn btn-primary flex items-center gap-1">
                <ArrowDownUp size={16} /> Movimiento
              </button>
              <button onClick={() => openModal('producto')} className="btn btn-secondary flex items-center gap-1">
                <Plus size={16} /> Producto
              </button>
              <button onClick={() => openModal('bodega')} className="btn btn-secondary flex items-center gap-1">
                <Plus size={16} /> Bodega
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card flex items-center gap-3" style={{ padding: '1rem' }}>
          <div style={{ background: 'rgba(59,130,246,0.12)', borderRadius: '8px', padding: '0.6rem', color: 'var(--color-info)' }}><Package size={22} /></div>
          <div><p className="text-secondary" style={{ fontSize: '0.75rem' }}>Total Productos</p><h3 style={{ fontSize: '1.5rem' }}>{productos.length}</h3></div>
        </div>
        <div className="card flex items-center gap-3" style={{ padding: '1rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.12)', borderRadius: '8px', padding: '0.6rem', color: 'var(--color-success)' }}><Warehouse size={22} /></div>
          <div><p className="text-secondary" style={{ fontSize: '0.75rem' }}>Bodegas Activas</p><h3 style={{ fontSize: '1.5rem' }}>{bodegas.length}</h3></div>
        </div>
        <div className="card flex items-center gap-3" style={{ padding: '1rem', border: alertCount > 0 ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
          <div style={{ background: alertCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', borderRadius: '8px', padding: '0.6rem', color: alertCount > 0 ? 'var(--color-error)' : 'var(--color-warning)' }}><AlertTriangle size={22} /></div>
          <div><p className="text-secondary" style={{ fontSize: '0.75rem' }}>Alertas de Stock</p><h3 style={{ fontSize: '1.5rem', color: alertCount > 0 ? 'var(--color-error)' : undefined }}>{alertCount}</h3></div>
        </div>
        <div className="card flex items-center gap-3" style={{ padding: '1rem' }}>
          <div style={{ background: 'rgba(139,92,246,0.12)', borderRadius: '8px', padding: '0.6rem', color: '#8B5CF6' }}><ArrowDownUp size={22} /></div>
          <div><p className="text-secondary" style={{ fontSize: '0.75rem' }}>Movimientos Recientes</p><h3 style={{ fontSize: '1.5rem' }}>{movimientos.length}</h3></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: '10px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
              borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              background: tab === t.id ? 'rgba(255,215,0,0.15)' : 'transparent',
              color: tab === t.id ? 'var(--color-accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <t.icon size={16} />{t.label} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      {tab === 'productos' && (
        <div className="card mb-4" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} className="text-secondary" style={{ position: 'absolute', top: '10px', left: '10px' }} />
              <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="Buscar por SKU o nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: '200px' }} value={filtroBodega} onChange={e => setFiltroBodega(e.target.value)}>
              <option value="">Todas las Bodegas</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={soloAlertas} onChange={e => setSoloAlertas(e.target.checked)} style={{ accentColor: '#FFD700' }} />
              <AlertTriangle size={14} className={soloAlertas ? 'text-error' : 'text-secondary'} />
              Solo alertas
            </label>
          </div>
        </div>
      )}

      {/* Contenido de Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {tab === 'productos' && (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Bodega</th>
                  <th>Stock Actual</th>
                  <th>Mín / Máx</th>
                  <th>Precio Unit.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {prodFiltrados.length === 0 ? (
                  <tr><td colSpan="7" className="text-center p-8 text-secondary">No hay productos{soloAlertas ? ' con alertas' : ''}</td></tr>
                ) : prodFiltrados.map(p => {
                  const alerta = p.stockActual <= p.stockMinimo;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-accent">{p.sku}</td>
                      <td>
                        <div>{p.nombre}</div>
                        {p.categoria && <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{p.categoria}</span>}
                      </td>
                      <td className="text-secondary">{p.bodega?.nombre}</td>
                      <td>
                        <span className="font-medium" style={{ color: alerta ? 'var(--color-error)' : 'var(--color-success)', fontSize: '1.1rem' }}>
                          {p.stockActual}
                        </span>
                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}> {p.unidadMedida}</span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: '0.85rem' }}>{p.stockMinimo} / {p.stockMaximo || '∞'}</td>
                      <td>{formatDinero(p.precioUnitario)}</td>
                      <td>
                        {alerta ? (
                          <span className="badge status-RECHAZADA" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
                            <AlertTriangle size={12} /> Stock bajo
                          </span>
                        ) : (
                          <span className="badge status-ACEPTADA" style={{ width: 'fit-content' }}>Normal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'bodegas' && (
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {bodegas.length === 0 ? (
              <div className="text-center p-8 text-secondary" style={{ gridColumn: '1 / -1' }}>No hay bodegas registradas</div>
            ) : bodegas.map(b => {
              const ocupacion = b.capacidadM3 > 0 ? (b.ocupacionM3 / b.capacidadM3 * 100) : 0;
              return (
                <div key={b.id} style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 className="font-medium" style={{ fontSize: '1.1rem' }}>{b.nombre}</h3>
                      <p className="text-secondary" style={{ fontSize: '0.8rem' }}>{b.ciudad} · {b.tipo}</p>
                    </div>
                    <span className="badge status-ACEPTADA" style={{ fontSize: '0.7rem' }}>{b._count?.productos || 0} items</span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>{b.direccion}</p>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span className="text-secondary">Ocupación</span>
                      <span>{ocupacion.toFixed(1)}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(ocupacion, 100)}%`, height: '100%', borderRadius: '999px', background: ocupacion > 80 ? '#EF4444' : ocupacion > 50 ? '#F59E0B' : '#10B981', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                    Capacidad: {b.ocupacionM3} / {b.capacidadM3} m³
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'movimientos' && (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Stock</th>
                  <th>Responsable</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr><td colSpan="7" className="text-center p-8 text-secondary">No hay movimientos registrados</td></tr>
                ) : movimientos.map(m => (
                  <tr key={m.id}>
                    <td className="text-secondary" style={{ fontSize: '0.85rem' }}>{formatFecha(m.creadoEn)}</td>
                    <td>
                      <span className="font-medium text-accent">{m.producto?.sku}</span>
                      <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{m.producto?.nombre}</div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: m.tipo === 'ENTRADA' ? 'rgba(16,185,129,0.15)' : m.tipo === 'SALIDA' ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
                        color: m.tipo === 'ENTRADA' ? '#10B981' : m.tipo === 'SALIDA' ? '#EF4444' : '#8B5CF6',
                        display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content'
                      }}>
                        {m.tipo === 'ENTRADA' ? <TrendingUp size={12} /> : m.tipo === 'SALIDA' ? <TrendingDown size={12} /> : <RefreshCw size={12} />}
                        {m.tipo}
                      </span>
                    </td>
                    <td className="font-medium">{m.tipo === 'SALIDA' ? '-' : '+'}{m.cantidad}</td>
                    <td className="text-secondary">{m.stockAnterior} → <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.stockNuevo}</span></td>
                    <td className="text-secondary" style={{ fontSize: '0.85rem' }}>{m.responsable}</td>
                    <td className="text-secondary" style={{ fontSize: '0.8rem' }}>{m.referencia || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: 'var(--bg-surface)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              {showModal === 'producto' ? '📦 Nuevo Producto' : showModal === 'bodega' ? '🏭 Nueva Bodega' : '📋 Registrar Movimiento'}
            </h2>

            {feedback && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: feedback.type === 'success' ? '#10B981' : '#EF4444', border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {showModal === 'producto' && (
                <>
                  <div className="form-group"><label className="form-label">SKU *</label><input className="form-input" required value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU-001" /></div>
                  <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" required value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Categoría</label><input className="form-input" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label className="form-label">Stock Inicial</label><input className="form-input" type="number" value={formData.stockActual || ''} onChange={e => setFormData({...formData, stockActual: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Stock Mínimo</label><input className="form-input" type="number" value={formData.stockMinimo || ''} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label className="form-label">Stock Máximo</label><input className="form-input" type="number" value={formData.stockMaximo || ''} onChange={e => setFormData({...formData, stockMaximo: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Precio Unit.</label><input className="form-input" type="number" step="0.01" value={formData.precioUnitario || ''} onChange={e => setFormData({...formData, precioUnitario: e.target.value})} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Bodega *</label>
                    <select className="form-select" required value={formData.bodegaId || ''} onChange={e => setFormData({...formData, bodegaId: e.target.value})}>
                      <option value="">Seleccionar bodega...</option>
                      {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre} - {b.ciudad}</option>)}
                    </select>
                  </div>
                </>
              )}

              {showModal === 'bodega' && (
                <>
                  <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" required value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Bodega Principal" /></div>
                  <div className="form-group"><label className="form-label">Dirección *</label><input className="form-input" required value={formData.direccion || ''} onChange={e => setFormData({...formData, direccion: e.target.value})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label className="form-label">Ciudad *</label><input className="form-input" required value={formData.ciudad || ''} onChange={e => setFormData({...formData, ciudad: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Tipo</label>
                      <select className="form-select" value={formData.tipo || 'PROPIA'} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        <option value="PROPIA">Propia</option><option value="CLIENTE">Cliente</option><option value="TERCERO">Tercero</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label className="form-label">Capacidad (m³) *</label><input className="form-input" type="number" step="0.1" required value={formData.capacidadM3 || ''} onChange={e => setFormData({...formData, capacidadM3: e.target.value})} /></div>
                </>
              )}

              {showModal === 'movimiento' && (
                <>
                  <div className="form-group"><label className="form-label">Producto *</label>
                    <select className="form-select" required value={formData.productoId || ''} onChange={e => setFormData({...formData, productoId: e.target.value})}>
                      <option value="">Seleccionar producto...</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.nombre} (Stock: {p.stockActual})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label className="form-label">Tipo *</label>
                      <select className="form-select" required value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        <option value="ENTRADA">📥 Entrada</option>
                        <option value="SALIDA">📤 Salida</option>
                        <option value="AJUSTE">🔄 Ajuste</option>
                        <option value="DEVOLUCION">↩️ Devolución</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Cantidad *</label><input className="form-input" type="number" min="1" required value={formData.cantidad || ''} onChange={e => setFormData({...formData, cantidad: e.target.value})} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Referencia</label><input className="form-input" value={formData.referencia || ''} onChange={e => setFormData({...formData, referencia: e.target.value})} placeholder="Ej: Guía SRV-2026-0001" /></div>
                  <div className="form-group"><label className="form-label">Nota</label><textarea className="form-input" rows="2" value={formData.nota || ''} onChange={e => setFormData({...formData, nota: e.target.value})} /></div>
                </>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={saving}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
