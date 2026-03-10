# Contrato del proyecto AuraNet

Documento que define el alcance, la especificación y los compromisos del sistema tal como está implementado. Sirve como referencia única de “lo que tenemos” y como base para ampliaciones o mantenimiento.

**Ubicación de la documentación:** carpeta `docs/`  
**Documentos relacionados:** `PROJECT-CONTEXT.md` (contexto técnico y patrones para desarrollo).

---

## 1. Objeto del proyecto

- **Nombre:** AuraNet (workspace); en `package.json` aparece como "minible".
- **Tipo:** Aplicación web SPA (Single Page Application) para la operación de salas/casinos.
- **Objetivo:** Centralizar en una sola aplicación la gestión de afiliados, monederos, recargas (POS), tesorería/bóveda, turnos de caja, transacciones, estructura (clientes, salas, zonas, máquinas, cajas) y administración (módulos, permisos, roles, usuarios, bitácora).
- **Idioma de la interfaz:** Español.
- **Acceso:** Requiere autenticación (login); rutas principales protegidas con `AuthGuard`.

---

## 2. Stack técnico (compromiso del proyecto)

| Área | Tecnología utilizada |
|------|----------------------|
| Framework | Angular 17 |
| Grids y controles de datos | DevExtreme (dx-data-grid, dx-select-box, etc.) |
| Modales | NgBootstrap (NgbModal) |
| Formularios | Angular Reactive Forms (FormBuilder, FormGroup, Validators) |
| Alertas y confirmaciones | SweetAlert2 (Swal), con tema oscuro (`background: '#0d121d'`) |
| Estilos | SCSS, Bootstrap (utilidades), estilos globales en `src/styles.scss` |
| Animaciones | Animaciones propias en `src/app/core/` (fade-in-right, slide-down-fade, modal-animation) |
| Permisos en UI | ngx-permissions (cuando aplica) |
| Mapas | Google Maps (módulo Monitoreo) |

El proyecto se compromete a mantener estas tecnologías como estándar para nuevas funcionalidades, salvo que se acuerde un cambio explícito.

---

## 3. Alcance funcional (lo que está entregado)

### 3.1 Principal

| Funcionalidad | Ruta | Descripción |
|--------------|------|-------------|
| Tablero | `/dashboard` | Panel de control con métricas (afiliados, salas, máquinas, transacciones, etc.), gráficas y movimientos recientes. Datos actualmente estáticos. |
| POS (Recarga) | `/recarga` | Flujo en 4 pasos: selección de caja, monedero, monto y confirmación. Carga de efectivo a monederos con validaciones y resumen previo. |
| Perfil | `/contacts/profile` | Datos del usuario logueado y cambio de contraseña con validación de coincidencia. |

### 3.2 Administración

| Funcionalidad | Ruta | Descripción |
|--------------|------|-------------|
| Módulos | `/modulos` | Lista con grid (búsqueda, filtros, agrupación), alta, edición y activar/desactivar. |
| Permisos | `/permisos` | Lista con grid, alta, edición y activar/desactivar. |
| Roles | `/roles` | Lista con grid, alta, edición y activar/desactivar. |
| Usuarios | `/usuarios` | Lista con grid, alta, edición y activar/desactivar. |
| Bitácora | `/bitacora` | Solo consulta: grid con filtros y paginación. |

### 3.3 Estructura

| Funcionalidad | Ruta | Descripción |
|--------------|------|-------------|
| Clientes | `/clientes` | Lista con grid, alta, edición, activar/desactivar; columnas de documentos (Constancia Fiscal, Comprobante Domicilio, Acta Constitutiva) con previsualización. |
| Salas | `/salas` | Lista con grid, alta, edición y activar/desactivar. |
| Zonas | `/zonas` | Lista con grid, alta, edición y activar/desactivar. |
| Máquinas | `/maquinas` | Lista con grid, alta, edición y activar/desactivar. |
| Cajas | `/cajas` | Lista con grid, alta, edición y activar/desactivar. |
| Afiliados | `/afiliados` | Lista con grid, alta, edición y activar/desactivar. |

### 3.4 Operación y finanzas

| Funcionalidad | Ruta | Descripción |
|--------------|------|-------------|
| Boveda (Tesorería) | `/tesoreria` | Lista con grid; alta y edición de tesorería; pantalla “Abrir bóveda”; modales para resumen, historial, cerrar, reponer y retirar. |
| Ap. Turnos | `/turnos` | Lista de turnos con grid; pantalla “Abrir turno”; modales para consultar saldo de caja y reponer/retirar efectivo. |
| Monederos | `/monederos` | Lista con grid; alta y edición; modales para cargar, descargar, consultar saldo, cambiar estatus, traspaso y monederos por afiliado. Vista de saldo con efectivo y promociones. |
| Transacciones | `/transacciones` | Solo consulta: grid de movimientos con búsqueda y paginación. |
| Monitoreo | `/monitoreo` | Lista de ubicaciones con filtros y mapa (Google Maps). Datos actualmente estáticos. |

---

## 4. Ítems del menú sin implementación (fuera de alcance actual)

Los siguientes ítems aparecen en el menú (`src/app/layouts/sidebar/menu.ts`) pero **no** tienen ruta ni módulo implementado. Cualquier desarrollo sobre ellos se considera ampliación de alcance:

