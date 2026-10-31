# AuraNet — Contrato del frontend

Normas y contrato técnico del frontend AuraNet (septiembre 2026): cómo se construyen vistas, formularios, grids, modales, estilos, validaciones y control de roles, y qué endpoints consume hoy la aplicación con sus payloads. Complementa **`docs/contexto.md`** (estado y detalle de cada módulo).

Base API: `environment.API_SECURITY` = `https://auran3t.mx/api` (dev y prod). Swagger backend: `https://auran3t.mx/api/docs`, solo para implementar. **Nunca** se cita en la UI.

---

## 1. Propósito y precedencia

Este contrato fija:

1. El acuerdo de trabajo sobre el repositorio.
2. La estructura de módulos, rutas y menú.
3. El contrato de autenticación y sesión.
4. El control de rol en UI (`RolAccesoService`) y la regla de textos.
5. El contrato visual: paleta, componentes CSS, SweetAlert, modales, tooltips, animaciones.
6. El contrato de listas (DataGrid) y formularios.
7. El contrato de servicios HTTP y el catálogo de endpoints con payloads.
8. Las divergencias conocidas y el checklist.

**Precedencia:** si una documentación antigua y el código de `shared/services` no coinciden, **manda el código del servicio**. Si cambia un servicio, se actualiza este contrato en el mismo cambio.

---

## 2. Acuerdo de trabajo (obligatorio)

1. **Solo se hace lo que se pide.** Nada de mejoras, refactors, correcciones colaterales ni "de paso".
2. **No se ejecutan comandos de terminal.** Todo el trabajo se hace editando código. Si algo requiriera un comando, se pregunta antes.
3. Tocar solo los archivos necesarios para la tarea.
4. Los hallazgos de `contexto.md` §16 son estado conocido: **no se corrigen** sin petición explícita.
5. Commits y PRs solo si el usuario los pide.
6. No modificar demos de Minible ni código legado de transporte salvo petición.
7. `contexto.md` + `contrato.md` son la base de verdad para futuras implementaciones.

---

## 3. Stack y límites

| Usar en negocio | No usar como patrón nuevo |
|---|---|
| Angular 17 + Reactive Forms | FakeBackend / `JwtInterceptor` |
| DevExtreme `dx-data-grid`, `dx-select-box`, `dx-date-box`, `dx-chart` | Otra librería de grid o charts (Apex/Chart.js/ECharts son de demos) |
| SweetAlert2 con `background: '#0d121d'` | `alert()` / `confirm()` nativos |
| `NgbModal` con `ng-template` en la lista | Modales custom (excepción existente: preview de clientes) |
| `RolAccesoService` para acciones sensibles | Tooltips/HTML con "según API/Swagger", "requiere rol X" |
| Servicios `providedIn: 'root'` en `shared/services` | HTTP directo en componentes |
| Clases globales de `src/styles.scss` | Estilos que reinventan banner, campos o botones |
| Google Maps JS nativo (script de `index.html`) | Cargar otra instancia del script de Maps |

---

## 4. Módulos, rutas y menú

### 4.1 Estructura de un feature

```
src/app/pages/<dominio>/
  <dominio>.module.ts
  <dominio>-routing.module.ts
  lista-<dominio>/lista-<dominio>.component.ts|html|scss
  agregar-<dominio>/agregar-<dominio>.component.ts|html|scss   # alta y edición
```

Pantallas de operación opcionales al mismo nivel (`abrir-boveda`, `abrir-turno`, `distribucion-sala`). Todo `styleUrl` declarado debe existir.

### 4.2 Module del feature

Declarar sus componentes e importar según necesidad: `CommonModule`, `FormsModule`, `ReactiveFormsModule`, `DxDataGridModule`, `DxSelectBoxModule`, `DxDateBoxModule`, `DxChartModule`, `NgbModalModule`/`NgbTooltipModule`/`NgbModule` y el `<dominio>-routing.module`. `SharedModule` **no exporta** `UIModule`; si se necesita `app-page-title` o `app-loader`, importar `UIModule`.

### 4.3 Routing del feature

```ts
{ path: '', component: ListaXComponent },
{ path: 'agregar-x', component: AgregarXComponent },
{ path: 'editar-x/:idX', component: AgregarXComponent },
```

### 4.4 Registro

1. Lazy en `pages/pages-routing.module.ts`: `{ path: '<dominio>', loadChildren: () => import('./<dominio>/<dominio>.module').then(m => m.XModule) }`.
2. Item en `layouts/sidebar/menu.ts` (`id` único, `label`, `icon` `uil-*`, `link`), dentro de su sección `isTitle`.
3. Servicio en `shared/services/<dominio>.service.ts`.

### 4.5 Rutas raíz (no modificar sin petición)

| Path | Destino |
|---|---|
| `account` | AccountModule |
| `login` | LoginComponent + `NoAuthGuard` |
| `''` | LayoutComponent + PagesModule + `AuthGuard` |
| `pages` | ExtrapagesModule + `AuthGuard` |

### 4.6 Mapa menú → path → carpeta

| Menú | Path | Carpeta |
|---|---|---|
| Tablero | `/dashboard` | `pages/dashboards/default` |
| Modulos · Permisos · Roles · Clientes · Usuarios · Bitacora | `/modulos` · `/permisos` · `/roles` · `/clientes` · `/usuarios` · `/bitacora` | `pages/<mismo nombre>` |
| Salas · Zonas · Maquinas · Cajas · Afiliados · Monederos | `/salas` · `/zonas` · `/maquinas` · `/cajas` · `/afiliados` · `/monederos` | `pages/<mismo nombre>` |
| Boveda | `/tesoreria` | `pages/tesoreria` |
| Ap. Turnos | `/turnos` | `pages/turnos` |
| Transacciones | `/transacciones` | `pages/transacciones` |
| POS | `/recarga` | `pages/recarga` |
| Promociones · Monitoreo | `/promociones` · `/monitoreo` | `pages/promociones` · `pages/monitoreo` |
| Lealtad | `/lealtad` | **sin módulo** |
| Perfil | `/contacts/profile` | `pages/contacts/profile` |
| Cajero (comentado en menú) | `/cajero` | `pages/cajero` |

