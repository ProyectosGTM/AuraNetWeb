# Contrato de Desarrollo - AuraNet

## 📋 Índice
1. [Introducción](#introducción)
2. [Estándares de Código](#estándares-de-código)
3. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
4. [Estructura de Componentes](#estructura-de-componentes)
5. [Patrones Obligatorios](#patrones-obligatorios)
6. [Estándares de UI/UX](#estándares-de-uiux)
7. [Grids y Tablas](#grids-y-tablas)
8. [Formularios](#formularios)
9. [Modales](#modales)
10. [Servicios y APIs](#servicios-y-apis)
11. [Manejo de Errores](#manejo-de-errores)
12. [Animaciones](#animaciones)
13. [Estilos y SCSS](#estilos-y-scss)
14. [Git y Commits](#git-y-commits)
15. [Documentación](#documentación)
16. [Prohibiciones](#prohibiciones)
17. [Proceso de Revisión](#proceso-de-revisión)

---

## Introducción

Este documento establece el **contrato de desarrollo** que todos los desarrolladores deben seguir al trabajar en el proyecto AuraNet. El incumplimiento de estas reglas puede resultar en el rechazo de pull requests y requerir refactorización.

**OBJETIVO:** Mantener consistencia, calidad y mantenibilidad del código en todo el proyecto.

**VIGENCIA:** Este contrato es obligatorio para todos los desarrolladores desde su fecha de publicación.

---

## Estándares de Código

### TypeScript

#### ✅ OBLIGATORIO

1. **Indentación:** 2 espacios (NO tabs)
2. **Comillas:** Comillas simples (`'`) para strings
3. **Punto y coma:** SIEMPRE al final de cada declaración
4. **Línea máxima:** 140 caracteres
5. **Encoding:** UTF-8
6. **Final de línea:** Debe terminar con nueva línea

```typescript
// ✅ CORRECTO
const nombre = 'Juan';
const apellido = 'Pérez';

// ❌ INCORRECTO
const nombre = "Juan"  // Sin punto y coma, comillas dobles
```

#### Estructura de Archivos TypeScript

```typescript
// 1. Imports de Angular
import { Component, OnInit } from '@angular/core';

// 2. Imports de terceros
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

// 3. Imports locales (relativos)
import { ServicioService } from '../../shared/services/servicio.service';

// 4. Decorador @Component
@Component({
  selector: 'app-componente',
  templateUrl: './componente.component.html',
  styleUrls: ['./componente.component.scss']
})

// 5. Clase del componente
export class ComponenteComponent implements OnInit {
  // Propiedades públicas primero
  public listaDatos: any[] = [];
  
  // Propiedades privadas después
  private servicio: ServicioService;
  
  // Constructor
  constructor() {}
  
  // Lifecycle hooks
  ngOnInit(): void {}
}
```

### EditorConfig

El proyecto incluye `.editorconfig`. **DEBES** configurar tu editor para respetarlo:

```ini
indent_style = space
indent_size = 2
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true
```

---

## Convenciones de Nomenclatura

### ✅ OBLIGATORIO

#### Archivos y Carpetas

- **Componentes:** `kebab-case.component.ts`
  - ✅ `lista-clientes.component.ts`
  - ❌ `ListaClientes.component.ts`
  - ❌ `listaClientes.component.ts`

- **Servicios:** `kebab-case.service.ts`
  - ✅ `clientes.service.ts`
  - ❌ `ClientesService.ts`

- **Modelos/Interfaces:** `kebab-case.model.ts` o `kebab-case.interface.ts`
  - ✅ `menu.model.ts`
  - ✅ `user.interface.ts`

- **Carpetas:** `kebab-case`
  - ✅ `lista-clientes/`
  - ❌ `ListaClientes/`

#### Clases y Tipos

- **Componentes:** `PascalCase` + sufijo `Component`
  - ✅ `ListaClientesComponent`
  - ❌ `listaClientesComponent`

- **Servicios:** `PascalCase` + sufijo `Service`
  - ✅ `ClientesService`
  - ❌ `clientesService`

- **Interfaces:** `PascalCase` (sin prefijo `I`)
  - ✅ `MenuItem`
  - ❌ `IMenuItem`

#### Variables y Propiedades

- **Variables:** `camelCase`
  - ✅ `listaClientes`, `usuarioActual`
  - ❌ `ListaClientes`, `usuario_actual`

- **Constantes:** `UPPER_SNAKE_CASE`
  - ✅ `API_URL`, `MAX_RETRIES`
  - ❌ `apiUrl`, `maxRetries`

- **Propiedades privadas:** `camelCase` (sin prefijo `_`)
  - ✅ `private servicio: ServicioService`
  - ❌ `private _servicio: ServicioService`

#### Métodos

- **Métodos públicos:** `camelCase` con verbo
  - ✅ `cargarDatos()`, `guardarCliente()`, `eliminarItem()`
  - ❌ `LoadData()`, `guardar_cliente()`

- **Métodos privados:** `camelCase` con verbo
  - ✅ `private validarFormulario()`
  - ❌ `private _validarFormulario()`

#### Selectores de Componentes

- **Selector:** `app-kebab-case`
  - ✅ `app-lista-clientes`
  - ❌ `appListaClientes`
  - ❌ `app-listaClientes`

---

## Estructura de Componentes

### ✅ OBLIGATORIO: Estructura Estándar

Todos los componentes DEBEN seguir esta estructura:

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicioService } from '../../shared/services/servicio.service';

@Component({
  selector: 'app-nombre-componente',
  templateUrl: './nombre-componente.component.html',
  styleUrls: ['./nombre-componente.component.scss'],
  animations: [fadeInRightAnimation] // Si aplica
})
export class NombreComponenteComponent implements OnInit {
  
  // 1. ViewChild/ViewChildren
  @ViewChild('gridContainer', { static: false }) gridContainer: DxDataGridComponent;
  
  // 2. Propiedades públicas
  public listaDatos: any[] = [];
  public formulario: FormGroup;
  public pageSize: number = 50;
  
  // 3. Propiedades privadas
  private id: number | null = null;
  
  // 4. Constructor
  constructor(
    private fb: FormBuilder,
    private servicio: ServicioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.inicializarFormulario();
  }
  
  // 5. Lifecycle hooks
  ngOnInit(): void {
    this.cargarDatos();
  }
  
  // 6. Métodos públicos
  public cargarDatos(): void {
    // Implementación
  }
  
  // 7. Métodos privados
  private inicializarFormulario(): void {
    // Implementación
  }
}
```

### Orden de Propiedades

1. `@ViewChild` / `@ViewChildren`
2. Propiedades públicas
3. Propiedades privadas
4. Constructor
5. Lifecycle hooks (`ngOnInit`, `ngAfterViewInit`, etc.)
6. Métodos públicos
7. Métodos privados

---

## Patrones Obligatorios

### 1. Componentes de Lista

**DEBES** seguir este patrón exacto:

```typescript
export class ListaComponenteComponent implements OnInit {
  listaDatos: any[] = [];
  pageSize: number = 50;
  showFilterRow: boolean = true;
  showHeaderFilter: boolean = true;
  autoExpandAllGroups: boolean = true;
  mensajeAgrupar: string = 'Arrastra una columna aquí para agrupar';
  
  @ViewChild('gridContainer', { static: false }) gridContainer: DxDataGridComponent;
  
  ngOnInit(): void {
    this.cargarDatos();
  }
  
  cargarDatos(): void {
    this.servicio.obtenerTodos().subscribe({
      next: (data) => {
        this.listaDatos = data;
      },
      error: (error) => {
        this.mostrarError('Error al cargar datos');
      }
    });
  }
  
  agregar(): void {
    this.router.navigate(['/ruta/agregar']);
  }
  
  actualizar(id: number): void {
    this.router.navigate(['/ruta/agregar', id]);
  }
  
  activar(item: any): void {
    // Implementación
  }
  
  desactivar(item: any): void {
    // Implementación
  }
  
  onPageIndexChanged(event: any): void {
    // Implementación
  }
  
  onGridOptionChanged(event: any): void {
    // Implementación
  }
  
  toggleExpandGroups(): void {
    this.autoExpandAllGroups = !this.autoExpandAllGroups;
  }
  
  limpiarCampos(): void {
    // Limpiar filtros del grid
  }
}
```

### 2. Componentes de Formulario

**DEBES** seguir este patrón exacto:

```typescript
export class AgregarComponenteComponent implements OnInit {
  formulario: FormGroup;
  title: string = 'Agregar';
  submitButton: string = 'Guardar';
  id: number | null = null;
  
  constructor(
    private fb: FormBuilder,
    private servicio: ServicioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.inicializarFormulario();
  }
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.title = 'Editar';
        this.submitButton = 'Actualizar';
        this.cargarDatos();
      }
    });
  }
  
  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      campo1: ['', Validators.required],
      campo2: ['', Validators.required]
    });
  }
  
  submit(): void {
    if (this.formulario.valid) {
      if (this.id) {
        this.actualizar();
      } else {
        this.crear();
      }
    } else {
      this.mostrarErrorValidacion();
    }
  }
  
  crear(): void {
    this.servicio.crear(this.formulario.value).subscribe({
      next: () => {
        this.mostrarExito('Registro creado exitosamente');
        this.regresar();
      },
      error: (error) => {
        this.mostrarError('Error al crear registro');
      }
    });
  }
  
  actualizar(): void {
    this.servicio.actualizar(this.id!, this.formulario.value).subscribe({
      next: () => {
        this.mostrarExito('Registro actualizado exitosamente');
        this.regresar();
      },
      error: (error) => {
        this.mostrarError('Error al actualizar registro');
      }
    });
  }
  
  regresar(): void {
    this.router.navigate(['/ruta/lista']);
  }
}
```

### 3. Servicios

**DEBES** seguir este patrón exacto:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = 'https://api.ejemplo.com/endpoint';
  
  constructor(private http: HttpClient) {}
  
  obtenerTodos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }
  
  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  
  crear(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, data);
  }
  
  actualizar(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  
  activar(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/activar`, {});
  }
  
  desactivar(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/desactivar`, {});
  }
}
```

---

## Estándares de UI/UX

### ✅ OBLIGATORIO: Banner de Título

**TODOS** los componentes DEBEN incluir el banner de título estándar:

```html
<div class="title-banner-card shadow-sm">
    <div class="title-banner-content d-flex align-items-center justify-content-between flex-wrap p-1 pb-0">
        <div class="d-flex align-items-center gap-3">
            <div class="title-icon">
                <i class="fas fa-[icono-adecuado]"></i>
            </div>
            <div>
                <h4 class="title-title">{{title}}</h4>
                <p class="title-subtitle">Descripción clara y concisa</p>
            </div>
        </div>
        <div class="title-actions">
            <div class="title-tagline">
                <span class="line"></span>
                <span class="text">Tagline descriptivo</span>
            </div>
            <!-- Botones de acción si aplica -->
        </div>
    </div>
</div>
```

### Iconos

- **Font Awesome:** Usar `fas fa-*` para iconos en componentes
- **Unicons:** Usar `uil-*` SOLO en el menú sidebar
- **Consistencia:** Usar el mismo icono para la misma acción en todo el proyecto

### Animaciones

**DEBES** incluir animaciones en componentes de página:

```html
<div class="container-fluid" [@fadeInRight]>
```

**NO** uses animaciones personalizadas sin aprobación. Usa las animaciones existentes:
- `fadeInRightAnimation`
- `slideDownFadeAnimation`
- `staggerFadeInAnimation`

---

## Grids y Tablas

### ✅ OBLIGATORIO: Configuración Estándar

**TODOS** los grids DEBEN usar esta configuración base:

```html
<dx-data-grid 
    #gridContainer 
    id="gridContainer" 
    [columnHidingEnabled]="true" 
    [showBorders]="'true'"
    [showColumnLines]="true" 
    [showRowLines]="true" 
    [rowAlternationEnabled]="'true'"
    [dataSource]="listaDatos" 
    [keyExpr]="'id'" 
    [width]="'100%'"
    [remoteOperations]="{ paging: true }" 
    [paging]="{ pageSize: pageSize }" 
    [pager]="{ 
        showPageSizeSelector: true, 
        allowedPageSizes: [50], 
        showInfo: true,
        infoText: 'Página {0} de {1}', 
        visible: true 
    }" 
    (onPageIndexChanged)="onPageIndexChanged($event)"
    (onOptionChanged)="onGridOptionChanged($event)">
```

### ✅ OBLIGATORIO: Características Mínimas

**TODOS** los grids DEBEN incluir:

1. **Panel de búsqueda:**
```html
<dxo-search-panel [visible]="true" [width]="200" placeholder="Buscar..."></dxo-search-panel>
```

2. **Paginación:**
```html
<dxo-pager [showPageSizeSelector]="true" [allowedPageSizes]="[20]" [showInfo]="true"></dxo-pager>
```

3. **Columna de Acciones:**
```html
<dxi-column caption="Acciones" cellTemplate="Acciones" alignment="center" [width]="150"></dxi-column>
```

4. **Template de Acciones:**
```html
<div *dxTemplate="let row of 'Acciones'" class="d-flex gap-3 justify-content-center">
    <button class="btnAcciones" (click)="actualizar(row.data.id)" ngbTooltip="Editar">
        <i class="fa fa-edit"></i>
    </button>
    <button *ngIf="row.data.estatus === 0" class="btnAcciones" (click)="activar(row.data)" ngbTooltip="Activar">
        <i class="fa fa-arrow-up"></i>
    </button>
    <button *ngIf="row.data.estatus === 1" class="btnAcciones" (click)="desactivar(row.data)" ngbTooltip="Desactivar">
        <i class="fa fa-arrow-down"></i>
    </button>
</div>
```

### ✅ OBLIGATORIO: Estatus

**TODOS** los grids con campo `estatus` DEBEN usar este template:

```html
<dxi-column dataField="estatus" caption="Estatus" cellTemplate="est">
    <div *dxTemplate="let f of 'est'">
        <span *ngIf="f.data.estatus === 1" class="estatus estatus-activo">Activo</span>
        <span *ngIf="f.data.estatus !== 1" class="estatus estatus-inactivo">Inactivo</span>
    </div>
</dxi-column>
```

---

## Formularios

### ✅ OBLIGATORIO: Estructura de Campos

**TODOS** los campos DEBEN usar el estilo "sleek":

```html
<label class="field">
    <span class="field-label text-white">Etiqueta *</span>
    <div class="input-sleek">
        <i class="fas fa-[icono-adecuado]"></i>
        <input 
            formControlName="campo" 
            class="sleek-control" 
            type="text" 
            placeholder="Placeholder descriptivo" />
        <span class="sleek-line"></span>
    </div>
</label>
```

### ✅ OBLIGATORIO: Select Box

**TODOS** los select DEBEN usar DevExtreme SelectBox:

```html
<label class="field">
    <span class="field-label text-white">Selección *</span>
    <dx-select-box
        [dataSource]="listaOpciones"
        displayExpr="text"
        valueExpr="id"
        formControlName="campo"
        placeholder="Selecciona una opción..."
        searchEnabled="true"
        searchMode="contains"
        [showClearButton]="true"
        class="dx-select-box-custom">
    </dx-select-box>
</label>
```

### ✅ OBLIGATORIO: Botones de Formulario

**TODOS** los formularios DEBEN usar estos botones:

```html
<div class="d-flex justify-content-start gap-3 flex-wrap">
    <button (click)="submit()" type="button" class="btn-alt btn-alt--success" [disabled]="formulario.invalid">
        <i class="fas fa-check"></i>
        <span>{{submitButton}}</span>
    </button>
    <button (click)="regresar()" type="button" class="btn-alt btn-alt--cancel">
        <i class="fas fa-times"></i>
        <span>Cancelar</span>
    </button>
</div>
```

### Validación

- **SIEMPRE** valida formularios antes de enviar
- **SIEMPRE** muestra mensajes de error claros
- **SIEMPRE** deshabilita botones cuando el formulario es inválido
- **NO** uses validación HTML5 nativa, usa Angular Reactive Forms

---

## Modales

### ✅ OBLIGATORIO: Estructura de Modal

**TODOS** los modales DEBEN seguir esta estructura:

```html
<ng-template #modalNombre let-modal>
    <div class="modal-header modal-accion-header modal-accion-header--[tipo]">
        <h5 class="modal-title">
            <i class="fas fa-[icono]"></i>
            <span>Título del Modal</span>
        </h5>
        <button type="button" class="btn-close" (click)="cerrarModal()">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div class="modal-body modal-accion-body">
        <div class="form-indication form-indication--[tipo]">
            <i class="fas fa-[icono]"></i>
            <span>Descripción de la acción</span>
        </div>
        <form [formGroup]="formularioModal">
            <!-- Campos -->
        </form>
    </div>
    <div class="modal-footer modal-accion-footer">
        <button type="button" class="btn-alt btn-alt--cancel" (click)="cerrarModal()">
            <i class="fas fa-times"></i><span>Cancelar</span>
        </button>
        <button type="button" class="btn btn-[color]" (click)="guardar()" [disabled]="formularioModal.invalid">
            <i class="fas fa-check"></i> Guardar
        </button>
    </div>
</ng-template>
```

### Tipos de Modal Header

- `modal-accion-header--abrir-turno` (verde)
- `modal-accion-header--cerrar-turno` (amarillo)
- `modal-accion-header--descargar` (naranja)
- `modal-accion-header--consultar-saldo` (azul)

### Tipos de Form Indication

- `form-indication--info` (azul)
- `form-indication--warning` (amarillo)
- `form-indication--success` (verde)
- `form-indication--danger` (rojo)

---

## Servicios y APIs

### ✅ OBLIGATORIO: Estructura de Servicio

**TODOS** los servicios DEBEN seguir este patrón:

```typescript
@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = 'https://api.ejemplo.com/endpoint';
  
  constructor(private http: HttpClient) {}
  
  // Métodos CRUD estándar
  obtenerTodos(): Observable<any[]> { }
  obtenerPorId(id: number): Observable<any> { }
  crear(data: any): Observable<any> { }
  actualizar(id: number, data: any): Observable<any> { }
  eliminar(id: number): Observable<any> { }
  activar(id: number): Observable<any> { }
  desactivar(id: number): Observable<any> { }
}
```

### Manejo de Observables

**DEBES** usar la sintaxis moderna de RxJS:

```typescript
// ✅ CORRECTO
this.servicio.obtenerTodos().subscribe({
  next: (data) => {
    this.listaDatos = data;
  },
  error: (error) => {
    this.mostrarError('Error al cargar datos');
  }
});

// ❌ INCORRECTO (sintaxis antigua)
this.servicio.obtenerTodos().subscribe(
  (data) => { },
  (error) => { }
);
```

---

## Manejo de Errores

### ✅ OBLIGATORIO: SweetAlert2

**TODOS** los mensajes de éxito/error DEBEN usar SweetAlert2:

```typescript
import Swal from 'sweetalert2';

// Éxito
Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: 'Operación realizada correctamente',
    confirmButtonColor: '#34c38f'
});

// Error
Swal.fire({
    icon: 'error',
    title: 'Error',
    text: 'Ocurrió un error al procesar la solicitud',
    confirmButtonColor: '#f46a6a'
});

// Confirmación
Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f46a6a',
    cancelButtonColor: '#74788d',
    confirmButtonText: 'Sí, continuar'
}).then((result) => {
    if (result.isConfirmed) {
        // Acción
    }
});
```

**NO** uses `alert()`, `confirm()`, o `console.log()` para mensajes al usuario.

---

## Animaciones

### ✅ OBLIGATORIO: Animaciones Permitidas

**SOLO** puedes usar estas animaciones:

1. `fadeInRightAnimation` - Para páginas completas
2. `slideDownFadeAnimation` - Para elementos que aparecen
3. `staggerFadeInAnimation` - Para listas de elementos

```typescript
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';

@Component({
  animations: [fadeInRightAnimation]
})
```

```html
<div [@fadeInRight]>
```

**NO** crees animaciones personalizadas sin aprobación del equipo.

---

## Estilos y SCSS

### ✅ OBLIGATORIO: Estructura de SCSS

**TODOS** los archivos SCSS DEBEN seguir esta estructura:

```scss
// 1. Variables locales (si aplica)
$variable-local: valor;

// 2. Clases del componente
.nombre-componente {
  // Estilos
}

// 3. Clases anidadas
.clase-padre {
  .clase-hija {
    // Estilos
  }
}

// 4. Media queries al final
@media (max-width: 768px) {
  // Estilos responsivos
}
```

### ✅ OBLIGATORIO: Uso de Clases Existentes

**DEBES** usar las clases CSS existentes del proyecto:

- `title-banner-card`
- `title-banner-content`
- `title-title`
- `title-subtitle`
- `input-sleek`
- `sleek-control`
- `btn-title`
- `btn-alt`
- `panel-card`
- `estatus`
- `estatus-activo`
- `estatus-inactivo`

**NO** crees clases nuevas sin consultar primero si existe una equivalente.

### Tema Oscuro

**TODOS** los estilos DEBEN ser compatibles con el tema oscuro:

```scss
// ✅ CORRECTO
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.10);
color: rgba(255, 255, 255, 0.9);

// ❌ INCORRECTO
background: #ffffff;
color: #000000;
```

---

## Git y Commits

### ✅ OBLIGATORIO: Formato de Commits

**TODOS** los commits DEBEN seguir este formato:

```
[tipo]: [descripción breve]

[descripción detallada si es necesario]

[referencias a issues si aplica]
```

### Tipos de Commit

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan código)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

### Ejemplos

```
feat: agregar módulo de gestión de clientes

- Implementar lista de clientes con grid
- Agregar formulario de creación/edición
- Integrar servicios de API

Closes #123
```

```
fix: corregir validación de formulario de recarga

El formulario no validaba correctamente el monto mínimo.
Ahora valida que el monto sea mayor a 0.01.

Fixes #456
```

### ✅ OBLIGATORIO: Branching

- **main/master:** Solo código estable y probado
- **develop:** Rama de desarrollo principal
- **feature/[nombre]:** Nuevas funcionalidades
- **fix/[nombre]:** Correcciones de bugs
- **hotfix/[nombre]:** Correcciones urgentes

---

## Documentación

### ✅ OBLIGATORIO: Comentarios en Código

**DEBES** documentar:

1. **Métodos complejos:**
```typescript
/**
 * Carga los datos del grid aplicando filtros y paginación
 * @param pageIndex Índice de la página actual
 * @param pageSize Tamaño de página
 */
cargarDatos(pageIndex: number, pageSize: number): void {
  // Implementación
}
```

2. **Lógica de negocio compleja:**
```typescript
// Calcula el monto total considerando descuentos y recargos
// Si el monto es negativo, se establece en 0
const montoTotal = Math.max(0, montoBase - descuento + recargo);
```

3. **TODOs y FIXMEs:**
```typescript
// TODO: Implementar validación de RFC cuando el backend esté listo
// FIXME: Este método tiene un problema de rendimiento con más de 1000 registros
```

### ✅ OBLIGATORIO: README de Módulos

**TODOS** los módulos nuevos DEBEN incluir un README.md con:

- Descripción del módulo
- Funcionalidades principales
- Dependencias
- Ejemplos de uso

---

## Prohibiciones

### ❌ PROHIBIDO

1. **NO** uses `any` sin justificación. Usa tipos específicos o `unknown`
2. **NO** uses `console.log()` en código de producción
3. **NO** uses `alert()`, `confirm()`, o `prompt()` nativos
4. **NO** crees componentes sin seguir la estructura estándar
5. **NO** uses estilos inline en HTML (excepto casos muy específicos)
6. **NO** hardcodees URLs de API. Usa `environment.ts`
7. **NO** ignores errores de TypeScript con `@ts-ignore`
8. **NO** uses `var`. Siempre usa `let` o `const`
9. **NO** crees métodos sin propósito claro
10. **NO** dejes código comentado sin razón
11. **NO** uses librerías nuevas sin aprobación
12. **NO** modifiques estilos globales sin consultar
13. **NO** crees animaciones personalizadas sin aprobación
14. **NO** uses `setTimeout` o `setInterval` sin limpiarlos
15. **NO** olvides manejar la suscripción de Observables (usa `takeUntil` o `async` pipe)

### Ejemplos de Código Prohibido

```typescript
// ❌ PROHIBIDO
console.log('Debug:', data);
alert('Error');
var nombre = 'Juan';
any datos;
@ts-ignore
const resultado = funcionProblema();
```

```html
<!-- ❌ PROHIBIDO -->
<div style="color: red; background: blue;">
<button onclick="funcion()">
```

```scss
// ❌ PROHIBIDO
.componente {
  background: #ffffff; // No compatible con tema oscuro
  color: #000000;
}
```

---

## Proceso de Revisión

### Checklist Obligatorio

Antes de crear un Pull Request, **DEBES** verificar:

- [ ] El código sigue las convenciones de nomenclatura
- [ ] Los componentes siguen la estructura estándar
- [ ] Los grids incluyen todas las características obligatorias
- [ ] Los formularios usan el estilo "sleek"
- [ ] Los modales siguen la estructura estándar
- [ ] Los servicios siguen el patrón establecido
- [ ] Los errores se manejan con SweetAlert2
- [ ] Las animaciones son las permitidas
- [ ] Los estilos son compatibles con tema oscuro
- [ ] No hay código comentado innecesario
- [ ] No hay `console.log()` en código de producción
- [ ] Los commits siguen el formato establecido
- [ ] La documentación está actualizada

### Revisión de Código

1. **Automática:** El código debe pasar todos los linters
2. **Manual:** Un revisor debe aprobar el PR
3. **Testing:** El código debe funcionar correctamente
4. **UI/UX:** La interfaz debe seguir los estándares

### Criterios de Aprobación

Un PR será aprobado si:

- ✅ Cumple con TODOS los estándares del contrato
- ✅ No introduce bugs conocidos
- ✅ Mantiene consistencia con el código existente
- ✅ Incluye documentación necesaria
- ✅ Pasa todos los tests

Un PR será rechazado si:

- ❌ No cumple con los estándares del contrato
- ❌ Introduce código prohibido
- ❌ Rompe funcionalidad existente
- ❌ No sigue los patrones establecidos

---

## Sanciones por Incumplimiento

### Niveles de Incumplimiento

1. **Leve:** Código que no sigue convenciones menores
   - Acción: Solicitud de corrección en PR

2. **Moderado:** Código que no sigue patrones obligatorios
   - Acción: Rechazo de PR hasta corrección

3. **Grave:** Código que usa elementos prohibidos
   - Acción: Rechazo inmediato y requerimiento de refactorización completa

### Proceso de Corrección

1. El revisor identifica el incumplimiento
2. Se documenta en el PR con referencia al contrato
3. El desarrollador corrige el código
4. Se re-revisa hasta cumplir con el contrato

---

## Actualizaciones del Contrato

Este contrato puede ser actualizado por el equipo de desarrollo. Los cambios serán:

1. Documentados en este archivo
2. Comunicados a todos los desarrolladores
3. Aplicados a código nuevo inmediatamente
4. Aplicados a código existente en refactorizaciones

---

## Aceptación del Contrato

Al trabajar en este proyecto, aceptas:

- ✅ Seguir TODOS los estándares establecidos
- ✅ Respetar TODAS las convenciones
- ✅ Cumplir con TODOS los patrones obligatorios
- ✅ Aceptar las sanciones por incumplimiento
- ✅ Participar en el proceso de revisión

**Este contrato es vinculante para todos los desarrolladores del proyecto AuraNet.**

---

**Versión del Contrato:** 1.1  
**Fecha de Vigencia:** 2024  
**Última Actualización:** 2026-03-13

---

## Contacto y Consultas

Para consultas sobre este contrato o solicitudes de excepciones, contacta al equipo de desarrollo o crea un issue en el repositorio.
