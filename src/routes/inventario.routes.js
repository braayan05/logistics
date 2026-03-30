const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// =============================================
// BODEGAS
// =============================================

// GET /api/inventario/bodegas
router.get('/bodegas', authMiddleware, async (req, res) => {
  try {
    const bodegas = await prisma.bodega.findMany({
      where: { activa: true },
      include: {
        _count: { select: { productos: true } }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(bodegas);
  } catch (error) {
    console.error('Error al obtener bodegas:', error);
    res.status(500).json({ error: 'Error al obtener bodegas' });
  }
});

// POST /api/inventario/bodegas
router.post('/bodegas', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const { nombre, direccion, ciudad, tipo, capacidadM3 } = req.body;
    if (!nombre || !direccion || !ciudad || !capacidadM3) {
      return res.status(400).json({ error: 'Nombre, dirección, ciudad y capacidad son requeridos' });
    }
    const bodega = await prisma.bodega.create({
      data: { nombre, direccion, ciudad, tipo: tipo || 'PROPIA', capacidadM3: parseFloat(capacidadM3) }
    });
    res.status(201).json(bodega);
  } catch (error) {
    console.error('Error al crear bodega:', error);
    res.status(500).json({ error: 'Error al crear bodega' });
  }
});

// =============================================
// PRODUCTOS
// =============================================

// GET /api/inventario/productos
router.get('/productos', authMiddleware, async (req, res) => {
  try {
    const { bodegaId, search, alerta } = req.query;
    const where = { activo: true };
    if (bodegaId) where.bodegaId = parseInt(bodegaId);
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } }
      ];
    }

    let productos = await prisma.producto.findMany({
      where,
      include: {
        bodega: { select: { nombre: true, ciudad: true } }
      },
      orderBy: { actualizadoEn: 'desc' }
    });

    // Filtrar productos con alerta de stock
    if (alerta === 'true') {
      productos = productos.filter(p => p.stockActual <= p.stockMinimo);
    }

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST /api/inventario/productos
router.post('/productos', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const { sku, nombre, descripcion, categoria, unidadMedida, stockActual, stockMinimo, stockMaximo, precioUnitario, bodegaId, clienteId } = req.body;
    if (!sku || !nombre || !bodegaId) {
      return res.status(400).json({ error: 'SKU, nombre y bodega son requeridos' });
    }
    const producto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        descripcion,
        categoria,
        unidadMedida: unidadMedida || 'unidad',
        stockActual: parseInt(stockActual) || 0,
        stockMinimo: parseInt(stockMinimo) || 0,
        stockMaximo: parseInt(stockMaximo) || 0,
        precioUnitario: precioUnitario ? parseFloat(precioUnitario) : null,
        bodegaId: parseInt(bodegaId),
        clienteId: clienteId ? parseInt(clienteId) : null
      },
      include: { bodega: { select: { nombre: true } } }
    });
    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un producto con ese SKU' });
    }
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// =============================================
// MOVIMIENTOS DE INVENTARIO
// =============================================

// GET /api/inventario/movimientos
router.get('/movimientos', authMiddleware, async (req, res) => {
  try {
    const { productoId, tipo, limit } = req.query;
    const where = {};
    if (productoId) where.productoId = parseInt(productoId);
    if (tipo) where.tipo = tipo;

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        producto: { select: { sku: true, nombre: true, bodega: { select: { nombre: true } } } }
      },
      orderBy: { creadoEn: 'desc' },
      take: parseInt(limit) || 50
    });
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

// POST /api/inventario/movimientos
router.post('/movimientos', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const { productoId, tipo, cantidad, referencia, nota } = req.body;
    if (!productoId || !tipo || !cantidad) {
      return res.status(400).json({ error: 'Producto, tipo y cantidad son requeridos' });
    }

    const producto = await prisma.producto.findUnique({ where: { id: parseInt(productoId) } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const cantidadInt = parseInt(cantidad);
    let nuevoStock = producto.stockActual;

    switch (tipo) {
      case 'ENTRADA':
      case 'DEVOLUCION':
        nuevoStock += cantidadInt;
        break;
      case 'SALIDA':
        if (producto.stockActual < cantidadInt) {
          return res.status(400).json({ error: `Stock insuficiente. Disponible: ${producto.stockActual}` });
        }
        nuevoStock -= cantidadInt;
        break;
      case 'AJUSTE':
        nuevoStock = cantidadInt; // El ajuste establece el stock directamente
        break;
      default:
        return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }

    const [movimiento, productoActualizado] = await prisma.$transaction([
      prisma.movimientoInventario.create({
        data: {
          productoId: parseInt(productoId),
          tipo,
          cantidad: cantidadInt,
          stockAnterior: producto.stockActual,
          stockNuevo: nuevoStock,
          referencia,
          nota,
          responsable: `${req.usuario.nombre} ${req.usuario.apellido}`
        }
      }),
      prisma.producto.update({
        where: { id: parseInt(productoId) },
        data: { stockActual: nuevoStock }
      })
    ]);

    // Verificar alertas de stock
    const alertas = [];
    if (nuevoStock <= productoActualizado.stockMinimo) {
      alertas.push({ tipo: 'STOCK_MINIMO', mensaje: `¡Alerta! ${productoActualizado.nombre} (${productoActualizado.sku}) ha alcanzado el stock mínimo` });
    }
    if (productoActualizado.stockMaximo > 0 && nuevoStock >= productoActualizado.stockMaximo) {
      alertas.push({ tipo: 'STOCK_MAXIMO', mensaje: `${productoActualizado.nombre} (${productoActualizado.sku}) ha alcanzado el stock máximo` });
    }

    res.status(201).json({ movimiento, producto: productoActualizado, alertas });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
});

// GET /api/inventario/dashboard - Resumen de inventario
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [totalBodegas, totalProductos, productosAlerta, movimientosRecientes] = await Promise.all([
      prisma.bodega.count({ where: { activa: true } }),
      prisma.producto.count({ where: { activo: true } }),
      prisma.producto.findMany({
        where: {
          activo: true,
          stockActual: { lte: prisma.producto.fields?.stockMinimo }
        }
      }).then(async () => {
        // workaround: compare columns via raw
        const all = await prisma.producto.findMany({ where: { activo: true } });
        return all.filter(p => p.stockActual <= p.stockMinimo).length;
      }),
      prisma.movimientoInventario.findMany({
        include: { producto: { select: { sku: true, nombre: true } } },
        orderBy: { creadoEn: 'desc' },
        take: 10
      })
    ]);

    res.json({ totalBodegas, totalProductos, productosAlerta, movimientosRecientes });
  } catch (error) {
    console.error('Error en dashboard inventario:', error);
    res.status(500).json({ error: 'Error al obtener dashboard de inventario' });
  }
});

module.exports = router;
