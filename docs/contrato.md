# AuraNet — Contrato de desarrollo

Normas y contrato técnico del frontend para implementar features nuevas alineadas al código existente. Complementa `docs/contexto.md`.

Base API: `environment.API_SECURITY` = `https://auran3t.mx/api` (dev y prod).  
Swagger de referencia backend: `https://auran3t.mx/api/docs` (solo para implementación; **nunca** como copy de UI).

---

## 1. Propósito del contrato

Este documento fija:

1. Cómo crear módulos, rutas, listas, formularios y modales.
2. Cómo hablar con la API desde servicios Angular.
3. Cómo aplicar control de rol en UI (`RolAccesoService`).
4. Catálogo de endpoints que el frontend **ya consume**.
5. Checklist obligatorio antes de mergear trabajo nuevo.

Si hay duda entre una doc antigua en `docs/` y el código de `shared/services`, **manda el código del servicio**.

---

## 2. Stack y límites

| Debe usarse en negocio | Evitar como patrón nuevo (salvo demos) |
|------------------------|----------------------------------------|
| Angular 17 + Reactive Forms | FakeBackend / JwtInterceptor inactivo |
| DevExtreme DataGrid / SelectBox / DateBox | Inventar otra librería de grid |
| SweetAlert2 con fondo `#0d121d` | Alertas nativas del browser |
| NgbModal para flujos operativos | Modales custom sin patrón del repo |
| `RolAccesoService` para acciones sensibles | Tooltips/HTML con “según API/Swagger” |
| Servicios `providedIn: 'root'` en `shared/services` | Duplicar HTTP en el componente |
| Bootstrap grid + SCSS del módulo | Cards decorativos innecesarios fuera del design system existente |

Colores de marca a respetar en feedback/login: acento `#e40041`, Swal `#0d121d`. Primary Minible `#5b73e8` permanece en tema Bootstrap.

---

## 3. Contrato de módulos y carpetas

### 3.1 Estructura obligatoria de un feature nuevo

```
src/app/pages/<dominio>/
  <dominio>.module.ts
  <dominio>-routing.module.ts
  lista-<dominio>/
    lista-<dominio>.component.ts|html|scss
  agregar-<dominio>/          # también editar
    agregar-<dominio>.component.ts|html|scss
```

Opcional: pantallas de operación (`abrir-*`, paneles) al mismo nivel.

### 3.2 Module

Declarar componentes del feature. Importar según necesidad:

- `CommonModule`, `FormsModule`, `ReactiveFormsModule`
- DevExtreme: `DxDataGridModule`, `DxSelectBoxModule`, `DxDateBoxModule`, `DxPopupModule`, …
- `NgbModalModule` / `NgbTooltipModule` si hay modales/tooltips
- `SharedModule` (pagetitle/loader)
- `RouterModule` vía `*-routing.module`

### 3.3 Routing del feature

```ts
{ path: '', component: ListaXComponent },
{ path: 'agregar-x', component: AgregarXComponent },
{ path: 'editar-x/:idX', component: AgregarXComponent },
```

### 3.4 Registro en la app

1. Lazy load en `pages/pages-routing.module.ts`:
   `{ path: '<dominio>', loadChildren: () => import('./<dominio>/<dominio>.module').then(m => m.XModule) }`
2. Entrada en `layouts/sidebar/menu.ts` (id único, label, icon `uil-*`, link).
3. Servicio en `shared/services/<dominio>.service.ts`.

### 3.5 Rutas raíz (no modificar sin necesidad)

| Path | Módulo |
|------|--------|
| `account` | AccountModule |
| `login` | LoginComponent + NoAuthGuard |
| `''` | Layout + PagesModule + AuthGuard |
| `pages` | ExtrapagesModule + AuthGuard |

---

## 4. Contrato de autenticación HTTP

1. Login: `POST /login` → guardar `token`, `user`, `permissions` en **sessionStorage**.
2. Todas las llamadas (salvo skip): Bearer vía `InterceptService`.
3. `FormData`: no forzar `Content-Type` JSON (el interceptor ya lo contempla).
4. 401: `ErrorInterceptor` → logout + reload.
5. No reactivar `JwtInterceptor` legacy sin decisión explícita.
6. `ngx-permissions`: no asumir que está cargado; el gate de negocio es `RolAccesoService` + (futuro) permisos de catálogo si se reactiva de forma consistente.

