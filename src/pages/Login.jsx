import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Get user from localStorage since state may not be updated yet
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(storedUser.rol === 'ADMIN' ? '/admin' : '/dashboard');
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-pane-left">
        <div className="card auth-card glass">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Globe className="text-accent" size={32} />
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Logistics<span className="text-accent">World</span>
              </span>
            </Link>
            <h2 style={{ fontSize: '1.5rem' }}>Iniciar Sesión</h2>
            <p className="text-secondary mt-2">Bienvenido de vuelta a tu panel de control</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input 
                  id="email"
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="admin@logisticsworld.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <a href="#" className="form-label text-accent" style={{ fontSize: '0.75rem' }}>¿Olvidaste tu contraseña?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="text-secondary" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                <input 
                  id="password"
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary mt-6" 
              style={{ width: '100%', padding: '0.875rem' }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                <>Ingresar al Sistema <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-6">
            ¿No tienes cuenta? <Link to="/register" className="text-accent" style={{ fontWeight: 600 }}>Regístrate ahora</Link>
          </p>
        </div>
      </div>
      
      <div className="auth-pane-right">
        <div className="auth-shape-1"></div>
        <div className="auth-shape-2"></div>
        
        <div style={{ position: 'relative', zIndex: 20, maxWidth: '500px', padding: '2rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#fff' }}>Gestión logística a otro nivel.</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <li className="flex items-center gap-4 text-secondary">
              <div className="badge badge-success" style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center' }}>✓</div>
              <span style={{ fontSize: '1.125rem' }}>Cotizaciones inmediatas</span>
            </li>
            <li className="flex items-center gap-4 text-secondary">
              <div className="badge badge-warning" style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center' }}>✓</div>
              <span style={{ fontSize: '1.125rem' }}>Trazabilidad y estados GPS</span>
            </li>
            <li className="flex items-center gap-4 text-secondary">
              <div className="badge badge-info" style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center' }}>✓</div>
              <span style={{ fontSize: '1.125rem' }}>Inventario en tiempo real</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
