import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, CreditCard, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Facturas = () => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/facturas');
      setFacturas(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al obtener las facturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const isAdminOrOp = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(fecha));
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'status-PENDIENTE';
      case 'PAGADA': return 'status-ACEPTADA';
      case 'VENCIDA': return 'status-RECHAZADA';
      case 'ANULADA': return 'status-RECHAZADA text-secondary border border-color';
      default: return 'status-PENDIENTE';
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturación y Pagos</h1>
          <p className="text-secondary">Gestiona tus estados de cuenta y pagos electrónicos.</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="form-group mb-0 flex-1 min-w-[200px] relative">
            <Search size={18} className="text-secondary absolute top-3 left-3" />
            <input type="text" className="form-input pl-10" placeholder="Buscar por número de factura o servicio..." />
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
          ) : facturas.length === 0 ? (
            <div className="text-center p-12">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-surface-hover mb-4">
                <FileText size={32} className="text-secondary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No tienes facturas pendientes</h3>
              <p className="text-secondary">Las facturas se generan automáticamente cuando un servicio ha sido entregado.</p>
            </div>
          ) : (
             <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
               <table className="table">
                 <thead>
                   <tr>
                     <th>N° Factura</th>
                     {isAdminOrOp && <th>Cliente</th>}
                     <th>Asociado a</th>
                     <th>Fecha Emisión</th>
                     <th>Monto Total</th>
                     <th>Estado</th>
                     <th className="text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                   {facturas.map((fac) => (
                     <tr key={fac.id}>
                       <td className="font-medium text-accent">
                         <div className="flex items-center gap-2">
                           <FileText size={16} />
                           {fac.numero}
                         </div>
                       </td>
                       {isAdminOrOp && <td>{fac.usuario?.empresa || `${fac.usuario?.nombre} ${fac.usuario?.apellido}`}</td>}
                       <td>Servicio: {fac.servicio?.numero || 'N/A'}</td>
                       <td>{formatearFecha(fac.creadoEn)}</td>
                       <td className="font-semibold">{formatearMoneda(fac.total)}</td>
                       <td><span className={`badge ${getBadgeClass(fac.estado)}`}>{fac.estado}</span></td>
                       <td className="text-right">
                         <Link to={`/facturas/${fac.id}`} className="btn btn-secondary p-2 text-sm flex items-center gap-1 ml-auto" style={{ width: 'fit-content' }}>
                           Ver Detalle <ArrowRight size={14} />
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

export default Facturas;