Entidad sesión: `entities/User.ts` (`rol` como id string alineado a `GET /roles/list`).

---

## 5. Contrato de UI — roles y acceso denegado

Archivo: `shared/services/rol-acceso.service.ts`  
Regla de proyecto: `.cursor/rules/aura-ui-permisos.mdc`

### 5.1 Catálogo de roles (ids string)

| Id | Etiqueta |
|----|----------|
| 1 | SA |
| 2 | Dev |
| 3 | Cliente |
| 4 | Administrador |
| 5 | Gerente |
| 6 | Sub-Gerente |
| 7 | Cajero |
| 8 | Recepcionista |

### 5.2 Acciones tipadas (`AccionConControlRol`)

| Acción | Roles permitidos | Uso en UI |
|--------|------------------|-----------|
| `gestionarCajasCliente` | 3 | Alta/edición cajas |
| `registrarAfiliado` | 3 | Alta/edición afiliados |
| `actualizarNivelVipAfiliado` | 5 | Modal VIP |
| `verCumpleanerosAfiliados` | 1,2,3,4 | Cumpleañeros |
| `bloquearAfiliado` | 5 | Bloqueo |
| `registrarAutoexclusionAfiliado` | 5 | Autoexclusión |
| `cancelarAutoexclusionAfiliado` | 1,2,3,4 | Cancelar autoexclusión |
| `abrirTesoreriaDelDia` | 3,4,5,6 | Abrir bóveda |
| `cerrarTesoreriaDelDia` | 3,4,5,6 | Cerrar bóveda |
| `reponerEfectivoTurno` | 5,6,7 | Turnos |
| `retirarEfectivoTurno` | 5,6,7 | Turnos |
| `suspenderTurno` | 5,6,7 | Turnos |
| `reactivarTurno` | 5,6,7 | Turnos |
| `corteParcialTurno` | 5,6,7 | Corte X |
| `registrarPromocion` | 3,4 | Alta promoción |
| `descargarEfectivoMonedero` | 7 | Descarga monedero |
| `ajustarSaldoMonedero` | 1,2,3,4,5,6 | Ajuste saldo |

### 5.3 Flujo obligatorio en acciones sensibles

```ts
if (!this.rolAcceso.puedeRealizarAccion('miAccion')) {
  this.rolAcceso.mostrarAccesoDenegado('miAccion');
  return;
}
// abrir modal / llamar API
```

Helpers adicionales:

- `esPerfilClienteLogueado()`, `mostrarAccesoSoloPerfilCliente('cajas'|'sucursales'|'afiliados')`
- `obtenerIdClientePorDefectoFormulario()`, `esRolSinClientePorDefectoEnFormularios()` (SA/Dev)

### 5.4 Prohibido en UI

- Mencionar Swagger, “según API”, IDs de rol crudos, “La API devolverá…”.
- Sustituir el gate por un tooltip técnico.

### 5.5 Extender el contrato de roles

1. Añadir clave a `AccionConControlRol`.
2. Registrar en `ACCIONES` con `rolesPermitidosIds`, título, subtítulo, `tituloRolesPermitidos` (copy de usuario).
3. Invocar el gate en el componente **antes** de modal/API.
4. Documentar la fila en esta sección del contrato.

---

## 6. Contrato de formularios

1. `FormBuilder` + `Validators` en el componente (o validadores de grupo cuando aplique, p. ej. passwords).
2. Catálogos: cargar en `ngOnInit` / al cambiar padre (cliente → salas → zonas).
3. Selects/fechas de negocio: preferir **DxSelectBox / DxDateBox**.
4. Montos: `Validators.min(0.01)` o `min(0)` según dominio; formateo con util de montos si el módulo ya lo usa.
5. Invalid submit: preferir `FormularioValidacionSwalService` o Swal consistente (`#0d121d`).
6. Edición: leer `:id` de `ActivatedRoute`, `PATCH`/`PUT` según el servicio existente del dominio (no inventar verbo distinto al servicio).
7. Tras éxito: Swal + navegar a la lista del módulo.

---

## 7. Contrato de listas y modales

### Listas

- `DxDataGrid` + paginación server-side vía método `obtenerXData(page, limit)` del servicio cuando exista.
- Acciones de fila: editar (routerLink/navigate), estatus (confirm Swal → PATCH estatus).
- `container-fluid` + page title del shared UI.

### Modales NgbModal

