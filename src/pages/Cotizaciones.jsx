import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Search, CheckCircle, XCircle, ArrowRight, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const Cotizaciones = () => {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');

  const fetchCotizaciones = async () => {
    setLoading(true);
    try {
      const query = filtroEstado ? `?estado=${filtroEstado}` : '';
      const response = await api.get(`/cotizaciones${query}`);
      setCotizaciones(response.data);
    } catch (error) {
      console.error("Error al obtener cotizaciones", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizaciones();
  }, [filtroEstado]);

  const formatearDinero = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(fecha));
  };

  const handleEstadoCotizacion = async (id, accion) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${accion} esta cotización?`)) return;
    
    setProcesandoId(id);
    try {
      await api.patch(`/cotizaciones/${id}/${accion}`);
      // Refrescar lista
      fetchCotizaciones();
    } catch (error) {
      console.error(`Error al ${accion} la cotización`, error);
      alert(`Ocurrió un error al ${accion} la cotización. ${error.response?.data?.error || ''}`);
    } finally {
      setProcesandoId(null);
    }
  };

  const isAdminOrOp = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  const exportarExcel = () => {
    const data = cotizaciones.map(c => ({
      'Referencia': c.numero,
      'Cliente': c.usuario?.empresa || `${c.usuario?.nombre} ${c.usuario?.apellido}`,
      'Tipo de Servicio': c.tipoServicio?.replace('_', ' '),
      'Urgencia': c.urgencia,
      'Origen': c.origen,
      'Destino': c.destino,
      'Peso (kg)': c.peso,
      'Volumen (m3)': c.volumen,
      'Precio (COP)': c.precioCalculado,
      'Estado': c.estado,
      'Fecha': new Date(c.creadoEn).toLocaleDateString('es-CO')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotizaciones");
    XLSX.writeFile(wb, `Cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cotizaciones</h1>
          <p className="text-secondary">Historial y gestión de cotizaciones {isAdminOrOp ? 'generales' : 'solicitadas'}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="btn btn-secondary flex items-center gap-2" disabled={cotizaciones.length === 0}>
            <Download size={18} /> Exportar
          </button>
          <Link to="/nueva-cotizacion" className="btn btn-primary">
            <Plus size={18} /> Nueva Solicitud
          </Link>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="form-group mb-0" style={{ flex: '1', minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} className="text-secondary" style={{ position: 'absolute', top: '12px', left: '12px' }} />
              <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="Buscar referencia..." />
            </div>
          </div>
          <div className="form-group mb-0" style={{ width: '200px' }}>
            <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="ACEPTADA">Aceptadas</option>
              <option value="RECHAZADA">Rechazadas</option>
              <option value="VENCIDA">Vencidas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="flex justify-center items-center p-12"><div className="spinner"></div></div>
        ) : cotizaciones.length === 0 ? (
          <div className="text-center p-12">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-surface-hover mb-4">
              <FileText size={32} className="text-secondary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No se encontraron cotizaciones</h3>
            <p className="text-secondary mb-6">Aún no hay cotizaciones que coincidan con tus criterios.</p>
            <Link to="/nueva-cotizacion" className="btn btn-primary">Crear Primera Cotización</Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  {isAdminOrOp && <th>Cliente</th>}
                  <th>Servicio</th>
                  <th>Ruta</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cot) => (
                  <tr key={cot.id}>
                    <td className="font-medium text-primary">{cot.numero}</td>
                    {isAdminOrOp && <td>{cot.usuario?.empresa || `${cot.usuario?.nombre} ${cot.usuario?.apellido}`}</td>}
                    <td style={{ textTransform: 'capitalize' }}>
                      <div className="flex flex-col">
                        <span>{cot.tipoServicio.replace('_', ' ')}</span>
                        <span className="text-xs text-secondary capitalize">{cot.urgencia}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-sm">
                        <span><span className="text-secondary">O:</span> {cot.origen}</span>
                        <span><span className="text-secondary">D:</span> {cot.destino}</span>
                      </div>
                    </td>
                    <td>{formatearFecha(cot.creadoEn)}</td>
                    <td className="font-medium">{formatearDinero(cot.precioCalculado)}</td>
                    <td><span className={`badge status-${cot.estado}`}>{cot.estado}</span></td>
                    <td className="text-right">
                      {/* Acciones de Cliente */}
                      {!isAdminOrOp && cot.estado === 'PENDIENTE' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            className="btn btn-ghost text-error p-2" 
                            title="Rechazar"
                            onClick={() => handleEstadoCotizacion(cot.id, 'rechazar')}
                            disabled={procesandoId === cot.id}
                          >
                            {procesandoId === cot.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                          </button>
                          <button 
                            className="btn btn-primary p-2 flex items-center gap-1" 
                            title="Aceptar y Contratar"
                            onClick={() => handleEstadoCotizacion(cot.id, 'aceptar')}
                            disabled={procesandoId === cot.id}
                          >
                            {procesandoId === cot.id ? <Loader2 size={18} className="animate-spin" /> : (
                              <><CheckCircle size={18} /> <span className="text-sm">Contratar</span></>
                            )}
                          </button>
                        </div>
                      ) : (
                        <Link to={`/cotizaciones/${cot.id}`} className="btn btn-secondary p-2 text-sm inline-flex">
                          Ver Detalle <ArrowRight size={16} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cotizaciones;
