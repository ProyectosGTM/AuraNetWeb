# AuraNet — Contexto del proyecto

Documento de referencia para trabajo futuro. Describe qué es el sistema, cómo está organizado el frontend Angular, módulos, rutas, UI, validaciones y estado real del código (agosto 2026).

---

## 1. Qué es AuraNet

**AuraNet** es un sistema de gestión operativa para casinos / salas de juego (branding: “Sistema de Gestión Auranet”).

Dominio principal:

- Clientes (operadores/cadenas) y su estructura física: **salas → zonas → máquinas / cajas**.
- **Afiliados** (jugadores) y **monederos** (saldo / RFID).
- Operación de efectivo: **bóveda (tesorería)**, **turnos de caja (POS)**, carga/descarga de monederos.
- **Ledger / transacciones**, **promociones**, **tablero KPIs**, administración (usuarios, roles, permisos, módulos, bitácora).

Frontend: Angular 17, plantilla **Minible** (Themesbrand) adaptada. Backend consumido vía `https://auran3t.mx/api` (`environment.API_SECURITY`). Swagger referido en docs internas: `https://auran3t.mx/api/docs`.

Package name del repo: `minible` v3.1.0 (`package.json`). Arranque: `ng serve --ssl`.

---

## 2. Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | Angular 17 (`@angular/*` ^17.0.6), TypeScript 5.2.2, RxJS 7 |
| UI base | Bootstrap 5.3.2, ng-bootstrap 16, plantilla Minible SCSS |
| Grids / charts negocio | DevExtreme 24 (`dx-data-grid`, `dx-select-box`, `dx-date-box`, `dx-chart`, popups) |
| Feedback | SweetAlert2 |
| Formularios | ReactiveFormsModule + FormsModule; DevExtreme en selects/fechas de negocio |
| i18n | `@ngx-translate/core` |
| Permisos librería | `ngx-permissions` (registrado; carga al login comentada; poco uso activo en UI) |
| Mapas | Google Maps (monitoreo), Leaflet (demos template) |
| Charts demos template | ApexCharts, Chart.js, ECharts, Chartist (rutas `/charts/*`, no núcleo casino) |
| Auth storage | `sessionStorage` (`token`, `user`, `permissions`) |
| Otros | Firebase/`@angular/fire` (dependencia), CKEditor, FullCalendar, ngx-mask, ng-select, flatpickr (mayormente demos o puntuales) |

---

## 3. Mapa de carpetas `src/app`

```
src/app/
├── account/                 # AccountModule → auth (login, signup, reset, verify, afiliación)
├── core/                    # guards, helpers/interceptors, auth.service, models, haspermission.directive
├── entities/                # User, Credentials, ErrorMessage, Enums/permiso.enum
├── extrapages/              # 404/500, maintenance, lockscreen (template)
├── layouts/                 # LayoutComponent, vertical/horizontal, sidebar, topbar, footer, rightsidebar
├── pages/                   # Feature modules (negocio + demos Minible)
│   ├── afiliados, bitacora, cajas, cajero, clientes, maquinas, modulos,
│   ├── monederos, monitoreo, permisos, promociones, recarga, roles, salas,
│   ├── tesoreria, transacciones, turnos, usuarios, zonas,
│   ├── dashboards, calendar, chart, chat, contacts, ecommerce, email,
│   ├── form, icons, invoices, maps, tables, ui, utility, file-manager
└── shared/
    ├── services/            # HTTP de negocio + RolAccesoService + FormularioValidacionSwalService
    ├── ui/                  # pagetitle, loader (UIModule)
    ├── utils/               # monto-input-formato, dx-date-box-input-attr, …
    └── interfaces/
```

Assets/tema: `src/assets/scss/` (Minible + custom). Environments: `src/environments/environment.ts` y `.prod.ts`.

**Legado:** en `shared/services` existen servicios de transporte (rutas, viajes, vehículos, operadores, talleres, combustible, etc.) no cableados al menú casino actual.

