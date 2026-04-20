# Análisis Swagger / OpenAPI y alineación Angular — AuraNet

## 1. Fuente de verdad

| Recurso | URL |
|--------|-----|
| Swagger UI | https://auran3t.mx/api/docs |
| OpenAPI JSON (misma especificación) | https://auran3t.mx/api/docs-json |

**Metadatos comprobados** sobre el JSON `docs-json` (descarga verificada en el entorno de análisis):

- **OpenAPI:** `3.0.0`
- **info.version:** `1.0.5`
- **Cantidad de claves en `paths`:** **166**

La especificación completa incluye todos los `components.schemas`, `requestBody` y `responses` con referencias `$ref`. Ese contenido **no cabe** de forma manual en un solo paso de edición fiable; el proyecto incluye un generador que vuelca **cada operación** con esquemas expandidos.

---

## 2. Volcado exhaustivo (obligatorio para “cada campo” sin omisiones)

Desde la raíz del repositorio:

```bash
node scripts/generate-swagger-analisis.mjs
```

Opciones:

- Sin argumentos: descarga `https://auran3t.mx/api/docs-json`, guarda `docs/openapi-auranet.json`, genera `docs/swagger-analisis.md` (sobrescribe este archivo con el detalle máquina) y escribe `docs/swagger-path-index.txt` (lista de rutas base).
- Con argumento: `node scripts/generate-swagger-analisis.mjs ruta/al/openapi.json` usa un JSON local (por ejemplo si la descarga falla en red).

**Importante:** el archivo `docs/swagger-analisis.md` que estás leyendo ahora combina **(A)** procedimiento y comparación Angular **y (B)** anexo de rutas según `AURANET_API_SWAGGER_RESUMEN.md`. Tras ejecutar el script, el markdown generado reemplazará el contenido por el **volcado técnico completo**; conserva una copia de este documento si necesitas el texto de la sección 5 (correcciones) fuera del git.

---

## 3. Fase 2 — Servicios Angular bajo `environment.API_SECURITY`

Los servicios que llaman a la API AuraNet suelen estar en `src/app/shared/services/*.service.ts` y en `src/app/core/services/auth.service.ts`.

Hay además servicios de **otros dominios** (mantenimiento vehicular, pasajeros, rutas, etc.) que reutilizan el mismo `environment.API_SECURITY` pero **no** aparecen en el resumen de casino de la sección 6; pueden ser módulos legacy o APIs no listadas en el Swagger de Auranet.

---

## 4. Fase 3 — Comparación Swagger (1.0.5 / resumen) vs código (hallazgos)

| Área | Qué indica Swagger / resumen | Qué hacía el proyecto | Acción |
|------|------------------------------|------------------------|--------|
| Clientes — actualizar | `PATCH /clientes/{id}` | `PUT` en `clientes.service.ts` | Corregido a `PATCH` |
| Usuarios — operadores por cliente | `GET /usuarios/list/cliente/{idCliente}/rol` | `GET .../usuarios/list/rol/operador/{idCliente}` | Corregida la URL |
| Usuarios — cambiar contraseña | `PATCH /usuarios/actualizar/contrasena/{id}` | `PUT` en `usuario.service.ts` | Corregido a `PATCH` |
| Auth — control usuarios | `API_SECURITY` ya termina en `/api` | Rutas `.../api/controlusuarios/...` (doble `/api`) | Corregido a `.../controlusuarios/...` |
| Tesorerías — listado | No figura `GET /tesorerias/list` en el resumen OpenAPI de casino ni aparece la cadena `tesorerias/list` en el JSON analizado | `GET /tesorerias/list` en `tesoreria.service.ts` | Sustituido por delegación a `GET /tesorerias/{page}/{limit}` (`1` y `10000`) |

### 4.1 Verificaciones sin cambio (muestra)

- **Monederos / POS / Ledger / Turnos / Afiliados / Promociones / Dashboard:** las rutas revisadas en `monederos.service.ts`, `turnos.service.ts`, `transacciones.service.ts`, `afiliados.service.ts`, `promociones.service.ts`, `dashboard.service.ts` coinciden con `docs/AURANET_API_SWAGGER_RESUMEN.md`.
- **Módulos, roles, permisos:** verbos `PUT`/`PATCH` alineados con el resumen para actualización y estatus.
- **`PATCH /monederos/estatus/{id}`** (activar/desactivar registro en grid): documentado en `docs/API_MONEDEROS.md`; la cadena no aparece en búsqueda literal del JSON por tamaño/línea única — mantener según documentación interna hasta contrastar con volcado generado por script.

### 4.2 Riesgos pendientes (no tocados por falta de evidencia en OpenAPI exportado)

- **`AuthenticationService` — `controlusuarios`:** no aparece en el índice de paths del JSON buscado por texto; conviene **confirmar en backend** el path exacto tras quitar el doble `/api/`.
- **`TesoreriaService.updateEstatus`** y **`actualizarTesoreria`:** el resumen de casino en `AURANET_API_SWAGGER_RESUMEN.md` no lista `PATCH` de tesorería ni `POST` genérico de creación; si el volcado OpenAPI confirma ausencia, habría que alinear con el DTO real (fuera del alcance inferido aquí).

---

## 5. Fase 4 — Correcciones aplicadas en código (solo servicios)

1. **`clientes.service.ts` — `actualizarCliente`:** `http.put` → `http.patch` para `PATCH /clientes/{id}`.
2. **`usuario.service.ts` — `obtenerUsuariosRolOperador`:** ruta alineada a `GET /usuarios/list/cliente/{idCliente}/rol`.
3. **`usuario.service.ts` — `actualizarContrasena`:** `http.put` → `http.patch` para `PATCH /usuarios/actualizar/contrasena/{id}`.
4. **`auth.service.ts` — `updateUsuario` / `getUsuarioControl`:** eliminado el segmento duplicado `/api` en la URL base.
5. **`tesoreria.service.ts` — `obtenerTesoreria`:** eliminado `GET /tesorerias/list` no documentado; delegación a `obtenerTesoreriaData(1, 10000)`.

No se modificó HTML, SCSS ni lógica de componentes.

---

## 6. Anexo — Catálogo de rutas (resumen Swagger 1.0.5)

> Copia fiel de `docs/AURANET_API_SWAGGER_RESUMEN.md` (última versión en repo). Para cuerpos JSON, parámetros obligatorios y códigos HTTP por operación, usar el generador de la sección 2 o el Swagger UI.

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
