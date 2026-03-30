import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Package, AlertCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const NuevaCotizacion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    tipoServicio: 'transporte_nacional',
    origen: '',
    destino: '',
    peso: '',
    volumen: '',
    urgencia: 'normal',
    descripcion: ''
  });

  const tiposServicio = [
    { value: 'transporte_nacional', label: 'Transporte Nacional' },
    { value: 'transporte_internacional', label: 'Transporte Internacional' },
    { value: 'paqueteria', label: 'Paquetería y Courier' },
    { value: 'almacenamiento', label: 'Almacenamiento' },
    { value: 'freight_forwarding', label: 'Freight Forwarding' },
    { value: 'ultima_milla', label: 'Última Milla' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/cotizaciones', formData);
      navigate('/cotizaciones');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cotización. Verifica los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Cotización</h1>
          <p className="text-secondary">Ingresa los detalles de tu envío para obtener un cálculo automático.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && (
          <div className="mb-6 p-4 rounded-md flex items-center gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-error)' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Tipo y Urgencia */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Tipo de Servicio Logístico</label>
              <div style={{ position: 'relative' }}>
                <Truck size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <select name="tipoServicio" className="form-select" style={{ paddingLeft: '2.5rem' }} value={formData.tipoServicio} onChange={handleChange} required>
                  {tiposServicio.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Origen (Ciudad/País)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input type="text" name="origen" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.origen} onChange={handleChange} required placeholder="Ej: Bogotá, D.C." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Destino (Ciudad/País)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input type="text" name="destino" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.destino} onChange={handleChange} required placeholder="Ej: Medellín, Antioquia" />
              </div>
            </div>

            {/* Dimensiones y Peso */}
            <div className="form-group">
              <label className="form-label">Peso Estimado (Kgs)</label>
              <div style={{ position: 'relative' }}>
                <Package size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input type="number" step="0.1" min="0" name="peso" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.peso} onChange={handleChange} placeholder="0.0" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Volumen Estimado (M³)</label>
              <div style={{ position: 'relative' }}>
                <Package size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input type="number" step="0.01" min="0" name="volumen" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.volumen} onChange={handleChange} placeholder="0.00" />
              </div>
            </div>

            {/* Urgencia y Detalles */}
            <div className="form-group">
              <label className="form-label">Nivel de Urgencia</label>
              <div className="flex gap-2">
                {['normal', 'express', 'urgente'].map(nivel => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgencia: nivel }))}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-fast capitalize ${
                      formData.urgencia === nivel 
                        ? 'bg-accent text-inverse border-accent' 
                        : 'border-color text-secondary hover:text-primary'
                    }`}
                    style={formData.urgencia === nivel ? { backgroundColor: 'var(--color-accent)', color: 'var(--text-inverse)', borderColor: 'var(--color-accent)' } : { borderColor: 'var(--border-color)'}}
                  >
                    {nivel}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descripción de la Mercancía o Solicitud</label>
              <div style={{ position: 'relative' }}>
                <FileText size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <textarea 
                  name="descripcion" 
                  className="form-textarea" 
                  style={{ paddingLeft: '2.5rem', minHeight: '100px' }} 
                  value={formData.descripcion} 
                  onChange={handleChange} 
                  placeholder="Describe brevemente el contenido, cuidados especiales, etc."
                ></textarea>
              </div>
            </div>

          </div>

          <div className="flex justify-end mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-ghost mr-4">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>Generar Cotización <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaCotizacion;
