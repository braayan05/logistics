const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const servicio = await prisma.servicio.findFirst({
    include: { cotizacion: true }
  });

  if (!servicio) return console.log('No hay servicios para facturar');

  const montoBase = servicio.cotizacion?.precioCalculado || 50000;
  const impuestos = Math.round(montoBase * 0.19);
  const total = montoBase + impuestos;

  // Modificar estado del servicio a FACTURADO
  await prisma.servicio.update({
    where: { id: servicio.id },
    data: { estado: 'FACTURADO' }
  });

  const factura = await prisma.factura.create({
    data: {
      numero: `FAC-2026-TEST-${servicio.id}`,
      servicioId: servicio.id,
      usuarioId: servicio.usuarioId,
      montoBase,
      impuestos,
      total,
      estado: 'PENDIENTE'
    }
  });

  console.log('Factura generada:', factura);
  process.exit(0);
}

main().catch(console.error);
