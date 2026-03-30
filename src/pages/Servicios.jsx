import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Search, Truck, ArrowRight, Loader2, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const Servicios = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [buscar, setBuscar] = useState('');

  const fetchServicios = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = filtroEstado ? `?estado=${filtroEstado}` : '';
      const response = await api.get(`/servicios${query}`);
      setServicios(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al obtener los servicios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, [filtroEstado]);

  const isAdminOrOp = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  const serviciosFiltrados = servicios.filter(srv => {
    if (!buscar.trim()) return true;
    const q = buscar.toLowerCase();
    return (
      srv.numero?.toLowerCase().includes(q) ||
      srv.cotizacion?.origen?.toLowerCase().includes(q) ||
      srv.cotizacion?.destino?.toLowerCase().includes(q) ||
      srv.cotizacion?.tipoServicio?.toLowerCase().includes(q) ||
      srv.usuario?.nombre?.toLowerCase().includes(q) ||
      srv.usuario?.apellido?.toLowerCase().includes(q) ||
      srv.usuario?.empresa?.toLowerCase().includes(q)
    );
  });

  const formatearFecha = (fecha) => {
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(fecha));
  };
  
  const calcularETA = (fechaInicio, urgencia) => {
    const inicio = new Date(fechaInicio);
    let diasAgregar = 5; // Normal
    if (urgencia === 'urgente') diasAgregar = 2;
    else if (urgencia === 'flexible') diasAgregar = 10;
    
    inicio.setDate(inicio.getDate() + diasAgregar);
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }).format(inicio);
  };
  
  const obtenerColorEstado = (estado) => {
    const clases = {
      'CONTRATADO': 'status-PENDIENTE', 
      'EN_PREPARACION': 'status-WARNING',
      'EN_TRANSITO': 'status-INFO',
      'ENTREGADO': 'status-ACEPTADA',
      'FACTURADO': 'status-ACEPTADA',
      'CERRADO': 'status-ACEPTADA',
      'INCIDENCIA': 'status-RECHAZADA',
      'RECHAZADO': 'status-RECHAZADA',
      
      'LLEGADA_A_BODEGA': 'status-INFO',
      'PENDIENTE_ALMACENAR': 'status-WARNING',
      'ALMACENADA': 'status-INFO',
      'EN_INVENTARIO': 'status-ACEPTADA',
      'DESPACHADA': 'status-INFO'
    };
    return clases[estado] || 'status-PENDIENTE';
  };

  const exportarExcel = () => {
    const data = serviciosFiltrados.map(srv => ({
      'Num. Servicio': srv.numero,
      'Cliente': srv.usuario?.empresa || `${srv.usuario?.nombre} ${srv.usuario?.apellido}`,
      'Tipo (Carga)': srv.cotizacion?.tipoServicio?.replace('_', ' '),
      'Urgencia': srv.cotizacion?.urgencia,
      'Origen': srv.cotizacion?.origen,
      'Destino': srv.cotizacion?.destino,
      'Fecha Inicio': formatearFecha(srv.creadoEn),
      'Entrega Estimada': ['ENTREGADO', 'FACTURADO', 'CERRADO'].includes(srv.estado) ? 'Completado' : calcularETA(srv.creadoEn, srv.cotizacion?.urgencia),
      'Estado Actual': srv.estado.replace('_', ' ')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    XLSX.writeFile(wb, `Servicios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Servicios Activos</h1>
          <p className="text-secondary">Seguimiento y gestión de servicios {isAdminOrOp ? 'generales' : 'contratados'}.</p>
        </div>
        <button onClick={exportarExcel} className="btn btn-secondary flex items-center gap-2" disabled={serviciosFiltrados.length === 0}>
          <Download size={18} /> Exportar
        </button>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="form-group mb-0" style={{ flex: '1', minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} className="text-secondary" style={{ position: 'absolute', top: '12px', left: '12px' }} />
              <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="Buscar por número, ruta o cliente..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
            </div>
          </div>
          <div className="form-group mb-0" style={{ width: '250px' }}>
            <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos los Estados</option>
              <option value="CONTRATADO">Contratado</option>
              <option value="EN_PREPARACION">En Preparación</option>
              <option value="EN_TRANSITO">En Tránsito</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="INCIDENCIA">Incidencia</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card text-error flex items-center justify-center gap-2 p-8 border border-error">
          <AlertCircle size={24} /> {error}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="flex justify-center items-center p-12"><Loader2 size={32} className="animate-spin text-accent" /></div>
          ) : serviciosFiltrados.length === 0 ? (
            <div className="text-center p-12">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-surface-hover mb-4">
                <Truck size={32} className="text-secondary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No hay servicios</h3>
              <p className="text-secondary mb-6">Aún no hay servicios logísticos en curso que coincidan con tus criterios.</p>
              {!isAdminOrOp && (
                <Link to="/nueva-cotizacion" className="btn btn-primary">Crear Cotización</Link>
              )}
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Num. Servicio</th>
                    {isAdminOrOp && <th>Cliente</th>}
                    <th>Tipo (Carga)</th>
                    <th>Ruta Operativa</th>
                    <th>Fecha Inicio</th>
                    <th>Entrega Estimada</th>
                    <th>Estado Actual</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosFiltrados.map((srv) => (
                    <tr key={srv.id}>
                      <td className="font-medium text-accent">
                        <div className="flex items-center gap-2">
                          <Package size={16} />
                          {srv.numero}
                        </div>
                      </td>
                      {isAdminOrOp && <td>{srv.usuario?.empresa || `${srv.usuario?.nombre} ${srv.usuario?.apellido}`}</td>}
                      <td style={{ textTransform: 'capitalize' }}>
                        {srv.cotizacion?.tipoServicio?.replace('_', ' ') || 'No especificado'}
                      </td>
                      <td>
                        <div className="flex flex-col text-sm">
                          <span>{srv.cotizacion?.origen || 'No especificado'} <ArrowRight size={12} className="inline mx-1 text-secondary"/> {srv.cotizacion?.destino || 'No especificado'}</span>
                        </div>
                      </td>
                      <td>{formatearFecha(srv.creadoEn)}</td>
                      <td className="font-semibold text-accent">
                        {['ENTREGADO', 'FACTURADO', 'CERRADO'].includes(srv.estado) 
                          ? 'Completado' 
                          : calcularETA(srv.creadoEn, srv.cotizacion?.urgencia)}
                      </td>
                      <td><span className={`badge ${obtenerColorEstado(srv.estado)}`}>{srv.estado.replace('_', ' ')}</span></td>
                      <td className="text-right">
                        <Link to={`/servicios/${srv.id}`} className="btn btn-secondary p-2 text-sm flex items-center gap-1 ml-auto" style={{ width: 'fit-content' }}>
                          Ver Trazabilidad <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Servicios;