---

## 4. Arranque de la aplicación y routing raíz

Archivo: `src/app/app-routing.module.ts`

| Path | Destino | Guard |
|------|---------|-------|
| `account` | lazy `AccountModule` | — |
| `login` | `LoginComponent` | `NoAuthGuard` |
| `''` | `LayoutComponent` + lazy `PagesModule` | `AuthGuard` |
| `pages` | lazy `ExtrapagesModule` | `AuthGuard` |

`AppModule`: `NgxPermissionsModule.forRoot()`, DevExtreme (locale `es`), `LayoutsModule`, interceptores **`InterceptService`** + **`ErrorInterceptor`**. `JwtInterceptor` / fake-backend del template **no** están activos.

Layout por defecto (`layouts.model.ts`): modo **dark**, vertical, fluid, topbar/sidebar dark.

Menú lateral: `src/app/layouts/sidebar/menu.ts`.

---

## 5. Autenticación y sesión

### Login

- UI: `account/auth/login/` (también ruta `/account/auth/login`).
- Form: `userName` (email) + `password`.
- `AuthenticationService.authenticate` → `POST {API_SECURITY}/login`.
- Éxito: mapea permisos, `setData(User)`, navega a `/dashboard`.
- Swal éxito: fondo `#0d121d`, copy “¡Apuesta Ganadora!”.
- Flujos adicionales en el mismo componente: recuperación / OTP.

### Storage (`core/services/auth.service.ts`)

- Keys: `token`, `user`, `permissions` (+ `coordinates`).
- `isAuthenticated()`: token presente y válido.
- `logout()`: limpia sessionStorage + localStorage y recarga.
- Carga de `ngx-permissions` al login: **comentada**.

### Interceptores

- **`InterceptService`**: `Authorization: Bearer`, `Content-Type: application/json` (excepto `FormData`); header `SKIP_APP_AUTH` para omitir Bearer.
- **`ErrorInterceptor`**: HTTP 401 → logout + reload.

### Guards

- `AuthGuard`: sin sesión → `/login`.
- `NoAuthGuard`: con sesión → `dashboard`.

### Directiva `appHasPermission`

- Archivo: `core/haspermission.directive.ts` (intersecta permisos de sesión).
- **No declarada en módulos ni usada en templates** al momento de este documento.
- Control de acciones sensibles de negocio: **`RolAccesoService`**.

---

## 6. Menú de navegación (operativo)

Secciones en `menu.ts`:

1. **Principal** — Tablero (`/dashboard`).
2. **Administración** — Módulos, Permisos, Roles, Clientes, Usuarios, Bitácora.
3. **Organización / Estructura** — Salas, Zonas, Máquinas, Cajas, Afiliados, Monederos.
4. **Operación** — Bóveda (`/tesoreria`), Ap. Turnos (`/turnos`), Transacciones, POS (`/recarga`). (Cajero comentado en menú.)
5. **Gestión comercial** — Promociones, Monitoreo.
6. **Programas** — Lealtad (`/lealtad` — enlace en menú; módulo no listado en `pages-routing` como los demás).
7. **Cuenta** — Perfil (`/contacts/profile`).

---

## 7. Cómo se implementa un módulo de negocio

Patrón estándar (cajas, afiliados, monederos, salas, usuarios, …):

```
pages/<dominio>/
  <dominio>.module.ts
  <dominio>-routing.module.ts
  lista-<dominio>/     # DxDataGrid + CustomStore + Swal + (opcional) NgbModal
  agregar-<dominio>/   # FormBuilder; sirve también para editar vía ruta
```

Routing típico:

- `''` → lista  
- `agregar-<recurso>` → alta  
- `editar-<recurso>/:id…` → mismo componente de agregar  

