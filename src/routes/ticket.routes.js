const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware.js');
const ticketController = require('../controllers/ticket.controller.js');

const router = Router();

// Todas las rutas de tickets requieren autenticación
router.use(authMiddleware);

// Rutas principales
router.post('/', ticketController.crearTicket);
router.get('/', ticketController.obtenerTickets);
router.get('/:id', ticketController.obtenerTicketPorId);

// Rutas para interacción de mensajes y estados
router.post('/:id/mensajes', ticketController.agregarMensaje);
router.patch('/:id/estado', ticketController.actualizarEstado);

module.exports = router;
