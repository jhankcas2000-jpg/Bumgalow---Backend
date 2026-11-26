/* /api/equipo — el administrador activa vendedores y cambia roles */
const express = require('express');
const Usuario = require('../models/Usuario');
const { publico, requiereLogin, requiereAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(requiereLogin, requiereAdmin);

router.get('/', async (req, res) => {
  const datos = await Usuario.find().sort({ creado: 1 });
  res.json({ ok: true, datos: datos.map(publico) });
});
router.patch('/:id', async (req, res) => {
  try {
    const set = {};
    if (typeof req.body.activo === 'boolean') set.activo = req.body.activo;
    if (['admin', 'vendedor'].includes(req.body.rol)) set.rol = req.body.rol;
    if (String(req.params.id) === String(req.user._id)) { delete set.activo; if (set.rol === 'vendedor') delete set.rol; } // no te quites a ti mismo
    const u = await Usuario.findByIdAndUpdate(req.params.id, set, { new: true });
    if (!u) return res.status(404).json({ ok: false, mensaje: 'No existe.' });
    res.json({ ok: true, user: publico(u) });
  } catch (e) { res.status(400).json({ ok: false, mensaje: e.message }); }
});
module.exports = router;
