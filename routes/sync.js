/* /api/sync  — POST: sube registros nuevos/cambiados · GET: baja lo que cambió desde un momento
   /api/eventos — SSE: avisa a los demás celulares al instante para que suene la campana */
const express = require('express');
const Registro = require('../models/Registro');
const { usuarioDeToken, requiereLogin, requiereActivo } = require('../middleware/auth');
const router = express.Router();

const SOLO_ADMIN = new Set(['tamano', 'sede']);   // precios y sedes solo los cambia el administrador
const clientes = new Set();
const avisar = () => clientes.forEach(res => { try { res.write('event: cambio\ndata: {}\n\n'); } catch (e) {} });
setInterval(() => clientes.forEach(res => { try { res.write(': ping\n\n'); } catch (e) {} }), 25000).unref();

router.post('/sync', requiereLogin, requiereActivo, async (req, res) => {
  try {
    const lista = Array.isArray(req.body.registros) ? req.body.registros.slice(0, 500) : [];
    const admin = req.user.rol === 'admin', ops = [], now = new Date();
    lista.forEach((r, i) => {
      if (!r || !r.id || !r.col || (SOLO_ADMIN.has(r.col) && !admin)) return;
      ops.push({ updateOne: { filter: { _id: String(r.id) }, update: { $set: { col: String(r.col), data: r.data || {}, del: !!r.del, upd: new Date(now.getTime() + i) } }, upsert: true } });
    });
    if (ops.length) { await Registro.bulkWrite(ops, { ordered: false }); avisar(); }
    res.json({ ok: true, guardados: ops.length });
  } catch (e) { res.status(400).json({ ok: false, mensaje: e.message }); }
});

router.get('/sync', requiereLogin, requiereActivo, async (req, res) => {
  try {
    const q = {}; if (req.query.desde) { const d = new Date(req.query.desde); if (!isNaN(d)) q.upd = { $gte: d }; }
    const datos = await Registro.find(q).sort({ upd: 1 }).limit(Math.min(Number(req.query.limite) || 500, 1000)).lean();
    res.json({ ok: true, registros: datos.map(r => ({ id: r._id, col: r.col, data: r.data, del: !!r.del, upd: r.upd.toISOString() })) });
  } catch (e) { res.status(500).json({ ok: false, mensaje: e.message }); }
});

router.get('/eventos', async (req, res) => {
  const u = await usuarioDeToken(String(req.query.token || ''));
  if (!u || !u.activo) return res.status(401).end();
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders(); res.write('retry: 5000\n\n');
  clientes.add(res); req.on('close', () => clientes.delete(res));
});
module.exports = router;
