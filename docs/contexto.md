# AuraNet — Contexto del proyecto (frontend Angular)

Documento de referencia del estado **real** del código del frontend AuraNet (septiembre 2026). Describe qué es el sistema, cómo está construido, y el detalle de vistas, formularios, grids, botones, tabs, desplegables, modales, colores, estilos, animaciones, gráficas, mapas, layouts, validaciones, métodos, roles, permisos, servicios y APIs.

Las normas para implementar (qué se debe y qué no se debe hacer) están en **`docs/contrato.md`**.

---

## Índice

1. Qué es AuraNet
2. Stack y configuración
3. Estructura de carpetas
4. Arranque, routing y menú
5. Autenticación y sesión
6. Layout (topbar, sidebar, footer, tema)
7. Sistema visual (paleta, tipografías, componentes CSS globales, SweetAlert, tooltips)
8. Animaciones
9. Patrones transversales (grid, estatus, formularios, uploader S3, montos, fechas)
10. Roles y permisos
11. Módulos de negocio (detalle por módulo)
12. Gráficas
13. Mapas
14. Servicios `shared/services` (en uso y legado)
15. Páginas demo de la plantilla Minible
16. Hallazgos y deuda técnica observada

---

## 1. Qué es AuraNet

**AuraNet** ("Sistema de Gestión Auranet") es un sistema de gestión operativa para **casinos / salas de juego**.

Dominio:

- **Clientes** (operadores/cadenas) y su estructura física: **salas → zonas → máquinas / cajas**, con editor visual del plano de la sala.
- **Afiliados** (jugadores) y **monederos** electrónicos (saldo efectivo/promocional/puntos, RFID).
- Operación de efectivo: **bóveda (tesorería)** del día, **turnos de caja (POS)**, carga/descarga de monederos, traspasos y ajustes.
- **Ledger / transacciones**, **promociones** (rollover, vigencias), **tablero de KPIs**, **monitoreo** de salas en mapa.
- Administración: **módulos, permisos, roles, usuarios, clientes, bitácora**.

El frontend parte de la plantilla **Minible** (Themesbrand) y conserva sus demos. Existen restos de un proyecto anterior de transporte (**Transmovi**: vehículos, rutas, pasajeros, etc.) en servicios, enum de permisos y URLs de imágenes.

---

## 2. Stack y configuración

### 2.1 Dependencias clave (`package.json`, nombre `minible` v3.1.0)

| Área | Tecnología |
|---|---|
| Framework | Angular 17 (`@angular/*` ^17.0.6), TypeScript 5.2.2, RxJS 7.8, zone.js 0.14 |
| UI base | Bootstrap 5.3.2, `@ng-bootstrap/ng-bootstrap` 16, SCSS Minible |
| Grids / selects / fechas / charts de negocio | DevExtreme 24.1.6 + `devextreme-angular` |
| Feedback | SweetAlert2 11 |
| Formularios | Reactive Forms + Forms |
| i18n | `@ngx-translate/core` 15 + http-loader (`assets/i18n/*.json`) |
| Permisos (librería) | `ngx-permissions` 19 (registrado, sin carga real) |
| Mapas | Google Maps JS nativo (script en `index.html`), `@angular/google-maps` y Leaflet (`@asymmetrik/ngx-leaflet`) solo en demos |
| Charts demo | ApexCharts, Chart.js/ng2-charts, ECharts, Chartist (solo `/charts/*`) |
| Otros (demos/puntuales) | Firebase, CKEditor 5, FullCalendar, ngx-mask, ng-select, flatpickr, dropzone, owl-carousel, masonry, lightbox, ui-switch, simplebar, metismenujs |

Scripts: `start` = `ng serve --ssl`; `postinstall` = `node ./add-devextreme-license.js`. `src/main.ts` aplica `config({ licenseKey })` desde `./devextreme-license`.

### 2.2 `angular.json` (proyecto `minible-ng`)

- Builder `@angular-devkit/build-angular:browser`, salida `dist/minible-ng`.
- **Estilos (en orden):** `dx.common.css`, **`dx.fluent.saas.dark.compact.css`**, chartist, owl carousel (x2), ui-switch, lightbox, leaflet, `src/styles.scss`, `src/assets/scss/bootstrap.scss`, `src/assets/scss/app.scss`, `src/assets/scss/icons.scss`.
- Sin scripts globales.
- Configuración por defecto: desarrollo (`defaultConfiguration: ""`). Producción reemplaza `environment.ts` por `environment.prod.ts`, activa optimización y hashing.
- **Budgets:** initial 2 MB aviso / 5 MB error; `anyComponentStyle` 6 KB aviso / 10 KB error.

### 2.3 `src/index.html`

- `<title>AuraNet</title>`, `lang="en"`, favicon `assets/images/icono.png`.
- **Google Maps JS** con `key=AIzaSyCV…&libraries=drawing&v=weekly` (`async defer`); dos claves más comentadas.
- CDN: Material Icons, Font Awesome **4.3.0** y **4.7.0**, Unicons **3.0.1**.

### 2.4 Environments

| Archivo | `API_SECURITY` |
|---|---|
| `environment.ts` | `https://auran3t.mx/api` (comentado: `https://transmovi.mx/api`) |
| `environment.prod.ts` | `https://auran3t.mx/api` |

### 2.5 `AppModule`

- `NgxPermissionsModule.forRoot()`, `BrowserAnimationsModule`, `HttpClientModule`, módulos DevExtreme (DataGrid, SelectBox, Popup, Chart, TreeMap, TagBox, Validator, etc.), `TranslateModule.forRoot`, `LayoutsModule`, `NgbModule`, `AuthModule`. `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
- **Interceptores activos:** `InterceptService` y `ErrorInterceptor`. `JwtInterceptor` (cuerpo comentado) y `FakeBackendInterceptor` **no** están registrados.
- **Tooltips (`NgbTooltipConfig`):** `triggers = 'mouseenter:mouseleave'`, `container = undefined` (para no desalinear en DataGrid), `placement = 'top'`, `tooltipClass = 'aura-tooltip'`, `openDelay/closeDelay = 0`, `animation = false`, `popperOptions → strategy: 'fixed'`.
- **Localización DevExtreme:** `loadMessages({ es: { 'dxDataGrid-groupContinuesMessage': 'Continúa en la siguiente página', 'dxDataGrid-groupContinuedMessage': 'Continúa desde la página anterior' } })` + `locale('es')`. No se carga el paquete completo de mensajes `es`; las páginas definen sus textos (`mensajeAgrupar`, `infoText`).

---

## 3. Estructura de carpetas `src/app`

```
src/app/
├── account/            # AccountModule → auth (login, reset-password, signup, verify, afiliacion)
├── core/               # guards, helpers (interceptores, fake-backend), services (auth, event, language, loader…),
│                       # animaciones (fade-in-right, slide-down-fade, modal-animation, animation-text), haspermission.directive
├── entities/           # User, Credentials, ErrorMessage, Enums/permiso.enum
├── extrapages/         # maintenance, comingsoon, 404, 500, login-1, register-1, recoverpwd-1, lock-screen-1 (plantilla)
├── layouts/            # LayoutComponent, vertical, horizontal, topbar, horizontaltopbar, sidebar(+menu.ts), rightsidebar, footer
├── pages/              # Módulos de negocio + demos Minible
└── shared/
    ├── services/       # HTTP de negocio + RolAccesoService + FormularioValidacionSwalService (+ legado transporte)
    ├── ui/             # UIModule: PagetitleComponent (app-page-title), LoaderComponent (app-loader)
    └── utils/          # monto-input-formato.util.ts, dx-date-box-input-attr.ts
