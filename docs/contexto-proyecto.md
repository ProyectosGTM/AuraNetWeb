# Contexto del proyecto AuraNet

Documento de **consulta obligatoria** antes de analizar código o implementar cambios. Resume cómo está armado el sistema y dónde encontrar los patrones a replicar.

**Documentación relacionada (profundidad):** `PROJECT-CONTEXT.md`, `CONTRATO-DEL-PROYECTO.md`, APIs en `docs/API_*.md`.  
**Reglas estrictas de trabajo:** `contrato-proyecto.md`.

---

## 1. Qué es el sistema y su propósito

- **AuraNet** es una SPA en **Angular** (proyecto CLI `minible-ng` en `angular.json`) para la operación de salas/casinos y administración asociada.
- **Propósito:** concentrar POS/recargas, monederos, tesorería/bóveda, turnos de caja, transacciones, estructura (clientes, salas, zonas, máquinas, cajas, afiliados) y administración (módulos, permisos, roles, usuarios, bitácora), entre otros módulos bajo `src/app/pages/`.
- **UI en español.** Autenticación con guards; área principal bajo layout y `PagesModule`.

---

## 2. Estructura del proyecto

### 2.1 Carpetas clave

| Ruta | Rol |
|------|-----|
| `src/app/core/` | Guards, interceptors, auth, animaciones reutilizables |
| `src/app/layouts/` | Shell, sidebar, `menu.ts` (enlaces del menú) |
| `src/app/pages/` | Módulos de negocio; rutas en `pages-routing.module.ts` y en cada `*-routing.module.ts` |
| `src/app/shared/services/` | Servicios HTTP por dominio (`*Service`) |
| `src/app/shared/ui/` | `UIModule`: `PagetitleComponent`, `LoaderComponent` |
| `src/app/shared/shared.module.ts` | Reexporta `UIModule` (capa compartida mínima) |
| `src/assets/scss/` | Bootstrap, `app.scss`, iconos |
| `src/styles.scss` | Estilos globales del producto (cabeceras, grids, modales, etc.) |

### 2.2 Patrón por módulo de negocio

Cada dominio en `pages/<nombre>/` suele incluir:

- `<nombre>.module.ts` — declaraciones, imports (`DevExtremeModule`, `ReactiveFormsModule`, `NgbModalModule` si hay modales, etc.).
- `<nombre>-routing.module.ts` — rutas hijas.
- **`lista-<entidad>/`** — vista tipo **grid** (listado).
- **`agregar-<entidad>/`** — vista tipo **formulario**; el **mismo** componente suele servir para **alta** y **edición** (id por `ActivatedRoute`).

Rutas habituales: `''` → lista; `agregar-*`; `editar-*/:id...`. Algunos módulos añaden rutas puntuales (p. ej. `abrir-boveda`, `abrir-turno`).

---

## 3. Cómo se organizan las vistas

### 3.1 Vista tipo grid (listado)

- Contenedor `container-fluid` con animación `[@fadeInRight]` (p. ej. `fadeInRightAnimation` desde `core/`).
- Cabecera **`title-banner-card`** con icono, `title-title`, `title-subtitle`, botones `btn-title` (`--primary`, `--ghost`, `--danger`).
- Cuerpo: **`dx-data-grid`** con la configuración común del proyecto (ver sección 4).

**Referencias:** `lista-zonas`, `lista-clientes`, `lista-monederos`, `bitacora`, `lista-transacciones`.

### 3.2 Vista tipo formulario

- Misma cabecera `title-banner-card` adaptada al título (Agregar / Editar).
- **`FormGroup`** (Reactive Forms): `label.field`, `field-label`, controles **`input-sleek`** / **`sleek-control`**, y cuando aplica **`dx-select-box`** con clases del proyecto (`dx-select-box-custom`, etc.).
- Envío con servicios en `shared/services/`; en edición, carga con `patchValue` tras obtener por id.

**Referencias:** `agregar-zona`, `agregar-cliente`, `agregar-modulo`.

### 3.3 Páginas plantilla / demo

- Algunas rutas bajo `ui/`, `form/`, `tables/` usan **`app-page-title`** y componentes de plantilla; el **negocio** prioriza el patrón `title-banner-card` descrito arriba.

---

## 4. Grids (DevExtreme)

