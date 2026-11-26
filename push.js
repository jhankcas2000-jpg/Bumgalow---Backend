/* Notificaciones push (llegan aunque la app esté cerrada o el teléfono bloqueado).
   Las llaves VAPID se generan solas y se guardan en MongoDB; no hay que configurar nada. */
const webpush = require('web-push');
const Ajuste = require('./models/Ajuste');
const Suscripcion = require('./models/Suscripcion');

let listo = null, publica = '';
function iniciar() {
  if (!listo) listo = (async () => {
    let a = await Ajuste.findById('vapid');
    if (!a) { try { a = await Ajuste.create({ _id: 'vapid', valor: webpush.generateVAPIDKeys() }); } catch (e) { a = await Ajuste.findById('vapid'); } }
    webpush.setVapidDetails(process.env.PUSH_CONTACTO || 'mailto:bumgalow@example.com', a.valor.publicKey, a.valor.privateKey);
    publica = a.valor.publicKey;
  })();
  return listo;
}
const clavePublica = async () => { await iniciar(); return publica; };

/* envía a todos los teléfonos suscritos, menos al de quien hizo el cambio */
async function avisar({ titulo = 'Bumgalow', texto, tag = 'bgp', excepto }) {
  try {
    await iniciar();
    const subs = await Suscripcion.find(excepto ? { usuario: { $ne: String(excepto) } } : {});
    const payload = JSON.stringify({ titulo, texto, tag });
    await Promise.all(subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 3600 })
      .catch(e => { if (e && (e.statusCode === 404 || e.statusCode === 410)) return Suscripcion.deleteOne({ _id: s._id }); })));
  } catch (e) { console.error('push:', e.message); }
}
const pesos = n => '$' + Math.round(n || 0).toLocaleString('es-CO');
const textoVenta = d => `💰 ${d.autor || 'Alguien'} vendió ${pesos(d.total)} — ${(d.items || []).map(i => i.q + '× ' + i.n).join(', ')}`;
module.exports = { iniciar, clavePublica, avisar, textoVenta };
