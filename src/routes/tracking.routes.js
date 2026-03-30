const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/tracking/:servicioId - Obtener historial de ubicaciones GPS
router.get('/:servicioId', authMiddleware, async (req, res) => {
  try {
    const servicioId = parseInt(req.params.servicioId);
    
    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      include: {
        cotizacion: { select: { origen: true, destino: true, tipoServicio: true } },
        usuario: { select: { nombre: true, apellido: true } }
      }
    });

    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    // Verificar permisos
    if (!['ADMIN', 'OPERADOR'].includes(req.usuario.rol) && servicio.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const ubicaciones = await prisma.ubicacionGPS.findMany({
      where: { servicioId },
      orderBy: { creadoEn: 'asc' }
    });

    res.json({ servicio, ubicaciones });
  } catch (error) {
    console.error('Error al obtener tracking:', error);
    res.status(500).json({ error: 'Error al obtener datos de rastreo' });
  }
});

// POST /api/tracking/:servicioId - Registrar nueva ubicación GPS
router.post('/:servicioId', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const servicioId = parseInt(req.params.servicioId);
    const { latitud, longitud, velocidad, evento, direccion } = req.body;

    if (latitud === undefined || longitud === undefined) {
      return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }

    const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    const ubicacion = await prisma.ubicacionGPS.create({
      data: {
        servicioId,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        velocidad: velocidad ? parseFloat(velocidad) : null,
        evento,
        direccion
      }
    });

    res.status(201).json(ubicacion);
  } catch (error) {
    console.error('Error al registrar ubicación:', error);
    res.status(500).json({ error: 'Error al registrar ubicación GPS' });
  }
});

// POST /api/tracking/:servicioId/simular - Simular ruta GPS (para demo)
router.post('/:servicioId/simular', authMiddleware, requireRole('ADMIN', 'OPERADOR'), async (req, res) => {
  try {
    const servicioId = parseInt(req.params.servicioId);

    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      include: { cotizacion: { select: { origen: true, destino: true } } }
    });

    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    // Coordenadas de ciudades colombianas para simulación
    const ciudades = {
      'Bogotá':       { lat: 4.7110, lng: -74.0721 },
      'Bogota':       { lat: 4.7110, lng: -74.0721 },
      'Medellín':     { lat: 6.2476, lng: -75.5658 },
      'Medellin':     { lat: 6.2476, lng: -75.5658 },
      'medellin':     { lat: 6.2476, lng: -75.5658 },
      'Cali':         { lat: 3.4516, lng: -76.5320 },
      'Barranquilla': { lat: 10.9685, lng: -74.7813 },
      'Cartagena':    { lat: 10.3910, lng: -75.5144 },
      'Bucaramanga':  { lat: 7.1193, lng: -73.1227 },
      'cucuta':       { lat: 7.8939, lng: -72.5078 },
      'Cucuta':       { lat: 7.8939, lng: -72.5078 },
    };

    const origenStr = servicio.cotizacion.origen;
    const destinoStr = servicio.cotizacion.destino;
    
    const origen = ciudades[origenStr] || ciudades['Bogotá'];
    const destino = ciudades[destinoStr] || ciudades['Medellín'];

    // Generar puntos intermedios en la ruta
    const numPuntos = 8;
    const puntos = [];
    const ahora = new Date();

    for (let i = 0; i <= numPuntos; i++) {
      const t = i / numPuntos;
      const lat = origen.lat + (destino.lat - origen.lat) * t + (Math.random() - 0.5) * 0.05;
      const lng = origen.lng + (destino.lng - origen.lng) * t + (Math.random() - 0.5) * 0.05;
      
      let evento = 'EN_RUTA';
      if (i === 0) evento = 'RECOGIDO';
      else if (i === numPuntos) evento = 'ENTREGADO';
      else if (i === Math.floor(numPuntos / 2)) evento = 'PUNTO_CONTROL';

      const fecha = new Date(ahora.getTime() - (numPuntos - i) * 3600000); // cada hora

      puntos.push({
        servicioId,
        latitud: parseFloat(lat.toFixed(6)),
        longitud: parseFloat(lng.toFixed(6)),
        velocidad: i === 0 || i === numPuntos ? 0 : 60 + Math.random() * 40,
        evento,
        direccion: i === 0 ? origenStr : i === numPuntos ? destinoStr : `En ruta - Punto ${i}`,
        creadoEn: fecha
      });
    }

    // Eliminar ubicaciones anteriores y crear nuevas
    await prisma.ubicacionGPS.deleteMany({ where: { servicioId } });
    await prisma.ubicacionGPS.createMany({ data: puntos });

    const ubicaciones = await prisma.ubicacionGPS.findMany({
      where: { servicioId },
      orderBy: { creadoEn: 'asc' }
    });

    res.json({ mensaje: 'Ruta simulada generada', ubicaciones });
  } catch (error) {
    console.error('Error al simular ruta:', error);
    res.status(500).json({ error: 'Error al simular ruta GPS' });
  }
});

module.exports = router;
