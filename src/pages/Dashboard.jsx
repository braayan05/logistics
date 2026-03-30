import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, CheckCircle, AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cotResponse, srvResponse] = await Promise.all([
          api.get('/cotizaciones'),
          api.get('/servicios')
        ]);
        // Get only the most recent 3 items for the dashboard summary
        setCotizaciones(cotResponse.data.slice(0, 3));
        setServicios(srvResponse.data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatearDinero = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Intl.DateTimeFormat('es-CO').format(new Date(fecha));
  };

  // KPI Calculations
  const serviciosActivos = servicios.filter(s => !['CERRADO', 'RECHAZADO', 'ENTREGADO'].includes(s.estado)).length;
  const entregados = servicios.filter(s => s.estado === 'ENTREGADO').length;
  const cotizacionesPendientes = cotizaciones.filter(c => c.estado === 'PENDIENTE').length;

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenido, {user.nombre}</h1>
          <p className="text-secondary">Aquí tienes un resumen de tus operaciones logísticas.</p>
        </div>
        <Link to="/nueva-cotizacion" className="btn btn-primary">
          <FileText size={18} /> Nueva Cotización 
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
            <Package size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Servicios Activos</p>
            <h3 style={{ fontSize: '1.75rem', lineHeight: '1' }} className="mt-1">{serviciosActivos}</h3>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Envíos Entregados</p>
            <h3 style={{ fontSize: '1.75rem', lineHeight: '1' }} className="mt-1">{entregados}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
            <Clock size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Cotizaciones Pendientes</p>
            <h3 style={{ fontSize: '1.75rem', lineHeight: '1' }} className="mt-1">{cotizacionesPendientes}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Servicios Activos Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.25rem' }}>Servicios Recientes</h2>
            <Link to="/servicios" className="text-accent flex items-center gap-1 text-sm font-medium">Ver todos <ArrowRight size={16} /></Link>
          </div>
          
          {servicios.length === 0 ? (
            <div className="text-center p-6 text-secondary">No tienes servicios recientes.</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Guía</th>
                    <th>Estado</th>
                    <th>Destino</th>
                    <th>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.map((srv) => (
                    <tr key={srv.id}>
                      <td className="font-medium text-primary">{srv.numero}</td>
                      <td><span className={`badge status-${srv.estado}`}>{srv.estado.replace('_', ' ')}</span></td>
                      <td>{srv.cotizacion?.destino}</td>
                      <td className="text-secondary">{formatearFecha(srv.actualizadoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cotizaciones Recientes */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.25rem' }}>Últimas Cotizaciones</h2>
            <Link to="/cotizaciones" className="text-accent flex items-center gap-1 text-sm font-medium">Ver todas <ArrowRight size={16} /></Link>
          </div>

          {cotizaciones.length === 0 ? (
            <div className="text-center p-6 text-secondary">No tienes cotizaciones recientes.</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Servicio</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cot) => (
                    <tr key={cot.id}>
                      <td className="font-medium text-primary">{cot.numero}</td>
                      <td style={{ textTransform: 'capitalize' }}>{cot.tipoServicio.replace('_', ' ')}</td>
                      <td>{formatearDinero(cot.precioCalculado)}</td>
                      <td><span className={`badge status-${cot.estado}`}>{cot.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
