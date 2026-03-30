const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.servicio.findUnique({
  where: { id: 2 },
  include: { cotizacion: true, usuario: true, cambiosEstado: true }
}).then(res => {
  console.log(JSON.stringify(res, null, 2));
  p.$disconnect();
});