Registro lazy en `pages/pages-routing.module.ts`. Entrada en `layouts/sidebar/menu.ts`. Servicio HTTP en `shared/services/<dominio>.service.ts` con `providedIn: 'root'`.

Lista: `container-fluid`, `DxDataGrid`, confirmaciones SweetAlert2 (`background: '#0d121d'`).  
Alta/edición: Reactive Forms, catálogos vía GET `/cat…/list` o listas, navegación de vuelta a la lista.

---

## 8. Módulos de negocio (detalle)

Lazy paths en `pages-routing.module.ts` salvo donde se indique.

### 8.1 Tablero — `/dashboard`

- Componente: `pages/dashboards/default/DefaultComponent` (eager en pages-routing).
- También `/dashboards/default|saas|crypto` → mismo componente.
- `DashboardService.postKpis` → `POST /dashboard/kpis`.
- Filtros fechas/cliente; cards KPI; tendencia con **`dx-chart`** (splineArea). `NgApexchartsModule` importado en el module pero **sin** `<apx-chart>` en el template.
- Modelo: `dashboard-kpis.model.ts`.

### 8.2 Administración

| Módulo | Rutas | Componentes | Servicio | Notas |
|--------|-------|-------------|----------|-------|
| Módulos | `/modulos`, `agregar-modulo`, `editar-modulo/:idModulo` | lista + agregar | `ModulosService` | nombre/descripcion required; activar/desactivar |
| Permisos | `/permisos`, `agregar-permiso`, `editar-permiso/:idPermiso` | lista + agregar | `PermisosService` (+ `ModulosService` en alta) | idModulo, nombre, descripcion required |
| Roles | `/roles`, `agregar-rol`, `editar-rol/:idRol` | lista + agregar | `RolesService` | nombre, descripcion required |
| Usuarios | `/usuarios`, `agregar-usuario`, `editar-usuario/:idUsuario` | lista + agregar | `UsuariosService` + clientes/roles/permisos/salas | email, passwords match, telefono, nombre, idCliente; upload S3 |
| Clientes | `/clientes`, `agregar-cliente`, `editar-cliente/:idCliente` | lista + agregar | `ClientesService` | física/moral, RFC, docs, domicilio, encargado; NgbModal auxiliar |
| Bitácora | `/bitacora` | solo lista | `BitacoraService` + usuarios | consulta paginada |

### 8.3 Estructura

| Módulo | Rutas | Notas |
|--------|-------|-------|
| Salas | `''`, `agregar-sala`, `editar-sala/:idSala`, `distribucion/:idSala` | Logo, licencia, mapa; `RolAccesoService` perfil cliente / sucursales; layout `GET|PATCH /layout/mapa/{idSala}` |
| Zonas | `''`, `agregar-zona`, `editar-zona/:idZona` | Editor visual plano (máquinas, puertas, polígonos); required nombre, tipo, dimensiones, cliente, sala |
| Máquinas | `''`, `agregar-maquina`, `editar-maquina/:idMaquina` | serie, sala, cliente, tipo, fabricante, estatus required |
| Cajas | `''`, `agregar-caja`, `editar-caja/:idCaja` | sala, zona, código, nombre, tipoCaja; acción UI `gestionarCajasCliente` |
| Afiliados | `''`, `agregar-afiliado`, `editar-afiliado/:idAfiliado` | Grid multi-modo; modales bloquear/autoexclusión/VIP/cumpleañeros/resumen/monederos |
| Monederos | `''`, `agregar-monedero`, `editar-monedero/:idMonedero` | Lista = CRUD + POS (cargar, descargar, saldo, traspaso, ajuste, reemplazo, historial) |

### 8.4 Operación

