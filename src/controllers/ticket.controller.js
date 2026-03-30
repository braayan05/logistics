const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Crear un nuevo ticket
exports.crearTicket = async (req, res) => {
  try {
    const { asunto, descripcion, prioridad } = req.body;
    const usuarioId = req.usuario.id;

    if (!asunto || !descripcion) {
      return res.status(400).json({ error: 'Asunto y descripción son requeridos' });
    }

    // Generar número de ticket único
    const count = await prisma.ticket.count();
    const numero = `TIC-2026-${String(count + 1).padStart(4, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        numero,
        usuarioId,
        asunto,
        descripcion,
        prioridad: prioridad || 'MEDIA',
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(500).json({ error: 'Error al crear el ticket' });
  }
};

// Obtener todos los tickets (Admin ve todos, Cliente ve los suyos)
exports.obtenerTickets = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    let testFilters = {};
    if (rol !== 'ADMIN' && rol !== 'OPERADOR') {
      testFilters.usuarioId = usuarioId;
    }

    const tickets = await prisma.ticket.findMany({
      where: testFilters,
      include: {
        usuario: { select: { nombre: true, apellido: true, empresa: true } },
        _count: { select: { mensajes: true } }
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: 'Error al obtener los tickets' });
  }
};

// Obtener detalle de un ticket
exports.obtenerTicketPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { nombre: true, apellido: true, empresa: true } },
        mensajes: {
          include: {
            usuario: { select: { nombre: true, apellido: true, rol: true } }
          },
          orderBy: { creadoEn: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Seguridad: Solo admin/operador o el dueño pueden ver el ticket
    if (ticket.usuarioId !== usuarioId && rol !== 'ADMIN' && rol !== 'OPERADOR') {
      return res.status(403).json({ error: 'No autorizado para ver este ticket' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error al obtener detalle del ticket:', error);
    res.status(500).json({ error: 'Error al obtener el detalle del ticket' });
  }
};

// Agregar mensaje a un ticket
exports.agregarMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;
    const usuarioId = req.usuario.id;

    if (!mensaje) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Verificar permisos
    if (ticket.usuarioId !== usuarioId && req.usuario.rol !== 'ADMIN' && req.usuario.rol !== 'OPERADOR') {
      return res.status(403).json({ error: 'No autorizado para mensajear en este ticket' });
    }

    const nuevoMensaje = await prisma.mensajeTicket.create({
      data: {
        ticketId: parseInt(id),
        usuarioId,
        mensaje
      },
      include: {
        usuario: { select: { nombre: true, apellido: true, rol: true } }
      }
    });

    // Si el ticket estaba cerrado y responde el cliente, lo reabre a EN_PROCESO
    if (ticket.estado === 'CERRADO' && ticket.usuarioId === usuarioId) {
      await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { estado: 'EN_PROCESO' }
      });
    }

    // Marcar ticket como actualizado
    await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { actualizadoEn: new Date() }
    });

    res.status(201).json(nuevoMensaje);
  } catch (error) {
    console.error('Error al agregar mensaje:', error);
    res.status(500).json({ error: 'Error al agregar el mensaje' });
  }
};

// Cambiar estado del ticket (Solo Admin/Operador)
exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const rol = req.usuario.rol;

    if (rol !== 'ADMIN' && rol !== 'OPERADOR') {
      return res.status(403).json({ error: 'No autorizado para cambiar estados de tickets' });
    }

    const ticketActualizado = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { estado }
    });

    res.json(ticketActualizado);
  } catch (error) {
    console.error('Error al actualizar estado del ticket:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del ticket' });
  }
};