```

`SharedModule` importa `CommonModule` y `UIModule` pero **no exporta nada** (declarations vacías).

Tema: `src/assets/scss/` (Minible) + `src/styles.scss` (toda la personalización AuraNet).

---

## 4. Arranque, routing y menú

### 4.1 Rutas raíz (`app-routing.module.ts`)

| Path | Destino | Guard |
|---|---|---|
| `account` | lazy `AccountModule` | — |
| `login` | `LoginComponent` | `NoAuthGuard` |
| `''` | `LayoutComponent` + lazy `PagesModule` | `AuthGuard` |
| `pages` | lazy `ExtrapagesModule` | `AuthGuard` |

- `scrollPositionRestoration: 'top'`. `HashLocationStrategy` comentado.
- **No hay ruta comodín `**`** ni `redirectTo` para `''`.

### 4.2 Rutas de negocio (`pages/pages-routing.module.ts` + routing de cada módulo)

| Path | Componente | Notas |
|---|---|---|
| `/dashboard` | `DefaultComponent` | eager; también `/dashboards/default|saas|crypto` |
| `/modulos` · `agregar-modulo` · `editar-modulo/:idModulo` | Lista / Agregar | |
| `/permisos` · `agregar-permiso` · `editar-permiso/:idPermiso` | Lista / Agregar | |
| `/roles` · `agregar-rol` · `editar-rol/:idRol` | Lista / Agregar (`app-alta-roles`) | |
| `/usuarios` · `agregar-usuario` · `editar-usuario/:idUsuario` | Lista / Agregar (`app-alta-usuario`) | |
| `/bitacora` | `BitacoraComponent` | solo lista |
| `/clientes` · `agregar-cliente` · `editar-cliente/:idCliente` | Lista / Agregar (`app-alta-clientes`) | |
| `/salas` · `agregar-sala` · `editar-sala/:idSala` · `distribucion/:idSala` | Lista / Agregar / `DistribucionSalaComponent` | distribución con `data: { modoDistribucionSala: true }` |
| `/zonas` · `agregar-zona` · `editar-zona/:idZona` | Lista / Agregar | |
| `/maquinas` · `agregar-maquina` · `editar-maquina/:idMaquina` | Lista / Agregar | |
| `/cajas` · `agregar-caja` · `editar-caja/:idCaja` | Lista / Agregar | |
| `/afiliados` · `agregar-afiliado` · `editar-afiliado/:idAfiliado` | Lista / Agregar | |
| `/monederos` · `agregar-monedero` · `editar-monedero/:idMonedero` | Lista / Agregar | |
| `/tesoreria` · `agregar-tesoreria` · `editar-tesoreria/:idTesoreria` · `abrir-boveda` | Lista / Agregar (inalcanzable) / AbrirBoveda | |
| `/turnos` · `abrir-turno` | Lista / AbrirTurno (sin navegación hacia ella) | |
| `/cajero` | `CajeroComponent` | fuera del menú, datos mock |
| `/transacciones` | `ListaTransaccionesComponent` | |
| `/recarga` | `RecargaComponent` (POS) | |
| `/promociones` · `agregar-promocion` | Lista / Agregar | sin ruta de edición |
| `/monitoreo` | `MonitoreoComponent` | mock |
| `/contacts/profile` · `/contacts/list` · `/contacts/grid` | Profile / demos | |

Ninguna ruta hija tiene guard propio: la única protección es `AuthGuard` (solo sesión).

### 4.3 Menú lateral (`layouts/sidebar/menu.ts`)

| Sección (`isTitle`) | Items (id · label · link · icono) |
|---|---|
| 1001 Principal | 8 Tablero `/dashboard` `uil-shopping-bag`; **27** Administración `uil-users-alt` → 31 Modulos, 29 Permisos, 30 Roles, 3 Clientes, 28 Usuarios, 32 Bitacora |
| 1002 Organización | 2 Estructura `uil-layer-group` → 5 Salas, 4 Zonas, 6 Maquinas, 37 Cajas, 40 Afiliados, 11 Monederos |
| 1003 Operación | 36 Boveda `/tesoreria` `uil-wallet`; 38 Ap. Turnos `/turnos` `uil-clock`; 41 Transacciones `uil-exchange-alt`; 57 POS `/recarga` `uil-shopping-bag` |
| 1004 Gestión comercial | 50 Promociones `uil-gift`; **27** Monitoreo `uil-map` |
| 1005 Programas | 22 Lealtad `/lealtad` `uil-heart` (**sin ruta**: no existe módulo) |
| 1006 Cuenta | 10 Perfil `/contacts/profile` `uil-user` |

Comentados: Cajero (58), Indicadores (13–16), Tipo Estado (20), Efectivo (21), identificación/moneda (23–26), Finanzas (33–35). El id **27 está duplicado**. El menú **no se filtra** por permisos ni rol (ver §10).

---

## 5. Autenticación y sesión

### 5.1 `AuthenticationService` (`core/services/auth.service.ts`)

- `isAuthenticated()`: `sessionStorage.token` distinto de `null`, `'null'`, `'undefined'`, `''`.
- `getToken()`: `JSON.parse(sessionStorage.token)` o `""`.
- `setData(user)`: guarda `token`, `user` (respuesta completa del login) y `permissions` (`data.permisos`).
- `getUser()`, `getPermissions()`, `cleanSession()`, `clearUserData()`, `failToken()`.
- `setStorageCoordinate()` / `getCoordinates()` (`coordinates`): nunca se llaman.
- `logout()`: `window.location.reload()` **antes** de limpiar `sessionStorage` y `localStorage` (deja `console.log`).
- Endpoints: `POST /login`, `POST /login/recuperar/confirmacion` (texto), `PATCH /login/verify` `{codigo}` (texto), `GET|PUT /controlusuarios/{id}` (sin uso).

### 5.2 Entidad `User` (`entities/User.ts`)

`id, token, refreshToken?, nombre, apellidoPaterno?, apellidoMaterno?, nombreCompleto?, telefono, fechaCreacion, ultimoLogin, permisos[], email, idCliente?, imagenPerfil, user, rol, userName, fotoPerfil, logotipo, nombreCliente, apellidoPaternoCliente, apellidoMaternoCliente`.

`rol` es el id de rol (string/number) que usa `RolAccesoService`. `idSala` también se lee desde `user` en monederos.

### 5.3 Interceptores

- **`InterceptService`** (`account/auth/login/intercept.service.ts`): si el `HttpContext` no trae `SKIP_APP_AUTH` y no hay `Authorization`, añade `Bearer <token>`. Si el body no es `FormData` y no hay `Content-Type`, añade `application/json`.
- **`ErrorInterceptor`** (`core/helpers/error.interceptor.ts`): 401 → `logout()` + `location.reload()`. Relanza `{ status, message, error }`. Al cálculo de `backendMessage` le faltan los `||`, en la práctica `message = err.error?.message`.

### 5.4 Guards

- `AuthGuard` (`core/guards/auth.guard.ts`): sin sesión → `/login` (sin `returnUrl`).
- `NoAuthGuard` (`core/guards/no-auth.guard.ts`): con sesión → `dashboard`.
- `account/auth/login/Guard/auth.guard.ts` (valida `route.data['permiso']` → `/unauthorized`): **no se usa**.

### 5.5 Pantallas de cuenta (`account/auth/*`)

Rutas: `/login` (raíz), `/account/login`, `/account/reset-password`, `/account/signup`, `/account/verify`, `/account/afiliacion` (también existen bajo `/account/auth/...`).

**Login**
- Textos: "Bienvenido", "Sistema de Gestión Auranet", "Iniciar Sesión", "Ingresa tus credenciales", campos "Correo" (`correo@dominio.com`) y "Contraseña" (`••••••••`, botón ojo).
- Form: `userName` [required, email], `password` [required]. Botón "Entrar"/"Cargando..." deshabilitado si inválido o cargando.
- Enlaces: "¿Olvidaste tu contraseña?" → `/account/reset-password`; "¿No tienes cuenta? Crear cuenta" → `/account/afiliacion`.
- Éxito: Swal "¡Apuesta Ganadora!" / "Has entrado al sistema correctamente." / "Continuar"; permisos mapeados a `String(p.idPermiso)`; `setData`; navega a `/dashboard` (ignora `returnUrl`).
- Error: Swal "¡Ops!" con `error.error`, botón "Entendido", no se cierra con clic fuera ni Esc.
- El componente tiene pasos `login | email | otp` (OTP de 4 dígitos, reenvío 60 s), pero **la plantilla solo renderiza el login**. No hay 2FA.
- Estilos: degradado `#0d121d → #151c2c`, halos `#6a8cff` y `#e40041`, animación `slideUpFade 0.7s`, 2 columnas → 1 bajo 992 px.

**Recuperar contraseña** (`reset-password`): campo "Correo Electrónico" [required, email]; `POST /login/usuario/recuperar/acceso` (texto); guarda `sessionStorage.reset_token`; éxito "¡Operación Exitosa!" → login.

**Cambiar contraseña** (`signup`): token de `reset_token` o `?token=`; reglas en vivo (mayúscula, minúscula, número, símbolo, longitud >6 y <16, "Contraseña segura."), coincidencia; `POST /login/cambiar/accesso` con `Authorization: Bearer <reset_token>`. Animaciones locales `fadeOnChange` (160 ms) y `fadeInOut`.

**Afiliación de pasajero** (`afiliacion`, legado transporte): nombre [required, minLength 2], apellidoPaterno [required], apellidoMaterno, fechaNacimiento [required], telefono [required, `^\d{10}$`], correo [required, email], passwordHash [required, `^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{7,15}$`]; `POST /login/pasajero/registro`; modal OTP (NgbModal lg, estático) con 4 cajas, reenvío 60 s, `PATCH /login/verify` con `SKIP_APP_AUTH`.

**Verificación** (`verify`): guarda `?token=` en `sessionStorage.verify_token` (nunca se envía); campo código [required]; `PATCH /login/verify`.

### 5.6 Almacenamiento

- `sessionStorage`: `token`, `user`, `permissions`, `reset_token`, `verify_token` (`coordinates` y `authUser` nunca se escriben).
- Cookie `lang` (LanguageService).

---

## 6. Layout

### 6.1 Estructura

- `LayoutComponent` → `<app-vertical>` (por defecto) o `<app-horizontal>`.
- Vertical: `#layout-wrapper` → `app-topbar`, `app-sidebar [isCondensed]`, `.main-content > .page-content > router-outlet`, `app-footer`; fuera, `app-rightsidebar`.
- Constantes (`layouts.model.ts`): `vertical`, modo `dark`, ancho `fluid`, posición `fixed`, topbar `dark`, sidebar `lg` y `dark`.
- `LayoutComponent` aplica atributos en `body`: `data-bs-theme`, `data-topbar`, `data-sidebar`, `data-layout-size`, `data-layout-scrollable`, `data-sidebar-size` (`lg` 250 px, `sm` 70 px solo iconos, `small` 160 px).
- `EventService` (Subject `{type,payload}`): eventos `changeLayout`, `changeMode`, `changeWidth`, `changePosition`, `changeTopbar`, `changeSidebarColor`, `changeSidebarSize`.
- Botón hamburguesa (`onToggleMobileMenu`): alterna `sidebar-enable`; ≥992 px alterna `lg`↔`sm`.

### 6.2 Topbar (`layouts/topbar`)

- `header#page-topbar` con `background-color:#0d121d`.
- Hamburguesa `fa fa-fw fa-bars` (`title="Menú"`, `aria-label="Abrir o cerrar menú"`).
- Pantalla completa `uil-minus-path` → `fullscreen()`.
- Comentados: buscador, idioma, apps, notificaciones, engrane de ajustes.
- Usuario: avatar **fijo** `https://transmovi.s3.us-east-2.amazonaws.com/imagenes/user_default.png` (fallback `assets/images/user_default.png`), nombre `nombre + apellidoPaterno` (`#e9edf6`, 15 px, 600), insignia de rol con `RolAccesoService.obtenerEtiquetaRol(user.rol)` (fondo `rgba(9,250,58,.18)`, borde `rgba(9,250,58,.45)`, texto `#7eff9f`, 11 px mayúsculas), chevron `uil-angle-down` `#09fa3a`.
- Dropdown: "Perfil Usuario" → `/contacts/profile`; "Cerrar sesión" (`HEADER.LOGIN.LOGOUT`) → `logout()` + `/account/login`.
- No muestra el logotipo del cliente.

### 6.3 Sidebar

- `menuItems = MENU` (sin filtro). MetisMenu, activación por `pathname`, scroll SimpleBar.
- Plantilla con `*ngIf="!item.permiso || hasPermission(item.permiso)"` en 3 niveles: **`permiso` no existe en `MenuItem` ni `hasPermission` en el componente** (nunca se evalúa).
- Colores: `.vertical-menu` `#0d121d`, `.navbar-brand-box` `#22252f`; items sin hijos `#ff1a5b`, subitems blancos; hover/activo `#e40041`; padre activo `#64001e`; fuente Poppins.
- Logos: `assets/images/icono.png` (sm), `logo.png` (lg dark), `fondo.png` (lg light).
- Iconos: clase base `bx` + nombre `uil-*`.

### 6.4 Footer y barra derecha

- Footer: "Copyright {año} © AuraNet. Todos los derechos reservados." (`#0d121d`, blanco, 0.9em).
- `rightsidebar` (Settings de Minible en inglés: Layout Mode, Width, Topbar, Sidebar Size/Color): **no se puede abrir** desde la UI actual.
- `horizontaltopbar`: demo Minible (usuario "Marcus", menú `MENUITEMS.*`).

---

## 7. Sistema visual

### 7.1 Paleta AuraNet

| Token | Hex | Uso |
|---|---|---|
| Fondo base | `#0d121d` | topbar, sidebar, footer, banners, modales, SweetAlert |
| Caja logo / gray-900 | `#22252f` | |
| Acento primario | `#e40041` | botones primarios, iconos de título, foco, asteriscos |
| Acento rosa | `#ff1a5b` | iconos, enlaces, inactivo, pines de mapa |
| Rojo oscuro | `#64001e` / `#ab0033` | padre activo menú / selección paginador |
| Azul secundario | `#6a8cff` | iconos `.btn-title`, foco de inputs, halo login |
| Input sleek | `#1e2832` / borde `#8996af` | |
| Éxito botón form | `#1f7a4d` (hover `#239b63`) | `.btn-alt--success` |
| Confirmación Swal | `#3085d6` (cancel `#d33`) | |
| Activo pill | `#0f2e22` / `#1f5c45` / `#34d399` | `.estatus-activo` |
| Inactivo pill | `#2a0a14` / `#7a1330` / `#ff1a5b` | `.estatus-inactivo` |
| Texto Swal | título `#ffffff`, cuerpo `#c7c7c7`; RolAcceso `#e2e8f0`/`#94a3b8`/`#cbd5e1` | |
| Lista validación | `#d9534f` (borde), `#caa8a8` (fondo), `#b02a37` (texto) | |
| Minible primary | `#5b73e8` (`$blue`) | tema Bootstrap |
| Semánticos Minible | green `#34c38f`, cyan `#50a5f1`, yellow `#f1b44c`, red `#f46a6a` | modales, montos |

### 7.2 Tipografías

- **IBM Plex Sans** (Minible, cargada desde Google Fonts) = fuente base.
- **Poppins**: usada en sidebar, banners, botones, campos, select boxes, auth… **nunca se carga** (depende del sistema).
- POS (`recarga`): Russo One, IBM Plex Mono, Barlow (importadas en su SCSS).
- Iconos: Font Awesome 5 Free (empaquetado, `fas`), FA 4.3/4.7 (CDN), Unicons (`uil-*`), MDI, Boxicons, Dripicons, Material Icons.

### 7.3 Componentes CSS globales (`src/styles.scss`)

**Banner de título (todas las pantallas de negocio):**

```
div.container-fluid [@fadeInRight]
 └ .title-banner-card.shadow-sm   (#0d121d, radio 18px, padding 25px, Poppins)
    └ .title-banner-content
       ├ izquierda: .title-icon (#e40041, radio 12, sombra rgba(255,45,117,.4)) + h4.title-title + p.title-subtitle
       └ derecha: .title-actions → .title-tagline (span.line + texto) + .title-buttons
```

- `.btn-title` (radio 12, icono `#6a8cff`): `--primary` fondo `#e40041`; `--danger` borde `rgba(228,0,65,.45)` e icono `#e40041`; `--ghost` y `--secondary` **no definidos** (se ven como base).
- `.btn-alt--success` `#1f7a4d`; `.btn-alt--cancel` `rgba(108,117,125,.25)`.
- **Campo sleek:** `label.field` → `span.field-label.text-white` → `div.input-sleek` (fondo `#1e2832`, borde inferior `#8996af`, icono `#e40041`) → `<i>` + `input.sleek-control` (texto `#fff`, placeholder `rgba(255,255,255,.45)`) + `span.sleek-line` (degradado `#6a8cff → #e40041` al foco).
- **`.dx-select-box-custom`** (50 px, fondo `rgba(13,18,29,.35)`, borde `rgba(108,117,125,.35)`, radio 14, padding izquierdo 44 px para icono FA en `#e40041`; foco `rgba(27,33,51,.65)` / borde `rgba(106,140,255,.7)`). Modificadores de icono: `-caja \f1b0`, `-monedero`/`-boveda \f555`, `-sala`/`-cliente \f1ad`, `-modulo \f3ed`, `-zona`/`-tipo-zona \f5fd`, `-tipo-caja \f466`, `-estatus \f205`, `-promocion-tipo \f06b`, `-turno \f017`, `-afiliado \f007`, `-tipo-id \f2c2`, `-sexo \f228`, `-es-principal \f005`, `-rol \f505`, `-maquina`/`-tipo-maquina \f1b9`, `-fabricante \f275`, `-moneda \f51e`.
- Overlays DevExtreme: `.dx-overlay-content` `rgba(13,18,29,.96)` + blur, `.dx-list-item` hover `rgba(228,0,65,.2)` / seleccionado `.3`, scrollbar `rgba(228,0,65,.55)`, `.dx-popup-wrapper { z-index:10000 }`, paginador seleccionado `#ab0033`.
- **`.btnAcciones`** (32×32, radio 8, `#1f2933`, icono `#cfd8e3`, hover `translateY(-2px)`), con color por id:

| id / clase | Fondo / borde / icono |
|---|---|
| `#actualizarButton` | `#1e293b` / `#334155` / `#60a5fa` |
| `#pinButton` (activar) | `#132e22` / `#1f4d3a` / `#34d399` |
| `#deleteButton` (desactivar) | `#3a0d1a` / `#7a1330` / `#ff1a5b` |
| `#mapButton` | `#2a1e0d` / `#4a3419` / `#f59e0b` |
| `#resumenButton` | icono `#8b5cf6` |
| `#historialButton` | icono `#0ea5e9` |
| `#bovedaAbiertaSalaButton` | `#1a2e1a` / icono `#4ade80` |
| `#eliminarTesoreriaButton` | `#2a0d0d` / icono `#ef4444` |
| `#cambiarEstatusButton` | `#2a0d1a` / `#5c1930` / `#f472b6` |
| `#reemplazarMonederoButton` | `#1e0d2a` / `#3d195c` / `#a855f7` |
| `#historialMonederoButton` | `#0d1e2a` / `#193d5c` / `#22d3ee` |
| `--monederos-consultar-saldo-grid` | `#0c1528` / `#1e3a8a` / `#93c5fd` |
| `--turno-detalle` / `--turno-resumen` / `--turno-movimientos` | `#a78bfa` / `#d946ef` / `#f87171` |
| `#reponerButton` / `#retirarButton` / `#suspenderTurnoButton` / `#corteParcialButton` | `#84cc16` / `#eab308` / `#94a3b8` / `#0ea5e9` |

- **Modales `.modal-holder`**: `.modal-content` `#0d121d`, borde `rgba(255,255,255,.1)`, radio 12; `.btn-close` invertido; `.modal-accion-header--*` con barra lateral de color (close `#f46a6a`, reponer/cargar `#34c38f`, retirar/descargar `#f1b44c`, estatus/consultar `#50a5f1`, abrir-turno `#34c38f`, cerrar-turno `#f1b44c`, reponer-turno `#20c997`, retirar-turno `#6f42c1`, suspender `#6c757d`, resumen-turno `#17a2b8`, movimientos-turno `#fd7e14`).
- **`.form-indication`**: `#50a5f1`, `--warning` `#f1b44c`, `--info` `#17a2b8`.
- Botones POS/turnos: abrir `#00acc1`, cerrar `#ff6d00`, descargar `#7c4dff`, consultar `#2979ff`, reponer `#00c853`, retirar `#ff9800`, suspender `#c62828`, reactivar `#009688`, corte `#673ab7`.

### 7.4 Tooltips `.aura-tooltip`

`.tooltip-inner` fondo `rgba(13,18,29,.98)`, texto `rgba(255,255,255,.95)`, borde `rgba(228,0,65,.55)`, peso 700, barra lateral de 3 px (`#e40041 → rgba(255,26,91,.55)`), brillo diagonal; flechas del color del fondo.

### 7.5 SweetAlert2 (convenciones observadas)

- Global: `.swal2-title` `#ffffff`, `.swal2-html-container` `#c7c7c7`.
- Casi todos: `background: '#0d121d'`, `confirmButtonColor: '#3085d6'`.
- Confirmación: icono `warning`, `showCancelButton`, `cancelButtonColor '#d33'`, "Confirmar"/"Cancelar".
- Éxito: "¡Operación Exitosa!" icono `success`. Error: "¡Ops!" o "¡Error!" icono `error`. Validación: "¡Atención!" / "¡Faltan campos obligatorios!".
- Excepciones: dashboard y perfil usan `confirmButtonColor '#e40041'`; eliminar tesorería usa confirm `#d33` / cancel `#6c757d`; cancelar autoexclusión usa `#c12a42` / `#6c757d`.

---

## 8. Animaciones

| Trigger / keyframe | Definición | Uso |
|---|---|---|
| `fadeInRight` (`core/fade-in-right.animation.ts`) | `:enter` `translateX(40px)`, opacity 0 → 0, 1 en `650ms cubic-bezier(0.4,0,0.2,1)` | Contenedor raíz de todas las pantallas de negocio y perfil |
| `slideDownFade` (`core/slide-down-fade.animation.ts`) | `:enter` opacity 0, `translateY(-15px)`, maxHeight 0 → 500px en `0.5s cubic-bezier(0.34,1.56,0.64,1)`; `:leave` 0.3s ease-in | POS (detalles, comprobante), perfil (panel contraseña) |
| `staggerFadeIn` | `query('.info-row')` stagger 100ms | registrado en recarga, sin uso |
| `previewModal` (`core/modal-animation.ts`) | `:enter` `scale(0.96) translateY(20px)` → normal 260ms; `:leave` 200ms | Modal de previsualización de documentos (clientes) |
| `hintSwap` (`core/animation-text.ts`) | 180ms | sin uso (replicado como keyframe CSS en usuarios/clientes) |
| `promoTabPanel` / `turnoTabPanel` | `* => *` opacity 0, `translateY(10px)` → 1, 0 en `260ms cubic-bezier(0.33,1,0.68,1)` | Pestañas de monederos, tesorería, promociones / turnos |
| `fadeOnChange`, `fadeInOut` | 160/120ms | signup |
| CSS `pulse-icon` | scale 1→1.05, 2s | icono del modal de mapa (salas) |
| CSS `pulse` | opacidad, 2s | placeholder de turnos en abrir-bóveda |
| CSS afiliados | `heroPulse`, `heroBadgePop`, `heroTitleFloat`, `confettiBurst`, `heroStarTwinkle`, `heroCountPulse`, `heroTodayBorder`, `heroTodayTitle`, `birthdayCardPulse`, `birthdayShine`, `birthdayChipPulse` | Panel de cumpleañeros |
| CSS POS | `vtScanSlide`, `vtTickerScroll`, `vtNeonPulse`, `vtCursorBlink`, `vtStepSlide`, `vtFirePulse`, `vtAccentPulse`, `vtShimmer` (+ `vtGoldSpin`, `vtOrnSpin`, `vtLogoPulse` sin uso) | Recarga |
| CSS dashboard | `dashPulse` 2s | punto pulsante |
| CSS monitoreo | `sweep` | chip "En vivo" |
| CSS perfil | `pulse-ring` 2s | anillo del avatar |
| CSS login | `slideUpFade 0.7s` | tarjeta de login |
| CSS usuarios/clientes | `hintSwap` 180ms | pista de contraseña |

---

## 9. Patrones transversales

### 9.1 Listado con `dx-data-grid` (patrón base)

- `CustomStore({ key: 'id', load })`: `take = loadOptions.take || 20`, `page = floor(skip/take)+1`, llama `servicio.obtenerXData(page, take)`; lee `resp.data` y `resp.paginated.{total,page,lastPage}` (fallback `resp.total/page/pages`); devuelve `{ data, totalCount }`.
- Opciones: `[remoteOperations]="{ paging: true }"`, `pageSize 20`, pager `allowedPageSizes: [20]`, `infoText: 'Página {0} de {1}'` (+ `<dxo-pager>` duplicado), `columnHidingEnabled`, `showBorders`, `showColumnLines`, `showRowLines`, `rowAlternationEnabled`, `keyExpr 'id'`, `width 100%`.
- `<dxo-search-panel [visible]="true" [width]="200" placeholder="Buscar...">`, `<dxo-group-panel emptyPanelText="Arrastre un encabezado de columna aquí para agrupar por esa columna">`, `filter-row` y `header-filter` visibles, `<dxo-export [enabled]="false">` (sin exportación en ningún grid).
- **Búsqueda propia** (`onGridOptionChanged` sobre `searchPanel.text`): filtra en memoria solo la página actual (`paginaActualData`) y reemplaza el dataSource por un arreglo; texto vacío restaura el `CustomStore`. Filtros/orden no se envían al backend.
- Botones de cabecera: **Nuevo** (`fas fa-plus`, `btn-title--primary`, `agregar()`), **Contraer Grid** (`fas fa-expand`, `btn-title--ghost`, `toggleExpandGroups()`), **Restablecer** (`fas fa-sync-alt`, `btn-title--danger`, `limpiarCampos()` = `clearGrouping`, `pageIndex(0)`, `refresh`).
- `toggleExpandGroups()` sin agrupación → Swal "¡Ops!" "Debes arrastrar un encabezado de una columna para expandir o contraer grupos." (`allowOutsideClick:false`). En varios grids `autoExpandAll` está fijo en `true` y el botón no tiene efecto (usuarios, clientes, bitácora, monederos, tesorería, transacciones).
- Columna **Acciones** (`cellTemplate`): Editar (`#actualizarButton`, `fa fa-edit`), Activar (`#pinButton`, `fa fa-arrow-up`, si `estatus === 0`), Desactivar (`#deleteButton`, `fa fa-arrow-down`, si `estatus === 1`), con `ngbTooltip` y spinner `fa-spinner fa-spin` mientras procesa (`procesandoEstatusXId`).
- Columna **Estatus** (`cellTemplate="est"`): `span.estatus.estatus-activo` "Activo" / `estatus-inactivo` "Inactivo".

### 9.2 Activar / desactivar

1. Swal "¡Activar!"/"¡Desactivar!", `html` "¿Está seguro que requiere activar/desactivar el <entidad>: <strong>nombre</strong>?", `warning`, Confirmar/Cancelar.
2. `servicio.updateEstatus(id, 1|0)` (PATCH, `responseType: 'text'`) con `finalize`.
3. Éxito "¡Confirmación Realizada!" + "El <entidad> ha sido activado/desactivado." → `setupDataSource()` + `refresh()`.
4. Error "¡Ops!" con `${error}` (se ve `[object Object]`).

### 9.3 Formulario de alta/edición

- Reactive `FormGroup` con `FormBuilder`; la misma pantalla sirve para editar leyendo `:idX` de la ruta (título "Agregar X" / "Actualizar X", botón "Guardar" / "Actualizar", "Cargando..." / "Guardando..." al enviar).
- Secciones `.form-section` con `.section-header` (`.section-icon` degradado `rgba(228,0,65,.2)` e icono `#ff1a5b`, `h5.section-title` Poppins 18px, `.section-line`) en clientes, salas, máquinas, afiliados.
- Sin mensajes inline por campo (excepto perfil); validación vía Swal "¡Faltan campos obligatorios!" con lista numerada (`#d9534f`/`#caa8a8`/`#b02a37`). El servicio `FormularioValidacionSwalService` existe pero solo lo usa `agregar-afiliado`; el resto duplica el HTML.
- Pie: `btn-alt--success` (`fas fa-check`, `{{submitButton}}`) + `btn-alt--cancel` (`fas fa-times`, "Cancelar" → lista).
- Éxito: Swal + navegación a la lista.

### 9.4 Uploader de archivos a S3 (`.pf-uploader`)

- Clic o arrastrar/soltar (máquinas solo clic), preview de imagen o icono PDF, badge de tamaño, botones "Reemplazar" (`fa-sync-alt`) y "Eliminar" (`fa-trash`).
- Subida inmediata con `UsuariosService.uploadFile` → `POST /s3/upload` (FormData `file`, `folder`, `idModule`); URL de `res.url ?? res.Location ?? res.data.url`.

| Pantalla | `folder` | `idModule` | Archivos (límite) |
|---|---|---|---|
| Clientes | `clientes` | `1` | Logotipo (5 MB, exactamente 707×353 px), Constancia, Comprobante, Acta (3 MB, imagen/PDF) |
| Usuarios | `usuarios` | `2` | Foto de perfil (3 MB) |
| Salas | `salas` | `6` | Logotipo (3 MB), Licencia (5 MB), Plano arquitectónico y de distribución (3 MB) |
| Afiliados | `afiliados` | `6` | Identificación frente (5 MB, imagen/PDF), Foto de perfil (5 MB) |
| Máquinas | `maquinas` | `8` | Imagen e icono (5 MB, png/jpg/webp) |

### 9.5 Montos (`shared/utils/monto-input-formato.util.ts`)

- Input de texto **sin `formControlName`** (`#inpX`, `inputmode="decimal"`, placeholder "0.00"), eventos `(input)`/`(blur)`.
- `extraerNumericaEditableMonto` (dígitos y un punto, máx. 2 decimales, sin negativos), `vistaMontoDesdeNorm` (`$1,234.5` mientras escribe, `en-US`), `vistaMontoDesdeNumero` (al salir: `$1,234` o `$1,234.50`), `aplicarMontoInputEnCampo`, `aplicarMontoBlurEnCampo`, `textoMontoDesdeValorControl`.
- Usado en: agregar-caja, agregar-maquina, agregar-afiliado, lista-monederos, lista-tesoreria, abrir-boveda, agregar-tesoreria, lista-turnos, abrir-turno, agregar-promocion. El POS (`recarga`) tiene su propia máscara (`es-MX`).

### 9.6 Fechas

- `dx-date-box type="date"`, `displayFormat` y `dateSerializationFormat` `yyyy-MM-dd`, `[inputAttr]="dateBoxAttr('campo')"` con `dxDateBoxInputAttr` (anti-autocompletado de Chrome). Usado en salas, máquinas y bloqueo de afiliados.
- `input type="date"` nativo en afiliados (nacimiento/vigencia), dashboard, promociones, tesorería (agregar).

### 9.7 Cascadas y cliente por defecto

- Cliente → salas (`GET /salas/by-cliente/{id}`) → zonas (`GET /zonas/by-sala/{id}`) en zonas y máquinas; sala en solo lectura hasta elegir cliente.
- `RolAccesoService.obtenerIdClientePorDefectoFormulario()` precarga `idCliente` en altas (salas, zonas, máquinas); no aplica a SA (1) ni Dev (2).
- Cajas no tiene cascada (zonas completas de `/zonas/list`).

---

## 10. Roles y permisos

### 10.1 Qué existe

| Mecanismo | Estado |
|---|---|
| `AuthGuard` | Solo verifica sesión |
| `RolAccesoService` (`shared/services/rol-acceso.service.ts`) | **Único control por rol activo**, en acciones concretas |
| `sessionStorage.permissions` (ids de `idPermiso`) | Se guarda, no se evalúa en UI |
| `HasPermissionDirective` (`[appHasPermission]`) | No declarada en ningún módulo, sin uso |
| `NgxPermissionsModule` | Registrado; `loadPermissions` comentado; `NgxPermissionsService` inyectado sin uso en listas de administración |
| Menú (`hasPermission`, `permiso`) | No existe; menú sin filtrar |
| `entities/Enums/permiso.enum.ts` | Ids `"1"`–`"133"` (Clientes 1–4, Usuarios 5–8, Roles 9–12, Permisos 13–16, Módulos 17–20, Bitácora 85, Monederos 77–80, Transacciones 90–91, POS 99, Dashboard 100, Monitoreo 101 + legado transporte); sin entradas para salas, zonas, máquinas, cajas, afiliados, tesorería, turnos, promociones; sin uso |

### 10.2 Catálogo de roles (`ROLES_CATALOGO`)

`'1'` SA · `'2'` Dev · `'3'` Cliente · `'4'` Administrador · `'5'` Gerente · `'6'` Sub-Gerente · `'7'` Cajero · `'8'` Recepcionista.

### 10.3 Acciones (`AccionConControlRol`) y dónde se validan

| Acción | Roles | Dónde se valida en el código |
|---|---|---|
| `gestionarCajasCliente` | 3 | `agregar-caja` al guardar (usa `esPerfilClienteLogueado()`) |
| `registrarAfiliado` | 3 | `agregar-afiliado.guardar()` (usa `esPerfilClienteLogueado()`, tras validar el form) |
| `actualizarNivelVipAfiliado` | 5 | lista-afiliados: abrir y confirmar modal VIP |
| `verCumpleanerosAfiliados` | 1,2,3,4 | lista-afiliados: abrir y confirmar cumpleañeros |
| `bloquearAfiliado` | 5 | lista-afiliados: abrir/confirmar bloqueo **y desbloquear** |
| `registrarAutoexclusionAfiliado` | 5 | lista-afiliados: abrir/confirmar |
| `cancelarAutoexclusionAfiliado` | 1,2,3,4 | lista-afiliados |
| `abrirTesoreriaDelDia` | 3,4,5,6 | lista-tesoreria (antes de navegar) y abrir-boveda (al guardar) |
| `cerrarTesoreriaDelDia` | 3,4,5,6 | lista-tesoreria: cerrar **y también reponer/retirar bóveda** |
| `reponerEfectivoTurno`, `retirarEfectivoTurno`, `suspenderTurno`, `reactivarTurno`, `corteParcialTurno` | 5,6,7 | lista-turnos: `asegurarRolOperacionTurno()` al abrir y al guardar |
| `registrarPromocion` | 3,4 | agregar-promocion `submit()` |
| `descargarEfectivoMonedero` | 7 | lista-monederos: abrir y guardar descarga |
| `ajustarSaldoMonedero` | 1–6 | lista-monederos: abrir y guardar ajuste |

Otros helpers: `obtenerEtiquetaRol`, `obtenerRolUsuarioLogueado` (`String(user.rol)`), `esRolSinClientePorDefectoEnFormularios` (1, 2), `obtenerIdClientePorDefectoFormulario`, `esPerfilClienteLogueado` (`rol === '3'`), `mostrarAccesoSoloPerfilCliente('cajas'|'sucursales'|'afiliados')` (usado en salas con `'sucursales'`), `puedeRealizarAccion(accion, rol)`, `obtenerTextoRolesAutorizados`, `mostrarAccesoDenegado(accion)`.

`mostrarAccesoDenegado`: Swal `warning`, título "¡<Título En Formato Título>!", HTML centrado con subtítulo (`#e2e8f0`), "Roles Que Sí Pueden Realizar Esta Acción:" (`#94a3b8`) y `<ul>` de roles (`#cbd5e1`), `background '#0d121d'`, `color '#e2e8f0'`, botón "Entendido" `#3085d6`.

### 10.4 Acciones sin control de rol (estado actual)

Todo Administración (módulos, permisos, roles, usuarios, clientes, bitácora), zonas, máquinas, distribución de sala, listado de salas y cajas, editar/activar/desactivar afiliados, traspaso/cambio de estatus/reemplazo/alta de monederos, abrir y cerrar turno, eliminar/agregar tesorería, POS completo (incluida descarga), transacciones, consultas de promociones (incl. `cron/expirar`), dashboard (selector de cualquier cliente), monitoreo, perfil.

---

## 11. Módulos de negocio

### 11.1 Tablero — `/dashboard`

- **Vista (`default.component.html`)**, raíz `.casino-dashboard [@fadeInRight]` con fondos `.dash-bg` / `.dash-grid-glow`:
  1. Hero: badge "Tablero" con punto `.dash-pulse`, H1 "**Casino** · Resumen operativo", subtítulo, chips de periodo (`fa-calendar-alt`) y granularidad (`fa-layer-group`); tarjetas glass "Ingreso bruto" (`ggr`, sub "Ingreso neto {ngr}") y "Efectivo neto" (`netCashFlow`, verde `#00c853` / naranja `#ff6d00`, "Actualizado {fecha}").
  2. Filtros (`glass-panel`): presets "Hoy", "Semana actual", "Mes actual" (`btn-action-large btn-boveda-abrir`), `input date` Inicio/Fin, `select` Cliente, botón "Aplicar" / "Cargando…".
  3. Alcance: "Cliente base … · Incluye N cliente(s): ids".
  4. KPIs: GGR, NGR, bloque apilado (Apuestas, Ganancias pagadas, Bonos, Bonos/ingreso bruto %), 6 compactos (Jugadores activos, Nuevos afiliados, Sesiones, Duración media min, Ingreso medio por usuario, Promedio diario de jugadores), fila ancha (Depósitos, Retiros, Pico diario) y "Flujo de efectivo neto".
  5. Inferior: "Tendencia de ingresos" (`dx-chart`), "Top máquinas por apuestas", "Promociones por estatus".
- **Formulario** `filterForm` { fechaInicio, fechaFin, idCliente } sin validadores; inicia en semana actual (lunes-domingo). `filtroApi`: 0 manual, 1 hoy, 2 semana (inicial), 3 mes.
- **Métodos:** `cargarClientes()` (`GET /clientes/list`), `resolverIdCliente()` (sesión, fallback **1**), `cargarKpis()` (`POST /dashboard/kpis` `{fechaInicio, fechaFin, filtro, idCliente}`), formateadores `es-MX`/MXN, `textoFilaGenerica`.
- **Error:** Swal "Error", `confirmButtonColor '#e40041'`.
- **Estilos:** acento `#e40041`, tonos KPI (cyan `#00acc1→#26c6da`, sky `#50a5f1`, teal `#0d9488`, indigo `#2979ff`, amber `#d97706`, rose `#e40041→#f43f5e`), `.glass-panel` blur 20px.
- Modelo: `dashboard-kpis.model.ts` (ver contrato).

### 11.2 Módulos — `/modulos`

- Lista: icono `fas fa-archive`, "Apartado de Módulos" / "Administra los componentes activos del sistema". Columnas: Acciones (150), Nombre, Estatus. `autoExpandAll` enlazado (Contraer Grid funciona).
- Form `moduloForm`: `nombre` [required] (`fas fa-user`, "Nombre completo"), `descripcion` [required] (`fas fa-align-left`).
- API: `GET /modulos/{page}/{size}`, `GET /modulos/list`, `POST /modulos`, `GET|PUT|DELETE /modulos/{id}`, `PATCH /modulos/{id}/estatus`.
- `actualizar()` no hace `return` tras el Swal de inválido.

### 11.3 Permisos — `/permisos`

- Lista: `fas fa-lock`, "Apartado de Permisos". Toolbar con groupPanel, exportButton "Exportar Grid" (sin efecto), searchPanel. Columnas: Acciones, Id, Nombre, Descripción, Módulo (`modulo.nombre`), Estatus.
- Form `permisoForm`: `idModulo` [required] (`dx-select-box` `/modulos/list`, "Selecciona un módulo...", `dx-select-box-modulo`), `nombre` [required], `descripcion` [required]. Payload `{ idModulo:number, nombre, descripcion }`.
- API: `GET /permisos/{page}/{size}`, `GET /permisos/permisosAgrupados`, `POST /permisos`, `GET|PUT|DELETE /permisos/{id}`, `PATCH /permisos/{id}/estatus`.

### 11.4 Roles — `/roles`

- Lista: `fas fa-key`, "Administración de Roles" / "Configura los niveles de acceso del sistema". Columnas: Acciones (180), Nombre, Descripción, Estatus.
- Form `rolForm`: `nombre`, `descripcion` [required].
- API: `GET /roles/{page}/{size}`, `GET /roles/list`, `POST /roles`, `GET|PUT|DELETE /roles/{id}`, **`PATCH /roles/estatus/{id}`**.

### 11.5 Usuarios — `/usuarios`

- Lista: `fas fa-users`, "Administración de Usuarios". `keyExpr 'Id'` (store `id`). Columnas: Acciones, Imagen (`FotoPerfil`, default `https://auranet.s3.us-east-2.amazonaws.com/general/user_default.png`), Nombre (`NombreCompleto`), Teléfono, Correo (`UserName`), Cliente (oculta, `showCliente` indefinido), Rol (`RolNombre`), Estatus.
- Form `usuarioForm` (validador de grupo `passwordsMatchValidator` → `passwordMismatch`):

| Control | Validadores | UI |
|---|---|---|
| nombre | required | "Nombre" |
| apellidoPaterno / apellidoMaterno | — | |
| userName | required, email | "Correo Electrónico" (solo alta) |
| telefono | required | maxlength 10, solo números |
| idRol | — | dx-select `/roles/list` (`dx-select-box-rol`) |
| idCliente | required | dx-select `/clientes/list` |
| idSala | — | dx-select `/salas/list` |
| passwordHash / confirmPassword | required (solo alta) | con ojo; pistas de fortaleza (`#25d366` ok / `#ff3b5c` bad) |
| fotoPerfil | — | uploader S3 |
| permisosIds | — | chips por módulo |

- Sección **Permisos**: "Asigna permisos por módulo para este usuario."; tarjetas `.perm-module` (grid 3/2/1 columnas), switch por módulo `.perm-mod-toggle` (encendido degradado `#ff1a5b → #e40041`), chips `.perm-chip` (`is-on` borde `#ff1a5b`); fuente `GET /permisos/permisosAgrupados`.
- Alta: `POST /usuarios` `{ userName, passwordHash, nombre, apellidoPaterno, apellidoMaterno, telefono, fotoPerfil, idRol, idCliente, idSala, permisosIds }`; sin permisos → Swal "¡Faltan permisos!".
- Edición: `PATCH /usuarios/{id}` sin userName; `idSala` solo si cambió; contraseña oculta.
- API: `GET /usuarios/list`, `/usuarios/{page}/{size}`, `/usuarios/{id}`, `/usuarios/list/cliente/{idCliente}/rol`, `POST /usuarios`, `PATCH /usuarios/{id}`, `PATCH /usuarios/estatus/{id}`, `PATCH /usuarios/actualizar/contrasena/{id}`, `DELETE /usuarios/{id}`, `POST /s3/upload`.

### 11.6 Bitácora — `/bitacora`

- `fas fa-list-ol`, "Registro de Actividad". Sin botón Nuevo. Columnas: Módulo (200), Acción (`accionTexto`: CREATE→Crear, UPDATE→Actualizar, DELETE→Eliminar), Usuario (`UserNameUsuario`), Descripción, Fecha (`dd/MM/yyyy HH:mm:ss a` en UTC).
- API: `GET /bitacora/{page}/{size}`, `GET /usuarios/list` (mapa de usuarios).

### 11.7 Clientes — `/clientes`

- Lista: `fas fa-users`, "Directorio de Clientes". Columnas: Acciones, Constancia Situación Fiscal / Comprobante de Domicilio / Acta Constitutiva (botón "Ver Documento" `btn-warning|success|primary` o "Sin documentos"), Nombre, Teléfono, RFC, Correo, Tipo Persona ("Físico"/"Moral"), Estatus.
- **Modal de previsualización propio** (`.preview-backdrop [@previewModal]`): iframe PDF o imagen, "Cerrar", "Abrir en otra pestaña", cierre con Esc.
- Form (4 secciones):
  - Información General: `idPadre` (dx-select "Cuenta Padre"), `rfc` [required + minlength/maxlength 12 en HTML], `tipoPersona` [required] (1 Física / 2 Moral), `nombre` [required] ("Razón Social" si moral), `apellidoPaterno` [required si física], `apellidoMaterno`, `telefono` [required, 10], `correo` [required, email], `sitioWeb`.
  - Dirección: `estado`, `municipio`, `colonia`, `calle`, `numeroExterior`, `cp` [required, 5]; `entreCalles`, `numeroInterior`.
  - Encargado: `nombreEncargado`, `telefonoEncargado`, `correoEncargado` [required].
  - Documentos: logotipo, constancia, comprobante, acta (ver §9.4).
- Validación: Swal "Revisa el formulario" con mensajes por error.
- API: `GET /clientes/list`, `/clientes/{page}/{size}`, `/clientes/{id}`, `POST /clientes`, **`PUT /clientes/{id}`**, `PATCH /clientes/estatus/{id}`, `DELETE /clientes/{id}`. Persona moral envía apellidos como string `'null'`.

### 11.8 Salas — `/salas`

- Lista: `fas fa-building`, "Administración de Salas". Columnas: Acciones (260), Nombre, Nombre Comercial, Descripción, Dirección, País, Estado, Municipio, Colonia, Calle, N° Ext/Int, CP, Referencias, Metros², Niveles, Capacidad, Vencimiento Licencia, Inicio/Fin Contrato (`dd/MM/yyyy`). Sin columna de estatus.
- Acciones: Editar, **Distribución** (`fa fa-th-large` → `/salas/distribucion/{id}`), **Mapa** (`fa fa-map-marker-alt` → Swal con Google Map), Activar/Desactivar.
- Form `salaForm` (secciones Información General, Dirección del Lugar, Datos del Lugar, Licencia y Contrato, Documentos): único obligatorio `idCliente`; `pais` fijo `'MEX'`; numéricos con `allowOnlyNumbers`; fechas `dx-date-box`; `idMonedaPrincipal` (`/catmonedas/list`), `idEstatusLicencia` (`/catestatuslicencia/list`); `latitud/longitud` con 8 decimales.
- Flujo: `submit()` valida → abre Swal de mapa "Selecciona la ubicación del lugar" (clic coloca marcador arrastrable; "Guardar" deshabilitado hasta elegir) → `confirmarUbicacion()` valida rol (`esPerfilClienteLogueado`, si no `mostrarAccesoSoloPerfilCliente('sucursales')`) → `POST /salas` o `PATCH /salas/{id}` → tras alta, Swal "¿Configurar distribución?" ("Ir a distribución" / "Volver al listado").
- API: `GET /salas/list`, `/salas/{page}/{size}`, `/salas/{id}`, `/salas/by-cliente/{id}`, `POST /salas`, `PATCH /salas/{id}`, `PATCH /salas/estatus/{id}`, `DELETE /salas/{id}`, `GET|PATCH /layout/mapa/{idSala}`, catálogos.
- Estilos: modal de mapa `.map-modal-popup` (degradado oscuro, borde `rgba(255,26,91,.15)`, radio 20, responsive 900px/98vw/pantalla completa), pin SVG `#ff1a5b`.

### 11.9 Distribución de sala (editor de plano) — `/salas/distribucion/:idSala`

- `DistribucionSalaComponent extends AgregarZonaComponent` y reutiliza su plantilla con `modoDistribucionSala = true`.
- Carga: `GET /salas/{id}` (subtítulo "Sala: nombre"), `GET /maquinas/by-sala/{id}`, `GET /zonas/by-sala/{id}`, `GET /layout/mapa/{id}`.
- `.plano-card` "Plano de Distribución": desplegables personalizados `.select-sleek` de máquinas ("Agregar máquina") y zonas ("Zonas de la sala"), botón "Limpiar" (`fa-broom`), zoom (−, %, +, centrar). Botones Entrada/Salida comentados.
- Lienzo `#stage`: pan con arrastre, zoom con rueda, guías de ajuste, cuadrícula 10; zonas con 8 asas de redimensión; máquinas con imagen `assets/maquinas/*.png` (VideoPoker, VideoSlot, RuletaElectronica, BlackJacElectronico, Keno, Tragamonedas), tooltip (nombre editable, nº serie, estado, girar, centrar, eliminar); puertas Entrada (rosa) / Salida (verde) con rotación; minimapa; Delete/Backspace borra zona seleccionada.
- Guardar: `PATCH /layout/mapa/{idSala}` con `areaPoligonoJson` (ver contrato); solo persiste posiciones (`id,x,y` máquina; `id,x,y,w,h` zona).
- Estilos: `.plano-card` degradado oscuro, acentos rosa `rgba(255,26,91,…)` y cian `rgba(0,209,255,…)`, zonas con borde `rgba(255,138,178,.98)`.

### 11.10 Zonas — `/zonas`

- Lista: "Administración de Zonas". Columnas: Acciones, Nombre, Descripción, Tamaño (`alto x ancho mts`), Área (m²), Cap. Personas, Cap. Máquinas, Sala, Tipo Zona, Estatus.
- Form `zonaForm`: `nombre`, `idTipoZona` (`/cattiposzona/list`), `idCliente`, `idSala` (cascada, solo lectura sin cliente), `anchoMetros`, `altoMetros` [required]; `descripcion`, `nivel`, `areaMetrosCuadrados`, `capacidadMaximaPersonas`, `capacidadMaximaMaquinas`, `areaPoligonoJSON` (oculto).
- Payload sin `idCliente`. API: `GET /zonas/list`, `/zonas/{page}/{size}`, `/zonas/by-sala/{id}`, `/zonas/{id}`, `POST /zonas`, `PATCH /zonas/{id}`, `PATCH /zonas/estatus/{id}`, `DELETE /zonas/{id}`.
- `lista-zonas.component.scss` referenciado en `styleUrl` **no existe**.

### 11.11 Máquinas — `/maquinas`

- Lista: `fas fa-cogs`. Columnas: Acciones, Número de Serie, Nombre, Marca, Modelo, Zona, Sala, Cliente, Tipo Máquina, Fabricante, Estatus (texto catálogo), Próximo Mantenimiento, Den. Mínima/Máxima, % Pago, Dirección IP, MAC.
- Form (secciones Información General, Ubicación, Fechas y Costos, Visualización y denominación, Mantenimiento y Red, Imágenes): obligatorios `numeroSerie`, `idTipoMaquina`, `idFabricante`, `idEstatusMaquina`, `idCliente`, `idSala`; resto opcional (`idZona`, fechas, `costoAdquisicion`, `mostrarNombre/mostrarNumero` Sí/No, `porcentajePago`, denominaciones, `direccionIP`, `mac`, `observaciones`, imágenes).
- Inválido: Swal "¡Campos incompletos!" genérico.
- API: `GET /maquinas/list`, `/maquinas/{page}/{size}`, `/maquinas/by-sala/{id}`, `/maquinas/{id}`, `POST /maquinas`, `PATCH /maquinas/{id}`, `PATCH /maquinas/estatus/{id}`, `DELETE /maquinas/{id}`, catálogos `/cattiposmaquina/list`, `/catfabricantes/list`, `/catestatusmaquina/list`.
- `lista-maquinas.component.scss` referenciado **no existe**.

### 11.12 Cajas — `/cajas`

- Lista: `fas fa-cash-register`. Columnas: Acciones, Estatus Caja (pill por código/id: ABIERTA/2 `--abierta` verde, CERRADA/1 gris, SUSPENDIDA/3 ámbar, MANTENIMIENTO/4 azul, DISPONIBLE/5 índigo, otro cian), Código, Nombre, Descripción, Sala, Zona, Tipo Caja, Límite Efectivo (`currency`), Requiere Arqueo, Estatus.
- Form `cajaForm`: `nombre`, `idSala`, `idZona`, `codigo` ("CAJA-001"), `idTipoCaja` [required]; `limiteEfectivo` (monto), `requiereArqueo` (No/Sí), `descripcion`.
- Guardar: valida form → `esPerfilClienteLogueado()` o `mostrarAccesoDenegado('gestionarCajasCliente')` → `POST /cajas` / `PATCH /cajas/{id}` con `idEstatusCaja: 2` fijo; textos vacíos → `'Sin registro'`.
- API: `GET /cajas/list`, `/cajas/{page}/{size}`, `/cajas/{id}`, `POST /cajas`, `PATCH /cajas/{id}`, `PATCH /cajas/estatus/{id}`, `DELETE /cajas/{id}`, `/cattiposcaja/list`, `/catestatuscaja/list`.

### 11.13 Afiliados — `/afiliados`

- **Lista** (`fas fa-users`, "Gestión de Afiliados"): tarjeta "Vistas del listado" con "Solo inactivos" (`#6c757d`) y "Cumpleañeros" (`#f1b44c`); modos `paginado | inactivos | cumpleaneros | buscar`.
- Panel destacado de cumpleañeros (aurora, estrellas, confeti; "Celebraciones de hoy" / "Agenda De Celebraciones Del Mes").
- Grid: Acciones (350), Nombre Completo (chips "Cumple hoy/este mes", edad), Número Identificación, Estatus Afiliado (pill: activo `#bbf7d0`, bloqueado `#fde68a`, suspendido `#fecaca`, cerrado `#e5e7eb`, autoexcluido `#ddd6fe`), Email, Teléfono, Sexo, Fecha Nacimiento, Sala, Tipo Identificación, Estatus, Fecha Creación/Actualización.
- Acciones por fila: Editar, Resumen (`fa-id-card`), Monederos (`fa-wallet`), Nivel VIP (`fa-crown`), Bloquear (`fa-ban`) / Desbloquear (`fa-unlock`), Registrar autoexclusión (`fa-hand-paper`) / Cancelar autoexclusión (`fa-calendar-times`), Activar / Desactivar.
- **Modales NgbModal** (`centered`, `backdrop:'static'`): Filtros (inalcanzable), Resumen (xl, saldos/actividad/promociones/juego responsable), Monederos (lg, tabla), Cumpleañeros (md, tarjetas Hoy/Mes), Bloquear (motivo + fecha fin `dx-date-box` min hoy), Autoexclusión (motivo, duración ≥30 días, observaciones), Nivel VIP (select `/catnivelesvip/list` + motivo).
- **Alta/edición** (9 secciones): obligatorios `idSala`, `idTipoIdentificacion`, `numeroIdentificacion`, `nombre`, `apellidoPaterno`, `fechaNacimiento`, `sexo` (M/F), `idEstatusAfiliado`; `email` con validador opcional; CURP (18), RFC (13), teléfono (10), domicilio, contacto de emergencia (parentesco fijo), `idNivelVIP`, límites de apuesta/retiro (monto), `aceptaPromociones`/`aceptaEmail` Sí/No, observaciones, archivos. Validación con `FormularioValidacionSwalService`.
- API: ver contrato (`/afiliados/*`, `/cat*`).

### 11.14 Monederos — `/monederos`

- Lista (`fas fa-wallet`, "Administración de Monederos") con "Centro de Operaciones" y 2 pestañas (`promoTabPanel`): **Consultas y ajustes** (inicial: Consultar Saldo, Monederos por Afiliado, toggle "Ampliar por estatus" → `?todos=true`) y **Movimientos de saldo** (Descargar Efectivo, Traspasar Saldo, Ajustar Saldo).
- Grid: Acciones (270), Número Monedero, Estatus Monedero (pill: activo, bloqueado, extraviado, robado, reemplazado, cancelado), Código RFID, Alias, Afiliado, Es Principal, Estatus.
- Acciones por fila: Editar, Historial (`fa-history`), Consultar saldo (`fa-search-dollar`), Cambiar estatus (`fa-exchange-alt`), Reemplazar (`fa-sync-alt`).
- Modales: Descargar (caja con turno activo + monedero + monto), Cambiar estatus (excluye BLOQUEADO/REEMPLAZADO; confirmación extra si CANCELADO), Historial, Ajuste (monedero, Agregar/Quitar, tipo de saldo, monto, justificación), Reemplazar (número nuevo, motivo, "¿Transferir saldo al monedero nuevo?"), Consultar saldo (formulario o directo desde fila; saldos efectivo `#34c38f`, promocional `#50a5f1`, puntos `#f1b44c`, total `#5b73e8`, redimible `#f46a6a`, promociones activas con barra de progreso), Traspaso (afiliado → caja con turno → origen/destino → monto), Monederos por afiliado; Cargar (inalcanzable).
- Alta/edición: `idAfiliado`, `numeroMonedero`, `idEstatusMonedero` (solo ids 1 y 2) [required]; `codigoRFID`, `esPrincipal` (se bloquea en No si el afiliado ya tiene principal), `alias`.
- API: ver contrato (`/monederos/*`, `/pos/monederos/*`, `/pos/turnos/activos?idSala=`).

### 11.15 Bóveda (tesorería) — `/tesoreria`

- Lista (`fas fa-wallet`, "Administración de Boveda"; Nuevo comentado). Centro de Operaciones con pestañas **Apertura y cierre** (Abrir Bóveda `#0d9488`, Cerrar Bóveda `#e11d48`) y **Efectivo en bóveda** (Reponer `#2563eb`, Retirar `#d97706`).
- Grid: Acciones (340), Estatus Boveda (color del backend), Sala, Fecha, Fondo Inicial, Fondo Contado, Fecha/Usuario Apertura, Fecha/Usuario Cierre, Estatus (+ ocultas). Acciones: Bóveda abierta de la sala (`fa-door-open`), Resumen (`fa-chart-line`), Historial (`fa-history`), Eliminar (`fa-trash-alt`).
- Catálogo UI de estatus: 1 ABIERTA `#22c55e`, 2 CERRANDO `#f59e0b`, 3 CERRADA `#6b7280`.
- Modales: Resumen, Bóveda abierta de la sala, Historial, Cerrar (bóveda abierta + fondo contado + observaciones), Reponer / Retirar (bóveda + monto + referencia + observaciones).
- **Abrir bóveda** (`/tesoreria/abrir-boveda`): `idSala`, `fondoInicial` [min 0.01], `observaciones`, FormArray `turnosAbrir` (≥1: `idCaja`, `fondoInicial` [min 0.01], `idUsuario` opcional), cajas filtradas por sala y estatus (1, 2, 5 o DISPONIBLE); validaciones con Swal `info` ("Elige la sala", "Dinero de la bóveda", "Faltan turnos de caja", "Revisa la caja", etc.).
- API: ver contrato (`/tesorerias/*`).

### 11.16 Ap. Turnos — `/turnos`

- Lista (`fa-clock`, "Administración de Turnos") con 5 pestañas (`turnoTabPanel`): **Mi turno y activos** (Consultar mi turno, Ver turnos activos con chip "N en curso"), **Apertura y cierre** (Abrir `#00acc1`, Cerrar `#ff6d00`), **Efectivo en caja** (Reponer `#00c853`, Retirar `#ff9800`), **Suspender / Reactivar** (`#c62828` / `#009688`), **Corte y reporte** (Corte parcial X `#673ab7`).
- Grid: Acciones (Detalle, Resumen y saldos, Movimientos), Estatus Turno (color backend), Cliente, Caja (badge), Fondo Inicial (verde), Fondo Cierre (azul), Fondo Contado (ámbar), Diferencia (Favorable/Desfavorable), Fechas, Ops, Usuario, Estatus.
- Modales de consulta: Turnos activos, Mi turno (ficha reutilizable), Detalle, Resumen, Movimientos.
- Modales de acción: Abrir (caja, estatus turno, bóveda, fondo inicial), Cerrar (caja, fondo contado, observaciones), Reponer / Retirar (caja, monto, motivo), Suspender (caja, motivo, efectivo contado), Reactivar (caja, observaciones), Corte parcial (caja, efectivo contado, observaciones; muestra resultado).
- Filtros avanzados comentados en HTML (lógica viva). No hay conteo de denominaciones, impresión de tickets ni "Corte Z" explícito.
- API: ver contrato (`/pos/turnos/*`).

### 11.17 Transacciones — `/transacciones`

- `fas fa-exchange-alt`, "Transacciones" / "Historial y consulta de movimientos financieros del sistema". Solo "Contraer Grid" y "Restablecer".
- Grid de solo lectura (columnas **sin `dataField`**): Monto (Ingreso/Egreso con color), Contexto, Origen, Destino, Usuario, Fecha Movimiento, Tipo Movimiento, Tipo Saldo, Concepto, UUID (+ ocultas: IDs, Referencia, Requiere Autorización, IP). Badges de color por tipo.
- API: `GET /ledger/{page}/{limit}` (resto del servicio sin uso: saldo monedero/caja, historial monedero).
- SCSS con `::ng-deep` global sobre celdas de `dx-datagrid`.

### 11.18 POS — `/recarga`

- Tema "vt-" (fondo `#07090d`, acento `#ff1a5b`, neón `#00ffaa`): header "SISTEMA POS · TERMINAL 01" / "CARGA DE MONEDERO", píldora "EN LÍNEA" (estática), reloj.
- Ticker, 3 pasos: 01 Seleccionar caja (cajas estatus 1/2), 02 Monedero destino, 03 Monto (máscara propia); accesos rápidos $100, $500, $1,000, $2,000, $5,000; comprobante "COMPROBANTE DE OPERACIÓN" con "VALIDADO"; botones "CONFIRMAR RECARGA" y "LIMPIAR".
- Panel lateral: Instrucciones y Progreso.
- Flujo: `POST /pos/monederos/cargar` `{ idCaja, idMonedero, monto }` → Swal éxito → `/transacciones`.
- 4 modales implementados sin botón que los abra (abrir turno, cerrar turno, descargar, consultar saldo). Sin control de rol.
- `::ng-deep` global sobre overlays/listas DevExtreme.

### 11.19 Promociones — `/promociones`

- Lista (`fa-gift`, "Promociones"): Centro de Operaciones con 5 pestañas y 10 vistas: Listado general (Catálogo completo), Vigencia y programación (Vigentes, Por vencer, Rollover estado, Cron expirar), Conversiones e historial (Pendientes de conversión, Historial rollover), Reporte por fechas (Reporte), Afiliado y monedero (Por afiliado, Por monedero).
- Filtros condicionales: rango de fechas (reporte) o ID numérico (afiliado/monedero/promoción). Vista detalle con JSON.
- Grid: Acciones ("Ver"), Nombre, Inicio, Fin, Código, Estatus (texto); modo `kv` (Campo/Valor) para respuestas objeto. Paginación en cliente.
- Alta: `codigo`, `nombre`, `idTipoPromocion`, `esPorcentaje`, `multiplicadorRollover` [min 0.0001], `diasParaCompletar` [min 1] obligatorios; opcionales sala, descripción, porcentaje/montos (monto util), fechas/horas, días aplica, límites de uso, nivel VIP mínimo, visible, activa, requiere código, términos. Rol `registrarPromocion` al guardar.
- API: ver contrato (`/promociones/*`).

### 11.20 Monitoreo — `/monitoreo`

- Banner "Ubicaciones" (`fa-archive`). Panel izquierdo "Casinos" con buscador, chips Todos/Online/Offline, lista y detalle (botones "Centrar" y "Sala" sin acción).
- Mapa Google nativo (`#map`) con 4 casinos **fijos** (Aurora Centro CDMX, Nova Norte Monterrey, Diamante Guadalajara, Riviera Cancún); marcadores círculo `#2fe3a7` (online) / `#ff4b5c` (offline); tooltip `OverlayView` propio; estilos oscuros alternables. Chip "En vivo" decorativo. No consume API.

### 11.21 Perfil — `/contacts/profile`

- Hero con avatar fijo (S3 transmovi), nombre, correo, badge de organización; tarjetas ID, Teléfono, Organización, Fecha de registro, Último acceso (desde `sessionStorage`).
- Panel "Cambiar contraseña" (`slideDownFade`): `contraseñaActual` [required, minLength 6], `nuevaContrasena` [required, minLength 6], `confirmarContrasena` [required] con `passwordMismatch`; errores inline (`#e40041`).
- API: `PATCH /usuarios/actualizar/contrasena/{id}` `{ contraseñaActual, contraseñaNueva }`. No hay subida de foto.

### 11.22 Cajero — `/cajero` (fuera del menú)

- Grid agrupado por ubicación con tickets **mock** (`cajero.service.ts`), tarjetas móviles (375–428 px), panel de pago (Efectivo, Tarjeta, Transferencia, Mixto) con valores de demostración y bloque "DTO" de depuración.

---

## 12. Gráficas

| Dónde | Librería | Tipo | Datos |
|---|---|---|---|
| Dashboard "Tendencia de ingresos" | DevExtreme `dx-chart` | `splineArea`, `argumentField="periodo"`, `valueField="valor"`, puntos tamaño 6, leyenda oculta, tooltip, eje X rotado −35°, palette `['#00acc1','#2979ff','#e40041']` | `POST /dashboard/kpis` → `tendencias.ingresos` |
| `/charts/*` (demos) | ApexCharts, Chart.js, ECharts, Chartist | varios | datos fijos de la plantilla |

`NgApexchartsModule` está importado en dashboards y contacts sin uso.

---

## 13. Mapas

| Dónde | Tecnología | Detalle |
|---|---|---|
| Salas: ver ubicación / seleccionar ubicación | Google Maps JS nativo dentro de SweetAlert | centro por defecto CDMX `19.4326, -99.1332`; zoom 15 (ver) / 13 (seleccionar); POIs ocultos; pin SVG `#ff1a5b` 48×64 con `DROP`; marcador arrastrable; coordenadas a 8 decimales |
| Monitoreo | Google Maps JS nativo | UI deshabilitada salvo zoom; marcadores círculo; `OverlayView` tooltip; estilos oscuros `#0b0f17`/`#0a0f19`; `fitBounds` |
| `/maps/google` (demo) | `@angular/google-maps` | París, marcadores Eiffel/Louvre/Notre-Dame |
| `/maps/leaflet` (demo) | Leaflet + tiles Mapbox/OSM | token Mapbox de la plantilla |

El script de Google Maps se carga una sola vez en `index.html`; los componentes esperan `window.google.maps` con reintentos por `setTimeout`.

---

## 14. Servicios `shared/services`

### 14.1 En uso por el negocio

| Servicio (clase) | Dominio |
|---|---|
| `afiliados.service` (`AfiliadosService`), `afiliados-estatus.service` | Afiliados |
| `bitacora.service` | Bitácora |
| `cajas.service` (`CajasService`) | Cajas (+ `obtenerEstatusAfiliado` fuera de lugar) |
| `clientes.service` (`ClientesService`) | Clientes |
| `dashboard.service` (`DashboardService`) | KPIs |
| `maquinas.service` (`MaquinasService`) | Máquinas |
| `modulos.service`, `permisos.service`, `roles.service` | Catálogo RBAC |
| `monederos.service` (`MonederosServices`) | Monederos + POS monederos |
| `promociones.service` (`PromocionesService`) | Promociones |
| `salas.service` (`SalaService`) | Salas + layout mapa + catálogos moneda/licencia |
| `tesoreria.service` (`TesoreriaService`) | Bóveda |
| `transacciones.service` (`TransaccionesService`) | Ledger |
| `turnos.service` (`TurnosService`) | Turnos POS |
| `turnos-activos-descarga-monedero.service` | Turnos activos por sala (monederos) |
| `usuario.service` (`UsuariosService`) | Usuarios, S3, contraseñas |
| `zona.service` (`ZonaService`) | Zonas |
| `rol-acceso.service`, `formulario-validacion-swal.service` | UI (sin HTTP) |

### 14.2 Sin uso / legado (Transmovi)

`vehiculos`, `derroteros`, `dispositivos`, `dispositivobluevox`, `instalaciones`, `operadores`, `rutas`, `viajes`, `talleres`, `verificaciones`, `incidentes`, `mat-combustible`, `mat-kilometraje`, `mat-vehicular`, `cat-combustible`, `cat-referenciaServicio`, `tarifa` (`TarifasService`), `regiones`, `posiciones` (`PosicioneService`), `monitoreo` (`MonitoreoService`), `turnos-activos` (`TurnosActivosService`), `bitacora-conteo` (exporta `BlueVoxService`). `pasajeros` solo lo usan afiliación/verify de cuenta.

---

## 15. Páginas demo de la plantilla Minible

Rutas presentes (no son núcleo del producto): `calendar`, `chat`, `file-manager`, `dashboards/*`, `ecommerce/*`, `email/*`, `invoices/*`, `contacts/list|grid`, `pages/*` (utility), `ui/*`, `form/*`, `tables/*`, `charts/*`, `icons/*`, `maps/google|leaflet`, y extrapages (`/pages/maintenance`, `comingsoon`, `404`, `500`, `login-1`, `register-1`, `recoverpwd-1`, `lock-screen-1`). Usan `app-page-title`, datos fijos y textos en inglés.

---

## 16. Hallazgos y deuda técnica observada

> Se documentan como estado actual. **No se corrigen** salvo que se pida explícitamente (ver contrato §2).

**Permisos y roles**
1. Menú sin filtro; `hasPermission`/`permiso` inexistentes; `appHasPermission` sin declarar; `ngx-permissions` sin cargar.
2. Muchas acciones sin validación de rol (§10.4); en bóveda, reponer/retirar reutilizan `cerrarTesoreriaDelDia`; desbloquear afiliado reutiliza `bloquearAfiliado`.
3. Validación de rol al final del formulario (cajas, afiliados, promociones, abrir-bóveda, salas).
4. Autoexclusión: registrar solo Gerente (5), cancelar solo 1–4.
5. **Textos de UI que incumplen la regla `aura-ui-permisos`:** `lista-turnos.component.html` ("Requiere rol Jefe de Sala o Gerente.", "catálogo /cajas/list", "ID de caja", "estatus operativo (1 o 2)", "validación en servidor"); `lista-monederos.component.html` ("Ajuste manual (solo Gerente)"); Swals de afiliados con "según el servidor".

**Grids**
6. Búsqueda solo sobre la página actual; filtros/orden no remotos; `<dxo-pager>` duplicado; exportación desactivada en todos.
7. "Contraer Grid" sin efecto donde `autoExpandAll` es fijo.
8. Transacciones sin `dataField` (filtros y agrupación inoperantes).
9. Doble recarga tras cambiar estatus / al cambiar página (monederos, transacciones).

**Formularios**
10. `actualizar()` de módulos, permisos y roles envía aunque el form sea inválido.
11. RFC de cliente limitado a 12 caracteres (persona física tiene 13).
12. Cajas envía `idEstatusCaja: 2` también al editar.
13. Distribución de sala pierde rotación, nombre y tipo al guardar; máquinas fuera de su zona se descartan.
14. Mínimos de monto inconsistentes (`min(0.01)` bóveda, `min(0)` turnos, sin mínimo en agregar-tesorería).
15. Errores de API mostrados con `error.error` o `${error}` (`[object Object]`).
15b. Descarga de monedero con cuerpos distintos: lista-monederos envía `{ idCaja, idMonedero, monto }` y el modal del POS `{ idTurnoCaja, idMonedero, monto }` al mismo `POST /pos/monederos/descargar`.

**Otros**
16. `lista-zonas.component.scss` y `lista-maquinas.component.scss` referenciados y ausentes.
17. `/lealtad` en el menú sin ruta; sin ruta comodín.
18. Monitoreo y cajero con datos mock; POS con 4 modales inalcanzables; `AgregarTesoreriaComponent` y `AbrirTurnoComponent` sin navegación.
19. Avatar fijo en topbar y perfil (S3 transmovi); logo por defecto de clientes de transmovi.
20. Poppins no se carga; `btn-title--ghost`/`--secondary` no definidos.
21. `::ng-deep` sin `:host` en transacciones y recarga afecta estilos globales de DevExtreme.
22. Perfil: si falla el cambio de contraseña, `cambiandoContrasena` queda en `true`.
23. Textos con codificación rota en turnos ("informaci?n", "v?lida", "aqu?").
24. `logout()` recarga antes de limpiar storage; `ErrorInterceptor` sin `||`.
25. Claves de Google Maps y token Mapbox expuestos en código.
