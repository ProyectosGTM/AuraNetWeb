# Contrato de desarrollo AuraNet

Documento de **reglas obligatorias** para cualquier cambio en el código o la documentación técnica del repositorio. Debe leerse **junto con** `contexto-proyecto.md` **antes** de analizar el código o implementar.

---

## 1. Orden de trabajo obligatorio

En cada solicitud del usuario:

1. **Revisar** `docs/contexto-proyecto.md`.
2. **Revisar** este `docs/contrato-proyecto.md`.
3. **Analizar** el código existente y localizar un **patrón equivalente** (misma familia: lista, formulario, modal, servicio).
4. **Indicar** brevemente qué patrón o archivos se tomarán de referencia.
5. **Implementar** únicamente lo pedido (ver sección 7).

Si `contexto-proyecto.md` o `contrato-proyecto.md` están desactualizados respecto a una decisión arquitectónica acordada, **actualizar primero** la documentación y luego el código.

---

## 2. Diseño y estilos

- **Respetar** colores, fondos, tipografías, espaciados y componentes visuales ya usados en pantallas similares.
- **No crear** estilos nuevos si ya existe una clase o patrón reutilizable en `src/styles.scss`, `src/assets/scss/` o en el `.scss` de un componente de referencia del mismo tipo.
- **Mantener** coherencia con el tema DevExtreme y Bootstrap ya integrados en el proyecto.

---

## 3. Estructura y arquitectura

- **Seguir** la organización actual: módulos bajo `src/app/pages/<dominio>/`, rutas en `*-routing.module.ts`, listas `lista-*`, formularios `agregar-*`, servicios en `src/app/shared/services/`.
- **No introducir** nuevas formas de organización (nuevas carpetas “por capa” distintas al patrón existente, nuevos patrones de routing, etc.) **salvo** que el usuario lo pida **explícitamente**.

---

## 4. Componentes y lógica

- **Reutilizar** componentes, animaciones y servicios ya existentes cuando cubran el caso.
- **No duplicar** lógica que ya esté centralizada en un servicio compartido, salvo que el usuario pida explícitamente un comportamiento distinto con alcance acotado.

---

## 5. Grids (DevExtreme)

- **Replicar** la misma configuración, estructura de columnas, templates, paginación y filtros que en grids **del mismo tipo** ya implementados.
- **No improvisar** una configuración distinta “por estética” sin alinearla a listas existentes del dominio.

---

## 6. Vistas

Solo existen estos modelos de pantalla de negocio salvo indicación contraria del usuario:

| Tipo | Uso |
|------|-----|
| **Vista tipo grid** | Listado principal con `dx-data-grid` y cabecera `title-banner-card` |
| **Vista tipo formulario** | Alta/edición con Reactive Forms y el mismo patrón visual que otras pantallas `agregar-*` |

Las rutas y nombres deben **alinearse** a las convenciones ya usadas en el módulo de referencia.

---

## 7. Modales

Solo están permitidos **dos** tipos conceptuales:

1. **Modal de formulario** — crear, editar o ejecutar una acción que requiere datos del usuario: formularios con validación y acciones de guardar/ejecutar + cancelar.
2. **Modal de visualización** — solo lectura: consulta, historial, detalle, listas informativas; sin envío de formulario de negocio salvo que el usuario pida explícitamente lo contrario.

**Prohibido** inventar un tercer “tipo” de modal como categoría de producto (p. ej. “modal wizard genérico”) sin que el usuario lo solicite. Dentro de los dos tipos, la **implementación** sigue el patrón existente (`NgbModal` + `ng-template`).

---

## 8. Regla de oro: alcance estricto

**No hacer nada que el usuario no haya pedido explícitamente.**

Queda **prohibido** sin una orden clara del usuario:

- Modificar archivos que **no** formen parte del alcance (HTML, TS, SCSS, JSON, etc.).
- Refactorizar, “limpiar”, renombrar variables o aplicar “mejoras” por iniciativa propia.
- Reorganizar carpetas o módulos.
- Tocar dependencias, configuración de build o entornos si no se pidió.
- Ampliar el comportamiento “por si acaso” (validaciones extra, mensajes, UI adicional).

Si se detecta un problema o una mejora posible:

- **No implementarla** por cuenta propia.
- Se puede **mencionar** al usuario como sugerencia opcional; la decisión es suya.

---

## 9. Prohibiciones resumidas

- Inventar estilos o patrones visuales sin contrastar con lo existente.
- Crear estructuras nuevas sin validar contra el código y este contrato.
- Ignorar `contexto-proyecto.md` y este documento antes de cambiar código.
- Implementar sin identificar antes un **ejemplo similar** en el repositorio.
- **Cualquier cambio no solicitado** explícitamente.

---

## 10. Objetivo

Garantizar **consistencia** de diseño y arquitectura, **reutilización** de patrones probados en el sistema y **cumplimiento exacto** de lo que el usuario pide, sin desviaciones no autorizadas.
