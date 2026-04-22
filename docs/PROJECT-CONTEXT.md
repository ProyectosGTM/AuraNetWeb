# Contexto del proyecto AuraNet

Documento de referencia para entender la estructura, convenciones y módulos del sistema. Úsalo como contexto al desarrollar o al pedir asistencia sobre el código.

---

## 1. Descripción general

- **Proyecto:** AuraNet (nombre de workspace; en `package.json` figura como "minible").
- **Tipo:** Aplicación Angular 17 (SPA) con lazy loading de módulos.
- **Dominio:** Sistema operativo para salas/casinos: afiliados, monederos, recargas (POS), tesorería/bóveda, turnos de caja, transacciones, clientes, salas, zonas, máquinas, cajas, y administración (módulos, permisos, roles, usuarios, bitácora).
- **Idioma de la UI:** Español.
- **Autenticación:** Login con guard `AuthGuard`; rutas principales bajo `LayoutComponent` y `PagesModule`.

---

## 2. Stack técnico relevante

| Área | Tecnología |
|------|------------|
| Framework | Angular 17 |
| UI / Grids / Controles | DevExtreme (dx-data-grid, dx-select-box, etc.) |
| Modales | NgBootstrap (NgbModal) |
| Formularios | Angular Reactive Forms (FormBuilder, FormGroup, Validators) |
| Alertas / confirmaciones | SweetAlert2 (Swal) |
| Estilos | SCSS, Bootstrap (clases utilitarias), estilos globales en `src/styles.scss` |
| Animaciones | Animaciones propias en `src/app/core/` (fade-in-right, slide-down-fade, modal-animation) |
| Permisos (opcional en vistas) | ngx-permissions |
| Mapas | Google Maps (Monitoreo) |

---

## 3. Estructura de rutas y menú

- **Raíz:** `app-routing.module.ts`: `''` → `LayoutComponent` + `PagesModule` (con `AuthGuard`); `account` → `AccountModule`; `login` → `LoginComponent`.
- **Páginas:** Rutas hijas definidas en `src/app/pages/pages-routing.module.ts` y en cada `*-routing.module.ts` de cada módulo.

### 3.1 Mapeo menú → ruta (lo que SÍ está implementado)

El menú se define en `src/app/layouts/sidebar/menu.ts`. Rutas que existen y tienen componentes:

| Menú (label) | Ruta | Módulo / componente principal |
|--------------|------|------------------------------|
| Principal → Tablero | `/dashboard` | `DefaultComponent` (dashboards/default) |
| Principal → POS | `/recarga` | `RecargaComponent` (recarga) |
| Principal → Perfil | `/contacts/profile` | `ProfileComponent` (contacts) |
| Administración → Modulos | `/modulos` | lista + agregar/editar |
| Administración → Permisos | `/permisos` | lista + agregar/editar |
| Administración → Roles | `/roles` | lista + agregar/editar |
| Administración → Usuarios | `/usuarios` | lista + agregar/editar |
| Administración → Bitacora | `/bitacora` | solo lista (consulta) |
| Estructura → Clientes | `/clientes` | lista + agregar/editar |
| Estructura → Salas | `/salas` | lista + agregar/editar |
| Estructura → Zonas | `/zonas` | lista + agregar/editar |
| Estructura → Maquinas | `/maquinas` | lista + agregar/editar |
| Estructura → Cajas | `/cajas` | lista + agregar/editar |
| Estructura → Afiliados | `/afiliados` | lista + agregar/editar |
| Boveda | `/tesoreria` | lista + agregar/editar + abrir-boveda |
| Ap. Turnos | `/turnos` | lista + abrir-turno |
| Monederos | `/monederos` | lista + agregar/editar + modales de operaciones |
| Transacciones | `/transacciones` | solo lista |
| Monitoreo | `/monitoreo` | `MonitoreoComponent` (lista + mapa) |

### 3.2 Ítems del menú SIN ruta implementada

Estos enlaces están en `menu.ts` pero **no** tienen ruta en `pages-routing.module.ts`; al hacer clic pueden llevar a 404 o a la ruta por defecto:

- **Indicadores:** `/saldo-no-debitado`, `/premios-entregados`, `/venta-acumulada`, `/promociones`
- **Catálogos:** `/tipo-estado`, `/efectivo`, `/lealtad`, `/tipo-identificacion`, `/numero-identificacion`, `/moneda`, `/cantidad-recibida`
- **Finanzas (submenú):** `/caja`, `/bobeda` (la "Boveda" del menú principal usa `/tesoreria`)
- **Tu cuenta:** `/cuenta` (el perfil real está en `/contacts/profile`)

