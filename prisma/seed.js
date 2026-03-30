const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales...');

  // Crear usuario admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@logisticsworld.com' },
    update: {},
    create: {
      email: 'admin@logisticsworld.com',
      password: adminPassword,
      nombre: 'Admin',
      apellido: 'Sistema',
      tipoDocumento: 'CC',
      documento: '1000000001',
      telefono: '3001234567',
      rol: 'ADMIN',
      empresa: 'Logistics World'
    }
  });
  console.log('✅ Admin creado:', admin.email);

  // Crear operador
  const opPassword = await bcrypt.hash('operador123', 12);
  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@logisticsworld.com' },
    update: {},
    create: {
      email: 'operador@logisticsworld.com',
      password: opPassword,
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      tipoDocumento: 'CC',
      documento: '1000000002',
      telefono: '3009876543',
      rol: 'OPERADOR',
      empresa: 'Logistics World'
    }
  });
  console.log('✅ Operador creado:', operador.email);

  // Crear cliente B2B
  const b2bPassword = await bcrypt.hash('cliente123', 12);
  const clienteB2B = await prisma.usuario.upsert({
    where: { email: 'empresa@demo.com' },
    update: {},
    create: {
      email: 'empresa@demo.com',
      password: b2bPassword,
      nombre: 'María',
      apellido: 'González',
      tipoDocumento: 'NIT',
      documento: '900123456',
      telefono: '3115551234',
      rol: 'CLIENTE_B2B',
      empresa: 'Importaciones del Valle S.A.S'
    }
  });
  console.log('✅ Cliente B2B creado:', clienteB2B.email);

  // Crear cliente B2C
  const b2cPassword = await bcrypt.hash('cliente123', 12);
  const clienteB2C = await prisma.usuario.upsert({
    where: { email: 'juan@correo.com' },
    update: {},
    create: {
      email: 'juan@correo.com',
      password: b2cPassword,
      nombre: 'Juan',
      apellido: 'Pérez',
      tipoDocumento: 'CC',
      documento: '1020304050',
      telefono: '3201112233',
      rol: 'CLIENTE_B2C'
    }
  });
  console.log('✅ Cliente B2C creado:', clienteB2C.email);

  // Crear zonas
  const zonas = await Promise.all([
    prisma.zona.upsert({ where: { nombre: 'Bogotá' }, update: {}, create: { nombre: 'Bogotá', departamento: 'Cundinamarca' } }),
    prisma.zona.upsert({ where: { nombre: 'Medellín' }, update: {}, create: { nombre: 'Medellín', departamento: 'Antioquia' } }),
    prisma.zona.upsert({ where: { nombre: 'Cali' }, update: {}, create: { nombre: 'Cali', departamento: 'Valle del Cauca' } }),
    prisma.zona.upsert({ where: { nombre: 'Barranquilla' }, update: {}, create: { nombre: 'Barranquilla', departamento: 'Atlántico' } }),
    prisma.zona.upsert({ where: { nombre: 'Cartagena' }, update: {}, create: { nombre: 'Cartagena', departamento: 'Bolívar' } }),
    prisma.zona.upsert({ where: { nombre: 'Bucaramanga' }, update: {}, create: { nombre: 'Bucaramanga', departamento: 'Santander' } }),
  ]);
  console.log('✅ Zonas creadas:', zonas.length);

  // Crear cotizaciones de ejemplo
  try {
  const cotizaciones = await Promise.all([
    prisma.cotizacion.create({
      data: {
        numero: 'COT-2026-0001',
        usuarioId: clienteB2B.id,
        tipoServicio: 'transporte_nacional',
        origen: 'Bogotá',
        destino: 'Medellín',
        peso: 500,
        descripcion: 'Envío de maquinaria industrial',
        urgencia: 'normal',
        precioCalculado: 550000,
        estado: 'ACEPTADA'
      }
    }),
    prisma.cotizacion.create({
      data: {
        numero: 'COT-2026-0002',
        usuarioId: clienteB2B.id,
        tipoServicio: 'almacenamiento',
        origen: 'Bogotá',
        destino: 'Bogotá',
        volumen: 20,
        descripcion: 'Almacenamiento de mercancía importada',
        urgencia: 'normal',
        precioCalculado: 1800000,
        estado: 'PENDIENTE'
      }
    }),
    prisma.cotizacion.create({
      data: {
        numero: 'COT-2026-0003',
        usuarioId: clienteB2C.id,
        tipoServicio: 'paqueteria',
        origen: 'Cali',
        destino: 'Barranquilla',
        peso: 5,
        descripcion: 'Envío de documentos y paquete pequeño',
        urgencia: 'express',
        precioCalculado: 48750,
        estado: 'ACEPTADA'
      }
    }),
    prisma.cotizacion.create({
      data: {
        numero: 'COT-2026-0004',
        usuarioId: clienteB2B.id,
        tipoServicio: 'freight_forwarding',
        origen: 'Shanghai, China',
        destino: 'Cartagena',
        peso: 2000,
        volumen: 40,
        descripcion: 'Importación de productos electrónicos',
        urgencia: 'normal',
        precioCalculado: 14800000,
        estado: 'PENDIENTE'
      }
    })
  ]);
  console.log('✅ Cotizaciones creadas:', cotizaciones.length);

  // Crear servicios a partir de cotizaciones aceptadas
  const servicio1 = await prisma.servicio.create({
    data: {
      numero: 'SRV-2026-0001',
      cotizacionId: cotizaciones[0].id,
      usuarioId: clienteB2B.id,
      estado: 'EN_TRANSITO'
    }
  });

  const servicio2 = await prisma.servicio.create({
    data: {
      numero: 'SRV-2026-0002',
      cotizacionId: cotizaciones[2].id,
      usuarioId: clienteB2C.id,
      estado: 'EN_PREPARACION'
    }
  });

  // Crear historial de cambios de estado
  await prisma.cambioEstado.createMany({
    data: [
      { servicioId: servicio1.id, estadoAnterior: 'COTIZADO', estadoNuevo: 'CONTRATADO', nota: 'Cotización aceptada', responsable: 'María González' },
      { servicioId: servicio1.id, estadoAnterior: 'CONTRATADO', estadoNuevo: 'EN_PREPARACION', nota: 'Vehículo asignado: TKR-456', responsable: 'Carlos Rodríguez' },
      { servicioId: servicio1.id, estadoAnterior: 'EN_PREPARACION', estadoNuevo: 'EN_TRANSITO', nota: 'Carga recogida. En camino a Medellín', responsable: 'Carlos Rodríguez' },
      { servicioId: servicio2.id, estadoAnterior: 'COTIZADO', estadoNuevo: 'CONTRATADO', nota: 'Cotización aceptada', responsable: 'Juan Pérez' },
      { servicioId: servicio2.id, estadoAnterior: 'CONTRATADO', estadoNuevo: 'EN_PREPARACION', nota: 'Paquete recibido en centro de distribución', responsable: 'Carlos Rodríguez' },
    ]
  });
  console.log('✅ Servicios y cambios de estado creados');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Las cotizaciones y servicios de prueba ya existían en la base de datos. Se omitió su creación.');
    } else {
      throw error;
    }
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba:');
  console.log('  Admin:    admin@logisticsworld.com / admin123');
  console.log('  Operador: operador@logisticsworld.com / operador123');
  console.log('  B2B:      empresa@demo.com / cliente123');
  console.log('  B2C:      juan@correo.com / cliente123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
