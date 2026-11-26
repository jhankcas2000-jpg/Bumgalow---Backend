/* /api/push — el teléfono se suscribe para recibir avisos aunque la app esté cerrada */
const express = require('express');
const Suscripcion = require('../models/Suscripcion');
const { requiereLogin, requiereActivo } = require('../middleware/auth');
const { clavePublica } = require('../push');
const router = express.Router();
router.use(requiereLogin, requiereActivo);

router.get('/clave', async (req, res) => { try { res.json({ ok: true, clave: await clavePublica() }); } catch (e) { res.status(500).json({ ok: false, mensaje: e.message }); } });
router.post('/suscribir', async (req, res) => {
  try {
    const s = req.body.suscripcion; if (!s || !s.endpoint || !s.keys) return res.status(400).json({ ok: false, mensaje: 'Suscripción inválida' });
    await Suscripcion.findOneAndUpdate({ endpoint: s.endpoint }, { endpoint: s.endpoint, keys: s.keys, usuario: String(req.user._id), nombre: req.user.nombre }, { upsert: true });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ ok: false, mensaje: e.message }); }
});
router.post('/baja', async (req, res) => { await Suscripcion.deleteOne({ endpoint: String(req.body.endpoint || '') }); res.json({ ok: true }); });
module.exports = router;