- **Indicadores:** Saldo no debitado, Premios entregados, Venta Acumulada, Promociones.
- **Catálogos:** Tipo Estado, Efectivo, Lealtad, Tipo de Identificación, Número de Identificación, Moneda, Cantidad Recibida.
- **Finanzas (submenú):** Caja (`/caja`), Bobeda (`/bobeda`). (La Boveda del menú principal sí usa `/tesoreria`.)
- **Tu cuenta:** enlace `/cuenta` (el perfil real está en `/contacts/profile`).

---

## 5. Estructura y convenciones del código

### 5.1 Carpetas principales

- `src/app/account/`: autenticación (login, registro, verificación, afiliación).
- `src/app/core/`: guards, interceptores, servicio de auth, animaciones.
- `src/app/layouts/`: layout principal, sidebar, definición del menú (`menu.ts`).
- `src/app/pages/`: módulos de negocio; rutas principales en `pages-routing.module.ts`.
- `src/app/shared/services/`: servicios por dominio (un servicio por entidad).

### 5.2 Convenciones de nombres

- **Rutas:** minúsculas con guiones (`agregar-modulo`, `editar-modulo/:idModulo`, `abrir-boveda`, `abrir-turno`).
- **Componentes de lista:** `Lista*Component` (selector `app-lista-*`).
- **Componentes de alta/edición:** `Agregar*Component` (selector `app-agregar-*`); mismo componente para crear y editar según parámetro de ruta.
- **Parámetros de ruta:** `idModulo`, `idCliente`, `idCaja`, `idAfiliado`, `idZona`, `idMaquina`, `idTesoreria`, etc.
- **Archivos:** `lista-modulos.component.ts`, `agregar-modulo.component.ts`, `modulos-routing.module.ts`, `modulos.module.ts`.

### 5.3 Patrones obligatorios para nuevas pantallas

- **Cabecera:** uso de `title-banner-card`, `title-icon`, `title-title`, `title-subtitle`, `title-buttons` y clases `btn-title`, `btn-title--primary`, `btn-title--ghost`, `btn-title--danger`.
- **Grids:** DevExtreme `dx-data-grid` con `CustomStore`, paginación remota cuando aplique, `searchPanel`, `filter-row`, `header-filter`, columna Acciones y columna Estatus con `estatus-activo` / `estatus-inactivo`.
- **Formularios:** Reactive Forms con `Validators`; montos con `Validators.min(0.01)`; selectores con `dx-select-box` y clase `dx-select-box-custom` cuando aplique.
- **Confirmaciones:** SweetAlert2 con `background: '#0d121d'` y textos en español.
- **Modales:** NgbModal con `TemplateRef` y formularios validados dentro del modal.
- **Animaciones:** `fadeInRightAnimation` en el contenedor principal de la página.

---

## 6. Servicios y API

- Los servicios de dominio viven en `src/app/shared/services/` (por ejemplo: `ModulosService`, `PermisosService`, `RolesService`, `UsuariosService`, `ClientesService`, `SalaService`, `ZonaService`, `CajasService`, `TesoreriaService`, `MonederosServices`, `TurnosService`, `TransaccionesService`, `BitacoraService`).
- Patrón de métodos: `obtener*()` / `obtener*Data(page, take)` para listados; `obtener*(id)` para edición; `crear*` / `actualizar*` para persistencia; `updateEstatus(id, estatus)` para activar/desactivar donde aplique.
- Algunos servicios son compartidos entre módulos (por ejemplo `CajasService` en recarga, turnos y afiliados; `TurnosService` en turnos y monederos).

---

## 7. Estilos globales

- Archivo principal: `src/styles.scss`.
- Clases de cabecera y botones: `.title-banner-card`, `.btn-title`, `.btn-title--primary`, `.btn-title--ghost`, `.btn-title--danger`.
- Estados en grids: `.estatus-activo`, `.estatus-inactivo`.
- Ajustes de DevExtreme (pager, etc.) en `styles.scss`. Los módulos pueden definir estilos propios en su `.scss` de componente.

---

## 8. Criterios de aceptación para desarrollo futuro

Para que una nueva funcionalidad se considere alineada con este contrato:

1. Debe usar el stack indicado (Angular 17, DevExtreme, NgBootstrap, Reactive Forms, SweetAlert2, SCSS).
2. Debe respetar las convenciones de nombres y la estructura de carpetas descritas.
3. Debe aplicar los patrones de cabecera, grid, formularios, modales y animaciones definidos.
4. Si aparece en el menú, la ruta debe estar registrada en `pages-routing.module.ts` (y en el módulo hijo si aplica) y el `link` en `menu.ts` debe coincidir.
5. Los textos de la UI deben estar en español y las alertas/confirmaciones usar el tema oscuro acordado.

---

## 9. Resumen

- **Contrato:** Este documento describe el alcance y las reglas del proyecto AuraNet tal como está construido.
- **Alcance:** Principal (Tablero, POS, Perfil), Administración (Módulos, Permisos, Roles, Usuarios, Bitácora), Estructura (Clientes, Salas, Zonas, Máquinas, Cajas, Afiliados), Operación (Boveda, Turnos, Monederos, Transacciones, Monitoreo).
- **Fuera de alcance actual:** Indicadores, catálogos listados en el menú, submenú Finanzas (Caja/Bobeda) y enlace “Tu cuenta” (`/cuenta`).
- **Documentación técnica detallada:** `docs/PROJECT-CONTEXT.md`.

**Última actualización:** según revisión de módulos y menú del proyecto (documento generado a partir del estado actual del código).
