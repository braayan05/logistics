const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.usuario.findMany({
    select: { id: true, email: true, rol: true }
  });
  
  let output = '=== USUARIOS ===\n';
  users.forEach(u => output += `  ID:${u.id} | ${u.email} | ${u.rol}\n`);
  
  const cotizaciones = await prisma.cotizacion.count();
  const servicios = await prisma.servicio.count();
  const facturas = await prisma.factura.count();
  const tickets = await prisma.ticket.count();
  const pagos = await prisma.pago.count();
  
  output += '\n=== TOTALES ===\n';
  output += `  Cotizaciones: ${cotizaciones}\n`;
  output += `  Servicios: ${servicios}\n`;
  output += `  Facturas: ${facturas}\n`;
  output += `  Tickets: ${tickets}\n`;
  output += `  Pagos: ${pagos}\n`;
  
  fs.writeFileSync('db_report.txt', output);
  console.log('Report written to db_report.txt');
  
  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
