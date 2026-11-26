/* COLECCION: suscripciones — un documento por teléfono que activó las notificaciones */
const mongoose = require('mongoose');
module.exports = mongoose.model('Suscripcion', new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys:     { p256dh: String, auth: String },
  usuario:  { type: String, index: true },
  nombre:   { type: String, default: '' },
  creado:   { type: Date, default: Date.now }
}));
