## Auranet API – Resumen completo de endpoints (Swagger `https://auran3t.mx/api/docs#/`)

Versión observada en Swagger: **1.0.5**  
Servidores:
- `http://localhost:3001`
- `https://auran3t.mx/api`

---

### 1. Autenticación

- **POST** `/login/usuario/recuperar/acceso`
- **POST** `/login/recuperar/confirmacion`
- **POST** `/login`
- **POST** `/login/cambiar/accesso`
- **PATCH** `/login/verify`

---

### 2. Bitácora

- **GET** `/bitacora/list`
- **GET** `/bitacora/{page}/{limit}`
- **GET** `/bitacora/{id}`

---

### 3. Usuarios

- **POST** `/usuarios` – Crear usuario.
- **GET** `/usuarios/list` – Lista completa.
- **GET** `/usuarios/list/cliente/{idCliente}/rol` – Usuarios por cliente (rol operador).
- **GET** `/usuarios/{page}/{limit}` – Paginado.
- **GET** `/usuarios/{id}` – Por ID.
- **PATCH** `/usuarios/{id}` – Actualizar.
- **DELETE** `/usuarios/{id}` – Eliminar.
- **PATCH** `/usuarios/estatus/{id}` – Cambiar estatus.
- **PATCH** `/usuarios/actualizar/contrasena/{id}` – Cambiar contraseña.

---

### 4. Roles

- **POST** `/roles`
- **GET** `/roles/{page}/{limit}`
- **GET** `/roles/list`
- **GET** `/roles/{id}`
- **PUT** `/roles/{id}`
- **DELETE** `/roles/{id}`
- **PATCH** `/roles/estatus/{id}`

---

### 5. Permisos

- **POST** `/permisos`
- **GET** `/permisos/{page}/{limit}`
- **GET** `/permisos/list`
- **GET** `/permisos/permisosAgrupados`
- **GET** `/permisos/{id}`
- **PUT** `/permisos/{id}`
- **DELETE** `/permisos/{id}`
- **PATCH** `/permisos/{id}/estatus`

---

### 6. Módulos

- **POST** `/modulos`
- **GET** `/modulos/list`
- **GET** `/modulos/{page}/{limit}`
- **GET** `/modulos/{id}`
- **PUT** `/modulos/{id}`
- **DELETE** `/modulos/{id}`
- **PATCH** `/modulos/{id}/estatus`

---

### 7. Catálogos – Endpoint central

- **GET** `/catalogos/{nombreCatalogo}` – Devuelve el catálogo indicado por nombre.

---

### 8. Catálogos específicos

- **Contextos operación**
  - **GET** `/catcontextosoperacion/list`

- **Estatus Afiliado**
  - **GET** `/catestatusafiliado/list`

- **Estatus Caja**
  - **GET** `/catestatuscaja/list`

- **Estatus Cuenta**
  - **GET** `/catestatuscuenta/list`

- **Estatus Licencia**
  - **GET** `/catestatuslicencia/list`

- **Estatus Máquina**
  - **GET** `/catestatusmaquina/list`

- **Estatus Monedero**
  - **GET** `/catestatusmonedero/list`

- **Estatus Promoción**
  - **GET** `/catestatuspromocion/list`

- **Estatus Sesión**
  - **GET** `/catestatussesion/list`

- **Estatus Tesorería**
  - **GET** `/catestatustesoreria/list`

- **Estatus Turno**
  - **GET** `/catestatusturno/list`

- **Fabricantes**
  - **GET** `/catfabricantes/list`

- **Juegos Rollover**
  - **GET** `/catjuegosrollover/list`

- **Monedas**
  - **GET** `/catmonedas/list`

- **Niveles VIP**
  - **GET** `/catnivelesvip/list`

- **Sexos**
  - **GET** `/catsexos/list`

- **Tipos Caja**
  - **GET** `/cattiposcaja/list`

- **Tipos Contenedor**
  - **GET** `/cattiposcontenedor/list`