---

## 5. Autenticación y sesión

1. Login: `POST /login` `{ userName, password }`. En éxito se guarda en **`sessionStorage`**: `token`, `user` (respuesta completa) y `permissions` (arreglo de `String(idPermiso)`).
2. `InterceptService` añade `Authorization: Bearer <token>` y `Content-Type: application/json` (salvo `FormData`). Para omitir el Bearer: `new HttpContext().set(SKIP_APP_AUTH, true)`.
3. `ErrorInterceptor`: 401 → `logout()` + recarga. Los errores llegan como `{ status, message, error }`.
4. `AuthGuard` solo verifica token; no hay guard por rol ni permiso.
5. Usuario actual: `JSON.parse(sessionStorage.getItem('user'))`, campo `rol` (id de rol) e `idCliente`. Usar `RolAccesoService.obtenerRolUsuarioLogueado()` para el rol.
6. No reactivar `JwtInterceptor`, fake-backend ni la carga de `ngx-permissions` sin petición.

Forma de `User` (`entities/User.ts`): `id, token, refreshToken?, nombre, apellidoPaterno?, apellidoMaterno?, nombreCompleto?, telefono, fechaCreacion, ultimoLogin, permisos[], email, idCliente?, imagenPerfil, user, rol, userName, fotoPerfil, logotipo, nombreCliente, apellidoPaternoCliente, apellidoMaternoCliente`.

---

## 6. Control de rol en UI

Archivo: `shared/services/rol-acceso.service.ts`. Regla: `.cursor/rules/aura-ui-permisos.mdc`.

### 6.1 Catálogo de roles (ids string)

| Id | Etiqueta |
|---|---|
| 1 | SA |
| 2 | Dev |
| 3 | Cliente |
| 4 | Administrador |
| 5 | Gerente |
| 6 | Sub-Gerente |
| 7 | Cajero |
| 8 | Recepcionista |

### 6.2 Acciones (`AccionConControlRol`)

| Acción | Roles permitidos | Pantalla donde se valida |
|---|---|---|
| `gestionarCajasCliente` | 3 | agregar-caja (guardar) |
| `registrarAfiliado` | 3 | agregar-afiliado (guardar) |
| `actualizarNivelVipAfiliado` | 5 | lista-afiliados (modal VIP) |
| `verCumpleanerosAfiliados` | 1, 2, 3, 4 | lista-afiliados (cumpleañeros) |
| `bloquearAfiliado` | 5 | lista-afiliados (bloquear y desbloquear) |
| `registrarAutoexclusionAfiliado` | 5 | lista-afiliados |
| `cancelarAutoexclusionAfiliado` | 1, 2, 3, 4 | lista-afiliados |
| `abrirTesoreriaDelDia` | 3, 4, 5, 6 | lista-tesoreria, abrir-boveda |
| `cerrarTesoreriaDelDia` | 3, 4, 5, 6 | lista-tesoreria (cerrar, reponer, retirar) |
| `reponerEfectivoTurno` | 5, 6, 7 | lista-turnos |
| `retirarEfectivoTurno` | 5, 6, 7 | lista-turnos |
| `suspenderTurno` | 5, 6, 7 | lista-turnos |
| `reactivarTurno` | 5, 6, 7 | lista-turnos |
| `corteParcialTurno` | 5, 6, 7 | lista-turnos |
| `registrarPromocion` | 3, 4 | agregar-promocion (guardar) |
| `descargarEfectivoMonedero` | 7 | lista-monederos |
| `ajustarSaldoMonedero` | 1, 2, 3, 4, 5, 6 | lista-monederos |

### 6.3 Flujo obligatorio en acciones sensibles

Validar **antes** de abrir el modal y **otra vez** antes de llamar a la API:

```ts
const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
if (!this.rolAcceso.puedeRealizarAccion('miAccion', rol)) {
  this.rolAcceso.mostrarAccesoDenegado('miAccion');
  return;
}
// abrir modal / llamar API
```

`puedeRealizarAccion` recibe **dos argumentos** (acción y rol).

### 6.4 Helpers

| Método | Uso |
|---|---|
| `obtenerEtiquetaRol(idRol)` | Etiqueta de rol (topbar) |
| `obtenerRolUsuarioLogueado()` | `String(user.rol)` o `null` |
| `esRolSinClientePorDefectoEnFormularios(rol)` | `true` para 1 y 2 |
| `obtenerIdClientePorDefectoFormulario()` | `user.idCliente` salvo SA/Dev; precarga `idCliente` en altas |
| `esPerfilClienteLogueado()` | `rol === '3'` |
| `mostrarAccesoSoloPerfilCliente('cajas' \| 'sucursales' \| 'afiliados')` | Swal para acciones reservadas al perfil Cliente |
| `obtenerTextoRolesAutorizados(accion)` | Texto "A o B" |
| `mostrarAccesoDenegado(accion)` | Swal estándar de acceso denegado |

### 6.5 Textos prohibidos en UI (HTML, tooltips, SweetAlert)

- "según API", "según Swagger", "según el servidor", "documentación", "La API devolverá…".
- "Requiere rol X", "solo Gerente", ids de rol o de catálogo, rutas de endpoints (`/cajas/list`).
- Tooltips que sustituyen la validación de rol: el tooltip describe la función; el acceso lo resuelve `RolAccesoService`.

### 6.6 Extender el catálogo de acciones

