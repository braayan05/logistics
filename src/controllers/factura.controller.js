const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar facturas
exports.getFacturas = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.usuario;
    
    // Filtro base: si no es ADMIN/OPERADOR, solo ve sus propias facturas
    const where = ['ADMIN', 'OPERADOR'].includes(rol) ? {} : { usuarioId };

    const facturas = await prisma.factura.findMany({
      where,
      include: {
        servicio: {
          select: { numero: true, estado: true }
        },
        usuario: {
          select: { nombre: true, apellido: true, empresa: true }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error del servidor al obtener facturas' });
  }
};

// Obtener factura por ID
exports.getFacturaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, id: usuarioId } = req.usuario;

    const factura = await prisma.factura.findUnique({
      where: { id: parseInt(id) },
      include: {
        servicio: true,
        usuario: {
          select: { 
            nombre: true, 
            apellido: true, 
            empresa: true, 
            documento: true, 
            tipoDocumento: true, 
            email: true, 
            telefono: true 
          }
        },
        pagos: {
          orderBy: { creadoEn: 'desc' }
        }
      }
    });

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    if (!['ADMIN', 'OPERADOR'].includes(rol) && factura.usuarioId !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta factura' });
    }

    res.json(factura);
  } catch (error) {
    console.error('Error al obtener la factura:', error);
    res.status(500).json({ error: 'Error del servidor al obtener la factura' });
  }
};