- **Tipos Identificación**
  - **GET** `/cattiposidentificacion/list`

- **Tipos Máquina**
  - **GET** `/cattiposmaquina/list`

- **Tipos Movimiento**
  - **GET** `/cattiposmovimiento/list`

- **Tipos Promoción**
  - **GET** `/cattipospromocion/list`

- **Tipos Saldo**
  - **GET** `/cattipossaldo/list`

- **Tipos Zona**
  - **GET** `/cattiposzona/list`

---

### 9. Clientes

- **POST** `/clientes` – Crear cliente.
- **GET** `/clientes/list` – Lista completa.
- **GET** `/clientes/list/{cliente}` – Lista por ID de cliente.
- **GET** `/clientes/{page}/{limit}` – Paginado.
- **GET** `/clientes/{id}` – Por ID.
- **PATCH** `/clientes/{id}` – Actualizar.
- **DELETE** `/clientes/{id}` – Eliminar (soft delete).
- **PATCH** `/clientes/estatus/{id}` – Cambiar estatus.

---

### 10. Salas

- **POST** `/salas`
- **GET** `/salas/list`
- **GET** `/salas/by-cliente/{idCliente}`
- **GET** `/salas/{page}/{limit}`
- **GET** `/salas/{id}`
- **PATCH** `/salas/{id}`
- **DELETE** `/salas/{id}`
- **PATCH** `/salas/estatus/{id}`

---

### 11. Zonas

- **POST** `/zonas`
- **GET** `/zonas/list`
- **GET** `/zonas/by-sala/{idSala}`
- **GET** `/zonas/{page}/{limit}`
- **GET** `/zonas/{id}`
- **PATCH** `/zonas/{id}`
- **DELETE** `/zonas/{id}`
- **PATCH** `/zonas/estatus/{id}`

---

### 12. Máquinas

- **POST** `/maquinas`
- **GET** `/maquinas/list`
- **GET** `/maquinas/by-zona/{idZona}`
- **GET** `/maquinas/by-sala/{idSala}`
- **GET** `/maquinas/{page}/{limit}`
- **GET** `/maquinas/{id}`
- **PATCH** `/maquinas/{id}`
- **DELETE** `/maquinas/{id}`
- **PATCH** `/maquinas/estatus/{id}`

---

### 13. Afiliados (jugadores)

- **POST** `/afiliados` – Crear afiliado.
- **GET** `/afiliados/list` – Lista completa.
- **GET** `/afiliados/{page}/{limit}` – Paginado.
- **PATCH** `/afiliados/{id}` – Actualizar afiliado.
- **DELETE** `/afiliados/{id}` – Eliminar.
- **GET** `/afiliados/{id}` – Por ID.
- **POST** `/afiliados/{id}/bloquear`
- **POST** `/afiliados/{id}/desbloquear`
- **POST** `/afiliados/{id}/autoexclusion`
- **DELETE** `/afiliados/{id}/autoexclusion`
- **GET** `/afiliados/buscar` – Búsqueda con filtros.
- **GET** `/afiliados/numero/{numeroIdentificacion}`
- **GET** `/afiliados/{id}/resumen` – Dashboard/resumen.
- **GET** `/afiliados/{id}/monederos`
- **GET** `/afiliados/cumpleaneros`
- **GET** `/afiliados/inactivos`
- **POST** `/afiliados/{id}/nivel-vip` – Actualizar nivel VIP.

---

### 14. Monederos

- **POST** `/monederos/cambiar-estatus`
- **POST** `/monederos/reemplazar`
- **POST** `/monederos/traspaso`
- **POST** `/monederos/ajuste`
- **POST** `/monederos`
- **GET** `/monederos/list`
- **GET** `/monederos/numero/{numero}`
- **GET** `/monederos/afiliado/{idAfiliado}`
- **GET** `/monederos/movimientos/historial/{id}`
- **GET** `/monederos/{page}/{limit}`
- **GET** `/monederos/{id}`
- **PATCH** `/monederos/{id}`
- **DELETE** `/monederos/{id}`

