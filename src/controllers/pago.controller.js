const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/pagos/procesar - Procesar un pago
const procesarPago = async (req, res) => {
  try {
    const { facturaId, monto, metodoPago, referencia } = req.body;

    if (!facturaId || !monto || !metodoPago) {
      return res.status(400).json({ error: 'Factura, monto y método de pago son requeridos' });
    }

    const factura = await prisma.factura.findUnique({
      where: { id: parseInt(facturaId) },
      include: { pagos: true, servicio: true }
    });

    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    if (factura.estado === 'PAGADA') return res.status(400).json({ error: 'Esta factura ya está pagada' });
    if (factura.estado === 'ANULADA') return res.status(400).json({ error: 'Esta factura está anulada' });

    // Verificar que el usuario tiene permisos
    if (!['ADMIN', 'OPERADOR'].includes(req.usuario.rol) && factura.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permisos para pagar esta factura' });
    }

    const montoFloat = parseFloat(monto);
    const totalPagado = factura.pagos.reduce((sum, p) => p.estado === 'COMPLETADO' ? sum + p.monto : sum, 0);
    const saldoPendiente = factura.total - totalPagado;

    if (montoFloat > saldoPendiente) {
      return res.status(400).json({ error: `El monto excede el saldo pendiente: $${saldoPendiente.toLocaleString()}` });
    }

    // Simular procesamiento de pasarela de pago colombiana
    const refGenerada = referencia || `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Simular aprobación (95% probabilidad de éxito para demo)
    const aprobado = Math.random() < 0.95;

    const pago = await prisma.pago.create({
      data: {
        facturaId: parseInt(facturaId),
        monto: montoFloat,
        metodoPago,
        referencia: refGenerada,
        estado: aprobado ? 'COMPLETADO' : 'FALLIDO'
      }
    });

    if (aprobado) {
      const nuevoTotalPagado = totalPagado + montoFloat;
      
      // Si el total pagado cubre la factura, marcar como PAGADA
      if (nuevoTotalPagado >= factura.total) {
        await prisma.factura.update({
          where: { id: factura.id },
          data: { estado: 'PAGADA' }
        });

        // Avanzar el servicio a CERRADO si estaba FACTURADO
        if (factura.servicio && factura.servicio.estado === 'FACTURADO') {
          await prisma.$transaction([
            prisma.servicio.update({
              where: { id: factura.servicio.id },
              data: { estado: 'CERRADO' }
            }),
            prisma.cambioEstado.create({
              data: {
                servicioId: factura.servicio.id,
                estadoAnterior: 'FACTURADO',
                estadoNuevo: 'CERRADO',
                nota: `Pago completado. Ref: ${refGenerada}`,
                responsable: `${req.usuario.nombre} ${req.usuario.apellido}`
              }
            })
          ]);
        }
      }
    }

    res.status(201).json({
      pago,
      aprobado,
      mensaje: aprobado ? 'Pago procesado exitosamente' : 'El pago fue rechazado por la pasarela. Intente nuevamente.',
      saldoPendiente: aprobado ? Math.max(0, saldoPendiente - montoFloat) : saldoPendiente
    });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
};

// GET /api/pagos/factura/:facturaId - Obtener pagos de una factura
const obtenerPagosPorFactura = async (req, res) => {
  try {
    const facturaId = parseInt(req.params.facturaId);
    const pagos = await prisma.pago.findMany({
      where: { facturaId },
      orderBy: { creadoEn: 'desc' }
    });
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

// GET /api/pagos/metodos - Métodos de pago disponibles
const obtenerMetodosPago = async (req, res) => {
  res.json([
    { id: 'PSE', nombre: 'PSE - Pagos Seguros en Línea', icono: '🏦', descripcion: 'Débito directo desde tu cuenta bancaria' },
    { id: 'TARJETA_CREDITO', nombre: 'Tarjeta de Crédito', icono: '💳', descripcion: 'Visa, Mastercard, American Express' },
    { id: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito', icono: '💳', descripcion: 'Todas las redes de débito' },
    { id: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria', icono: '🏧', descripcion: 'Transferencia directa a cuenta Logistics World' },
    { id: 'EFECTIVO', nombre: 'Pago en Efectivo', icono: '💵', descripcion: 'Baloto, Efecty, SuRed' }
  ]);
};

module.exports = { procesarPago, obtenerPagosPorFactura, obtenerMetodosPago };
