/* COLECCION: registros — un documento por producto, tamaño, sede, venta, movimiento o cotización.
   El celular genera el id (clientId) para poder trabajar sin internet y subir después. */
const mongoose = require('mongoose');
const registroSchema = new mongoose.Schema({
  _id:  { type: String },                              // clientId
  col:  { type: String, required: true, index: true }, // producto | tamano | sede | venta | mov | cotiz
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  del:  { type: Boolean, default: false },
  upd:  { type: Date, default: Date.now, index: true } // lo pone el servidor
}, { minimize: false });
module.exports = mongoose.model('Registro', registroSchema);
