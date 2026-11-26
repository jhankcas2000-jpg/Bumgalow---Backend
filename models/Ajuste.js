/* COLECCION: ajustes — guarda las llaves VAPID de las notificaciones (se crean solas la primera vez) */
const mongoose = require('mongoose');
module.exports = mongoose.model('Ajuste', new mongoose.Schema({ _id: String, valor: mongoose.Schema.Types.Mixed }));