---

## 4. Estructura de carpetas relevante

```
src/app/
├── account/          # Auth: login, signup, verify, affiliation, etc.
├── core/             # Guards, interceptors, auth service, animaciones
├── layouts/          # Layout principal, sidebar, menu.ts
├── pages/            # Módulos de negocio (cada uno con lista, agregar, editar según aplique)
│   ├── pages-routing.module.ts   # Rutas principales
│   ├── dashboards/default/       # Dashboard
│   ├── recarga/                  # POS
│   ├── contacts/                 # Perfil (profile)
│   ├── modulos | permisos | roles | usuarios | bitacora/
│   ├── clientes | salas | zonas | maquinas | cajas | afiliados/
│   ├── tesoreria | turnos | monederos | transacciones | monitoreo/
│   └── ...
└── shared/           # Servicios, pipes, componentes compartidos
    └── services/     # *Service por dominio (modulos, permisos, clientes, cajas, etc.)
```

Cada módulo de negocio suele tener:

- `*-routing.module.ts`: rutas `''`, `agregar-*`, `editar-*/:id*` (y rutas extra como `abrir-boveda`, `abrir-turno`).
- Lista: componente `lista-*` con grid.
- Alta/Edición: componente `agregar-*` reutilizado para crear y editar (leyendo id por `ActivatedRoute.params`).

---

## 5. Patrones de UI y comportamiento

### 5.1 Cabecera de página

- Contenedor: `title-banner-card shadow-sm`
- Contenido: `title-banner-content`, `title-icon`, `title-title`, `title-subtitle`
- Acciones: `title-actions`, `title-tagline`, `title-buttons`
- Botones: `btn-title`, `btn-title--primary`, `btn-title--ghost`, `btn-title--danger` (definidos en `src/styles.scss`)

### 5.2 Grids (listas)

- **Componente:** DevExtreme `dx-data-grid`.
- **Datos:** `CustomStore` con `load` que llama al servicio (paginación: `page`, `take`/`skip`); se suele guardar `paginaActualData` para búsqueda en cliente.
- **Opciones típicas:** `remoteOperations: { paging: true }`, `paging: { pageSize }`, `searchPanel`, `filter-row`, `header-filter`, `group-panel`, `onPageIndexChanged`, `onOptionChanged` (para reaccionar a `searchPanel.text` y filtrar en cliente si aplica).
- **Columnas:** Columna "Acciones" con template (Editar, Activar/Desactivar); columna Estatus con template que usa clases `estatus-activo` / `estatus-inactivo`.
- **Mensaje de agrupar:** `mensajeAgrupar = 'Arrastre un encabezado de columna aquí para agrupar por esa columna'`.

### 5.3 Formularios

- Reactive Forms: `FormBuilder`, `FormGroup`, `Validators.required`, `Validators.min`, `Validators.minLength`.
- Montos: normalmente `Validators.min(0.01)`.
- Selectores: DevExtreme `dx-select-box` con `dataSource`, `displayExpr`, `valueExpr`, `formControlName`, `searchEnabled`, `showClearButton`; a veces clase `dx-select-box-custom`.
- Alta/Edición: mismo componente; en edición se usa `ActivatedRoute.params` y se hace `patchValue` con datos del servicio.

### 5.4 Confirmaciones y mensajes

- SweetAlert2 con tema oscuro: `background: '#0d121d'`, `confirmButtonColor` (por ejemplo `'#3085d6'` o `'#e40041'`), textos en español.
- Se usa para confirmar activar/desactivar, éxito/error de guardado y errores de API.

### 5.5 Modales

- NgBootstrap: `NgbModal.open(templateRef, { windowClass, size, ... })`.
- Se usan `@ViewChild` con `TemplateRef` para el contenido.
- Dentro del modal suele haber un `FormGroup` con validación; al guardar se cierra el modal y se refresca el grid si aplica.
- Ejemplos: Tesorería (resumen, historial, cerrar, reponer, retirar), Turnos (consultar saldo caja, reponer/retirar), Monederos (cargar, descargar, consultar saldo, cambiar estatus, traspaso, monederos por afiliado).

### 5.6 Animaciones

- Entrada de página: `fadeInRightAnimation` aplicada al contenedor principal.
- Detalles que se muestran/ocultan: `slideDownFadeAnimation`, `staggerFadeInAnimation` (p. ej. en Recarga).
- Modales de previsualización: `previewModalAnimation` (p. ej. documentos en Clientes).