| Módulo | Rutas | Notas |
|--------|-------|-------|
| Tesorería (Bóveda) | `''`, `agregar-tesoreria`, `editar-tesoreria/:idTesoreria`, `abrir-boveda` | Abrir/cerrar día, reponer/retirar, resumen, historial; roles abrir/cerrar bóveda |
| Turnos | `''`, `abrir-turno` | Abrir/cerrar, reponer/retirar, suspender/reactivar, corte parcial, saldos |
| POS Recarga | `/recarga` | Cargar monedero; modales abrir/cerrar turno, descargar, consultar saldo; responsive fuerte |
| Transacciones | `/transacciones` | Ledger paginado `GET /ledger/{page}/{limit}`; consultas saldo en servicio; UI saldo comentada |
| Cajero | `/cajero` | UI tickets con **datos mock** (`cajero.service` local); fuera del menú activo |

### 8.5 Comercial / otros

| Módulo | Rutas | Notas |
|--------|-------|-------|
| Promociones | `''`, `agregar-promocion` (**sin** editar en routing) | Vistas GET (vigentes, por vencer, reporte, rollover, cron…); alta con `registrarPromocion` |
| Monitoreo | `/monitoreo` | Google Maps + lista ONLINE/OFFLINE **hardcodeada**; `MonitoreoService` shared no usado en el componente |

---

## 9. Funciones de negocio del sistema

1. **Auth y cuenta:** login JWT, recuperación de acceso, perfil, logout.
2. **RBAC de catálogo:** módulos, permisos, roles, usuarios (y enum `Permiso` legado + casino).
3. **Clientes:** alta física/moral, documentos, estatus.
4. **Estructura de sala:** salas, distribución/layout, zonas (plano), máquinas, cajas.
5. **Afiliados:** CRUD, búsqueda, inactivos, cumpleañeros, resumen, monederos, bloqueo, autoexclusión, VIP.
6. **Monederos:** CRUD/estatus, POS carga/descarga, traspaso, ajuste, reemplazo, historial, saldo por número.
7. **Bóveda:** ciclo diario abrir/cerrar, movimientos, saldo ledger tesorería.
8. **Turnos POS:** ciclo de caja, efectivo caja↔bóveda, suspensión, corte X, resumen/movimientos.
9. **POS unificado (`/recarga`):** operación de mostrador (carga + turnos + descarga + saldo).
10. **Ledger:** consulta de movimientos y saldos.
11. **Promociones:** alta + consultas/reportes (escrituras avanzadas del Swagger no cableadas en servicio).
12. **Dashboard KPIs:** métricas por periodo/cliente.
13. **Bitácora:** auditoría de acciones.
14. **Control UI por rol:** `RolAccesoService` en acciones sensibles (ver contrato).

---

## 10. Colores, tema y look & feel

### Base Minible

- Variables: `src/assets/scss/_variables.scss`, dark `_variables-dark.scss`.
- Primary Bootstrap Minible: **`#5b73e8`** (`$blue` → `$primary`).
- Semánticos: green `#34c38f`, cyan `#50a5f1`, yellow `#f1b44c`, red `#f46a6a`, etc.
- Layout default: dark (`LAYOUT_MODE = 'dark'`).

### Branding AuraNet (sobre Minible)

| Token | Uso |
|-------|-----|
| `#e40041` | Acento de marca (login, glows, botones, `accent-color`) |
| `#0d121d` | Fondo SweetAlert / superficies oscuras de feedback |
| Footer | “Copyright … © AuraNet” |
| Tooltip global | clase `aura-tooltip` (AppModule) |

No existe `_variables-auranet.scss` dedicado: la marca se aplica en SCSS de páginas (login, etc.) y convenciones de Swal.

---

## 11. Formularios

### Patrones

- **Reactivos** en casi todo el negocio (`FormBuilder` / `FormGroup` / `Validators`).
- Selects/fechas de negocio: **DevExtreme** (`DxSelectBox`, `DxDateBox`).
- ng-select / ngx-mask / flatpickr: presentes en demos template y algunos módulos; no son el patrón dominante casino.
- Validación visual compartida: `FormularioValidacionSwalService.resaltarYAlertarSiInvalido` (uso verificado en agregar-afiliado).
- Utilidades: `shared/utils/monto-input-formato.util.ts`, `dx-date-box-input-attr.ts`.
- Clases UI frecuentes: `sleek-control`, grids Bootstrap `col-12 col-md-6 col-lg-*`.

