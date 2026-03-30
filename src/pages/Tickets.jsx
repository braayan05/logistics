import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LifeBuoy, Plus, Tag, Clock, CheckCircle, AlertCircle, MessageSquare, Send, X, FileText, Upload } from 'lucide-react';
import api from '../services/api';
import '../styles/ticket-modal.css';

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [nuevoTicket, setNuevoTicket] = useState({ asunto: '', descripcion: '', prioridad: 'BAJA' });
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/tickets');
      setTickets(data);
    } catch (err) {
      setError('No se pudieron cargar los tickets de soporte');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', nuevoTicket);
      setShowModal(false);
      setNuevoTicket({ asunto: '', descripcion: '', prioridad: 'MEDIA' });
      fetchTickets();
    } catch (err) {
      setError('Error al crear el ticket');
    }
  };

  const statusColors = {
    ABIERTO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    EN_PROCESO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    CERRADO: 'bg-slate-500/20 text-white font-medium border-slate-500/30'
  };

  const priorityColors = {
    ALTA: 'text-rose-400',
    MEDIA: 'text-amber-400',
    BAJA: 'text-emerald-400'
  };

  const ticketsFiltrados = tickets.filter(t => filtroEstado === 'ALL' || t.estado === filtroEstado);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="text-primary w-6 h-6" />
            Soporte Técnico
          </h1>
          <p className="text-slate-400 mt-1">Centro de ayuda y resolución de incidencias</p>
        </div>
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg w-fit border border-slate-700/50 overflow-x-auto max-w-full">
        {['ALL', 'ABIERTO', 'EN_PROCESO', 'CERRADO'].map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filtroEstado === estado
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {estado === 'ALL' ? 'Todos' : estado.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Lista de Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ticketsFiltrados.length === 0 ? (
          <div className="col-span-full bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Todo en orden</h3>
            <p className="text-slate-400">No hay tickets de soporte en este estado.</p>
          </div>
        ) : (
          ticketsFiltrados.map((ticket) => (
            <Link 
              key={ticket.id} 
              to={`/soporte/${ticket.id}`}
              className="group bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-mono text-slate-500">{ticket.numero}</span>
                  <h3 className="text-lg font-semibold text-white mt-1 line-clamp-1" title={ticket.asunto}>
                    {ticket.asunto}
                  </h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[ticket.estado]} ${ticket.estado === 'CERRADO' ? 'text-white' : ''}`}>
                  {ticket.estado.replace('_', ' ')}
                </span>
              </div>

              <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">
                {ticket.descripcion}
              </p>

              <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-700/50 mt-auto">
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1.5" title="Prioridad">
                    <Tag size={14} className={priorityColors[ticket.prioridad]} />
                    {ticket.prioridad}
                  </span>
                  <span className="flex items-center gap-1.5" title="Mensajes">
                    <MessageSquare size={14} />
                    {ticket._count?.mensajes || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={14} />
                  {new Date(ticket.creadoEn).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Modal Crear Ticket - Premium Design */}
      {showModal && (
        <div className="tm-overlay">
          <div className="tm-backdrop" onClick={() => setShowModal(false)}></div>
          <div className="tm-card">
            <div className="tm-strip"></div>
            <div className="tm-body">

              {/* Header */}
              <div className="tm-header">
                <div className="tm-icon">
                  <FileText size={22} />
                </div>
                <div className="tm-title-wrap">
                  <h2 className="tm-title">Crear Nuevo Ticket</h2>
                  <p className="tm-subtitle">Detalla tu solicitud y te responderemos pronto.</p>
                </div>
                <button className="tm-close-btn" type="button" onClick={() => setShowModal(false)} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCrearTicket}>
                {/* Asunto */}
                <div className="tm-form-group">
                  <label className="tm-label">
                    Asunto <span className="tm-badge-required">Requerido</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoTicket.asunto}
                    onChange={(e) => setNuevoTicket({ ...nuevoTicket, asunto: e.target.value })}
                    placeholder="Ej. Problema con la cotización #4521"
                  />
                </div>

                {/* Prioridad - Pills */}
                <div className="tm-form-group">
                  <label className="tm-label">Prioridad</label>
                  <div className="tm-pills">
                    {[['BAJA','Baja','tm-low','Consulta general'],['MEDIA','Media','tm-med','Incidencia regular'],['ALTA','Alta','tm-high','Problema urgente']].map(([val,label,cls,sub]) => (
                      <div
                        key={val}
                        className={`tm-pill ${cls} ${nuevoTicket.prioridad === val ? 'tm-active' : ''}`}
                        onClick={() => setNuevoTicket({ ...nuevoTicket, prioridad: val })}
                      >
                        <span className="tm-pill-dot"></span>
                        <span className="tm-pill-name">{label}</span>
                        <span className="tm-pill-sub">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descripción */}
                <div className="tm-form-group">
                  <label className="tm-label">
                    Descripción <span className="tm-badge-required">Requerido</span>
                  </label>
                  <div className="tm-textarea-wrap">
                    <textarea
                      required
                      maxLength={1000}
                      value={nuevoTicket.descripcion}
                      onChange={(e) => {
                        setNuevoTicket({ ...nuevoTicket, descripcion: e.target.value });
                        setCharCount(e.target.value.length);
                      }}
                      placeholder="Describe tu incidencia con el mayor detalle posible..."
                    ></textarea>
                    <span className={`tm-char-count ${charCount > 900 ? 'limit' : charCount > 700 ? 'warning' : ''}`}>
                      {charCount} / 1000
                    </span>
                  </div>
                </div>

                {/* Adjunto */}
                <div className="tm-form-group">
                  <label className="tm-label">Adjuntos <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--tm-text-muted)'}}>&#40;opcional&#41;</span></label>
                  <div
                    className={`tm-dropzone ${fileName ? 'tm-file-ok' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="tm-dropzone-icon"><Upload size={18} /></div>
                    <div className="tm-dropzone-text">
                      {fileName
                        ? <><strong>{fileName}</strong><small>Archivo seleccionado ✓</small></>
                        : <><strong>Haz clic para subir</strong> o arrastra un archivo<small>PNG, JPG, PDF hasta 10 MB</small></>}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="tm-footer">
                  <button type="button" className="tm-btn tm-btn-ghost" onClick={() => setShowModal(false)}>
                    <X size={14} /> Cancelar
                  </button>
                  <button type="submit" className="tm-btn tm-btn-primary">
                    <Send size={14} /> Enviar Ticket
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
