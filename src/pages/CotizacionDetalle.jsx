import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, MapPin, Package, AlertCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import api from '../services/api';

const CotizacionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        const { data } = await api.get(`/cotizaciones/${id}`);
        setCotizacion(data);
      } catch (err) {
        console.error("Error al obtener cotización:", err);
        setError('No se pudo encontrar la cotización o fue eliminada.');
      } finally {
        setLoading(false);
      }
    };
    fetchCotizacion();
  }, [id]);

  const formatearDinero = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);
  };

  const handleEstadoCotizacion = async (accion) => {
    setProcesandoAccion(true);
    try {
      await api.patch(`/cotizaciones/${id}/${accion}`);
      // Refrescar datos
      const { data } = await api.get(`/cotizaciones/${id}`);
      setCotizacion(data);
      
      if (accion === 'aceptar') {
        alert('Cotización aceptada y Servicio Contratado exitosamente. Se ha generado la Orden de Servicio.');
        navigate('/servicios');
      }
    } catch (error) {
      console.error(`Error al ${accion} la cotización`, error);
      alert(`Ocurrió un error. ${error.response?.data?.error || ''}`);
    } finally {
      setProcesandoAccion(false);
    }
  };

  const generarPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Logistics World - Cotización', 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Referencia: ${cotizacion.numero}`, 14, 35);
      doc.text(`Fecha: ${new Date(cotizacion.creadoEn).toLocaleDateString('es-CO')}`, 14, 40);
      doc.text(`Estado: ${cotizacion.estado}`, 14, 45);

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Datos del Solicitante', 14, 60);
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const nombreUsuario = cotizacion.usuario?.empresa || `${cotizacion.usuario?.nombre} ${cotizacion.usuario?.apellido}`;
      doc.text(`Nombre/Empresa: ${nombreUsuario}`, 14, 68);
      doc.text(`Email: ${cotizacion.usuario?.email}`, 14, 73);

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Detalles del Carga y Servicio', 14, 88);
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(`Tipo de Servicio: ${cotizacion.tipoServicio.replace('_', ' ').toUpperCase()}`, 14, 96);
      doc.text(`Nivel de Urgencia: ${cotizacion.urgencia.toUpperCase()}`, 14, 101);
      doc.text(`Origen: ${cotizacion.origen}`, 14, 106);
      doc.text(`Destino: ${cotizacion.destino}`, 14, 111);
      if (cotizacion.peso) doc.text(`Peso Estimado: ${cotizacion.peso} kg`, 14, 116);
      if (cotizacion.volumen) doc.text(`Volumen Estimado: ${cotizacion.volumen} m³`, 14, 121);
      
      if (cotizacion.descripcion) {
        doc.text(`Descripción: ${cotizacion.descripcion}`, 14, 131);
      }

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Liquidación', 14, 150);
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text(`Total Calculado: ${formatearDinero(cotizacion.precioCalculado)} COP`, 14, 160);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Este documento es una estimación generada automáticamente.', 14, 275);
      doc.text('El valor final puede variar tras la inspección física de la mercancía.', 14, 280);

      doc.save(`${cotizacion.numero}.pdf`);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-xl text-center">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Cotización No Encontrada</h3>
        <p className="mb-4">{error}</p>
        <button onClick={() => navigate('/cotizaciones')} className="btn btn-secondary">
          <ArrowLeft size={18} /> Volver a Cotizaciones
        </button>
      </div>
    );
  }

  const isAdminOrOp = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  return (
    <div className="fade-in pb-10">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cotizaciones')} className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-lg transition-colors border border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Detalle de Cotización
              <span className={`badge status-${cotizacion.estado} text-sm px-3 py-1`}>
                {cotizacion.estado}
              </span>
            </h1>
            <p className="text-slate-400 font-mono mt-1">{cotizacion.numero}</p>
          </div>
        </div>
        
        {/* Acciones para Cotizaciones Pendientes */}
        {cotizacion.estado === 'PENDIENTE' && (
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => handleEstadoCotizacion('rechazar')}
              disabled={procesandoAccion}
              className="btn bg-slate-800 text-error hover:bg-slate-700 border border-slate-700"
            >
              {procesandoAccion ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
              Rechazar
            </button>
            <button 
              onClick={() => handleEstadoCotizacion('aceptar')}
              disabled={procesandoAccion}
              className="btn btn-primary"
            >
              {procesandoAccion ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              Aceptar y Contratar
            </button>
          </div>
        )}
        
        {/* Acciones Generales (PDF, etc) */}
        {cotizacion.estado !== 'PENDIENTE' && (
          <button onClick={generarPDF} className="btn btn-secondary bg-slate-800 border-slate-700 hover:text-white flex items-center gap-2">
            <Download size={18} /> Descargar PDF
          </button>
        )}
        {cotizacion.estado === 'PENDIENTE' && (
          <button onClick={generarPDF} className="btn btn-secondary border-slate-700 hover:text-white flex items-center gap-2 ml-auto">
            <Download size={18} /> PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Central: Datos del Servicio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold border-b border-surface-hover pb-3 mb-4 flex items-center gap-2">
              <Package className="text-primary" size={20} />
              Información de la Carga
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-secondary mb-1">Tipo de Servicio</p>
                <p className="font-medium capitalize text-lg text-white">
                  {cotizacion.tipoServicio.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-secondary mb-1">Nivel de Urgencia</p>
                <p className={`font-medium capitalize ${cotizacion.urgencia === 'urgente' ? 'text-error' : 'text-primary'}`}>
                  {cotizacion.urgencia}
                </p>
              </div>

              <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center text-center md:text-left">
                  <div className="flex-1">
                    <p className="text-xs text-secondary mb-1 flex items-center justify-center md:justify-start gap-1">
                      <MapPin size={14} className="text-primary" /> Origen
                    </p>
                    <p className="font-medium text-white">{cotizacion.origen}</p>
                  </div>
                  
                  <div className="hidden md:block text-slate-600">
                    ⟶
                  </div>
                  
                  <div className="flex-1 md:text-right">
                    <p className="text-xs text-secondary mb-1 flex items-center justify-center md:justify-end gap-1">
                      <MapPin size={14} className="text-primary" /> Destino
                    </p>
                    <p className="font-medium text-white">{cotizacion.destino}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-secondary mb-1">Peso Estimado</p>
                <p className="font-medium text-white">{cotizacion.peso ? `${cotizacion.peso} kg` : 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-secondary mb-1">Volumen Estimado</p>
                <p className="font-medium text-white">{cotizacion.volumen ? `${cotizacion.volumen} m³` : 'N/A'}</p>
              </div>
            </div>

            {cotizacion.descripcion && (
              <div className="mt-6 pt-4 border-t border-surface-hover">
                <p className="text-sm text-secondary mb-2">Notas / Descripción de la Carga</p>
                <p className="text-white bg-slate-900/50 p-4 rounded-lg text-sm border border-slate-800">
                  {cotizacion.descripcion}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Lateral: Liquidación y Cliente */}
        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-lg shadow-primary/5">
            <h3 className="text-lg font-bold text-white mb-6 text-center">Liquidación Total</h3>
            <div className="flex flex-col space-y-4 text-center">
              <div>
                <p className="text-sm text-secondary mb-1">Costo Base Calculado</p>
                <p className="text-3xl font-black text-primary">
                  {formatearDinero(cotizacion.precioCalculado)}
                </p>
              </div>
              <div className="text-xs text-slate-500 pt-4 border-t border-primary/10">
                Los precios incluyen impuestos y seguros básicos acordados en el SRS logístico.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold border-b border-surface-hover pb-3 mb-4 text-slate-300">
              Datos del Solicitante
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-secondary">Nombre o Empresa</p>
                <p className="text-sm font-medium text-white">
                  {cotizacion.usuario?.empresa || `${cotizacion.usuario?.nombre} ${cotizacion.usuario?.apellido}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary">Documento</p>
                <p className="text-sm text-white">
                  {cotizacion.usuario?.tipoDocumento} {cotizacion.usuario?.documento}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary">Email de Contacto</p>
                <p className="text-sm text-white">{cotizacion.usuario?.email}</p>
              </div>
              <div className="pt-3 border-t border-surface-hover">
                <p className="text-xs text-secondary flex items-center gap-1">
                  <Clock size={12} /> Fecha de Creación
                </p>
                <p className="text-sm font-mono mt-1 text-slate-300">
                  {new Date(cotizacion.creadoEn).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotizacionDetalle;