- Componente principal: **`dx-data-grid`** (`DevExtremeModule` en el módulo de la feature).
- **Tema global:** definido en `angular.json` (p. ej. `dx.fluent.saas.dark.compact.css`) más overrides en `src/styles.scss`.
- **Patrón recurrente en listas:** `columnHidingEnabled`, `showBorders`, `showColumnLines`, `showRowLines`, `rowAlternationEnabled`, `keyExpr`, `width: 100%`, `remoteOperations: { paging: true }`, `paging` / `pager` con textos en español (`infoText: 'Página {0} de {1}'`), `dxo-search-panel`, `dxo-filter-row`, `dxo-header-filter`, `dxo-group-panel` con mensaje tipo *“Arrastre un encabezado…”*, manejadores `onPageIndexChanged` / `onOptionChanged` según el listado.
- **Datos:** muchas listas usan **`CustomStore`** con `load` que mapea `skip`/`take` a la API; otras combinan búsqueda en cliente según el componente.
- **Columnas:** columna de acciones con `cellTemplate`; estatus con clases globales `estatus-activo` / `estatus-inactivo` donde aplique.

Antes de un grid nuevo: **abrir 2–3 listas del mismo tipo** y copiar la misma estructura de opciones y templates.

---

## 5. Formularios

- **Reactive Forms:** `FormBuilder`, `Validators` (required, min en montos, etc.).
- Controles alineados al diseño existente (`field`, `input-sleek`, DevExtreme donde ya se usa en ese módulo).
- **SweetAlert2** para éxito, error y confirmaciones; tono oscuro acorde al proyecto cuando se configure en el componente.

---

## 6. Modales

- **NgBootstrap `NgbModal`:** el módulo de la feature importa `NgbModalModule` si abre modales.
- **Implementación típica:** `ng-template` en el HTML del componente (a menudo en **`lista-*`**) y `modalService.open(templateRef, { size, windowClass, centered, ... })` en el `.ts`, con `@ViewChild` del `TemplateRef`.
- **Dos tipos permitidos (contrato de producto):**
  1. **Modal de formulario** — acciones crear/editar/procesar: cabecera/cuerpo/pie al estilo `modal-accion-header`, `modal-accion-body`, `modal-accion-footer`, formularios con validación y botones Cancelar + acción principal.
  2. **Modal de visualización** — solo lectura: listas, detalle, historial; pie suele ser solo cerrar (`btn-alt`, etc.).

Ejemplos ricos: `lista-monederos` (cargar, descargar, historial solo lectura, traspaso, etc.), `lista-tesoreria`, `recarga.component`.

---

## 7. Estilos (globales y locales)

| Ámbito | Dónde |
|--------|--------|
| Globales / tema app | `src/styles.scss`, `src/assets/scss/app.scss`, `bootstrap.scss`, `icons.scss` |
| DevExtreme | CSS de tema en `angular.json` + ajustes en `styles.scss` |
| Por componente | `*.component.scss` junto al `.ts` (listas complejas, POS, modales específicos) |

**Clases recurrentes del producto:** `title-banner-card`, `btn-title`, `field`, `input-sleek`, `modal-accion-*`, `form-indication`, `btn-alt`, chips/badges en cabeceras de modal, etc. **No inventar** nuevas familias si ya hay una clase equivalente en `styles.scss` o en un SCSS de referencia del mismo tipo de pantalla.

---

## 8. Componentes reutilizables existentes

- **`PagetitleComponent` / `LoaderComponent`** — `shared/ui/ui.module.ts`; usados sobre todo en vistas tipo plantilla.
- **Animaciones** — `src/app/core/` (`fadeInRightAnimation`, etc.).
- **Servicios** — `src/app/shared/services/` por entidad; reutilizar en lugar de duplicar llamadas HTTP.
- **No** hay una librería grande de “modales genéricos” en `shared`: el patrón es **plantilla + modal en el feature**.

---

## 9. Cómo usar este archivo en el día a día

1. Leer **`contrato-proyecto.md`** (reglas y alcance).
2. Leer este **`contexto-proyecto.md`** (dónde está cada patrón).
3. Abrir el **módulo más parecido** al cambio pedido y copiar estructura (rutas, HTML, TS, SCSS).
4. Si falta información de API o reglas de negocio, cruzar con `docs/API_*.md` y `CONTRATO-DEL-PROYECTO.md`.
