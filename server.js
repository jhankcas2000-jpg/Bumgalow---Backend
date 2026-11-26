/* =============================================================
   BUMGALOW COCKTAILS — Sistema de ventas e inventario
   Node.js + Express + MongoDB Atlas (igual estructura que Tennisco)
   Ejecutar: npm install · configurar .env · npm start
   ============================================================= */
require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), cors = require('cors'), path = require('path');
const app = express(), PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);                        // Render está detrás de un proxy
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, f) => { if (/sw\.js$|index\.html$/.test(f)) res.set('Cache-Control', 'no-cache'); }
}));

app.use('/api/auth', require('./routes/auth'));
app.get('/api/config', (req, res) => res.json({ ok: true, abierto: process.env.REQUIRE_LOGIN !== 'true' }));
app.use('/api', require('./routes/auth'));        // GET /api/me
app.use('/api/equipo', require('./routes/equipo'));
app.use('/api/push', require('./routes/push'));
app.use('/api', require('./routes/sync'));        // /api/sync y /api/eventos
app.get('/salud', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI en el .env / variables de entorno'); process.exit(1); }
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('Bumgalow conectado a MongoDB');
  app.listen(PORT, () => console.log('Servidor en http://localhost:' + PORT));
}).catch(e => { console.error('No se pudo conectar a MongoDB:', e.message); process.exit(1); });
