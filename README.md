# Bumgalow · Sistema de ventas e inventario (Node + Express + MongoDB)

Misma estructura que Tennisco: un servidor Express con Mongoose en **MongoDB Atlas**, desplegado en **Render**.
El servidor entrega también la app (carpeta `public/`), que funciona como app instalable y **sin internet**; al volver la red sube y baja los cambios.

## Qué hace el servidor
| Ruta | Para qué |
|---|---|
| `POST /api/auth/registro` · `POST /api/auth/login` | Cuentas (el **primero** en registrarse queda administrador; los demás quedan pendientes) |
| `GET /api/equipo` · `PATCH /api/equipo/:id` | El administrador activa vendedores y cambia roles |
| `POST /api/sync` · `GET /api/sync?desde=` | Subir y bajar ventas, productos, movimientos, cotizaciones |
| `/api/push/*` | Suscripción de cada teléfono a las notificaciones (Web Push)
| `GET /api/eventos` | Aviso instantáneo (SSE): cuando un vendedor registra algo, los demás teléfonos suenan al momento |
| `GET /salud` | Chequeo de Render |

Colecciones en MongoDB: `usuarios` y `registros`.

## 1) MongoDB Atlas (gratis)
1. Crea cuenta en mongodb.com/atlas → **Create** → cluster **M0 (Free)**.
2. *Database Access* → crea un usuario y contraseña.
3. *Network Access* → **Add IP Address** → `0.0.0.0/0` (Render no tiene IP fija).
4. *Connect* → *Drivers* → copia la URI. Cámbiale `<password>` por tu clave y agrega el nombre `/bumgalow` antes del `?`:
   `mongodb+srv://USUARIO:CLAVE@cluster0.xxxx.mongodb.net/bumgalow?retryWrites=true&w=majority`

## 2) GitHub
Sube **esta carpeta** (sin `node_modules`) a un repositorio nuevo.

## 3) Render
1. render.com → **New → Web Service** → conecta el repositorio.
2. Runtime **Node** · Build `npm install` · Start `npm start` (o usa el `render.yaml` incluido con *Blueprint*).
3. *Environment* → agrega:
   - `MONGODB_URI` = la URI de Atlas
   - `JWT_SECRET` = una frase larga cualquiera
4. Deploy. Abre `https://TU-APP.onrender.com`.

## 4) Primer uso
1. En el teléfono del dueño abre la dirección → escribe tu nombre → **Entrar** (queda como administrador).
2. Cada vendedor abre la misma dirección y entra con su nombre.
3. Instalar: menú ⋮ de Chrome → *Instalar app*.

## Contraseñas: opcionales
Por defecto **no hay contraseñas**: cada persona entra escribiendo solo su nombre (la primera en entrar queda como administradora; luego puedes cambiar roles en Ajustes → Equipo).
Ojo: así, cualquiera que conozca la dirección puede entrar. No la compartas fuera del equipo.
Cuando quieras exigir correo y contraseña, en Render agrega la variable `REQUIRE_LOGIN` = `true` y vuelve a desplegar (los vendedores nuevos quedan pendientes hasta que el administrador los active).

## Notas
- Plan gratis de Render: se duerme tras ~15 min sin uso y tarda ~1 minuto en despertar. La app sigue funcionando sin internet y sincroniza después. Para que no se duerma, usa el plan de pago o un monitor que visite `/salud`.
- **Notificaciones con la app cerrada:** en cada teléfono toca la campana 🔔 → **Activar notificaciones**. Así, cuando un vendedor registra una venta o marca algo agotado, llega una notificación aunque la app esté cerrada o el teléfono bloqueado. No hay que configurar nada en Render (las llaves se crean solas y se guardan en MongoDB). En iPhone solo funciona si la app está instalada (Compartir → Añadir a pantalla de inicio, iOS 16.4 o superior). Si el servidor gratis estaba dormido, el aviso llega cuando despierte (con la venta ya subida).
- Con la app abierta suena el tono de adentro; con la app cerrada suena el sonido normal de notificaciones del teléfono.
- Probar en tu computador: `npm install`, copia `.env.example` a `.env`, `npm start`, abre http://localhost:3000.