1. Añadir la clave a `AccionConControlRol`.
2. Registrarla en `ACCIONES` con `rolesPermitidosIds`, `titulo`, `subtitulo` y `tituloRolesPermitidos` (texto para el usuario).
3. Invocar el flujo §6.3 en el componente.
4. Añadir la fila en §6.2 de este contrato.

### 6.7 Permisos de catálogo

`sessionStorage.permissions`, `Permiso` (enum), `HasPermissionDirective` y `ngx-permissions` existen pero **no forman parte del contrato activo**. No asumir que filtran nada.

---

## 7. Contrato visual

### 7.1 Tokens de color

| Token | Valor |
|---|---|
| Fondo base (layout, banners, modales, Swal) | `#0d121d` |
| Acento primario | `#e40041` |
| Acento rosa | `#ff1a5b` |
| Azul secundario / foco | `#6a8cff` |
| Botón éxito formulario | `#1f7a4d` (hover `#239b63`) |
| Confirmar / cancelar Swal | `#3085d6` / `#d33` |
| Estatus activo | `#0f2e22` · `#1f5c45` · `#34d399` |
| Estatus inactivo | `#2a0a14` · `#7a1330` · `#ff1a5b` |
| Montos en modales | efectivo `#34c38f`, promocional `#50a5f1`, puntos `#f1b44c`, total `#5b73e8`, alerta `#f46a6a` |
| Primary Bootstrap (Minible) | `#5b73e8` |

Tema fijo **dark**. Fuente base IBM Plex Sans; los componentes AuraNet declaran Poppins.

### 7.2 Estructura de pantalla

```html
<div class="container-fluid" [@fadeInRight]>
  <div class="title-banner-card shadow-sm">
    <div class="title-banner-content">
      <div class="d-flex align-items-center">
        <div class="title-icon"><i class="fas fa-..."></i></div>
        <div>
          <h4 class="title-title">Título</h4>
          <p class="title-subtitle">Subtítulo</p>
        </div>
      </div>
      <div class="title-actions">
        <div class="title-tagline"><span class="line"></span>Control y configuración centralizada</div>
        <div class="title-buttons"><!-- botones de cabecera --></div>
      </div>
    </div>
  </div>
  <!-- contenido -->
</div>
```

`fadeInRight` se importa de `core/fade-in-right.animation.ts` y se declara en `animations` del componente.

### 7.3 Botones

| Contexto | Clase | Icono / texto |
|---|---|---|
| Nuevo | `btn-title btn-title--primary` | `fas fa-plus` "Nuevo" |
| Contraer Grid | `btn-title btn-title--ghost` | `fas fa-expand` |
| Restablecer | `btn-title btn-title--danger` | `fas fa-sync-alt` |
| Guardar formulario | `btn-alt btn-alt--success` | `fas fa-check` "Guardar" / "Actualizar" |
| Cancelar formulario | `btn-alt btn-alt--cancel` | `fas fa-times` "Cancelar" |
| Acción de fila | `btn btn-sm btnAcciones` + id (§7.4) | icono FA + `ngbTooltip` |
| Tarjeta de operación | `btn-action-large btn-<modulo>-<accion>` con `.btn-action-icon` + `.btn-action-label` + `.btn-action-desc` | |

### 7.4 Ids de acción de fila (colores definidos en `styles.scss`)

`#actualizarButton` (editar, `fa fa-edit`), `#pinButton` (activar, `fa fa-arrow-up`), `#deleteButton` (desactivar, `fa fa-arrow-down`), `#mapButton`, `#resumenButton`, `#historialButton`, `#bovedaAbiertaSalaButton`, `#eliminarTesoreriaButton`, `#cambiarEstatusButton`, `#reemplazarMonederoButton`, `#historialMonederoButton`, `#reponerButton`, `#retirarButton`, `#suspenderTurnoButton`, `#corteParcialButton`, y clases `--monederos-consultar-saldo-grid`, `--turno-detalle`, `--turno-resumen`, `--turno-movimientos`. Una acción nueva reutiliza un id existente o define su color en `styles.scss` siguiendo el mismo patrón (fondo oscuro, borde, icono de color).

### 7.5 Campos

**Texto / número:**

```html
<label class="field">
  <span class="field-label text-white">Etiqueta <span style="color:#e40041">*</span></span>
  <div class="input-sleek">
    <i class="fas fa-..."></i>
    <input class="sleek-control" formControlName="campo" placeholder="..." autocomplete="off" />
    <span class="sleek-line"></span>
  </div>
</label>
```

**Select:** `dx-select-box` con `class="dx-select-box-custom dx-select-box-<icono>"`, `displayExpr`, `valueExpr="id"`, `[searchEnabled]="true"`, `[showClearButton]="true"`, placeholder "Selecciona …", `noDataText`. Modificadores de icono disponibles: caja, monedero, bóveda, sala, cliente, módulo, zona, tipo-zona, tipo-caja, estatus, promoción-tipo, turno, afiliado, tipo-id, sexo, es-principal, rol, máquina, tipo-máquina, fabricante, moneda.

**Fecha:** `dx-date-box type="date"` con `displayFormat` y `dateSerializationFormat` `yyyy-MM-dd` y `[inputAttr]="dateBoxAttr('campo')"` (`shared/utils/dx-date-box-input-attr.ts`).

**Monto:** input de texto **sin `formControlName`**, `inputmode="decimal"`, `placeholder="0.00"`, con `aplicarMontoInputEnCampo` en `(input)` y `aplicarMontoBlurEnCampo` en `(blur)` (`shared/utils/monto-input-formato.util.ts`). Formato `$` con miles `en-US`, máximo 2 decimales, sin negativos. Precarga con `textoMontoDesdeValorControl`.

**Secciones de formulario:** `.form-section` > `.section-header` (`.section-icon` + `h5.section-title` + `.section-line`).

### 7.6 Estatus

