const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const cotizacionRoutes = require('./routes/cotizacion.routes');
const servicioRoutes = require('./routes/servicio.routes');
const facturaRoutes = require('./routes/factura.routes');
const pagoRoutes = require('./routes/pago.routes');
const adminRoutes = require('./routes/admin.routes');
const ticketRoutes = require('./routes/ticket.routes');
const trackingRoutes = require('./routes/tracking.routes');
const inventarioRoutes = require('./routes/inventario.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/inventario', inventarioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Logistics World API corriendo en http://localhost:${PORT}`);
});
