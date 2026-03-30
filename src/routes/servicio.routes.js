const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// Transiciones de estado válidas
const transicionesValidas = {
  // Comunes
  'CONTRATADO': ['EN_PREPARACION', 'LLEGADA_A_BODEGA'],
  'ENTREGADO': ['FACTURADO'],
  'FACTURADO': ['CERRADO'],
  'INCIDENCIA': ['EN_TRANSITO', 'PENDIENTE_ALMACENAR', 'ALMACENADA', 'EN_INVENTARIO', 'DESPACHADA'],

  // Transporte
  'EN_PREPARACION': ['EN_TRANSITO'],
  'EN_TRANSITO': ['ENTREGADO', 'INCIDENCIA'],

  // Almacenamiento
  'LLEGADA_A_BODEGA': ['PENDIENTE_ALMACENAR', 'INCIDENCIA'],
  'PENDIENTE_ALMACENAR': ['ALMACENADA', 'INCIDENCIA'],
  'ALMACENADA': ['EN_INVENTARIO', 'INCIDENCIA'],
  'EN_INVENTARIO': ['DESPACHADA', 'INCIDENCIA'],
  'DESPACHADA': ['ENTREGADO', 'INCIDENCIA']
};

// GET /api/servicios - Listar servicios
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};

    if (!['ADMIN', 'OPERADOR'].includes(req.usuario.rol)) {
      where.usuarioId = req.usuario.id;
    }

    if (req.query.estado) where.estado = req.query.estado;

    const servicios = await prisma.servicio.findMany({
      where,
      include: {
        cotizacion: {
          select: { tipoServicio: true, origen: true, destino: true, precioCalculado: true }
        },
        usuario: { select: { nombre: true, apellido: true, empresa: true } },
        cambiosEstado: { orderBy: { creadoEn: 'desc' }, take: 1 }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(servicios);
  } catch (error) {
    console.error('Error al listar servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// GET /api/servicios/:id - Detalle con historial
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        cotizacion: true,
        usuario: { select: { nombre: true, apellido: true, email: true, empresa: true, telefono: true } },
        cambiosEstado: { orderBy: { creadoEn: 'asc' } }
      }
    });

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    if (!['ADMIN', 'OPERADOR'].includes(req.usuario.rol) && servicio.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    res.json(servicio);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
});

// PATCH /api/servicios/:id/estado - Actualizar estado
router.patch('/:id/estado', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const { nuevoEstado, nota } = req.body;
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { cotizacion: true }
    });

    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    // Validar transición
    const permitidos = transicionesValidas[servicio.estado];
    if (!permitidos || !permitidos.includes(nuevoEstado)) {
      return res.status(400).json({
        error: `Transición inválida: ${servicio.estado} → ${nuevoEstado}`,
        transicionesPermitidas: permitidos || []
      });
    }

    const transacciones = [
      prisma.servicio.update({
        where: { id: servicio.id },
        data: { estado: nuevoEstado }
      }),
      prisma.cambioEstado.create({
        data: {
          servicioId: servicio.id,
          estadoAnterior: servicio.estado,
          estadoNuevo: nuevoEstado,
          nota: nota || null,
          responsable: `${req.usuario.nombre} ${req.usuario.apellido}`
        }
      })
    ];

    // Si pasa a FACTURADO, generar factura automáticamente
    if (nuevoEstado === 'FACTURADO') {
      const montoBase = servicio.cotizacion.precioCalculado;
      const impuestos = Math.round(montoBase * 0.19);
      const total = montoBase + impuestos;
      const timestampYear = new Date().getFullYear();
      const numRandomStr = Math.floor(1000 + Math.random() * 9000).toString(); // Fallback for numero factura
      
      transacciones.push(
        prisma.factura.create({
          data: {
            numero: `FAC-${timestampYear}-${numRandomStr}-${servicio.id}`,
            servicioId: servicio.id,
            usuarioId: servicio.usuarioId,
            montoBase,
            impuestos,
            total,
            estado: 'PENDIENTE'
          }
        })
      );
    }

    const [servicioActualizado, cambio] = await prisma.$transaction(transacciones);

    res.json({ servicio: servicioActualizado, cambio });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;