- Estatus genérico (0/1): `<span class="estatus" [ngClass]="estatus === 1 ? 'estatus-activo' : 'estatus-inactivo'">Activo|Inactivo</span>`.
- Estatus de dominio (caja, afiliado, monedero, turno, bóveda): pill con color por código de catálogo o color del backend (ver `contexto.md` §11).

### 7.7 SweetAlert2 (presets)

| Uso | Configuración |
|---|---|
| Confirmación | `icon: 'warning'`, `showCancelButton: true`, `confirmButtonColor: '#3085d6'`, `cancelButtonColor: '#d33'`, "Confirmar" / "Cancelar", `background: '#0d121d'` |
| Éxito | título "¡Operación Exitosa!", `icon: 'success'`, `background: '#0d121d'`, `confirmButtonColor: '#3085d6'` |
| Error | título "¡Ops!" o "¡Error!", `icon: 'error'`, mismo fondo/botón; mensaje legible del backend, nunca `[object Object]` ni stack |
| Campos faltantes | `FormularioValidacionSwalService.resaltarYAlertarSiInvalido(form, etiquetas)`: título "¡Faltan campos obligatorios!", lista numerada (`#d9534f` / `#caa8a8` / `#b02a37`), botón "Entendido" |
| Acceso denegado | exclusivamente `RolAccesoService.mostrarAccesoDenegado(accion)` |
| Grupo no agrupado | "¡Ops!" "Debes arrastrar un encabezado de una columna para expandir o contraer grupos." |

### 7.8 Modales `NgbModal`

- Plantilla `<ng-template #modalX let-modal>` en el HTML de la lista; `@ViewChild('modalX')`.
- Apertura: `this.modalService.open(this.modalX, { size: 'md'|'lg'|'xl', windowClass: 'modal-holder modal-<accion>', centered: true, backdrop: 'static', keyboard: true })`; referencia en `modalRef`; cerrar con `cerrarModal()`.
- Estructura: `.modal-header.modal-accion-header.modal-accion-header--<accion>` (barra de color, §7.9) → `.modal-body` con campos §7.5 y `.form-indication` → `.modal-footer.modal-accion-footer` con `btn-alt--cancel` y botón de acción deshabilitado si `form.invalid || guardando`.

### 7.9 Colores de modales y botones de operación

Barras de encabezado: close `#f46a6a`, reponer/cargar `#34c38f`, retirar/descargar `#f1b44c`, estatus/consultar `#50a5f1`, abrir-turno `#34c38f`, cerrar-turno `#f1b44c`, reponer-turno `#20c997`, retirar-turno `#6f42c1`, suspender `#6c757d`, resumen-turno `#17a2b8`, movimientos-turno `#fd7e14`.

Tarjetas de operación: abrir `#00acc1`, cerrar `#ff6d00`, descargar `#7c4dff`, consultar `#2979ff`, reponer `#00c853`, retirar `#ff9800`, suspender `#c62828`, reactivar `#009688`, corte `#673ab7`; bóveda: abrir `#0d9488`, cerrar `#e11d48`, reponer `#2563eb`, retirar `#d97706`.

### 7.10 Pestañas de operación ("Centro de Operaciones")

`nav` con botones `.promo-tab-btn` (icono + caption), panel `.promo-tab-panel` con `[@promoTabPanel]="tabActual"` (o `turnoTabPanel` en turnos) y `[ngSwitch]` por pestaña; cada pestaña contiene tarjetas `btn-action-large` en `row g-3` (`col-12 col-md-6 col-xl-4`).

### 7.11 Tooltips

`ngbTooltip` con la configuración global (`aura-tooltip`, `placement top`, `strategy fixed`, sin animación). Texto funcional corto ("Editar", "Activar", "Ver resumen"), sin roles ni endpoints.

### 7.12 Animaciones disponibles

| Trigger | Archivo | Uso previsto |
|---|---|---|
| `fadeInRight` | `core/fade-in-right.animation.ts` | Entrada de toda pantalla |
| `slideDownFade` | `core/slide-down-fade.animation.ts` | Paneles que aparecen/desaparecen |
| `previewModal` | `core/modal-animation.ts` | Overlay de previsualización |
| `promoTabPanel` / `turnoTabPanel` | definidos en cada componente (260ms `cubic-bezier(0.33,1,0.68,1)`) | Cambio de pestaña |

### 7.13 Estilos por componente

- SCSS del componente con `:host`; no usar `::ng-deep` sin `:host` (afecta todo DevExtreme).
- Respetar budgets: 6 KB aviso / 10 KB error por hoja de componente.
- Breakpoints en uso: 1400, 1200, 1100, 992, 900, 768, 640, 576, 480, 400 px.

---

## 8. Contrato de listas (`dx-data-grid`)

### 8.1 Servicio

`obtenerXData(page: number, limit: number)` → `GET /<recurso>/{page}/{limit}`. La respuesta paginada es:

```json
{ "data": [ ... ], "paginated": { "total": 0, "page": 1, "lastPage": 1 } }
```

### 8.2 Store

```ts
new CustomStore({
  key: 'id',
  load: async (loadOptions: any) => {
    const take = Number(loadOptions?.take) || this.pageSize;   // 20
    const skip = Number(loadOptions?.skip) || 0;
    const page = Math.floor(skip / take) + 1;
    const resp: any = await lastValueFrom(this.servicio.obtenerXData(page, take).pipe(take(1)));
    // data = resp.data; total = resp.paginated.total
    return { data, totalCount: total };
  }
});
```

### 8.3 Configuración del grid

