import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, MapPin, Truck, RefreshCw, FileText, CheckCircle, Package, AlertTriangle, Loader2, Archive } from 'lucide-react';
import api from '../services/api';
import FreightDocs from '../components/FreightDocs';

const transicionesValidasTransporte = {
  'CONTRATADO': ['EN_PREPARACION'],
  'EN_PREPARACION': ['EN_TRANSITO'],
  'EN_TRANSITO': ['ENTREGADO', 'INCIDENCIA'],
  'INCIDENCIA': ['EN_TRANSITO'],
  'ENTREGADO': ['FACTURADO'],
  'FACTURADO': ['CERRADO']
};

const transicionesValidasAlmacenamiento = {
  'CONTRATADO': ['LLEGADA_A_BODEGA'],
  'LLEGADA_A_BODEGA': ['PENDIENTE_ALMACENAR', 'INCIDENCIA'],
  'PENDIENTE_ALMACENAR': ['ALMACENADA', 'INCIDENCIA'],
  'ALMACENADA': ['EN_INVENTARIO', 'INCIDENCIA'],
  'EN_INVENTARIO': ['DESPACHADA', 'INCIDENCIA'],
  'DESPACHADA': ['ENTREGADO', 'INCIDENCIA'],
  'INCIDENCIA': ['LLEGADA_A_BODEGA', 'PENDIENTE_ALMACENAR', 'ALMACENADA', 'EN_INVENTARIO', 'DESPACHADA'],
  'ENTREGADO': ['FACTURADO'],
  'FACTURADO': ['CERRADO']
};

const labelsEstado = {
  'EN_PREPARACION': 'Preparar Carga',
  'EN_TRANSITO': 'Despachar / En Tránsito',
  'LLEGADA_A_BODEGA': 'Llegada a Bodega',
  'PENDIENTE_ALMACENAR': 'Pendiente Almacenar',
  'ALMACENADA': 'Almacenada',
  'EN_INVENTARIO': 'En Inventario',
  'DESPACHADA': 'Despachar',
  'ENTREGADO': 'Confirmar Entrega',
  'INCIDENCIA': 'Reportar Incidencia',
  'FACTURADO': 'Generar Factura',
  'CERRADO': 'Cerrar Servicio'
};

const ServicioDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isRole, hasAnyRole } = useAuth();
  
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [updating, setUpdating] = useState(false);
  const [nota, setNota] = useState('');

  const esAdminOrOp = hasAnyRole(['ADMIN', 'OPERADOR']);

  const fetchServicio = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/servicios/${id}`);
      setServicio(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los detalles del servicio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicio();
  }, [id]);

  const handleUpdateEstado = async (nuevoEstado) => {
    if (nuevoEstado === 'INCIDENCIA' && !nota.trim()) {
      alert("Debes proporcionar una nota al reportar una incidencia.");
      return;
    }
    
    setUpdating(true);
    try {
      await api.patch(`/servicios/${id}/estado`, { nuevoEstado, nota });
      setNota('');
      fetchServicio(); // Refrescar historia
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar el estado.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
  if (error) return <div className="text-center p-12 text-error"><h2>{error}</h2><button className="btn btn-secondary mt-4" onClick={() => navigate(-1)}>Volver</button></div>;
  if (!servicio) return <div className="text-center p-12">Servicio no encontrado</div>;

  const getIconForState = (estado) => {
    switch (estado) {
      case 'CONTRATADO': return <FileText size={20} />;
      case 'EN_PREPARACION': return <Package size={20} />;
      case 'EN_TRANSITO': return <Truck size={20} />;
      case 'LLEGADA_A_BODEGA': return <Package size={20} />;
      case 'PENDIENTE_ALMACENAR': return <Archive size={20} />;
      case 'ALMACENADA': return <Archive size={20} />;
      case 'EN_INVENTARIO': return <Archive size={20} />;
      case 'DESPACHADA': return <Truck size={20} />;
      case 'ENTREGADO': return <CheckCircle size={20} />;
      case 'INCIDENCIA': return <AlertTriangle size={20} className="text-error" />;
      default: return <RefreshCw size={20} />;
    }
  };

  const formatearFechaHora = (fecha) => {
    return new Intl.DateTimeFormat('es-CO', { 
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(fecha));
  };

  const modoTransiciones = servicio?.cotizacion?.tipoServicio === 'almacenamiento' ? transicionesValidasAlmacenamiento : transicionesValidasTransporte;
  const estadosSiguientes = modoTransiciones[servicio.estado] || [];

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2 rounded-full border border-color hover:bg-surface-hover">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Detalle del Servicio {servicio.numero}
            <span className={`badge status-${servicio.estado === 'INCIDENCIA' ? 'RECHAZADA' : 'PENDIENTE'} text-sm`}>
              {servicio.estado.replace('_', ' ')}
            </span>
          </h1>
          <p className="text-secondary text-sm">Contratado el {new Date(servicio.creadoEn).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Detalles */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 border-b border-color pb-2">Información de Ruta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="p-4 bg-surface-hover rounded-xl border border-color flex items-start gap-3">
                <MapPin className="text-secondary mt-1" />
                <div>
                  <p className="text-xs text-secondary mb-1 uppercase font-semibold text-accent">Origen</p>
                  <p className="font-medium text-lg">{servicio.cotizacion?.origen || 'No especificado'}</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-secondary z-10 bg-surface px-2 rounded-full">
                <ArrowRight size={24} />
              </div>
              <div className="p-4 bg-surface-hover rounded-xl border border-color flex items-start gap-3">
                <MapPin className="text-secondary mt-1" />
                <div>
                  <p className="text-xs text-secondary mb-1 uppercase font-semibold text-accent">Destino</p>
                  <p className="font-medium text-lg">{servicio.cotizacion?.destino || 'No especificado'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 mt-6 gap-4 border-t border-color pt-4">
              <div>
                <p className="text-sm text-secondary">Tipo de Carga</p>
                <p className="font-medium capitalize">{servicio.cotizacion?.tipoServicio?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Urgencia</p>
                <p className="font-medium capitalize">{servicio.cotizacion?.urgencia || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Dimensiones</p>
                <p className="font-medium">Peso: {servicio.cotizacion?.peso || 'N/A'} kg | Vol: {servicio.cotizacion?.volumen || 'N/A'} m³</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Descripción</p>
                <p className="font-medium text-sm">{servicio.cotizacion?.descripcion || 'Sin descripción detallada.'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              Trazabilidad <Truck size={18} className="text-accent" />
            </h3>
            
            <div className="relative border-l-2 border-surface-hover ml-3 space-y-8 pb-4">
              {servicio.cambiosEstado.map((cambio, idx) => (
                <div key={cambio.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full flex items-center justify-center border-4 border-surface ${idx === servicio.cambiosEstado.length - 1 ? 'bg-accent text-inverse' : 'bg-surface-hover text-secondary'}`}>
                    {getIconForState(cambio.estadoNuevo)}
                  </span>
                  <div>
                    <h4 className="font-medium text-base text-primary uppercase">{cambio.estadoNuevo.replace('_', ' ')}</h4>
                    <p className="text-xs text-secondary mb-2">{formatearFechaHora(cambio.creadoEn)} - Responsable: {cambio.responsable}</p>
                    {cambio.nota && (
                      <div className="p-3 bg-surface-hover rounded-md text-sm border-l-2 border-accent">
                        {cambio.nota}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos Freight Forwarding */}
          {servicio.cotizacion?.tipoServicio === 'freight_forwarding' && (
            <FreightDocs servicio={servicio} />
          )}
        </div>

        {/* Columna Derecha: Acciones y Cliente */}
        <div className="flex flex-col gap-6">
          
          {/* Panel de Operador/Admin */}
          {esAdminOrOp && (
            <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
              <h3 className="font-semibold mb-4 text-accent">Gestión Operativa</h3>
              {estadosSiguientes.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <textarea 
                    className="form-input text-sm" 
                    placeholder="Nota obligatoria para incidencias..." 
                    rows={2}
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                  ></textarea>
                  
                  {estadosSiguientes.map(est => (
                    <button 
                      key={est}
                      onClick={() => handleUpdateEstado(est)}
                      disabled={updating}
                      className={`btn w-full justify-center ${est === 'INCIDENCIA' ? 'bg-error text-inverse hover:brightness-110' : 'btn-primary'}`}
                    >
                      {updating ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                      {labelsEstado[est] || `Pasar a ${est}`}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-3 bg-surface-hover rounded-md text-sm text-secondary">
                  Servicio en su estado final. No hay acciones permitidas.
                </div>
              )}
            </div>
          )}

          {/* Info Cliente */}
          <div className="card bg-surface-hover">
            <h3 className="font-semibold mb-4">Información del Cliente</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-secondary text-xs">Nombre/Empresa</p>
                <p className="font-medium">{servicio.usuario?.empresa || `${servicio.usuario?.nombre} ${servicio.usuario?.apellido}`}</p>
              </div>
              <div>
                <p className="text-secondary text-xs">Contacto</p>
                <p>{servicio.usuario?.email}</p>
                <p>{servicio.usuario?.telefono || 'Sin teléfono'}</p>
              </div>
              {servicio.cotizacion && (
                <div className="mt-4 pt-4 border-t border-color">
                  <p className="text-secondary text-xs mb-1">Cotización Vínculada</p>
                  <Link to={`/cotizaciones`} className="text-accent hover:underline flex items-center gap-1">
                    <FileText size={14}/> {servicio.cotizacion.numero}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicioDetalle;
