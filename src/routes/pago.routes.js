const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const pagoController = require('../controllers/pago.controller');

// Obtener todas las rutas de pagos (protegidas)
router.use(authMiddleware);

// Métodos de pago disponibles
router.get('/metodos', pagoController.obtenerMetodosPago);

// Obtener pagos de una factura
router.get('/factura/:facturaId', pagoController.obtenerPagosPorFactura);

// Procesar un pago
router.post('/procesar', pagoController.procesarPago);

module.exports = router;
