import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, User, Mail, Lock, FileText, Phone, Building, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const Register = () => {
  const [formData, setFormData] = useState({
    tipoCliente: 'B2C', // B2C o B2B
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipoDocumento: 'CC',
    documento: '',
    telefono: '',
    empresa: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoClienteChange = (tipo) => {
    setFormData(prev => ({ 
      ...prev, 
      tipoCliente: tipo,
      rol: tipo === 'B2B' ? 'CLIENTE_B2B' : 'CLIENTE_B2C',
      tipoDocumento: tipo === 'B2B' ? 'NIT' : 'CC'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    if (formData.tipoCliente === 'B2B' && !formData.empresa) {
      return setError('El nombre de la empresa es obligatorio para cuentas B2B');
    }

    setIsLoading(true);

    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      password: formData.password,
      tipoDocumento: formData.tipoDocumento,
      documento: formData.documento,
      telefono: formData.telefono,
      empresa: formData.tipoCliente === 'B2B' ? formData.empresa : null,
      rol: formData.tipoCliente === 'B2B' ? 'CLIENTE_B2B' : 'CLIENTE_B2C'
    };

    const result = await register(payload);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-pane-left" style={{ padding: '2rem 1rem' }}>
        <div className="card auth-card glass" style={{ maxWidth: '600px', width: '100%' }}>
          
          <div className="flex items-center mb-6">
            <Link to="/login" className="btn btn-ghost" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
            <div className="flex-1 text-center pr-8">
              <Link to="/" className="inline-flex items-center gap-2">
                <Globe className="text-accent" size={24} />
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Logistics<span className="text-accent">World</span></span>
              </Link>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 style={{ fontSize: '1.5rem' }}>Crear una cuenta</h2>
            <p className="text-secondary mt-1">Regístrate para solicitar y rastrear envíos</p>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-surface-hover rounded-md" style={{ background: 'var(--bg-surface-hover)' }}>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-sm transition-fast ${formData.tipoCliente === 'B2C' ? 'bg-surface text-accent shadow-sm' : 'text-secondary hover:text-primary'}`}
              style={formData.tipoCliente === 'B2C' ? { backgroundColor: 'var(--bg-surface)', color: 'var(--color-accent)' } : {}}
              onClick={() => handleTipoClienteChange('B2C')}
              type="button"
            >
              Persona Natural (B2C)
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-sm transition-fast ${formData.tipoCliente === 'B2B' ? 'bg-surface text-accent shadow-sm' : 'text-secondary hover:text-primary'}`}
              style={formData.tipoCliente === 'B2B' ? { backgroundColor: 'var(--bg-surface)', color: 'var(--color-accent)' } : {}}
              onClick={() => handleTipoClienteChange('B2B')}
              type="button"
            >
              Empresa (B2B)
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-md text-sm text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="text" name="nombre" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.nombre} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Apellido</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="text" name="apellido" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.apellido} onChange={handleChange} required />
                </div>
              </div>

              {formData.tipoCliente === 'B2B' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nombre de la Empresa</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                    <input type="text" name="empresa" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.empresa} onChange={handleChange} required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Tipo Documento</label>
                <select name="tipoDocumento" className="form-select" value={formData.tipoDocumento} onChange={handleChange}>
                  {formData.tipoCliente === 'B2B' ? (
                    <option value="NIT">NIT</option>
                  ) : (
                    <>
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Número Documento</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="text" name="documento" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.documento} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="email" name="email" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="password" name="password" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.password} onChange={handleChange} required minLength={6} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="password" name="confirmPassword" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Teléfono (Opcional)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <input type="tel" name="telefono" className="form-input" style={{ paddingLeft: '2.5rem' }} value={formData.telefono} onChange={handleChange} />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary mt-4" 
              style={{ width: '100%', padding: '0.875rem' }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Completar Registro'}
            </button>
          </form>
          
          <p className="text-center text-sm text-secondary mt-4">
            Al registrarte aceptas nuestros <a href="#" className="text-accent">Términos y Condiciones</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
