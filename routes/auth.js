/* /api/auth/registro, /api/auth/login, /api/me */
const express = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { firmar, publico, requiereLogin } = require('../middleware/auth');
const router = express.Router();

// freno simple contra adivinar claves: 10 intentos fallidos por IP cada 10 min
const fallos = new Map();
const bloqueado = ip => { const f = fallos.get(ip); return f && f.n >= 10 && Date.now() - f.t < 600000; };
const fallo = ip => { const f = fallos.get(ip); fallos.set(ip, { n: (f && Date.now() - f.t < 600000 ? f.n : 0) + 1, t: Date.now() }); };

/* MODO SIN CONTRASEÑA (por defecto): se entra solo con el nombre. Para exigir correo y contraseña,
   pon la variable REQUIRE_LOGIN=true en Render. */
const abierto = () => process.env.REQUIRE_LOGIN !== 'true';
router.get('/config', (req, res) => res.json({ ok: true, abierto: abierto() }));

router.post('/entrar', async (req, res) => {
  try {
    if (!abierto()) return res.status(403).json({ ok: false, mensaje: 'Aquí se necesita correo y contraseña.' });
    const nombre = String(req.body.nombre || '').trim().slice(0, 40);
    if (!nombre) return res.status(400).json({ ok: false, mensaje: 'Escribe tu nombre.' });
    const email = 'nombre:' + nombre.toLowerCase();
    let u = await Usuario.findOne({ email });
    if (!u) { const primero = (await Usuario.countDocuments()) === 0; u = await Usuario.create({ email, nombre, rol: primero ? 'admin' : 'vendedor', activo: true }); }
    res.json({ ok: true, token: firmar(u), user: publico(u) });
  } catch (e) { res.status(500).json({ ok: false, mensaje: e.message }); }
});

router.post('/registro', async (req, res) => {
  try {
    if (abierto()) return res.status(403).json({ ok: false, mensaje: 'Este sistema entra solo con el nombre.' });
    const email = String(req.body.email || '').trim().toLowerCase(), nombre = String(req.body.nombre || '').trim(), clave = String(req.body.clave || '');
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, mensaje: 'Escribe un correo válido.' });
    if (!nombre) return res.status(400).json({ ok: false, mensaje: 'Escribe tu nombre.' });
    if (clave.length < 6) return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener mínimo 6 caracteres.' });
    if (await Usuario.findOne({ email })) return res.status(409).json({ ok: false, mensaje: 'Ese correo ya tiene cuenta. Usa "Entrar".' });
    const primero = (await Usuario.countDocuments()) === 0;
    const u = await Usuario.create({ email, nombre, clave: await bcrypt.hash(clave, 10), rol: primero ? 'admin' : 'vendedor', activo: primero });
    res.json({ ok: true, token: firmar(u), user: publico(u) });
  } catch (e) { res.status(500).json({ ok: false, mensaje: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    if (abierto()) return res.status(403).json({ ok: false, mensaje: 'Este sistema entra solo con el nombre.' });
    if (bloqueado(req.ip)) return res.status(429).json({ ok: false, mensaje: 'Demasiados intentos. Espera unos minutos.' });
    const email = String(req.body.email || '').trim().toLowerCase();
    const u = await Usuario.findOne({ email });
    if (!u || !(await bcrypt.compare(String(req.body.clave || ''), u.clave))) { fallo(req.ip); return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos.' }); }
    res.json({ ok: true, token: firmar(u), user: publico(u) });
  } catch (e) { res.status(500).json({ ok: false, mensaje: e.message }); }
});

router.get('/me', requiereLogin, (req, res) => res.json({ ok: true, user: publico(req.user) }));
module.exports = router;
