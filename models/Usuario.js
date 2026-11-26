/* COLECCION: usuarios — el primero en registrarse queda como administrador y activo */
const mongoose = require('mongoose');
const usuarioSchema = new mongoose.Schema({
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  nombre:  { type: String, required: true, trim: true },
  clave:   { type: String, default: '' },              // hash bcrypt (vacío en modo sin contraseña)
  rol:     { type: String, enum: ['admin', 'vendedor'], default: 'vendedor' },
  activo:  { type: Boolean, default: false },
  creado:  { type: Date, default: Date.now }
});
module.exports = mongoose.model('Usuario', usuarioSchema);