---

### 15. Ledger (contabilidad y movimientos financieros)

- **GET** `/ledger/saldo/monedero/{id}`
- **GET** `/ledger/saldo/caja/{id}`
- **GET** `/ledger/saldo/tesoreria/{id}`
- **GET** `/ledger/movimientos/monedero/{id}`
- **GET** `/ledger/{page}/{limit}`

---

### 16. Tesorerías (bóvedas)

- **POST** `/tesorerias/abrir`
- **POST** `/tesorerias/cerrar`
- **POST** `/tesorerias/reponer`
- **POST** `/tesorerias/retirar`
- **GET** `/tesorerias/abierta/creada/sala/{idSala}`
- **GET** `/tesorerias/resumen/completo/{idTesoreria}`
- **GET** `/tesorerias/movimientos/historial/{idTesoreria}`
- **GET** `/tesorerias/{page}/{limit}`
- **GET** `/tesorerias/{id}`
- **DELETE** `/tesorerias/{id}`

---

### 17. Cajas

- **POST** `/cajas`
- **GET** `/cajas/list`
- **GET** `/cajas/{page}/{limit}`
- **GET** `/cajas/{id}`
- **PATCH** `/cajas/{id}`
- **DELETE** `/cajas/{id}`

---

### 18. POS – Turnos de caja

- **GET** `/pos/turnos/mi-turno/activo`
- **GET** `/pos/turnos/list`
- **GET** `/pos/turnos/activos`
- **GET** `/pos/turnos/resumen/saldos/{id}`
- **GET** `/pos/turnos/movimientos/{id}`
- **GET** `/pos/turnos/paginado/{page}/{limit}`
- **GET** `/pos/turnos/{id}`
- **GET** `/pos/turnos/consulta/filtrada`
- **POST** `/pos/turnos/suspender`
- **POST** `/pos/turnos/reactivar`
- **POST** `/pos/turnos/reponer`
- **POST** `/pos/turnos/retirar`
- **POST** `/pos/turnos/corte-parcial`

---

### 19. POS – Operaciones de caja (carga/descarga monederos)

- **POST** `/pos/turnos/abrir`
- **POST** `/pos/turnos/cerrar`
- **POST** `/pos/monederos/cargar`
- **POST** `/pos/monederos/descargar`
- **GET** `/pos/monederos/{numero}` – Consultar saldo por número.

---

### 20. S3 – Archivos

- **POST** `/s3/upload`

---

### 21. Mail

> En Swagger solo aparece la sección “Mail – Servicio de correo electrónico”; no se listan endpoints explícitos en el extracto actual.

---

### 22. Promociones

- **POST** `/promociones` – Crear promoción.
- **GET** `/promociones` – Listar promociones.
- **PUT** `/promociones/{id}` – Actualizar promoción.
- **GET** `/promociones/{id}` – Obtener por ID.
- **DELETE** `/promociones/{id}` – Eliminar (soft delete).
- **GET** `/promociones/vigentes`
- **POST** `/promociones/{id}/pausar`
- **POST** `/promociones/{id}/activar`
- **POST** `/promociones/{id}/juegos` – Configurar juegos válidos para rollover.
- **POST** `/promociones/otorgar`
- **POST** `/promociones/otorgar-masivo`
- **POST** `/promociones/cancelar/{id}`
- **POST** `/promociones/convertir/{id}`
- **GET** `/promociones/cron/expirar`
- **GET** `/promociones/pendientes-conversion`
- **GET** `/promociones/reporte`
- **POST** `/promociones/registrar-apuesta`
- **GET** `/promociones/afiliado/{id}`
- **GET** `/promociones/monedero/{id}`
- **GET** `/promociones/{id}/rollover/historial`
- **GET** `/promociones/{id}/rollover`
- **GET** `/promociones/por-vencer`

---

### 23. Dashboard

- **POST** `/dashboard/kpis` – Endpoint principal de KPIs de casino.