- Template en el HTML de la lista; `open` con `centered`, `backdrop: 'static'` cuando el flujo no deba cerrarse al click fuera.
- Forms del modal: mismo contrato de validators + roles.

### SweetAlert

- Confirmaciones destructivas / de negocio antes del HTTP.
- Errores de API: mensaje usable, sin stack ni jerga de contrato en el título visible.

---

## 8. Contrato de servicios HTTP

### 8.1 Forma

```ts
@Injectable({ providedIn: 'root' })
export class XService {
  constructor(private http: HttpClient) {}
  // URLs: `${environment.API_SECURITY}/recurso/...`
}
```

### 8.2 Convenciones observadas

| Operación | Patrón de path frecuente |
|-----------|---------------------------|
| Listado corto | `GET /recurso/list` |
| Paginado | `GET /recurso/{page}/{limit}` |
| Detalle | `GET /recurso/{id}` |
| Alta | `POST /recurso` |
| Actualización | `PATCH /recurso/{id}` (algunos legacy `PUT`: roles, permisos, módulos, clientes) |
| Soft estatus | `PATCH /recurso/estatus/{id}` o `PATCH /recurso/{id}/estatus` (ver servicio) |
| Baja | `DELETE /recurso/{id}` |
| Catálogos | `GET /cat…/list` |

POS y bóveda usan prefijos `/pos/...` y `/tesorerias/...` con verbos de acción (`abrir`, `cerrar`, `reponer`, …).

### 8.3 Auth / usuarios especiales

- Upload: `POST /s3/upload` (FormData) vía `UsuariosService`.
- Recuperación: `POST /login/usuario/recuperar/acceso`, `POST /login/cambiar/accesso`, etc.

---

## 9. Catálogo de endpoints consumidos por el frontend

Paths relativos a `{API_SECURITY}`. Verbos según implementación actual en `shared/services`.

### Auth

| Método | Endpoint |
|--------|----------|
| POST | `/login` |
| POST | `/login/usuario/recuperar/acceso` |
| POST | `/login/cambiar/accesso` |
| POST | `/login/recuperar/confirmacion` |
| PATCH | `/login/verify` |

### Módulos / Permisos / Roles

| Dominio | Métodos |
|---------|---------|
| Módulos | GET `/{page}/{size}`, `/list`, `/{id}` · POST `/` · PUT `/{id}` · PATCH `/{id}/estatus` · DELETE `/{id}` (prefijo `/modulos`) |
| Permisos | GET `/{page}/{size}`, `/permisosAgrupados`, `/{id}` · POST `/` · PUT `/{id}` · PATCH `/{id}/estatus` · DELETE `/{id}` |
| Roles | GET `/{page}/{size}`, `/list`, `/{id}` · POST `/` · PUT `/{id}` · PATCH `/estatus/{id}` · DELETE `/{id}` |

### Usuarios / Bitácora / S3 / Dashboard

| Método | Endpoint |
|--------|----------|
| GET | `/usuarios/list`, `/usuarios/{page}/{size}`, `/usuarios/{id}`, `/usuarios/list/cliente/{idCliente}/rol` |
| POST | `/usuarios` (FormData) |
| PATCH | `/usuarios/{id}`, `/usuarios/estatus/{id}`, `/usuarios/actualizar/contrasena/{id}` |
| DELETE | `/usuarios/{id}` |
| POST | `/s3/upload` |
| GET | `/bitacora/{page}/{size}`, `/bitacora/list` |
| POST | `/dashboard/kpis` |

### Clientes

| Método | Endpoint |
|--------|----------|
| GET | `/clientes/list`, `/clientes/{page}/{size}`, `/clientes/{id}` |
| POST | `/clientes` |
| PUT | `/clientes/{id}` |
| PATCH | `/clientes/estatus/{id}` |
| DELETE | `/clientes/{id}` |

### Salas / Layout

| Método | Endpoint |
|--------|----------|
| GET | `/salas/list`, `/salas/{page}/{size}`, `/salas/{id}`, `/salas/by-cliente/{idCliente}` |
| POST | `/salas` |
| PATCH | `/salas/{id}`, `/salas/estatus/{id}` |
| DELETE | `/salas/{id}` |
| GET/PATCH | `/layout/mapa/{idSala}` |
| GET | `/catmonedas/list`, `/catestatuslicencia/list` |

### Zonas / Máquinas / Cajas

