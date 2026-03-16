# Plan: Módulo Promociones (API Promociones)

Objetivo: exponer todos los **GET** de [Promociones (Swagger)](https://auran3t.mx/api/docs#/Promociones) en algo nuevo llamado **Promociones**, con el menú partido en **subitems** para que cada submódulo muestre unas cosas y otros otras, pero todo relacionado.

---

## 1. Servicios GET de la API Promociones (resumen)

| Método | Ruta | Uso sugerido |
|--------|------|-----------------------------|
| GET | `/promociones` | Listado general (grid) |
| GET | `/promociones/{id}` | Detalle de una promoción |
| GET | `/promociones/vigentes` | Solo promociones vigentes |
| GET | `/promociones/por-vencer` | Promociones próximas a vencer |
| GET | `/promociones/afiliado/{id}` | Promociones de un afiliado |
| GET | `/promociones/monedero/{id}` | Promociones de un monedero |
| GET | `/promociones/{id}/rollover` | Estado de rollover de una promoción |
| GET | `/promociones/{id}/rollover/historial` | Historial de rollover |
| GET | `/promociones/pendientes-conversion` | Bonos pendientes de convertir |
| GET | `/promociones/reporte` | Reporte de promociones |
| GET | `/promociones/cron/expirar` | Utilidad/cron expiración (si aplica en UI) |

Catálogos relacionados (para formularios/filtros):

- GET `/catestatuspromocion/list`
- GET `/cattipospromocion/list`

---

## 2. Estructura de menú propuesta

**Padre:** **Promociones** (icono ej. `uil-gift` o `uil-percentage`).

**Subitems (cada uno = una vista/módulo):**

| # | Subitem (label) | Ruta | Qué ve el usuario | GETs que usa |
|---|-----------------|------|-------------------|--------------|
| 1 | **Catálogo** | `/promociones/catalogo` | Listado de todas las promociones, filtros (vigentes, por vencer), detalle por ID | `GET /promociones`, `GET /promociones/{id}`, `GET /promociones/vigentes`, `GET /promociones/por-vencer` |
| 2 | **Por afiliado** | `/promociones/por-afiliado` | Promociones asociadas a un afiliado (selector/búsqueda de afiliado → grid/detalle) | `GET /promociones/afiliado/{id}` (+ opcionalmente `GET /promociones/{id}` para detalle) |
| 3 | **Por monedero** | `/promociones/por-monedero` | Promociones de un monedero (selector monedero → lista/detalle) | `GET /promociones/monedero/{id}` (+ opcionalmente `GET /promociones/{id}`) |
| 4 | **Rollover** | `/promociones/rollover` | Estado e historial de rollover por promoción (lista promociones → elegir una → rollover actual + historial) | `GET /promociones` o `GET /promociones/vigentes`, `GET /promociones/{id}/rollover`, `GET /promociones/{id}/rollover/historial` |
| 5 | **Pendientes de conversión** | `/promociones/pendientes-conversion` | Listado de bonos pendientes de convertir | `GET /promociones/pendientes-conversion` |
| 6 | **Reportes** | `/promociones/reportes` | Reporte general de promociones (y si aplica, enlace/utilidad expiración) | `GET /promociones/reporte`, opcional `GET /promociones/cron/expirar` |

Relación entre submódulos:

- **Catálogo** es el centro: de ahí se puede ir al detalle `/{id}` y desde el detalle enlazar a **Rollover** (rollover de esa promoción).
- **Por afiliado** y **Por monedero** son vistas “por entidad”; desde una fila se puede abrir el mismo detalle de promoción que en Catálogo.
- **Pendientes de conversión** y **Reportes** son vistas de operación/consulta que pueden filtrar o enlazar a una promoción por ID cuando el backend lo permita.

---

## 3. Menú en código (menu.ts)

Sustituir o añadir el ítem de Promociones para que quede un **padre con subitems** (y quitar el subitem “Promociones” que hoy está bajo Indicadores si se desea que todo viva bajo este nuevo padre):

```ts
// Opción A: Promociones como ítem propio con subitems (recomendado)
{
  id: 50,
  label: 'Promociones',
  icon: 'uil-gift',
  subItems: [
    { id: 51, label: 'Catálogo', link: '/promociones/catalogo' },
    { id: 52, label: 'Por afiliado', link: '/promociones/por-afiliado' },
    { id: 53, label: 'Por monedero', link: '/promociones/por-monedero' },
    { id: 54, label: 'Rollover', link: '/promociones/rollover' },
    { id: 55, label: 'Pendientes de conversión', link: '/promociones/pendientes-conversion' },
    { id: 56, label: 'Reportes', link: '/promociones/reportes' }
  ]
}
```

En **Indicadores** se puede eliminar el subitem `{ id: 17, label: 'Promociones', link: '/promociones' }` para evitar duplicado y que todo entre por **Promociones** > subitems.

---

## 4. Rutas (pages-routing y módulo Promociones)

- Ruta padre: `promociones` (lazy load del módulo de promociones).
- Rutas hijas (dentro del módulo):
  - `catalogo` → lista + detalle (ej. `catalogo`, `catalogo/:id`).
  - `por-afiliado` → vista por afiliado (ej. selector + resultado).
  - `por-monedero` → vista por monedero.
  - `rollover` → lista de promociones + selección → rollover + historial (ej. `rollover`, `rollover/:id`).
  - `pendientes-conversion` → una sola vista con el GET de pendientes.
  - `reportes` → vista de reporte (y opcional cron/expirar).

Ejemplo de rutas hijas (dentro de `promociones-routing.module.ts`):

```text
path: 'promociones',
  children: [
    { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
    { path: 'catalogo', component: CatalogoPromocionesComponent },
    { path: 'catalogo/:id', component: DetallePromocionComponent },
    { path: 'por-afiliado', component: PromocionesPorAfiliadoComponent },
    { path: 'por-monedero', component: PromocionesPorMonederoComponent },
    { path: 'rollover', component: RolloverPromocionesComponent },
    { path: 'rollover/:id', component: RolloverDetalleComponent },
    { path: 'pendientes-conversion', component: PendientesConversionComponent },
    { path: 'reportes', component: ReportesPromocionesComponent }
  ]
```

---

## 5. Reparto de GETs por submódulo (resumen)

| Submódulo | GETs principales |
|-----------|-------------------|
| **Catálogo** | `/promociones`, `/promociones/{id}`, `/promociones/vigentes`, `/promociones/por-vencer` |
| **Por afiliado** | `/promociones/afiliado/{id}` |
| **Por monedero** | `/promociones/monedero/{id}` |
| **Rollover** | `/promociones` o `/promociones/vigentes`, `/promociones/{id}/rollover`, `/promociones/{id}/rollover/historial` |
| **Pendientes de conversión** | `/promociones/pendientes-conversion` |
| **Reportes** | `/promociones/reporte` (y opcionalmente `/promociones/cron/expirar`) |

Catálogos para combos/filtros en cualquier vista que los necesite:

- `GET /catestatuspromocion/list`
- `GET /cattipospromocion/list`

---

## 6. Siguientes pasos de implementación

1. **Servicio Angular** `PromocionesService`: métodos para cada GET (y luego POST/PUT que se vayan usando).
2. **Módulo** `PromocionesModule` con routing hijo y componentes por cada subitem.
3. **Menú**: ítem **Promociones** con subitems como en §3; quitar “Promociones” de Indicadores si se desea todo bajo un solo menú.
4. **Implementar por fases**:
   - Fase 1: Catálogo (listado + detalle) y rutas básicas.
   - Fase 2: Por afiliado y Por monedero.
   - Fase 3: Rollover (estado + historial).
   - Fase 4: Pendientes de conversión y Reportes.

Con esto quedan todos los GET de Promociones repartidos en submódulos relacionados y un menú desglosado que permite ver “ciertas cosas en un módulo y otras en otro” de forma coherente.
