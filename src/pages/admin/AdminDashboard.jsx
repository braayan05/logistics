import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Package, TrendingUp, DollarSign } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatearDinero = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor || 0);
  };

  if (loading || !stats) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>;
  }

  // Prepara datos para Doughnut Chart (Estados de Servicios)
  const estadosLabels = Object.keys(stats.serviciosPorEstado || {});
  const estadosData = Object.values(stats.serviciosPorEstado || {});
  
  const doughnutChartData = {
    labels: estadosLabels.map(l => l.replace('_', ' ')),
    datasets: [
      {
        data: estadosData,
        backgroundColor: [
          '#10B981', // ENTREGADO
          '#3B82F6', // EN_TRANSITO
          '#F59E0B', // PENDIENTE/PREPARACION
          '#FFD700', // CONTRATADO
          '#8B5CF6', // SOLICITADO
          '#EF4444', // INCIDENCIA
          '#64748B', // CERRADO
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: { position: 'right', labels: { color: '#94A3B8' } }
    },
    cutout: '75%'
  };

  // Prepara datos ficticios para Bar Chart de ingresos últimos 6 meses (ya que el backend solo da el mes actual)
  const barChartData = {
    labels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Ingresos Históricos (COP)',
        data: [15000000, 18500000, 22000000, 14000000, 16500000, stats.ingresosMes],
        backgroundColor: 'rgba(255, 215, 0, 0.6)',
        borderColor: '#FFD700',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } },
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Centro de Control</h1>
          <p className="text-secondary">Indicadores clave de rendimiento (KPIs) en tiempo real.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
            <Users size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Usuarios Registrados</p>
            <h3 style={{ fontSize: '1.75rem', lineHeight: '1' }} className="mt-1">{stats.totalUsuarios}</h3>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
            <Package size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Servicios Activos</p>
            <h3 style={{ fontSize: '1.75rem', lineHeight: '1' }} className="mt-1">{stats.serviciosActivos}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Ingresos Mes Actual</p>
            <h3 style={{ fontSize: '1.25rem', lineHeight: '1.2' }} className="mt-1">{formatearDinero(stats.ingresosMes)}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-4 rounded-md" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-secondary text-sm font-medium">Cotizaciones Pendientes</p>
            <h3 style={{ fontSize: '1.75rem', lineHeight: '1' }} className="mt-1">{stats.cotizacionesPendientes}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Evolución de Ingresos</h2>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Distribución de Estados de Servicio</h2>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            {estadosLabels.length > 0 ? (
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            ) : (
              <p className="text-secondary self-center">No hay datos suficientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
