const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// Función para generar número de cotización
const generarNumeroCotizacion = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.cotizacion.count({
    where: { numero: { startsWith: `COT-${year}` } }
  });
  return `COT-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Cálculo de precio automático
const calcularPrecio = (tipoServicio, peso, volumen, urgencia) => {
  const tarifasBase = {
    'transporte_nacional':      { base: 135000, porKg: 720,  porM3: 45000  },
    'transporte_internacional': { base: 450000, porKg: 2250, porM3: 135000 },
    'paqueteria':               { base: 22500,  porKg: 1350, porM3: 27000  },
    'almacenamiento':           { base: 180000, porKg: 180,  porM3: 72000  },
    'freight_forwarding':       { base: 720000, porKg: 2700, porM3: 180000 },
    'ultima_milla':             { base: 13500,  porKg: 450,  porM3: 18000  }
  };

  const multiplicadorUrgencia = {
    'normal': 1.0,
    'express': 1.5,
    'urgente': 2.0
  };

  const tarifa = tarifasBase[tipoServicio] || tarifasBase['transporte_nacional'];
  const mult = multiplicadorUrgencia[urgencia] || 1.0;

  let precio = tarifa.base;
  if (peso) precio += peso * tarifa.porKg;
  if (volumen) precio += volumen * tarifa.porM3;
  precio *= mult;

  return Math.round(precio);
};

// POST /api/cotizaciones - Crear cotización
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipoServicio, origen, destino, peso, volumen, descripcion, urgencia } = req.body;

    if (!tipoServicio || !origen || !destino) {
      return res.status(400).json({ error: 'Tipo de servicio, origen y destino son requeridos' });
    }

    const numero = await generarNumeroCotizacion();
    const precioCalculado = calcularPrecio(tipoServicio, peso, volumen, urgencia || 'normal');

    const cotizacion = await prisma.cotizacion.create({
      data: {
        numero,
        usuarioId: req.usuario.id,
        tipoServicio,
        origen,
        destino,
        peso: peso ? parseFloat(peso) : null,
        volumen: volumen ? parseFloat(volumen) : null,
        descripcion,
        urgencia: urgencia || 'normal',
        precioCalculado
      }
    });

    res.status(201).json(cotizacion);
  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(500).json({ error: 'Error al crear cotización' });
  }
});

// GET /api/cotizaciones - Listar cotizaciones
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};

    // Si no es admin u operador, solo ver sus propias
    if (!['ADMIN', 'OPERADOR'].includes(req.usuario.rol)) {
      where.usuarioId = req.usuario.id;
    }

    // Filtros opcionales
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.tipoServicio) where.tipoServicio = req.query.tipoServicio;

    const cotizaciones = await prisma.cotizacion.findMany({
      where,
      include: { usuario: { select: { nombre: true, apellido: true, empresa: true } } },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(cotizaciones);
  } catch (error) {
    console.error('Error al listar cotizaciones:', error);
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});

// GET /api/cotizaciones/:id - Detalle
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        usuario: { select: { nombre: true, apellido: true, email: true, empresa: true } },
        servicio: true
      }
    });

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    // Verificar permisos
    if (!['ADMIN', 'OPERADOR'].includes(req.usuario.rol) && cotizacion.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    res.json(cotizacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cotización' });
  }
});

// Función para generar número de servicio
const generarNumeroServicio = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.servicio.count({
    where: { numero: { startsWith: `SRV-${year}` } }
  });
  return `SRV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// PATCH /api/cotizaciones/:id/aceptar
router.patch('/:id/aceptar', authMiddleware, async (req, res) => {
  try {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });
    if (cotizacion.usuarioId !== req.usuario.id && !['ADMIN', 'OPERADOR'].includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (cotizacion.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden aceptar cotizaciones pendientes' });
    }

    const numeroServicio = await generarNumeroServicio();

    const [cotizacionActualizada, servicio] = await prisma.$transaction([
      prisma.cotizacion.update({
        where: { id: cotizacion.id },
        data: { estado: 'ACEPTADA' }
      }),
      prisma.servicio.create({
        data: {
          numero: numeroServicio,
          cotizacionId: cotizacion.id,
          usuarioId: cotizacion.usuarioId,
          estado: 'CONTRATADO'
        }
      })
    ]);

    // Crear primer cambio de estado
    await prisma.cambioEstado.create({
      data: {
        servicioId: servicio.id,
        estadoAnterior: 'COTIZADO',
        estadoNuevo: 'CONTRATADO',
        nota: 'Cotización aceptada, servicio contratado',
        responsable: `${req.usuario.nombre} ${req.usuario.apellido}`
      }
    });

    res.json({ cotizacion: cotizacionActualizada, servicio });
  } catch (error) {
    console.error('Error al aceptar cotización:', error);
    res.status(500).json({ error: 'Error al aceptar cotización' });
  }
});

// PATCH /api/cotizaciones/:id/rechazar
router.patch('/:id/rechazar', authMiddleware, async (req, res) => {
  try {
    const cotizacion = await prisma.cotizacion.update({
      where: { id: parseInt(req.params.id) },
      data: { estado: 'RECHAZADA' }
    });
    res.json(cotizacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar cotización' });
  }
});

module.exports = router;
