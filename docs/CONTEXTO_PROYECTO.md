# Contexto del Proyecto AuraNet

## 📋 Índice
1. [Información General](#información-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Componentes del Menú](#componentes-del-menú)
4. [Grids (DataGrid)](#grids-datagrid)
5. [Formularios](#formularios)
6. [Modales](#modales)
7. [Vistas con Información](#vistas-con-información)
8. [Diseño y Estilos](#diseño-y-estilos)
9. [Patrones Comunes](#patrones-comunes)
10. [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## Información General

**Proyecto:** AuraNet  
**Framework:** Angular 17  
**Template Base:** Minible - Admin & Dashboard Template  
**Versión:** 3.1.0

### Regla Operativa Prioritaria
En AuraNet, **no se debe modificar ni mejorar código ya establecido** (incluyendo refactors, optimizaciones o cambios de estilo) **si no existe una instrucción explícita** para hacerlo.

### Descripción
AuraNet es una aplicación de administración y gestión para un sistema de puntos de venta (POS) que incluye gestión de clientes, salas, zonas, máquinas, monederos, transacciones, y más. El sistema utiliza un diseño moderno con tema oscuro y componentes interactivos.

---

## Estructura del Proyecto

```
AuraNet/
├── src/
│   ├── app/
│   │   ├── account/              # Módulo de autenticación
│   │   ├── core/                 # Servicios core, guards, helpers
│   │   ├── entities/             # Entidades y modelos
│   │   ├── extrapages/           # Páginas adicionales (login, 404, etc.)
│   │   ├── layouts/              # Layouts y sidebar
│   │   │   └── sidebar/
│   │   │       ├── menu.ts       # Configuración del menú
│   │   │       └── menu.model.ts  # Modelo de items del menú
│   │   ├── pages/                 # Páginas principales del sistema
│   │   │   ├── clientes/
│   │   │   ├── salas/
│   │   │   ├── zonas/
│   │   │   ├── maquinas/
│   │   │   ├── modulos/
│   │   │   ├── permisos/
│   │   │   ├── roles/
│   │   │   ├── usuarios/
│   │   │   ├── recarga/          # Módulo POS de recarga
│   │   │   ├── monederos/
│   │   │   ├── transacciones/
│   │   │   ├── bitacora/
│   │   │   └── ...
│   │   └── shared/                # Servicios compartidos
│   ├── assets/
│   │   ├── scss/                  # Estilos globales
│   │   ├── images/                # Imágenes
│   │   └── i18n/                  # Internacionalización
│   └── environments/              # Configuración de entornos
└── docs/                          # Documentación
```

---

## Componentes del Menú

El menú principal está definido en `src/app/layouts/sidebar/menu.ts` y contiene las siguientes secciones:

### Estructura del Menú

#### 1. **Principal**
- **Tablero** (`/dashboard`)
- **POS** (`/recarga`) - Módulo de recarga de monederos
- **Perfil** (`/contacts/profile`)

#### 2. **Administración**
- **Modulos** (`/modulos`)
- **Permisos** (`/permisos`)
- **Roles** (`/roles`)
- **Usuarios** (`/usuarios`)
- **Bitacora** (`/bitacora`)

#### 3. **Estructura**
- **Clientes** (`/clientes`)
- **Salas** (`/salas`)
- **Zonas** (`/zonas`)
- **Maquinas** (`/maquinas`)
- **Cajas** (`/cajas`)
- **Afiliados** (`/afiliados`)

#### 4. **Módulos Independientes**
- **Boveda** (`/tesoreria`)
- **Ap. Turnos** (`/turnos`)
- **Monederos** (`/monederos`)
- **Transacciones** (`/transacciones`)

#### 5. **Indicadores**
- **Saldo no debitado** (`/saldo-no-debitado`)
- **Premios entregados** (`/premios-entregados`)
- **Venta Acumulada** (`/venta-acumulada`)
- **Promociones** (`/promociones`)

#### 6. **Catálogos**
- **Tipo Estado** (`/tipo-estado`)
- **Efectivo** (`/efectivo`)
- **Lealtad** (`/lealtad`)
- **Tipo de Identificación** (`/tipo-identificacion`)
- **Número de Identificación** (`/numero-identificacion`)
- **Moneda** (`/moneda`)
- **Cantidad Recibida** (`/cantidad-recibida`)
- **Monitoreo** (`/monitoreo`)

#### 7. **Finanzas**
- **Caja** (`/caja`)
- **Bobeda** (`/bobeda`)

#### 8. **Cuenta**
- **Tu cuenta** (`/cuenta`)

### Modelo de MenuItem

```typescript
interface MenuItem {
    id?: number;
    label?: string;
    icon?: string;           // Iconos de Unicons (uil-*)
    link?: string;
    subItems?: any;
    isTitle?: boolean;
    badge?: any;
    parentId?: number;
    isLayout?: boolean;
}
```

---

## Grids (DataGrid)

### Librería Utilizada
**DevExtreme DataGrid** (`devextreme-angular`)

### Configuración Estándar

Los grids utilizan una configuración consistente en todo el proyecto:

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

### Características Comunes

#### 1. **Panel de Búsqueda**
```html
<dxo-search-panel [visible]="true" [width]="200" placeholder="Buscar..."></dxo-search-panel>
```

#### 2. **Paginación**
```html
<dxo-pager 
    [showPageSizeSelector]="true" 
    [allowedPageSizes]="[20]" 
    [showInfo]="true">
</dxo-pager>
```

#### 3. **Filtros y Agrupación**
```html
<dxo-group-panel [emptyPanelText]="mensajeAgrupar" [visible]="true"></dxo-group-panel>
<dxo-filter-row [visible]="showFilterRow"></dxo-filter-row>
<dxo-header-filter [visible]="showHeaderFilter"></dxo-header-filter>
<dxo-grouping [autoExpandAll]="true"></dxo-grouping>
```

#### 4. **Columna de Acciones**
Todas las grids incluyen una columna de acciones estándar:

```html
<dxi-column caption="Acciones" cellTemplate="Acciones" alignment="center" [width]="150"></dxi-column>

<div *dxTemplate="let row of 'Acciones'" class="d-flex gap-3 justify-content-center">
    <button class="btnAcciones" (click)="editar(row.data.id)" ngbTooltip="Editar">
        <i class="fa fa-edit"></i>
    </button>
    <button class="btnAcciones" (click)="activar/desactivar(row.data)" ngbTooltip="Activar/Desactivar">
        <i class="fa fa-arrow-up"></i> <!-- o fa-arrow-down -->
    </button>
</div>
```

#### 5. **Templates Personalizados**

**Estatus (Activo/Inactivo):**
```html
<dxi-column dataField="estatus" caption="Estatus" cellTemplate="est">
    <div *dxTemplate="let f of 'est'">
        <span *ngIf="f.data.estatus === 1" class="estatus estatus-activo">Activo</span>
        <span *ngIf="f.data.estatus !== 1" class="estatus estatus-inactivo">Inactivo</span>
    </div>
</dxi-column>
```

**Documentos (PDFs):**
```html
<dxi-column caption="Documento" cellTemplate="documento">
    <div *dxTemplate="let f of 'documento'">
        <button *ngIf="f?.data?.documento" 
            class="btn btn-primary btn-sm" 
            (click)="previsualizar(f?.data?.documento, 'Título', f?.data)">
            <i class="fa fa-file-pdf-o"></i> Ver Documento
        </button>
        <span *ngIf="!f?.data?.documento">Sin documentos</span>
    </div>
</dxi-column>
```

### Exportación
```html
<dxo-export 
    [enabled]="false" 
    [allowExportSelectedData]="true"
    [texts]="{ 
        exportAll: 'Exportar todos los datos a Excel', 
        exportSelectedRows: 'Exportar filas seleccionadas a Excel' 
    }">
</dxo-export>
```

---

## Formularios

### Framework
**Angular Reactive Forms** (`@angular/forms`)

### Estructura Estándar

#### 1. **Banner de Título**
Todos los formularios incluyen un banner superior consistente:

```html
<div class="title-banner-card shadow-sm">
    <div class="title-banner-content d-flex align-items-center justify-content-between flex-wrap p-1 pb-0">
        <div class="d-flex align-items-center gap-3">
            <div class="title-icon">
                <i class="fas fa-[icono]"></i>
            </div>
            <div>
                <h4 class="title-title">{{title}}</h4>
                <p class="title-subtitle">Descripción del formulario</p>
            </div>
        </div>
        <div class="title-actions">
            <div class="title-tagline">
                <span class="line"></span>
                <span class="text">Tagline descriptivo</span>
            </div>
        </div>
    </div>
</div>
```

#### 2. **Campos de Entrada (Input Sleek)**

Los formularios utilizan un estilo de input personalizado llamado "sleek":

```html
<label class="field">
    <span class="field-label text-white">Etiqueta *</span>
    <div class="input-sleek">
        <i class="fas fa-[icono]"></i>
        <input 
            formControlName="campo" 
            class="sleek-control" 
            type="text" 
            placeholder="Placeholder" />
        <span class="sleek-line"></span>
    </div>
</label>
```

**Para textarea:**
```html
<div class="input-sleek input-sleek--textarea">
    <i class="fas fa-align-left"></i>
    <textarea 
        formControlName="descripcion"
        class="sleek-control sleek-control--textarea" 
        rows="4"
        placeholder="Escribe aquí...">
    </textarea>
    <span class="sleek-line"></span>
</div>
```

#### 3. **Select Box (DevExtreme)**

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

#### 4. **Botones de Acción**

```html
<div class="d-flex justify-content-start gap-3 flex-wrap">
    <button (click)="submit()" type="button" class="btn-alt btn-alt--success">
        <i class="fas fa-check"></i>
        <span>Guardar</span>
    </button>
    <button (click)="regresar()" type="button" class="btn-alt btn-alt--cancel">
        <i class="fas fa-times"></i>
        <span>Cancelar</span>
    </button>
</div>
```

### Validación

Los formularios utilizan validadores de Angular:

```typescript
this.formulario = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    monto: ['', [Validators.required, Validators.min(0.01)]]
});
```

### Formulario Especial: Recarga (POS)

El módulo de recarga tiene un diseño único con pasos visuales:

#### Estructura de Pasos
```html
<div class="rail-card">
    <div class="rail-steps">
        <div class="step" [class.active]="!cajaSeleccionada">
            <div class="dot"><span>1</span></div>
            <div class="meta">
                <div class="s-title">Caja</div>
                <div class="s-sub">Elige el punto de cobro</div>
            </div>
        </div>
        <!-- Más pasos... -->
    </div>
</div>
```

#### Paneles de Información
```html
<div class="panel-card panel-caja">
    <div class="panel-head">
        <div class="ph-ico ph-ico-caja">
            <i class="fas fa-cash-register"></i>
        </div>
        <div class="ph-txt">
            <div class="ph-title">Caja</div>
            <div class="ph-sub">Selecciona la caja</div>
        </div>
    </div>
    <div class="panel-body">
        <!-- Contenido del panel -->
    </div>
</div>
```

---

## Modales

### Librería
**ng-bootstrap** (`@ng-bootstrap/ng-bootstrap`)

### Estructura Estándar

#### 1. **Modal con Formulario**

```html
<ng-template #modalForm let-modal>
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
            <!-- Campos del formulario -->
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

#### 2. **Apertura del Modal**

```typescript
@ViewChild('modalForm', { static: false }) modalForm!: TemplateRef<any>;
private modalRef?: NgbModalRef;

abrirModal() {
    this.modalRef = this.modalService.open(this.modalForm, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
    });
}

cerrarModal() {
    if (this.modalRef) {
        this.modalRef.close();
    }
}
```

#### 3. **Tipos de Modales**

**Modal de Acción (Abrir Turno, Cerrar Turno, etc.):**
- Clase: `modal-accion-header--[tipo]`
- Colores según acción:
  - `--abrir-turno`: Verde (success)
  - `--cerrar-turno`: Amarillo (warning)
  - `--descargar`: Naranja (warning)
  - `--consultar-saldo`: Azul (info)

**Modal de Vista (Previsualización):**
```html
<div class="preview-backdrop" *ngIf="previewModalOpen" (click)="closePreview()">
    <div class="preview-modal" (click)="$event.stopPropagation()">
        <div class="preview-header">
            <div class="preview-title">
                <i class="fa fa-eye"></i>
                <span>{{ previewTitle }}</span>
            </div>
            <button type="button" class="preview-close" (click)="closePreview()">
                <i class="fa fa-times"></i>
            </button>
        </div>
        <div class="preview-body">
            <!-- Contenido: iframe para PDFs, imágenes, etc. -->
        </div>
        <div class="preview-footer">
            <!-- Botones de acción -->
        </div>
    </div>
</div>
```

### Indicadores de Formulario

```html
<div class="form-indication form-indication--info">
    <i class="fas fa-info-circle"></i>
    <span>Mensaje informativo</span>
</div>

<!-- Variantes: -->
<!-- form-indication--info (azul) -->
<!-- form-indication--warning (amarillo) -->
<!-- form-indication--success (verde) -->
<!-- form-indication--danger (rojo) -->
```

---

## Vistas con Información

### 1. **Vista de Lista (Grid)**

Estructura estándar para páginas de listado:

```html
<div class="container-fluid" [@fadeInRight]>
    <div class="row">
        <div class="col-12">
            <div class="title-banner-card shadow-sm">
                <!-- Banner con título y botones -->
                <div class="title-buttons">
                    <button (click)="agregar()" class="btn-title btn-title--primary">
                        <i class="fas fa-plus"></i>
                        <span>Nuevo</span>
                    </button>
                    <button (click)="toggleExpandGroups()" class="btn-title btn-title--ghost">
                        <i class="fas fa-expand"></i>
                        <span>Contraer Grid</span>
                    </button>
                    <button (click)="limpiarCampos()" class="btn-title btn-title--danger">
                        <i class="fas fa-sync-alt"></i>
                        <span>Restablecer</span>
                    </button>
                </div>
                <!-- Grid -->
                <dx-data-grid>...</dx-data-grid>
            </div>
        </div>
    </div>
</div>
```

### 2. **Vista de Formulario**

```html
<div class="container-fluid" [@fadeInRight]>
    <div class="row">
        <div class="col-12">
            <div class="title-banner-card shadow-sm">
                <!-- Banner -->
                <form [formGroup]="formulario">
                    <div class="row g-3">
                        <!-- Campos del formulario -->
                    </div>
                </form>
                <!-- Botones de acción -->
            </div>
        </div>
    </div>
</div>
```

### 3. **Vista de Información Detallada**

Para mostrar información de solo lectura:

```html
<div class="detail-strip" *ngIf="datosSeleccionados">
    <div class="ditem">
        <div class="dlabel"><i class="fas fa-building"></i> Etiqueta</div>
        <div class="dvalue">{{ datosSeleccionados.campo || 'Sin registro' }}</div>
    </div>
    <!-- Más items... -->
</div>
```

### 4. **Badges y Etiquetas**

```html
<!-- Badge de estatus -->
<span class="estatus estatus-activo">Activo</span>
<span class="estatus estatus-inactivo">Inactivo</span>

<!-- Badge personalizado -->
<span class="tx-badge tx-badge-tipo-movimiento">
    <i class="fas fa-exchange-alt"></i>
    {{ valor }}
</span>
```

### 5. **Chips y Mini Chips**

```html
<div class="mini-chip mini-chip-caja" [class.on]="seleccionado">
    <i class="fas fa-warehouse"></i>
    <span>{{ seleccionado ? 'Listo' : 'Pendiente' }}</span>
</div>
```

---

## Diseño y Estilos

### Sistema de Colores

#### Colores Principales (Bootstrap Theme)
- **Primary (Azul):** `#5b73e8`
- **Success (Verde):** `#34c38f`
- **Warning (Amarillo):** `#f1b44c`
- **Danger (Rojo):** `#f46a6a`
- **Info (Cian):** `#50a5f1`
- **Secondary (Gris):** `#74788d`

#### Escala de Grises
- `$gray-100`: `#f8f9fa`
- `$gray-200`: `#f5f6f8`
- `$gray-300`: `#f6f6f6`
- `$gray-400`: `#ced4da`
- `$gray-500`: `#adb5bd`
- `$gray-600`: `#74788d`
- `$gray-700`: `#343747`
- `$gray-800`: `#2b2e3b`
- `$gray-900`: `#22252f`

### Componentes de Diseño

#### 1. **Title Banner Card**
```scss
.title-banner-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 18px;
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.45);
    padding: 20px;
}
```

#### 2. **Input Sleek**
Inputs con estilo moderno y línea animada:

```scss
.input-sleek {
    position: relative;
    
    .sleek-control {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        
        &:focus {
            border-color: var(--primary);
        }
    }
    
    .sleek-line {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: var(--primary);
        transform: scaleX(0);
        transition: transform 0.3s;
    }
    
    .sleek-control:focus + .sleek-line {
        transform: scaleX(1);
    }
}
```

#### 3. **Panel Cards**
Paneles con información agrupada:

```scss
.panel-card {
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    
    .panel-head {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .panel-body {
        padding: 16px;
    }
}
```

#### 4. **Botones**

**Botones de Título:**
```html
<button class="btn-title btn-title--primary">Nuevo</button>
<button class="btn-title btn-title--ghost">Contraer</button>
<button class="btn-title btn-title--danger">Restablecer</button>
```

**Botones Alternativos:**
```html
<button class="btn-alt btn-alt--success">Guardar</button>
<button class="btn-alt btn-alt--cancel">Cancelar</button>
```

**Botones de Acción:**
```html
<button class="btn-action-recarga btn-primary">Confirmar</button>
<button class="btn-action-recarga btn-secondary">Cancelar</button>
```

#### 5. **Animaciones**

El proyecto utiliza animaciones personalizadas:

```typescript
// fadeInRightAnimation
// slideDownFadeAnimation
// staggerFadeInAnimation
```

Aplicadas en templates:
```html
<div [@fadeInRight]>
<div [@slideDownFade]>
<div [@staggerFadeIn]>
```

### Tema Oscuro

El proyecto utiliza un tema oscuro con:
- Fondos oscuros con transparencia: `rgba(10, 12, 18, 0.58)`
- Bordes sutiles: `rgba(255, 255, 255, 0.10)`
- Sombras profundas: `rgba(0, 0, 0, 0.45)`
- Texto blanco con opacidad variable

---

## Patrones Comunes

### 1. **Estructura de Componente de Lista**

```typescript
export class ListaComponent implements OnInit {
    listaDatos: any[] = [];
    pageSize: number = 50;
    showFilterRow: boolean = true;
    showHeaderFilter: boolean = true;
    autoExpandAllGroups: boolean = true;
    mensajeAgrupar: string = "Arrastra una columna aquí para agrupar";
    
    @ViewChild('gridContainer', { static: false }) gridContainer: DxDataGridComponent;
    
    ngOnInit(): void {
        this.cargarDatos();
    }
    
    cargarDatos(): void {
        // Cargar datos del servicio
    }
    
    agregar(): void {
        this.router.navigate(['/ruta/agregar']);
    }
    
    actualizar(id: number): void {
        this.router.navigate(['/ruta/agregar', id]);
    }
    
    activar(item: any): void {
        // Lógica de activación
    }
    
    desactivar(item: any): void {
        // Lógica de desactivación
    }
    
    onPageIndexChanged(event: any): void {
        // Manejo de paginación
    }
    
    onGridOptionChanged(event: any): void {
        // Manejo de cambios en el grid
    }
    
    toggleExpandGroups(): void {
        this.autoExpandAllGroups = !this.autoExpandAllGroups;
    }
    
    limpiarCampos(): void {
        // Limpiar filtros
    }
}
```

### 2. **Estructura de Componente de Formulario**

```typescript
export class AgregarComponent implements OnInit {
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
        }
    }
    
    crear(): void {
        // Lógica de creación
    }
    
    actualizar(): void {
        // Lógica de actualización
    }
    
    regresar(): void {
        this.router.navigate(['/ruta/lista']);
    }
}
```

### 3. **Servicios**

Los servicios siguen un patrón consistente:

```typescript
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

### 4. **Manejo de Errores y Notificaciones**

El proyecto utiliza **SweetAlert2** para notificaciones:

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

---

## Tecnologías Utilizadas

### Framework y Librerías Principales

- **Angular:** 17.0.6
- **Bootstrap:** 5.3.2
- **DevExtreme:** 24.1.6
- **ng-bootstrap:** 16.0.0
- **RxJS:** 7.8.1
- **SweetAlert2:** 11.10.1

### Librerías de UI

- **@ng-select/ng-select:** 12.0.4 - Select boxes avanzados
- **ngx-mask:** 17.0.4 - Máscaras de entrada
- **ngx-permissions:** 19.0.0 - Control de permisos
- **@ngx-translate/core:** 15.0.0 - Internacionalización

### Librerías de Gráficos

- **apexcharts:** 3.44.2
- **chart.js:** 4.4.1
- **ng-apexcharts:** 1.8.0
- **ng2-charts:** 5.0.4

### Otras Librerías

- **@angular/fire:** 17.0.0 - Firebase
- **@angular/google-maps:** 17.0.3 - Google Maps
- **@asymmetrik/ngx-leaflet:** 17.0.0 - Mapas Leaflet
- **@ckeditor/ckeditor5-angular:** 7.0.1 - Editor de texto
- **@fullcalendar/angular:** 6.1.10 - Calendario
- **ngx-echarts:** 17.1.0 - Gráficos ECharts

### Iconos

- **Font Awesome:** `fas fa-*`
- **Unicons:** `uil-*` (usado en el menú)

---

## Convenciones de Código

### Nomenclatura

- **Componentes:** PascalCase (ej: `ListaClientesComponent`)
- **Servicios:** PascalCase con sufijo "Service" (ej: `ClientesService`)
- **Variables:** camelCase (ej: `listaClientes`)
- **Constantes:** UPPER_SNAKE_CASE (ej: `API_URL`)
- **Archivos:** kebab-case (ej: `lista-clientes.component.ts`)

### Estructura de Archivos

```
componente/
├── componente.component.ts
├── componente.component.html
├── componente.component.scss
└── componente.component.spec.ts
```

### Rutas

- **Lista:** `/modulo` (ej: `/clientes`)
- **Agregar:** `/modulo/agregar` (ej: `/clientes/agregar`)
- **Editar:** `/modulo/agregar/:id` (ej: `/clientes/agregar/123`)

---

## Notas Adicionales

### Características Especiales

1. **Módulo POS (Recarga):**
   - Diseño único con pasos visuales
   - Paneles informativos interactivos
   - Validación en tiempo real
   - Múltiples modales para operaciones

2. **Sistema de Permisos:**
   - Directiva `hasPermission` para control de acceso
   - Integración con `ngx-permissions`
   - Guards de ruta para protección

3. **Internacionalización:**
   - Soporte multiidioma (es, en, de, it, ru)
   - Archivos de traducción en `src/assets/i18n/`

4. **Animaciones:**
   - Animaciones personalizadas para transiciones
   - Efectos de fade y slide
   - Stagger animations para listas

---

## Referencias

- **Template Base:** [Minible - Admin & Dashboard Template](https://themesbrand.com/)
- **DevExtreme:** [Documentación](https://js.devexpress.com/Documentation/)
- **Angular:** [Documentación Oficial](https://angular.io/docs)
- **Bootstrap:** [Documentación](https://getbootstrap.com/docs/5.3/)

---

**Última actualización:** 2026-03-24  
**Versión del documento:** 1.2
