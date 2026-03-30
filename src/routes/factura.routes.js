const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const facturaController = require('../controllers/factura.controller');

// Todas las rutas de facturas requieren autenticación
router.use(authMiddleware);

// Obtener todas las facturas (filtradas según rol en el controlador)
router.get('/', facturaController.getFacturas);

// Obtener detalle de una factura específica
router.get('/:id', facturaController.getFacturaById);

module.exports = router;
