const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// Middleware: todas las rutas admin requieren ADMIN o OPERADOR
router.use(authMiddleware);
router.use(requireRole('ADMIN', 'OPERADOR'));

// GET /api/admin/dashboard - KPIs
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsuarios,
      totalServicios,
      serviciosActivos,
      totalCotizaciones,
      cotizacionesPendientes,
      serviciosPorEstado,
      ingresosMes
    ] = await Promise.all([
      prisma.usuario.count({ where: { activo: true } }),
      prisma.servicio.count(),
      prisma.servicio.count({
        where: { estado: { notIn: ['CERRADO', 'RECHAZADO'] } }
      }),
      prisma.cotizacion.count(),
      prisma.cotizacion.count({ where: { estado: 'PENDIENTE' } }),
      prisma.servicio.groupBy({
        by: ['estado'],
        _count: { estado: true }
      }),
      prisma.cotizacion.aggregate({
        where: {
          estado: 'ACEPTADA',
          creadoEn: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { precioCalculado: true }
      })
    ]);

    res.json({
      totalUsuarios,
      totalServicios,
      serviciosActivos,
      totalCotizaciones,
      cotizacionesPendientes,
      serviciosPorEstado: serviciosPorEstado.reduce((acc, item) => {
        acc[item.estado] = item._count.estado;
        return acc;
      }, {}),
      ingresosMes: ingresosMes._sum.precioCalculado || 0
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

// GET /api/admin/usuarios - Listar usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true, email: true, nombre: true, apellido: true,
        tipoDocumento: true, documento: true, telefono: true,
        rol: true, empresa: true, activo: true, creadoEn: true,
        _count: { select: { cotizaciones: true, servicios: true } }
      },
      orderBy: { creadoEn: 'desc' }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PATCH /api/admin/usuarios/:id - Editar usuario
router.patch('/usuarios/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { nombre, apellido, rol, activo, telefono, empresa } = req.body;
    const usuario = await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, apellido, rol, activo, telefono, empresa },
      select: {
        id: true, email: true, nombre: true, apellido: true,
        rol: true, activo: true, empresa: true
      }
    });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/admin/usuarios/:id - Desactivar usuario
router.delete('/usuarios/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false }
    });
    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

// GET /api/admin/zonas
router.get('/zonas', async (req, res) => {
  try {
    const zonas = await prisma.zona.findMany({
      include: { tarifas: true }
    });
    res.json(zonas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener zonas' });
  }
});

// POST /api/admin/zonas
router.post('/zonas', requireRole('ADMIN'), async (req, res) => {
  try {
    const { nombre, departamento } = req.body;
    const zona = await prisma.zona.create({ data: { nombre, departamento } });
    res.status(201).json(zona);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear zona' });
  }
});

// POST /api/admin/tarifas
router.post('/tarifas', requireRole('ADMIN'), async (req, res) => {
  try {
    const { zonaOrigenId, tipoServicio, precioBase, precioPorKg, precioPorM3 } = req.body;
    const tarifa = await prisma.tarifa.create({
      data: { zonaOrigenId, tipoServicio, precioBase, precioPorKg, precioPorM3 }
    });
    res.status(201).json(tarifa);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tarifa' });
  }
});

module.exports = router;