`[remoteOperations]="{ paging: true }"`, `keyExpr="id"`, `showBorders`, `showColumnLines`, `showRowLines`, `rowAlternationEnabled`, `columnHidingEnabled`, `<dxo-paging [pageSize]="20">`, `<dxo-pager [showInfo]="true" [allowedPageSizes]="[20]" infoText="Página {0} de {1}">`, `<dxo-search-panel [visible]="true" [width]="200" placeholder="Buscar...">`, `<dxo-group-panel [visible]="true" emptyPanelText="Arrastre un encabezado de columna aquí para agrupar por esa columna">`, `<dxo-grouping [autoExpandAll]="autoExpandAllGroups">`, `<dxo-filter-row>` y `<dxo-header-filter>` visibles, `<dxo-export [enabled]="false">`.

La búsqueda del panel filtra en memoria la página cargada (`onGridOptionChanged`). No se envían filtros al backend.

### 8.4 Columnas

- Primera columna **Acciones** (`cellTemplate`, `allowFiltering/Sorting/Grouping false`), botones §7.4 con `ngbTooltip` y spinner mientras procesa.
- Columnas de datos con `dataField` siempre (sin `dataField` no filtran ni agrupan).
- Última columna **Estatus** (§7.6).
- Fechas con `dataType` y formato `dd/MM/yyyy` (o `dd/MM/yyyy HH:mm`); montos con `format: { type: 'currency', currency: 'MXN' }` o pipe `currency`.

### 8.5 Cabecera y acciones estándar

- `agregar()` → `router.navigateByUrl('/<dominio>/agregar-x')`.
- `actualizarX(id)` → `router.navigateByUrl('/<dominio>/editar-x/' + id)`.
- `toggleExpandGroups()` alterna `autoExpandAllGroups` (Swal si no hay agrupación).
- `limpiarCampos()` → `clearGrouping()`, `pageIndex(0)`, `refresh()`.
- Activar/Desactivar: confirmación §7.7 → `updateEstatus(id, 1|0)` (PATCH, `responseType: 'text'`) → Swal "¡Confirmación Realizada!" → `refresh()`.

---

## 9. Contrato de formularios

1. `FormBuilder` + `Validators` en el componente; validadores de grupo para relaciones (p. ej. `passwordsMatchValidator` → error `passwordMismatch`).
2. Misma pantalla para alta y edición: leer `:idX` de `ActivatedRoute`; título "Agregar X"/"Actualizar X"; botón "Guardar"/"Actualizar"; texto de carga "Guardando...".
3. Catálogos en `ngOnInit`; cascadas cliente → sala (`/salas/by-cliente/{id}`) → zona (`/zonas/by-sala/{id}`), limpiando hijos al cambiar el padre.
4. `idCliente` por defecto con `RolAccesoService.obtenerIdClientePorDefectoFormulario()`.
5. Submit inválido: `markAllAsTouched()` + Swal de campos faltantes (§7.7) y **`return`**.
6. Validación de rol (§6.3) antes de enviar cuando la acción está en §6.2.
7. Verbo de edición: el que ya use el servicio del dominio (§11). No inventar otro.
8. Montos: `Validators.min(0.01)` en movimientos de dinero; `min(0)` solo donde el dominio admite cero (fondos contados).
9. Tras éxito: Swal "¡Operación Exitosa!" + navegación a la lista.
10. Archivos: `UsuariosService.uploadFile(file, folder, idModule)` → `POST /s3/upload` (FormData `file`, `folder`, `idModule`). Tabla de `folder`/`idModule` vigente:

| Dominio | folder | idModule |
|---|---|---|
| Clientes | `clientes` | `1` |
| Usuarios | `usuarios` | `2` |
| Salas | `salas` | `6` |
| Afiliados | `afiliados` | `6` |
| Máquinas | `maquinas` | `8` |

---

## 10. Contrato de servicios HTTP

### 10.1 Forma

