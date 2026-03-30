import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import '../styles/ticket-chat.css';

const PRIORITY_LABELS = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
const PRIORITY_DOT    = { BAJA: 'tc-low', MEDIA: '', ALTA: 'tc-high' };

const STATUS_PILL_CLASS = {
  ABIERTO:   'tc-pill-open',
  EN_PROCESO:'tc-pill-progress',
  RESUELTO:  'tc-pill-resolved',
  CERRADO:   'tc-pill-closed',
};

const getInitials = (nombre = '', apellido = '') =>
  `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase() || '??';

const TicketDetalle = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const mensajesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => { fetchTicket(); }, [id]);
  useEffect(() => { mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.mensajes]);

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch {
      setError('Error al cargar la conversación del ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e?.preventDefault();
    if (!nuevoMensaje.trim()) return;
    try {
      const res = await api.post(`/tickets/${id}/mensajes`, { mensaje: nuevoMensaje });
      setTicket(prev => ({
        ...prev,
        mensajes: [...prev.mensajes, res.data],
        estado: prev.estado === 'CERRADO' && prev.usuarioId === user.id ? 'EN_PROCESO' : prev.estado
      }));
      setNuevoMensaje('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch {
      setError('No se pudo enviar el mensaje.');
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      await api.patch(`/tickets/${id}/estado`, { estado: nuevoEstado });
      setTicket({ ...ticket, estado: nuevoEstado });
    } catch {
      setError('Error al actualizar el estado del ticket');
    }
  };

  const handleTextareaInput = (e) => {
    setNuevoMensaje(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'16rem' }}>
      <div className="spinner"></div>
    </div>
  );

  if (error || !ticket) return (
    <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--color-error)', padding:'1.5rem', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <p>{error || 'Ticket no encontrado'}</p>
      <Link to="/soporte" style={{ color:'white', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <ArrowLeft size={16} /> Volver
      </Link>
    </div>
  );

  const isAdmin = user.rol === 'ADMIN' || user.rol === 'OPERADOR';
  const isClosed = ticket.estado === 'CERRADO';

  return (
    <div className="tc-container">

      {/* ── HEADER ── */}
      <div className="tc-header">
        <div className="tc-header-top">
          <Link to="/soporte" className="tc-back-btn" title="Volver a soporte">
            <ArrowLeft size={18} />
          </Link>

          <div className="tc-header-info">
            <div className="tc-title-row">
              <h1 className="tc-title">{ticket.asunto}</h1>
              <span className="tc-ticket-id">{ticket.numero}</span>
            </div>
            <div className="tc-header-meta">
              <span>{ticket.usuario?.nombre} {ticket.usuario?.apellido}</span>
              <span className="tc-meta-dot"></span>
              <span>{new Date(ticket.creadoEn).toLocaleString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="tc-status-bar">
          <span className="tc-status-label">Estado:</span>

          {isAdmin ? (
            <div className="tc-status-pills">
              {[['ABIERTO','Abierto'],['EN_PROCESO','En Proceso'],['RESUELTO','Resuelto'],['CERRADO','Cerrado']].map(([val, label]) => (
                <button
                  key={val}
                  className={`tc-status-pill ${ticket.estado === val ? STATUS_PILL_CLASS[val] : ''}`}
                  onClick={() => handleCambiarEstado(val)}
                >
                  <span className="tc-s-dot"></span>{label}
                </button>
              ))}
            </div>
          ) : (
            <span className={`tc-status-pill ${STATUS_PILL_CLASS[ticket.estado] || ''}`} style={{ cursor: 'default' }}>
              <span className="tc-s-dot"></span>
              {{ ABIERTO:'Abierto', EN_PROCESO:'En Proceso', RESUELTO:'Resuelto', CERRADO:'Cerrado' }[ticket.estado]}
            </span>
          )}

          <div className="tc-priority-badge">
            <span className={`tc-p-dot ${PRIORITY_DOT[ticket.prioridad] || ''}`}></span>
            Prioridad {PRIORITY_LABELS[ticket.prioridad] || ticket.prioridad}
          </div>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="tc-messages">

        {/* Original description as first message */}
        <div className="tc-sys-event">
          <span>Ticket creado por {ticket.usuario?.nombre} {ticket.usuario?.apellido}</span>
        </div>

        <div className="tc-row">
          <div className={`tc-avatar tc-client`}>
            {getInitials(ticket.usuario?.nombre, ticket.usuario?.apellido)}
          </div>
          <div className="tc-msg-content">
            <div className="tc-sender tc-cname">
              {ticket.usuario?.nombre} {ticket.usuario?.apellido}
              <span className="tc-role-tag tc-ctag">Cliente</span>
            </div>
            <div className="tc-bubble tc-other" style={{ whiteSpace: 'pre-wrap' }}>
              {ticket.descripcion}
            </div>
            <div className="tc-time">
              {new Date(ticket.creadoEn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            </div>
          </div>
        </div>

        {/* Thread messages */}
        {ticket.mensajes?.map((msg) => {
          const isOwn   = msg.usuarioId === user.id;
          const isStaff = msg.usuario.rol === 'ADMIN' || msg.usuario.rol === 'OPERADOR';

          return (
            <div key={msg.id} className={`tc-row ${isOwn ? 'tc-self' : ''}`}>
              <div className={`tc-avatar ${isStaff ? 'tc-agent' : 'tc-client'}`}>
                {getInitials(msg.usuario.nombre, msg.usuario.apellido)}
              </div>
              <div className="tc-msg-content">
                <div className={`tc-sender ${isStaff ? 'tc-aname' : 'tc-cname'}`}>
                  {isOwn ? 'Tú' : `${msg.usuario.nombre}`}
                  <span className={`tc-role-tag ${isStaff ? 'tc-atag' : 'tc-ctag'}`}>
                    {isStaff ? 'Soporte' : 'Cliente'}
                  </span>
                </div>
                <div className={`tc-bubble ${isOwn ? 'tc-mine' : 'tc-other'}`} style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.mensaje}
                </div>
                <div className={`tc-time ${isOwn ? 'tc-self-time' : ''}`}>
                  {new Date(msg.creadoEn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  {isOwn && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={mensajesEndRef} />
      </div>

      {/* ── CLOSED BANNER ── */}
      {isClosed && !isAdmin && (
        <div className="tc-closed-banner">
          <CheckCircle size={28} style={{ color: '#475569' }} />
          <p>Este ticket ha sido cerrado.</p>
          <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>Si escribes un mensaje, se reabrirá automáticamente.</p>
        </div>
      )}

      {/* ── COMPOSER ── */}
      {(!isClosed || isAdmin) && (
        <div className="tc-composer">
          <form onSubmit={handleEnviarMensaje}>
            <div className="tc-composer-inner">
              <textarea
                ref={textareaRef}
                className="tc-compose-textarea"
                value={nuevoMensaje}
                onChange={handleTextareaInput}
                placeholder="Escribe un mensaje..."
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviarMensaje();
                  }
                }}
              />
              <button
                type="submit"
                className={`tc-send-btn ${nuevoMensaje.trim() ? 'tc-active' : ''}`}
                disabled={!nuevoMensaje.trim()}
                title="Enviar"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <div className="tc-composer-hint">
            <kbd>Enter</kbd> para enviar · <kbd>Shift + Enter</kbd> para nueva línea
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketDetalle;
