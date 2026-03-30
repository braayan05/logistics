import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Filter, CheckCircle, XCircle, Search, Edit2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const Usuarios = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Refrescar al cargar
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (usuario) => {
    if (!window.confirm(`¿Seguro que deseas ${usuario.activo ? 'desactivar' : 'activar'} a ${usuario.nombre}?`)) return;
    try {
      await api.patch(`/admin/usuarios/${usuario.id}`, { 
        ...usuario, 
        activo: !usuario.activo 
      });
      fetchUsuarios();
    } catch (error) {
      alert("Error al cambiar estado");
      console.error(error);
    }
  };

  const roleColors = {
    'ADMIN': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'OPERADOR': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'CLIENTE_B2B': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'CLIENTE_B2C': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.empresa && u.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fade-in pb-10">
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="text-primary" /> Gestión de Usuarios
          </h1>
          <p className="text-secondary">Administra los accesos y roles de la plataforma.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="form-group mb-0 flex-1 min-w-[250px] relative">
            <Search size={18} className="text-secondary absolute top-3 left-3" />
            <input 
              type="text" 
              className="form-input pl-10" 
              placeholder="Buscar por nombre, correo o empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary flex items-center gap-2" onClick={fetchUsuarios}>
            <Filter size={18} /> Refrescar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
           <div className="flex justify-center items-center p-12"><div className="spinner"></div></div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center p-12">
            <ShieldAlert size={40} className="text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-1">No se encontraron usuarios</h3>
            <p className="text-secondary">Intenta cambiar los términos de búsqueda.</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Contacto</th>
                  <th>Rol</th>
                  <th>Actividad</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-white">
                        {u.empresa ? u.empresa : `${u.nombre} ${u.apellido}`}
                      </div>
                      <div className="text-xs text-secondary">
                        {u.tipoDocumento} {u.documento}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{u.email}</div>
                      <div className="text-xs text-slate-400">{u.telefono || 'Sin teléfono'}</div>
                    </td>
                    <td>
                      <span className={`badge ${roleColors[u.rol] || 'bg-slate-800'} text-xs px-2 py-1`}>
                        {u.rol.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col text-xs space-y-1">
                        <span className="text-slate-300">Cotizaciones: <b className="text-white">{u._count?.cotizaciones || 0}</b></span>
                        <span className="text-slate-300">Servicios: <b className="text-white">{u._count?.servicios || 0}</b></span>
                      </div>
                    </td>
                    <td>
                      {u.activo ? (
                        <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-1 flex items-center gap-1 w-fit">
                          <CheckCircle size={12} /> Activo
                        </span>
                      ) : (
                        <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2 py-1 flex items-center gap-1 w-fit">
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {user?.id !== u.id && (
                        <button 
                          onClick={() => toggleStatus(u)}
                          className={`btn p-2 ${u.activo ? 'btn-ghost text-error' : 'btn-secondary text-emerald-400'}`}
                          title={u.activo ? "Desactivar Usuario" : "Activar Usuario"}
                        >
                          {u.activo ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
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

export default Usuarios;
