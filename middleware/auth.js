const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const SECRET = () => process.env.JWT_SECRET || 'cambia-esto-en-render';

const firmar = u => jwt.sign({ id: String(u._id) }, SECRET(), { expiresIn: '60d' });
const publico = u => ({ id: String(u._id), email: u.email, nombre: u.nombre, rol: u.rol, activo: !!u.activo });

async function usuarioDeToken(token) {
  try { const { id } = jwt.verify(token, SECRET()); return await Usuario.findById(id); } catch (e) { return null; }
}
async function requiereLogin(req, res, next) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  const u = t && await usuarioDeToken(t);
  if (!u) return res.status(401).json({ ok: false, mensaje: 'Sesión vencida. Vuelve a entrar.' });
  req.user = u; next();
}
function requiereActivo(req, res, next) {
  if (!req.user.activo) return res.status(403).json({ ok: false, mensaje: 'Tu cuenta aún no está activada.' });
  next();
}
function requiereAdmin(req, res, next) {
  if (req.user.rol !== 'admin') return res.status(403).json({ ok: false, mensaje: 'Solo el administrador.' });
  next();
}
module.exports = { firmar, publico, usuarioDeToken, requiereLogin, requiereActivo, requiereAdmin };