### Validaciones destacadas por módulo

| Módulo | Reglas clave |
|--------|----------------|
| Login | email + password required |
| Usuarios | email; passwordsMatchValidator; telefono, nombre, idCliente |
| Clientes | RFC, tipoPersona, docs, correo email, domicilio, encargado; apellido según física/moral |
| Cajas | idSala, idZona, codigo, nombre, idTipoCaja required |
| Afiliados | sala, tipo/número ID, nombre, apellido paterno, fecha nac., sexo, estatus; email opcional con validador condicional |
| Monederos alta | idAfiliado, numeroMonedero, idEstatusMonedero |
| Monederos POS | montos `min(0.01)`; motivos `minLength(1)`; tipoAjuste required |
| Recarga | monto `min(0.01)`; fondos turno `min(0)`; número saldo required |
| Turnos / bóveda | fondos y montos `min(0)` / `min(0.01)`; motivos required en reponer/retirar/suspender |
| Promociones alta | codigo, nombre, tipo, esPorcentaje; multiplicadorRollover `min(0.0001)`; diasParaCompletar `min(1)` |
| Zonas | nombre, tipo, ancho/alto, cliente, sala |
| Máquinas | serie, sala, cliente, tipo, fabricante, estatus |
| Salas | en form Angular solo `idCliente` marked required en init; resto puede validarse en submit |

---

## 12. Modales y feedback

### SweetAlert2

- Confirmaciones, éxito/error, acceso denegado, validación de forms.
- Estilo típico: `background: '#0d121d'`, `confirmButtonColor: '#3085d6'`.
- SCSS plugin: `assets/scss/custom/plugins/_sweatalert2.scss`.

### NgbModal

- Listas operativas con `@ViewChild` + `NgbModal.open`.
- Opciones frecuentes: `centered: true`, `backdrop: 'static'`, `size: 'md'`, `windowClass: 'modal-holder …'`.
- Ejemplos intensivos: **afiliados** (filtros, bloquear, autoexclusión, VIP, cumpleañeros, resumen, monederos), **monederos** (cargar/descargar/saldo/ajuste/historial/reemplazo/estatus), **tesorería**, **turnos**, **recarga**.

Antes de abrir modal sensible: `puedeRealizarAccion` → si no, `mostrarAccesoDenegado` (regla de proyecto).

---

## 13. Gráficas

| Librería | Uso real negocio |
|----------|------------------|
| DevExtreme `dx-chart` | Dashboard KPIs (ingresos) |
| DevExtreme DataGrid / SelectBox / Popup | Listados y formularios de casi todos los módulos |
| Apex / Chart.js / ECharts / Chartist | Demos en `/charts`; Apex importado en dashboards module sin uso en template |

---

## 14. Responsive

- Contenedor: `container-fluid` + grillas Bootstrap (`col-12`, `col-md-*`, `col-lg-*`, `row-cols-*`).
- SCSS con `@media` frecuentes: 1400 / 1100 / 992 / 900 / 768 / 640 / 576 / 400 px según página.
- Módulos con SCSS responsive más trabajado: **recarga**, **salas**, **tesorería**, **turnos**, **afiliados**, **dashboard**, **monitoreo**, **cajero**.
- DataGrid DevExtreme adapta columnas; en móvil se apoya en scroll horizontal / priorización de columnas según implementación de cada lista.

---

## 15. Entidades y modelos

### `src/app/entities/`