| Dominio | Endpoints clave |
|---------|-----------------|
| Zonas | GET list/paginado/by-sala/id · POST · PATCH id · PATCH estatus · DELETE · GET `/cattiposzona/list` |
| Máquinas | GET list/paginado/by-sala/id · POST · PATCH id · PATCH estatus · DELETE · cats tipo/fabricante/estatus |
| Cajas | GET list/paginado/id · POST · PATCH id · PATCH `/cajas/estatus/{id}` · DELETE · `/cattiposcaja/list`, `/catestatuscaja/list` |

### Afiliados

| Método | Endpoint |
|--------|----------|
| GET | `/afiliados/list`, `/{page}/{limit}`, `/{id}`, `/buscar`, `/numero/{n}`, `/{id}/resumen`, `/{id}/monederos`, `/cumpleaneros`, `/inactivos/sin-actividad`, `/list/sin-monedero` |
| POST | `/afiliados`, `/{id}/bloquear`, `/{id}/desbloquear`, `/{id}/autoexclusion`, `/{id}/nivel-vip` |
| PATCH | `/afiliados/{id}`, `/afiliados/estatus/{id}` |
| DELETE | `/afiliados/{id}`, `/{id}/autoexclusion` |
| GET cats | `/cattiposidentificacion/list`, `/catnivelesvip/list`, `/catestatusafiliado/list` |

### Monederos + POS monederos

| Método | Endpoint |
|--------|----------|
| GET | `/monederos/list`, `/{page}/{size}`, `/{id}`, `/numero/{n}`, `/afiliado/{id}`, `/movimientos/historial/{id}` |
| POST | `/monederos`, `/cambiar-estatus`, `/traspaso`, `/ajuste`, `/reemplazar` |
| PATCH | `/monederos/{id}`, `/{id}/estatus` |
| DELETE | `/monederos/{id}` |
| POST | `/pos/monederos/cargar`, `/pos/monederos/descargar` |
| GET | `/pos/monederos/{numero}` |
| GET cats | `/catestatusmonedero/list`, `/cattipossaldo/list` |

### Tesorería (bóveda)

| Método | Endpoint |
|--------|----------|
| GET | `/tesorerias/{page}/{size}`, `/{id}`, `/abierta/creada/sala/{idSala}`, `/resumen/completo/{id}`, `/movimientos/historial/{id}` |
| POST | `/tesorerias`, `/abrir`, `/cerrar`, `/reponer`, `/retirar` |
| PATCH | `/tesorerias/{id}`, `/{id}/estatus` |
| DELETE | `/tesorerias/{id}` |
| GET | `/catestatustesoreria/list`, `/ledger/saldo/tesoreria/{id}` |

### Turnos POS

| Método | Endpoint |
|--------|----------|
| GET | `/pos/turnos/paginado/{page}/{limit}`, `/list`, `/mi-turno/activo`, `/activos`, `/resumen/saldos/{id}`, `/movimientos/{id}`, `/consulta/filtrada`, `/{id}` |
| POST | `/abrir`, `/cerrar`, `/reponer`, `/retirar`, `/suspender`, `/reactivar`, `/corte-parcial` (prefijo `/pos/turnos`) |
| GET | `/catestatusturno/list` |

### Ledger / transacciones

| Método | Endpoint |
|--------|----------|
| GET | `/ledger/{page}/{limit}`, `/ledger/saldo/monedero/{id}`, `/ledger/saldo/caja/{id}`, `/ledger/movimientos/monedero/{id}` |

### Promociones

| Método | Endpoint |
|--------|----------|
| POST | `/promociones` |
| GET | `/promociones`, `/{id}`, `/vigentes`, `/por-vencer`, `/afiliado/{id}`, `/monedero/{id}`, `/{id}/rollover`, `/{id}/rollover/historial`, `/pendientes-conversion`, `/reporte`, `/cron/expirar` |
| GET cats | `/catestatuspromocion/list`, `/cattipospromocion/list` |

> Swagger puede exponer PUT/DELETE/pausar/otorgar/etc. **No están** en `PromocionesService` hasta que se implementen explícitamente.

### Monitoreo (servicio shared; UI actual mock)

| Método | Endpoint |
|--------|----------|
| GET | `/monitoreo/{page}/{size}`, `/list`, `/list/{idCliente}` |
| POST | `/monitoreo/recorrido` |

---