```ts
@Injectable({ providedIn: 'root' })
export class XService {
  constructor(private http: HttpClient) {}
  obtenerXData(page: number, limit: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/x/${page}/${limit}`);
  }
}
```

### 10.2 Convenciones de paths

| Operación | Patrón |
|---|---|
| Listado completo | `GET /recurso/list` |
| Paginado | `GET /recurso/{page}/{limit}` |
| Detalle | `GET /recurso/{id}` |
| Alta | `POST /recurso` |
| Edición | `PATCH /recurso/{id}` (excepciones `PUT`: módulos, permisos, roles, clientes) |
| Estatus 0/1 | `PATCH /recurso/estatus/{id}` (roles, usuarios, clientes, salas, zonas, máquinas, cajas, afiliados) o `PATCH /recurso/{id}/estatus` (módulos, permisos, monederos, tesorerías), body `{ estatus }`, respuesta texto |
| Baja | `DELETE /recurso/{id}` |
| Catálogos | `GET /cat<nombre>/list` |
| Operación | `POST /recurso/<verbo>` (`/pos/turnos/abrir`, `/tesorerias/cerrar`, …) |

---

## 11. Catálogo de endpoints consumidos

Paths relativos a `{API_SECURITY}`.

### 11.1 Auth y cuenta

| Método | Endpoint | Body / notas |
|---|---|---|
| POST | `/login` | `{ userName, password }` |
| POST | `/login/usuario/recuperar/acceso` | `{ email }` → texto |
| POST | `/login/cambiar/accesso` | nueva contraseña; `Authorization: Bearer <reset_token>` |
| POST | `/login/recuperar/confirmacion` | texto |
| PATCH | `/login/verify` | `{ codigo }` → texto (`SKIP_APP_AUTH` en afiliación) |
| POST | `/login/pasajero/registro` | legado transporte (afiliación) |
| GET/PUT | `/controlusuarios/{id}` | sin uso |

### 11.2 Administración

| Dominio | Endpoints |
|---|---|
| Módulos | GET `/modulos/{page}/{size}`, `/modulos/list`, `/modulos/{id}` · POST `/modulos` `{nombre, descripcion}` · PUT `/modulos/{id}` · PATCH `/modulos/{id}/estatus` · DELETE `/modulos/{id}` |
| Permisos | GET `/permisos/{page}/{size}`, `/permisos/permisosAgrupados`, `/permisos/{id}` · POST `/permisos` `{idModulo, nombre, descripcion}` · PUT `/permisos/{id}` · PATCH `/permisos/{id}/estatus` · DELETE `/permisos/{id}` |
| Roles | GET `/roles/{page}/{size}`, `/roles/list`, `/roles/{id}` · POST `/roles` `{nombre, descripcion}` · PUT `/roles/{id}` · PATCH `/roles/estatus/{id}` · DELETE `/roles/{id}` |
| Usuarios | GET `/usuarios/list`, `/usuarios/{page}/{size}`, `/usuarios/{id}`, `/usuarios/list/cliente/{idCliente}/rol` · POST `/usuarios` `{userName, passwordHash, nombre, apellidoPaterno, apellidoMaterno, telefono, fotoPerfil, idRol, idCliente, idSala, permisosIds[]}` · PATCH `/usuarios/{id}` (sin userName; contraseña opcional) · PATCH `/usuarios/estatus/{id}` · PATCH `/usuarios/actualizar/contrasena/{id}` `{contraseñaActual, contraseñaNueva}` · DELETE `/usuarios/{id}` |
| S3 | POST `/s3/upload` FormData `file`, `folder`, `idModule` → `{ url }` |
| Bitácora | GET `/bitacora/{page}/{size}`, `/bitacora/list` |
| Clientes | GET `/clientes/list`, `/clientes/{page}/{size}`, `/clientes/{id}` · POST `/clientes` · PUT `/clientes/{id}` · PATCH `/clientes/estatus/{id}` · DELETE `/clientes/{id}` |

Payload de cliente: `{ idPadre, rfc, tipoPersona (1 física | 2 moral), estatus (1), nombre, apellidoPaterno, apellidoMaterno, telefono, correo, estado, municipio, colonia, calle, entreCalles, numeroExterior, numeroInterior, cp, nombreEncargado, telefonoEncargado, correoEncargado, sitioWeb, logotipo, constanciaSituacionFiscal, comprobanteDomicilio, actaConstitutiva }`.

### 11.3 Dashboard

`POST /dashboard/kpis`

```ts
interface DashboardKpisRequest { fechaInicio: string; fechaFin: string; filtro: number /* 0 manual, 1 hoy, 2 semana, 3 mes */; idCliente: number; }
interface DashboardKpisResponse {
  periodo?: { fechaInicio?; fechaFin?; filtroAplicado?; granularidad? };
  alcance?: { clienteBase?: number; clientesIncluidos?: number[] };
  kpis?: { ggr?; ngr?; totalApuestas?; totalGanancias?; totalBonos?; bonusToGgrPorcentaje?; jugadoresActivos?;
           nuevosAfiliados?; totalSesiones?; duracionPromedioSesionMin?; arpu?; dauPromedio?; dauMaximo?;
           totalDepositos?; totalRetiros?; netCashFlow? };
  tendencias?: { ingresos?: Record<string, unknown>[] };      // periodo / valor
  ranking?: { top5MaquinasPorApuestas?: Record<string, unknown>[] };
  promociones?: { porEstatus?: Record<string, unknown>[] };
}
```

### 11.4 Estructura

| Dominio | Endpoints |
|---|---|
| Salas | GET `/salas/list`, `/salas/{page}/{size}`, `/salas/{id}`, `/salas/by-cliente/{idCliente}` · POST `/salas` · PATCH `/salas/{id}` · PATCH `/salas/estatus/{id}` · DELETE `/salas/{id}` · GET `/catmonedas/list`, `/catestatuslicencia/list` |
| Layout de sala | GET `/layout/mapa/{idSala}` · PATCH `/layout/mapa/{idSala}` `{ areaPoligonoJson }` |
| Zonas | GET `/zonas/list`, `/zonas/{page}/{size}`, `/zonas/by-sala/{idSala}`, `/zonas/{id}` · POST `/zonas` · PATCH `/zonas/{id}` · PATCH `/zonas/estatus/{id}` · DELETE `/zonas/{id}` · GET `/cattiposzona/list` |
| Máquinas | GET `/maquinas/list`, `/maquinas/{page}/{size}`, `/maquinas/by-sala/{idSala}`, `/maquinas/{id}` · POST `/maquinas` · PATCH `/maquinas/{id}` · PATCH `/maquinas/estatus/{id}` · DELETE `/maquinas/{id}` · GET `/cattiposmaquina/list`, `/catfabricantes/list`, `/catestatusmaquina/list` |
| Cajas | GET `/cajas/list`, `/cajas/{page}/{size}`, `/cajas/{id}` · POST `/cajas` · PATCH `/cajas/{id}` · PATCH `/cajas/estatus/{id}` · DELETE `/cajas/{id}` · GET `/cattiposcaja/list`, `/catestatuscaja/list` |

Payloads:

- Sala (`buildPayloadSala`): `{ nombre, nombreComercial, descripcion, logotipo, direccion, pais ('MEX'), estado, municipio, colonia, calle, numeroExterior, numeroInterior, codigoPostal, referencias, latitud, longitud (8 decimales), metrosCuadrados, numeroNiveles, capacidadPersonas, planoArquitectonico, planoDistribucion, licenciaOperacion, fechaVencimientoLicencia, idMonedaPrincipal, fechaInicioContrato, fechaFinContrato, idEstatusLicencia, idCliente, … }` (vacíos → `''` en textos y `null` en números/fechas).
- Zona: `{ nombre, descripcion, idTipoZona, idSala, nivel, anchoMetros, altoMetros, areaMetrosCuadrados, capacidadMaximaPersonas, capacidadMaximaMaquinas, areaPoligonoJSON }` (sin `idCliente`).
- Caja: `{ idSala, idZona, codigo, nombre, descripcion, idTipoCaja, idEstatusCaja: 2, limiteEfectivo, requiereArqueo }`.
- Layout:

```ts
interface AreaPoligonoJsonPayload {
  dimensiones: { ancho: number; alto: number; zoom: number };
  maquinaTamano: { ancho: number; alto: number };
  zonas: Array<{ id: number; x: number; y: number; w: number; h: number; maquinas: unknown[] /* {id,x,y} */ }>;
  maquinasSinZona: unknown[];
  entrada?: { x: number; y: number; r: number } | null;
  salida?: { x: number; y: number; r: number } | null;
}
```

### 11.5 Afiliados

| Método | Endpoint | Body / query |
|---|---|---|
| GET | `/afiliados/list`, `/afiliados/{page}/{limit}`, `/afiliados/{id}` | |
| GET | `/afiliados/buscar` | query libre (`texto`, `idSala`, fechas…) |
| GET | `/afiliados/numero/{numeroIdentificacion}` | |
| GET | `/afiliados/{id}/resumen`, `/afiliados/{id}/monederos` | |
| GET | `/afiliados/cumpleaneros` | `?tipo=hoy\|mes` |
| GET | `/afiliados/inactivos/sin-actividad` | |
| GET | `/afiliados/list/sin-monedero` | (monederos) |
| POST | `/afiliados` | payload de alta |
| PATCH | `/afiliados/{id}`, `/afiliados/estatus/{id}` | |
| DELETE | `/afiliados/{id}` | baja lógica |
| POST | `/afiliados/{id}/bloquear` | `{ motivo, fechaFinBloqueo: 'YYYY-MM-DD' }` |
| POST | `/afiliados/{id}/desbloquear` | `{}` |
| POST | `/afiliados/{id}/autoexclusion` | `{ motivo, duracionDias (≥30), observaciones }` |
| DELETE | `/afiliados/{id}/autoexclusion` | |
| POST | `/afiliados/{id}/nivel-vip` | `{ idNivelVIP, motivo }` |
| GET | `/cattiposidentificacion/list`, `/catnivelesvip/list`, `/catestatusafiliado/list` | |

Los servicios validan que `id` sea entero ≥ 1 antes de construir la URL.

### 11.6 Monederos y POS de monederos

| Método | Endpoint | Body / query |
|---|---|---|
| GET | `/monederos/{page}/{size}` | `?todos=true` opcional |
| GET | `/monederos/list`, `/monederos/{id}`, `/monederos/numero/{numero}`, `/monederos/afiliado/{idAfiliado}`, `/monederos/movimientos/historial/{id}` | |
| POST | `/monederos` | `{ idAfiliado, numeroMonedero, codigoRFID, idEstatusMonedero, esPrincipal, alias }` |
| PATCH | `/monederos/{id}` · `/monederos/{id}/estatus` | |
| DELETE | `/monederos/{id}` | |
| POST | `/monederos/cambiar-estatus` | `{ idMonedero, idEstatusMonedero, motivo }` |
| POST | `/monederos/traspaso` | `{ idTurnoCaja, idMonederoOrigen, idMonederoDestino, monto }` |
| POST | `/monederos/ajuste` | `{ idMonedero, tipoAjuste: 'positivo'\|'negativo', idTipoSaldo, monto, justificacion }` |
| POST | `/monederos/reemplazar` | `{ idMonederoAnterior, numeroMonederoNuevo, motivo, transferirSaldo }` |
| POST | `/pos/monederos/cargar` | `{ idCaja, idMonedero, monto }` |
| POST | `/pos/monederos/descargar` | monederos: `{ idCaja, idMonedero, monto }` · POS: `{ idTurnoCaja, idMonedero, monto }` |
| GET | `/pos/monederos/{numero}` | consulta de saldo |
| GET | `/catestatusmonedero/list`, `/cattipossaldo/list` | |
| GET | `/pos/turnos/activos?idSala=` | turnos activos para descarga/traspaso |

### 11.7 Tesorería (bóveda)

| Método | Endpoint | Body |
|---|---|---|
| GET | `/tesorerias/{page}/{size}` (listado completo = `1/10000`), `/tesorerias/{id}` | |
| GET | `/tesorerias/abierta/creada/sala/{idSala}`, `/tesorerias/resumen/completo/{id}`, `/tesorerias/movimientos/historial/{id}` | |
| POST | `/tesorerias` | alta directa (pantalla inalcanzable) |
| PATCH | `/tesorerias/{id}` · `/tesorerias/{id}/estatus` | |
| DELETE | `/tesorerias/{id}` | |
| POST | `/tesorerias/abrir` | `{ idSala, fondoInicial, observaciones?, turnosAbrir: [{ idCaja, fondoInicial, idUsuario? }] }` |
| POST | `/tesorerias/cerrar` | `{ idTesoreria, fondoContado, observaciones \| null }` |
| POST | `/tesorerias/reponer` | `{ idTesoreria, monto, referencia \| null, observaciones \| null }` |
| POST | `/tesorerias/retirar` | `{ idTesoreria, monto, referencia \| null, observaciones \| null }` |
| GET | `/catestatustesoreria/list`, `/ledger/saldo/tesoreria/{id}`, `/salas/list` | |

### 11.8 Turnos POS (prefijo `/pos/turnos`)

| Método | Endpoint | Body / query |
|---|---|---|
| GET | `/paginado/{page}/{limit}`, `/list`, `/mi-turno/activo`, `/activos`, `/{id}` | |
| GET | `/resumen/saldos/{id}`, `/movimientos/{id}` | |
| GET | `/consulta/filtrada` | query opcional |
| POST | `/abrir` | `{ idCaja, idTesoreria, idEstatusTurno, fondoInicial }` |
| POST | `/cerrar` | `{ idCaja, fondoContado, observaciones \| null }` |
| POST | `/reponer` | `{ idCaja, monto, motivo }` |
| POST | `/retirar` | `{ idCaja, monto, motivo }` |
| POST | `/suspender` | `{ idCaja, motivo, efectivoContado }` |
| POST | `/reactivar` | `{ idCaja, observaciones? }` |
| POST | `/corte-parcial` | `{ idCaja, efectivoContado, observaciones? }` |
| GET | `/catestatusturno/list` | |

### 11.9 Ledger

| Método | Endpoint |
|---|---|
| GET | `/ledger/{page}/{limit}` (en uso) |
| GET | `/ledger/saldo/monedero/{id}`, `/ledger/saldo/caja/{id}`, `/ledger/movimientos/monedero/{id}` (en servicio, sin uso en UI) |

### 11.10 Promociones (prefijo `/promociones`)

| Método | Endpoint | Notas |
|---|---|---|
| POST | `/promociones` | alta |
| GET | `/promociones` | query opcional |
| GET | `/{id}`, `/vigentes`, `/por-vencer`, `/afiliado/{id}`, `/monedero/{id}`, `/{id}/rollover`, `/{id}/rollover/historial`, `/pendientes-conversion`, `/cron/expirar` | |
| GET | `/reporte` | query de fechas |
| GET | `/catestatuspromocion/list`, `/cattipospromocion/list` | |

Payload de alta (`buildPayload`): `{ codigo, nombre, descripcion, idTipoPromocion, idSala, esPorcentaje (bool), porcentajeBono, montoFijo, montoMinDeposito, montoMaxBono, multiplicadorRollover, diasParaCompletar, fechaInicio, fechaFin, horaInicio, horaFin, diasAplica, soloNuevosAfiliados (bool), limiteUsosPorAfiliado, limiteUsosTotal, limiteUsosPorDia, idNivelVIPMinimo, diasMaxAntiguedad, visible (bool), requiereCodigoPromo (bool), codigoPromo, terminosCondiciones, activa (bool) }` (textos vacíos → `null`; Sí/No → boolean). No hay edición, pausa ni cambio de estatus en el servicio.

### 11.11 Monitoreo (servicio sin uso en UI)

GET `/monitoreo/{page}/{size}`, `/monitoreo/list`, `/monitoreo/list/{idCliente}` · POST `/monitoreo/recorrido`.

---

## 12. Gráficas y mapas

- Gráficas de negocio con **DevExtreme `dx-chart`**, tema oscuro, palette `['#00acc1', '#2979ff', '#e40041']`, datos tipados en un modelo junto al feature (como `dashboard-kpis.model.ts`).
- Mapas con **Google Maps JS nativo** ya cargado en `index.html` (esperar `window.google.maps`), estilos oscuros, pin `#ff1a5b` (salas) o círculos `#2fe3a7`/`#ff4b5c` (monitoreo). Coordenadas con 8 decimales; centro por defecto CDMX `19.4326, -99.1332`.

