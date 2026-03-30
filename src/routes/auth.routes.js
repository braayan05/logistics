const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, apellido, tipoDocumento, documento, telefono, rol, empresa } = req.body;

    if (!email || !password || !nombre || !apellido || !tipoDocumento || !documento) {
      return res.status(400).json({ error: 'Campos obligatorios: email, password, nombre, apellido, tipoDocumento, documento' });
    }

    const existingUser = await prisma.usuario.findFirst({
      where: { OR: [{ email }, { documento }] }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email o documento' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        tipoDocumento,
        documento,
        telefono,
        rol: rol || 'CLIENTE_B2C',
        empresa
      },
      select: { id: true, email: true, nombre: true, apellido: true, rol: true, creadoEn: true }
    });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ usuario, token });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValid = await bcrypt.compare(password, usuario.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        empresa: usuario.empresa
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true, email: true, nombre: true, apellido: true,
        tipoDocumento: true, documento: true, telefono: true,
        rol: true, empresa: true, creadoEn: true
      }
    });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

module.exports = router;