| Archivo | Contenido |
|---------|-----------|
| `User.ts` | Sesión: id, token, refreshToken?, nombres, telefono, permisos[], email, idCliente?, rol, userName, datos cliente, imágenes… |
| `Credentials.ts` | username, password |
| `ErrorMessage.ts` | title, message, httpStatus |
| `Enums/permiso.enum.ts` | IDs string `"1"`…`"133"` (casino + legado transporte) |

### Modelos locales (fuera de entities)

- `pages/cajero/models/ticket-caja.model.ts`
- `pages/dashboards/default/dashboard-kpis.model.ts`
- Interfaces en `salas.service.ts` (layout mapa)
- Tipos inline en zonas, monitoreo, promociones, turnos, afiliados…

Los payloads de negocio suelen ser `any` o shapes locales en el componente; el contrato HTTP vive en los servicios.

---

## 16. Servicios shared de negocio

Ubicación: `src/app/shared/services/`.

| Servicio | Dominio |
|----------|---------|
| `afiliados.service` / `afiliados-estatus.service` | Afiliados |
| `cajas.service` | Cajas |
| `clientes.service` | Clientes |
| `monederos.service` | Monederos + POS monederos |
| `salas.service` | Salas + layout mapa |
| `zona.service` | Zonas |
| `maquinas.service` | Máquinas |
| `tesoreria.service` | Bóveda |
| `turnos.service` (+ turnos-activos*) | Turnos POS |
| `transacciones.service` | Ledger |
| `promociones.service` | Promociones |
| `usuario.service` | Usuarios + S3 upload + recuperación |
| `roles.service` / `permisos.service` / `modulos.service` | RBAC catálogo |
| `bitacora.service` | Bitácora |
| `dashboard.service` | KPIs |
| `monitoreo.service` | Endpoints listado/recorrido (UI actual no los usa) |
| `rol-acceso.service` | Matriz UI roles (sin HTTP) |
| `formulario-validacion-swal.service` | Validación forms + Swal (sin HTTP) |

Detalle de endpoints: ver `docs/contrato.md`.

---

## 17. Template Minible (no núcleo)

Rutas aún presentes (demos): calendar, chat, file-manager, ecommerce, email, invoices, contacts, ui/*, form/*, tables, charts, icons, maps, utility, extrapages.

Sirven de referencia visual del template; el producto AuraNet opera sobre los módulos de la sección 8 y el menú de la sección 6.

---

## 18. Estado / madurez observada en código

| Área | Estado |
|------|--------|
| Monitoreo UI | Mock / hardcode; no consume `MonitoreoService` |
| Cajero | Mock local; menú comentado |
| Promociones | Sin ruta editar; servicio solo POST crear + GETs (Swagger tiene más escrituras) |
| Transacciones | Lista ledger; UI consultar saldo comentada |
| ngx-permissions / `appHasPermission` | Parcial / sin uso UI activo |
| Lealtad en menú | Link `/lealtad` sin módulo lazy equivalente en pages-routing |
| Servicios transporte | Legado en shared, fuera del menú casino |
| Clientes actualizar | Código usa `PUT` (docs Swagger suelen indicar PATCH) |

---

## 19. Regla de UI de permisos (proyecto)

Fuente: `.cursor/rules/aura-ui-permisos.mdc`

- No mostrar en HTML, tooltips ni SweetAlert frases tipo “según API/Swagger”, “requiere rol X” como copy técnico, ni IDs de documentación.
- Centralizar reglas y mensajes de acceso denegado en **`RolAccesoService`**.
- Validar antes de modal/acción con `obtenerRolUsuarioLogueado` + `puedeRealizarAccion` + `mostrarAccesoDenegado`.
- Textos orientados al usuario (qué no puede hacer y qué roles sí), sin endpoints ni IDs Swagger.

---

## 20. Uso de este documento

Este archivo es el **contexto** del frontend AuraNet: dominio, estructura, módulos, UI y estado.

Para convenciones de implementación, matriz de roles, endpoints HTTP y checklist al crear features nuevas, usar **`docs/contrato.md`**.