---

## 6. Estilos globales (resumen)

- **Archivo:** `src/styles.scss`.
- **Cabecera / botones:** `.title-banner-card`, `.btn-title`, `.btn-title--primary`, `.btn-title--ghost`, `.btn-title--danger`.
- **Estados en grid:** `.estatus-activo`, `.estatus-inactivo`.
- **DevExtreme:** Se ajustan estilos del pager (por ejemplo color de selección) en `styles.scss`.
- Los módulos pueden tener su propio `.scss` (p. ej. `recarga.component.scss`, `lista-monederos.component.scss`) para estilos específicos de la página o del grid.

---

## 7. Servicios por dominio

Ubicación: `src/app/shared/services/`. Un servicio por entidad, con métodos como:

- `obtener*()` o `obtener*Data(page, take)` para listados paginados.
- `obtener*ById(id)` o `obtener*(id)` para edición.
- `crear*` / `guardar*` / `actualizar*` para alta y edición.
- `updateEstatus(id, estatus)` para activar/desactivar donde aplique.
- Servicios usados en varios módulos: p. ej. `CajasService` (cajas, recarga, turnos, afiliados y operaciones de monederos en UI), `TurnosService` (turnos).

Nombres típicos: `ModulosService`, `PermisosService`, `RolesService`, `UsuariosService`, `ClientesService`, `SalaService`, `ZonaService`, `CajasService`, `TesoreriaService`, `MonederosServices`, `TurnosService`, `TransaccionesService`, `BitacoraService`.

---

## 8. Convenciones de nombres

- **Rutas:** minúsculas, guiones: `agregar-modulo`, `editar-modulo/:idModulo`, `abrir-boveda`, `abrir-turno`.
- **Componentes de lista:** `ListaModulosComponent`, `ListaClientesComponent`, etc.; selector `app-lista-*`.
- **Componentes de formulario:** `AgregarModuloComponent`, `AgregarClienteComponent`, etc.; selector `app-agregar-*` (y sirven para editar).
- **Params de ruta:** `idModulo`, `idCliente`, `idCaja`, `idAfiliado`, `idZona`, `idMaquina`, `idTesoreria`, etc.
- **Archivos:** `lista-modulos.component.ts`, `agregar-modulo.component.ts`, `modulos-routing.module.ts`, `modulos.module.ts`.

---

## 9. Módulos con lógica especial (resumen)

- **Recarga (POS):** Flujo en 4 pasos (Caja → Monedero → Monto → Confirmación); `forkJoin` para cargar cajas y monederos; validación de monto mínimo.
- **Clientes:** Grid con columnas de documentos (Constancia Fiscal, Comprobante Domicilio, Acta Constitutiva) y previsualización en modal.
- **Tesoreria:** Lista + modales para resumen, historial, cerrar, reponer y retirar; ruta adicional `abrir-boveda`.
- **Turnos:** Lista + `abrir-turno`; modales para consultar saldo de caja y reponer/retirar efectivo.
- **Monederos:** Lista + varios modales (cargar, descargar, consultar saldo, cambiar estatus, traspaso, monederos por afiliado); vista de saldo con efectivo y promociones.
- **Dashboard:** Datos estáticos (métricas y gráficas); sin llamadas a API.
- **Monitoreo:** Lista de ubicaciones + mapa Google Maps; datos estáticos.
- **Bitacora / Transacciones:** Solo listado (grid) sin formularios de alta/edición en el módulo.
- **Perfil:** Datos del usuario logueado y formulario de cambio de contraseña (validator de coincidencia).

---

## 10. Cómo usar este contexto

- Para **nuevas pantallas o módulos:** seguir los patrones de cabecera, grid (CustomStore + DxDataGrid), formularios (Reactive Forms + DevExtreme), Swal y modales NgbModal.
- Para **nuevas rutas del menú:** añadir la ruta en `pages-routing.module.ts` (y en el módulo hijo si aplica) y asegurar que el `link` en `menu.ts` coincida.
- Para **mantener consistencia:** usar las mismas clases de `styles.scss`, las mismas animaciones del `core/` y la misma estructura lista + agregar/editar donde aplique.
- Tener en cuenta que **Indicadores, catálogos (Tipo Estado, Efectivo, etc.), Finanzas (Caja/Bobeda) y Tu cuenta** están en el menú pero sin ruta; cualquier desarrollo ahí implica crear módulo y ruta nuevos.
