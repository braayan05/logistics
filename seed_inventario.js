const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInventario() {
  console.log('🏭 Seeding bodegas e inventario...');

  // Crear bodegas
  const bodegas = await Promise.all([
    prisma.bodega.create({
      data: { nombre: 'Bodega Principal Bogotá', direccion: 'Calle 80 #45-20, Zona Industrial', ciudad: 'Bogotá', tipo: 'PROPIA', capacidadM3: 5000, ocupacionM3: 2300 }
    }),
    prisma.bodega.create({
      data: { nombre: 'Centro de Distribución Medellín', direccion: 'Carrera 50 #12-45, Itagüí', ciudad: 'Medellín', tipo: 'PROPIA', capacidadM3: 3000, ocupacionM3: 1200 }
    }),
    prisma.bodega.create({
      data: { nombre: 'Bodega Puerto Cartagena', direccion: 'Zona Franca Mamonal Km 5', ciudad: 'Cartagena', tipo: 'PROPIA', capacidadM3: 8000, ocupacionM3: 4500 }
    }),
    prisma.bodega.create({
      data: { nombre: 'Almacén Cliente TechCorp', direccion: 'Av. El Dorado #68-90', ciudad: 'Bogotá', tipo: 'CLIENTE', capacidadM3: 1500, ocupacionM3: 800 }
    })
  ]);

  console.log(`  ✅ ${bodegas.length} bodegas creadas`);

  // Crear productos
  const productos = await Promise.all([
    prisma.producto.create({
      data: { sku: 'ELEC-001', nombre: 'Laptop HP ProBook 450', descripcion: 'Laptop 15.6" Intel i7 16GB RAM', categoria: 'Electrónica', unidadMedida: 'unidad', stockActual: 150, stockMinimo: 20, stockMaximo: 500, precioUnitario: 3500000, bodegaId: bodegas[0].id }
    }),
    prisma.producto.create({
      data: { sku: 'ELEC-002', nombre: 'Monitor Samsung 27"', descripcion: 'Monitor 4K IPS 27 pulgadas', categoria: 'Electrónica', unidadMedida: 'unidad', stockActual: 80, stockMinimo: 10, stockMaximo: 200, precioUnitario: 1200000, bodegaId: bodegas[0].id }
    }),
    prisma.producto.create({
      data: { sku: 'TEXT-001', nombre: 'Caja Textiles Premium', descripcion: 'Caja de prendas de algodón premium', categoria: 'Textiles', unidadMedida: 'caja', stockActual: 5, stockMinimo: 50, stockMaximo: 1000, precioUnitario: 450000, bodegaId: bodegas[1].id }
    }),
    prisma.producto.create({
      data: { sku: 'ALI-001', nombre: 'Pallet Café Exportación', descripcion: 'Café colombiano tipo exportación 70kg', categoria: 'Alimentos', unidadMedida: 'pallet', stockActual: 200, stockMinimo: 30, stockMaximo: 500, precioUnitario: 2800000, bodegaId: bodegas[2].id }
    }),
    prisma.producto.create({
      data: { sku: 'IND-001', nombre: 'Válvula Industrial 3"', descripcion: 'Válvula de bola acero inoxidable 3 pulgadas', categoria: 'Industrial', unidadMedida: 'unidad', stockActual: 45, stockMinimo: 15, stockMaximo: 100, precioUnitario: 380000, bodegaId: bodegas[0].id }
    }),
    prisma.producto.create({
      data: { sku: 'FARM-001', nombre: 'Lote Medicamentos Genéricos', descripcion: 'Lote sellado de medicamentos para distribución', categoria: 'Farmacéutico', unidadMedida: 'lote', stockActual: 12, stockMinimo: 10, stockMaximo: 50, precioUnitario: 5200000, bodegaId: bodegas[1].id }
    }),
    prisma.producto.create({
      data: { sku: 'TECH-001', nombre: 'Servidor Dell PowerEdge', descripcion: 'Servidor rack 2U Xeon 64GB', categoria: 'Tecnología', unidadMedida: 'unidad', stockActual: 8, stockMinimo: 5, stockMaximo: 25, precioUnitario: 15000000, bodegaId: bodegas[3].id }
    }),
    prisma.producto.create({
      data: { sku: 'AUTO-001', nombre: 'Repuesto Motor Toyota', descripcion: 'Kit de repuestos motor Hilux 2.8', categoria: 'Automotriz', unidadMedida: 'kit', stockActual: 3, stockMinimo: 10, stockMaximo: 40, precioUnitario: 4200000, bodegaId: bodegas[2].id }
    })
  ]);

  console.log(`  ✅ ${productos.length} productos creados`);

  // Crear algunos movimientos de ejemplo
  const movimientos = await Promise.all([
    prisma.movimientoInventario.create({
      data: { productoId: productos[0].id, tipo: 'ENTRADA', cantidad: 150, stockAnterior: 0, stockNuevo: 150, referencia: 'OC-2026-001', nota: 'Recepción inicial de inventario', responsable: 'Admin Sistema' }
    }),
    prisma.movimientoInventario.create({
      data: { productoId: productos[0].id, tipo: 'SALIDA', cantidad: 20, stockAnterior: 150, stockNuevo: 130, referencia: 'SRV-2026-0001', nota: 'Despacho para cliente B2B Importaciones', responsable: 'Admin Sistema' }
    }),
    prisma.movimientoInventario.create({
      data: { productoId: productos[2].id, tipo: 'ENTRADA', cantidad: 200, stockAnterior: 0, stockNuevo: 200, referencia: 'OC-2026-003', nota: 'Llegada contenedor port Buenaventura', responsable: 'Admin Sistema' }
    }),
    prisma.movimientoInventario.create({
      data: { productoId: productos[2].id, tipo: 'SALIDA', cantidad: 195, stockAnterior: 200, stockNuevo: 5, referencia: 'SRV-2026-0002', nota: 'Distribución nacional', responsable: 'Admin Sistema' }
    }),
    prisma.movimientoInventario.create({
      data: { productoId: productos[3].id, tipo: 'ENTRADA', cantidad: 200, stockAnterior: 0, stockNuevo: 200, referencia: 'IMP-2026-001', nota: 'Importación para exportación vía Cartagena', responsable: 'Admin Sistema' }
    }),
    prisma.movimientoInventario.create({
      data: { productoId: productos[7].id, tipo: 'SALIDA', cantidad: 7, stockAnterior: 10, stockNuevo: 3, referencia: 'SRV-2026-0003', nota: 'Envío urgente taller Cali', responsable: 'Admin Sistema' }
    })
  ]);

  console.log(`  ✅ ${movimientos.length} movimientos registrados`);

  // Agregar datos GPS de demostración para el primer servicio
  const servicios = await prisma.servicio.findMany({
    take: 2,
    include: { cotizacion: { select: { origen: true, destino: true } } }
  });

  if (servicios.length > 0) {
    const srv = servicios[0];
    const ciudades = {
      'Bogotá': { lat: 4.7110, lng: -74.0721 },
      'Medellín': { lat: 6.2476, lng: -75.5658 },
    };
    const origen = ciudades[srv.cotizacion?.origen] || ciudades['Bogotá'];
    const destino = ciudades[srv.cotizacion?.destino] || ciudades['Medellín'];
    const ahora = new Date();

    const puntosGPS = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      puntosGPS.push({
        servicioId: srv.id,
        latitud: parseFloat((origen.lat + (destino.lat - origen.lat) * t + (Math.random() - 0.5) * 0.05).toFixed(6)),
        longitud: parseFloat((origen.lng + (destino.lng - origen.lng) * t + (Math.random() - 0.5) * 0.05).toFixed(6)),
        velocidad: i === 0 || i === 8 ? 0 : 60 + Math.random() * 40,
        evento: i === 0 ? 'RECOGIDO' : i === 8 ? 'ENTREGADO' : i === 4 ? 'PUNTO_CONTROL' : 'EN_RUTA',
        direccion: i === 0 ? 'Bogotá - Centro de Distribución' : i === 8 ? 'Medellín - Destino Final' : `En ruta - Punto ${i}`,
        creadoEn: new Date(ahora.getTime() - (8 - i) * 3600000)
      });
    }

    await prisma.ubicacionGPS.createMany({ data: puntosGPS });
    console.log(`  ✅ ${puntosGPS.length} puntos GPS de demostración creados`);
  }

  console.log('\n✨ Seed de inventario y GPS completado exitosamente!');
}

seedInventario()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