---

## 13. Responsive

1. `container-fluid` + grid Bootstrap (`col-12`, `col-md-*`, `col-lg-*`, `col-xl-*`).
2. `@media` en el SCSS del componente cuando el grid no baste (POS, bóveda, turnos, afiliados, dashboard, monitoreo).
3. DataGrid con `columnHidingEnabled`; en móvil se aceptan scroll horizontal y columnas ocultas.
4. Validar escritorio y 640–768 px en pantallas de operación.

---

## 14. Divergencias conocidas código ↔ contrato

Estado actual que **no** cumple este contrato. No se corrige sin petición explícita (§2).

| Tema | Estado en código |
|---|---|
| Textos de rol/API en UI | `lista-turnos.component.html` ("Requiere rol Jefe de Sala o Gerente", "/cajas/list", "ID de caja"), `lista-monederos.component.html` ("Ajuste manual (solo Gerente)"), afiliados ("según el servidor") |
| Acciones sin validación de rol | ver `contexto.md` §10.4 |
| Rol reutilizado | reponer/retirar bóveda usan `cerrarTesoreriaDelDia`; desbloquear usa `bloquearAfiliado` |
| Menú | no se filtra; `hasPermission` inexistente |
| `actualizar()` sin `return` | módulos, permisos, roles |
| Descarga de monedero | `idCaja` (monederos) vs `idTurnoCaja` (POS) |
| Cajas | `idEstatusCaja: 2` también al editar |
| RFC cliente | máximo 12 caracteres |
| Transacciones | columnas sin `dataField` |
| SCSS inexistentes | `lista-zonas`, `lista-maquinas` |
| `/lealtad` | en menú sin ruta |
| `::ng-deep` global | transacciones, recarga |
| Swal validación | solo agregar-afiliado usa `FormularioValidacionSwalService` |
| Clases sin definir | `btn-title--ghost`, `btn-title--secondary` |

---

## 15. Checklist para trabajo nuevo

- [ ] Es exactamente lo pedido; sin mejoras ni cambios colaterales.
- [ ] Sin comandos de terminal.
- [ ] Module + routing + lazy en `pages-routing` + ítem de menú (si aplica).
- [ ] Servicio en `shared/services` con URLs bajo `API_SECURITY`.
- [ ] Pantalla con banner §7.2 y `fadeInRight`.
- [ ] Lista con `dx-data-grid` según §8.
- [ ] Formulario según §9, con Swal de faltantes y `return`.
- [ ] Acciones sensibles registradas en `RolAccesoService` y validadas según §6.3.
- [ ] Ningún texto de UI cita API, Swagger, endpoints ni roles (§6.5).
- [ ] Colores, botones, campos y modales según §7.
- [ ] Responsive revisado.
- [ ] Endpoints nuevos añadidos a §11; alcance nuevo reflejado en `contexto.md`.