## 10. Divergencias conocidas código ↔ docs antiguas

Usar el servicio, no la doc vieja:

| Tema | Código actual |
|------|---------------|
| Estatus monedero grid | `PATCH /monederos/{id}/estatus` |
| Afiliados inactivos | `GET /afiliados/inactivos/sin-actividad` |
| Clientes actualizar | `PUT /clientes/{id}` |
| Layout mapa sala | `GET\|PATCH /layout/mapa/{idSala}` |
| Afiliados sin monedero | `GET /afiliados/list/sin-monedero` |

Al alinear con Swagger, actualizar **servicio + este contrato** en el mismo cambio.

---

## 11. Responsive

1. Layout móvil-first con clases Bootstrap (`col-12`, breakpoints `md`/`lg`/`xl`).
2. SCSS del componente: `@media` cuando el grid no baste (paneles POS, bóveda, turnos, recarga).
3. No romper DataGrid en desktop; en móvil aceptar scroll horizontal o ocultar columnas secundarias como en listas existentes.
4. Probar al menos desktop y ancho ~640–768 px en pantallas de operación (recarga, turnos, monederos).

---

## 12. Gráficas

- KPIs / tendencias de negocio: **DevExtreme Chart** (como dashboard).
- No añadir Apex/Chart.js a un módulo casino solo porque existan en `/charts` del template.
- Si se necesita un chart nuevo: mismo look dark del dashboard y datos tipados (modelo junto al feature).

---

## 13. Checklist para trabajo futuro

Antes de considerar una feature lista:

- [ ] Carpeta module + routing + lazy en `pages-routing` + ítem menú (si aplica).
- [ ] Servicio en `shared/services` con URLs bajo `API_SECURITY`.
- [ ] Lista con DxDataGrid o justificación documentada.
- [ ] Form reactivo con validators; Swal de éxito/error consistente.
- [ ] Acciones sensibles registradas y gated en `RolAccesoService`.
- [ ] Cero copy de UI que cite API/Swagger/IDs técnicos de rol.
- [ ] Responsive revisado en la vista principal del feature.
- [ ] Endpoints nuevos añadidos a la sección 9 de este contrato.
- [ ] Contexto de dominio actualizado en `docs/contexto.md` si cambia el alcance del producto.
- [ ] No modificar módulos/demos Minible ajenos al requerimiento.
- [ ] No “arreglar” código colateral no pedido.

---

## 14. Alcance de cambios permitidos (acuerdo de trabajo)

Cuando se pida una tarea concreta:

1. Solo tocar archivos necesarios para esa tarea.
2. No ejecutar comandos de terminal innecesarios; si un comando es imprescindible, **preguntar antes**.
3. No generar resúmenes largos en chat si se pidieron artefactos (p. ej. solo estos docs).
4. Commits / PRs solo si el usuario lo solicita explícitamente.
5. Este par de documentos (`contexto.md`, `contrato.md`) es la base de verdad para futuras implementaciones en el frontend AuraNet.

---

## 15. Mapa rápido menú → path → módulo

| Menú | Path | Carpeta |
|------|------|---------|
| Tablero | `/dashboard` | `pages/dashboards/default` |
| Módulos | `/modulos` | `pages/modulos` |
| Permisos | `/permisos` | `pages/permisos` |
| Roles | `/roles` | `pages/roles` |
| Clientes | `/clientes` | `pages/clientes` |
| Usuarios | `/usuarios` | `pages/usuarios` |
| Bitácora | `/bitacora` | `pages/bitacora` |
| Salas | `/salas` | `pages/salas` |
| Zonas | `/zonas` | `pages/zonas` |
| Máquinas | `/maquinas` | `pages/maquinas` |
| Cajas | `/cajas` | `pages/cajas` |
| Afiliados | `/afiliados` | `pages/afiliados` |
| Monederos | `/monederos` | `pages/monederos` |
| Bóveda | `/tesoreria` | `pages/tesoreria` |
| Ap. Turnos | `/turnos` | `pages/turnos` |
| Transacciones | `/transacciones` | `pages/transacciones` |
| POS | `/recarga` | `pages/recarga` |
| Promociones | `/promociones` | `pages/promociones` |
| Monitoreo | `/monitoreo` | `pages/monitoreo` |
| Perfil | `/contacts/profile` | `pages/contacts` (template) |
| Cajero (fuera de menú activo) | `/cajero` | `pages/cajero` |
