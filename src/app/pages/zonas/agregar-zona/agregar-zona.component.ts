import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { MaquinasService } from 'src/app/shared/services/maquinas.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { ZonaService } from 'src/app/shared/services/zona.service';
import Swal from 'sweetalert2';
type MachineType = 'Tragamonedas' | 'Ruleta' | 'Blackjack' | 'Poker';
type ZoneType = 'VIP' | 'Caja' | 'Baños' | 'Sala';
type MachineStatus = 'Activa' | 'Mantenimiento';
type DoorType = 'ENTRADA' | 'SALIDA';

interface MachineItem {
  id: number;
  label: number;
  /** Id de catálogo/API cuando hay varias instancias de la misma máquina en el lienzo. */
  catalogMachineId?: number;
  type: MachineType;
  name: string;
  status: MachineStatus;
  serial: string;
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

interface ZoneItem {
  id: number;
  /** Id de zona en BD cuando hay varias piezas del mismo catálogo en el lienzo. */
  catalogZoneId?: number;
  type: ZoneType;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DoorPoint {
  x: number;
  y: number;
  r: number;
}

@Component({
  selector: 'app-agregar-zona',
  templateUrl: './agregar-zona.component.html',
  styleUrl: './agregar-zona.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarZonaComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public zonaForm: FormGroup;
  public idZona: number;
  public title = 'Agregar Zona';
  /** Vista /salas/distribucion/:idSala — pantalla de sala (componente `DistribucionSalaComponent`). */
  modoDistribucionSala = false;
  idSalaDistribucion: number | null = null;
  nombreSalaDistribucion = '';
  canvasLogicalW = 3048;
  canvasLogicalH = 3684;
  defaultMachineW = 80;
  defaultMachineH = 120;
  public listaClientes: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  @ViewChild('stage', { static: false }) stageRef: ElementRef<HTMLDivElement>;
  machines: MachineItem[] = [];
  zones: ZoneItem[] = [];
  selectedMachineId: number | null = null;
  selectedZoneId: number | null = null;
  hoverId: number | null = null;
  editNameId: number | null = null;
  zoom = 1;
  /** Desplazamiento del lienzo en píxeles de pantalla (vista del diagrama). */
  viewPanX = 0;
  viewPanY = 0;
  private readonly zoomMin = 0.05;
  private readonly zoomMax = 12;
  viewportPanning = false;
  private panPointerId: number | null = null;
  private panLastClient = { x: 0, y: 0 };
  private panMovedSq = 0;
  suppressNextStageClick = false;
  snapGuide = { showV: false, showH: false, v: 0, h: 0 };
  private draggingMachineId: number | null = null;
  private draggingZoneId: number | null = null;
  private resizingZoneId: number | null = null;
  private resizingMachineId: number | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private pointerActive = false;
  public stageW = 1320;
  public stageH = 520;

  private grid = 10;
  placingDoor: DoorType | null = null;
  entrada: DoorPoint | null = null;
  salida: DoorPoint | null = null;
  selectedDoor: DoorType | null = null;
  draggingDoor: DoorType | null = null;
  doorDragOffset = { x: 0, y: 0 };
  doorPointerId: number | null = null;
  doorHover: DoorType | null = null;

  private resizeHandle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null = null;
  private resizeStart = { x: 0, y: 0 };
  private resizeStartRect = { x: 0, y: 0, w: 0, h: 0 };
  /** Misma anchura/alto visual que `.door` en el SCSS (arrastre y límites). */
  private readonly doorVisW = 130;
  private readonly doorVisH = 54;
  /** Máquinas y puertas con centro dentro de la zona al iniciar arrastre de esa zona. */
  private zoneDragCapturedMachineIds: number[] = [];
  private zoneDragMoveEntrada = false;
  private zoneDragMoveSalida = false;
  /** Igual al redimensionar la zona cuando cambia el origen (handles N/W). */
  private zoneResizeCapturedMachineIds: number[] = [];
  private zoneResizeMoveEntrada = false;
  private zoneResizeMoveSalida = false;
  private rotateTickId: any = null;
  private rotateAccelId: any = null;
  private rotateStep = 3;
  private rotateDir = 1;
  private rotateDoorTarget: DoorType | null = null;
  private rotateMachineTarget = false;
  public listaTipoZona: any[] = [];
  public listaSalas: any;

  isTipoZonaOpen = false;
  tipoZonaLabel = '';

  isMaquinaOpen = false;
  maquinaLabel = '';
  /** Catálogo GET /maquinas/list — solo modo distribución sala. */
  listaMaquinasDistribucion: any[] = [];
  /** GET /zonas/by-sala/{idSala} — solo modo distribución sala. */
  listaZonasPorSalaDistribucion: any[] = [];

  toggleTipoZona(event: MouseEvent) {
    event.preventDefault();
    if (!this.listaZonasPorSalaDistribucion?.length) {
      return;
    }
    this.isTipoZonaOpen = !this.isTipoZonaOpen;
    if (this.isTipoZonaOpen) {
      this.isMaquinaOpen = false;
    }
  }

  toggleMaquina(event: MouseEvent) {
    event.preventDefault();
    if (!this.listaMaquinasDistribucion?.length) {
      return;
    }
    this.isMaquinaOpen = !this.isMaquinaOpen;
    if (this.isMaquinaOpen) {
      this.isTipoZonaOpen = false;
    }
  }

  /** Coloca una máquina del catálogo (/maquinas/list) en el diagrama. */
  seleccionarMaquinaDistribucion(maquina: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const nombre = String(maquina?.nombreMaquina ?? maquina?.nombre ?? 'Máquina').trim();
    this.maquinaLabel = nombre || 'Máquina';
    this.isMaquinaOpen = false;
    this.agregarMaquinaDesdeCatalogo(maquina);
  }

  /** Coloca una zona de la sala (/zonas/by-sala/{idSala}) en el diagrama. */
  seleccionarZonaDistribucion(zona: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const nombreZona = String(zona?.nombreZona ?? zona?.nombre ?? 'Zona').trim();
    const tipoEtiqueta = String(zona?.nombreTipoZona ?? zona?.tipoZona ?? nombreZona ?? 'Sala').trim();
    this.tipoZonaLabel = nombreZona || tipoEtiqueta;
    this.isTipoZonaOpen = false;
    const idTipo = zona?.idTipoZona ?? zona?.id_tipo_zona;
    if (idTipo != null && idTipo !== '') {
      this.zonaForm.patchValue({ idTipoZona: Number(idTipo) });
    }
    this.agregarZonaDesdeCatalogoSala(zona);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    const key = event.key;
    // Permitir números (48-57), punto decimal (190 o 110), coma (188), backspace (8), delete (46), tab (9), enter (13), flechas (37-40)
    const allowedKeys = [8, 9, 13, 37, 38, 39, 40, 46]; // backspace, tab, enter, flechas, delete
    const isNumber = (charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105);
    const isDecimal = key === '.' || key === ',' || charCode === 190 || charCode === 188 || charCode === 110;
    const isAllowedKey = allowedKeys.includes(charCode);
    
    if (!isNumber && !isAllowedKey && !isDecimal) {
      event.preventDefault();
    }
  }

  setTipoZona(id: any, nombre: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.zonaForm.patchValue({ idTipoZona: id });
    this.tipoZonaLabel = nombre;
    this.isTipoZonaOpen = false;
  }

  constructor(
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private formBuilder: FormBuilder,
    private zonaService: ZonaService,
    private salaService: SalaService,
    private maquinasService: MaquinasService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.modoDistribucionSala = this.activatedRouted.snapshot.data['modoDistribucionSala'] === true;
    this.activatedRouted.data.subscribe((d) => {
      this.modoDistribucionSala = d['modoDistribucionSala'] === true;
    });

    this.activatedRouted.params.subscribe((params) => {
      if (this.modoDistribucionSala) {
        const id = Number(params['idSala']);
        if (!Number.isFinite(id) || id <= 0) {
          Swal.fire({
            title: 'Error',
            text: 'Identificador de sala no válido.',
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Aceptar',
          }).then(() => this.route.navigateByUrl('/salas'));
          return;
        }
        this.idSalaDistribucion = id;
        this.title = 'Distribución';
        this.submitButton = 'Guardar distribución';
        this.maquinaLabel = '';
        this.tipoZonaLabel = '';
        this.isMaquinaOpen = false;
        this.isTipoZonaOpen = false;
        this.cargarCatalogosDistribucionSala(id);
        this.salaService.obtenerSala(id).subscribe({
          next: (res: any) => {
            const data = res?.data ?? res ?? {};
            this.nombreSalaDistribucion =
              String(data.nombreSala ?? data.nombre ?? '').trim() || `Sala ${id}`;
          },
          error: () => {
            this.nombreSalaDistribucion = `Sala ${id}`;
          },
        });
        this.cargarDistribucionLayout();
        return;
      }

      this.idZona = params['idZona'];
      if (this.idZona) {
        this.title = 'Actualizar Zona';
        this.submitButton = 'Actualizar';
      } else {
        this.title = 'Agregar Zona';
        this.submitButton = 'Guardar';
      }
      this.obtenerTipoZona();
      this.obtenerSalas();
      if (this.idZona) {
        setTimeout(() => {
          this.obtenerZona();
        }, 200);
      }
    });
  }

  initForm(): void {
    this.zonaForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      idTipoZona: [null, Validators.required],
      nivel: [''],
      anchoMetros: [null, Validators.required],
      altoMetros: [null, Validators.required],
      areaMetrosCuadrados: [null],
      areaPoligonoJSON: [{}],
      capacidadMaximaPersonas: [null],
      capacidadMaximaMaquinas: [null],
      idSala: [null, Validators.required]
    });
  }

  obtenerTipoZona() {
    this.zonaService.listarCatTiposZona().subscribe((response) => {
      this.listaTipoZona = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id ?? c.idTipoZona),
        nombre: (c.nombre ?? c.nombreTipoZona ?? '').toString(),
      }));
      // Actualizar label si ya hay un valor en el formulario
      const currentId = Number(this.zonaForm.get('idTipoZona')?.value ?? 0);
      if (currentId && this.listaTipoZona && this.listaTipoZona.length > 0) {
        const found = this.listaTipoZona.find((x: any) => Number(x.id) === currentId);
        if (found) {
          this.tipoZonaLabel = found.nombre;
        }
      }
    });
  }

  obtenerSalas() {
    this.salaService.obtenerSalas().subscribe((response) => {
      this.listaSalas = (response.data || []).map((c: any) => {
        const id = Number(c.idSala ?? c.id);
        const text = (c.nombreSala ?? c.nombre ?? 'Sin nombre').trim();
        return { ...c, id, idSala: id, text };
      });
    });
  }

  obtenerZona() {
    this.zonaService.obtenerZona(this.idZona).subscribe(
      (response: any) => {
        const data = response.data || {};
        
        // Mapear los campos del servicio a los del formulario
        this.zonaForm.patchValue({
          nombre: data.nombreZona ?? data.nombre ?? '',
          descripcion: data.descripcionZona ?? data.descripcion ?? '',
          idTipoZona: data.idTipoZona ?? 0,
          nivel: data.nivelZona ?? data.nivel ?? '',
          anchoMetros: data.anchoMetrosZona ?? data.anchoMetros ?? 0,
          altoMetros: data.altoMetrosZona ?? data.altoMetros ?? 0,
          areaMetrosCuadrados: data.areaMetrosCuadradosZona ?? data.areaMetrosCuadrados ?? 0,
          areaPoligonoJSON: data.areaPoligonoJSON ?? {},
          capacidadMaximaPersonas: data.capacidadMaximaPersonas ?? 0,
          capacidadMaximaMaquinas: data.capacidadMaximaMaquinas ?? 0,
          idSala: data.idSala ?? 0,
        });

        // Establecer labels después de que las listas estén cargadas
        const idTipoZona = Number(data.idTipoZona ?? 0);
        if (idTipoZona) {
          if (this.listaTipoZona && this.listaTipoZona.length > 0) {
            const foundTipoZona = this.listaTipoZona.find((x: any) => Number(x.id) === idTipoZona);
            if (foundTipoZona) {
              this.tipoZonaLabel = foundTipoZona.nombre;
            } else {
              // Si no se encuentra en la lista, usar el nombre del servicio
              this.tipoZonaLabel = data.nombreTipoZona ?? '';
            }
          } else {
            // Si la lista aún no está cargada, usar el nombre del servicio
            this.tipoZonaLabel = data.nombreTipoZona ?? '';
          }
        }

        // Cargar el plano
        this.loadPlanoFromAreaPoligono(data.areaPoligonoJSON);
      }, (error: any) => {
        console.log(error.error);
      }
    );
  }

  submit() {
    if (this.modoDistribucionSala) {
      this.guardarDistribucionSala();
      return;
    }

    this.submitButton = 'Cargando...';
    this.loading = true;

    this.persistPlanoToForm();

    if (this.idZona) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.zonaForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        nombre: 'Nombre',
        idTipoZona: 'Tipo de zona',
        anchoMetros: 'Ancho (metros)',
        altoMetros: 'Alto (metros)',
        idSala: 'Sala',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.zonaForm.controls).forEach(key => {
        const control = this.zonaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
              <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
                Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
                Por favor complétalos antes de continuar:
              </p>
              <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
            `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border'
        }
      });
      return;
    }

    const payload = this.buildPayloadZona();
    this.zonaService.agregarZona(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: `Se agregó una nueva zona de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.zonaForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        nombre: 'Nombre',
        idTipoZona: 'Tipo de zona',
        anchoMetros: 'Ancho (metros)',
        altoMetros: 'Alto (metros)',
        idSala: 'Sala',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.zonaForm.controls).forEach(key => {
        const control = this.zonaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
              <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
                Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
                Por favor complétalos antes de continuar:
              </p>
              <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
            `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border'
        }
      });
      return;
    }

    const payload = this.buildPayloadZona();
    this.zonaService.actualizarZona(this.idZona, payload).subscribe(
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: `Los datos de la zona se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  private buildPayloadZona(): any {
    const v = this.zonaForm.getRawValue();
    return {
      nombre: v.nombre ?? '',
      descripcion: v.descripcion ?? '',
      idTipoZona: Number(v.idTipoZona) || 0,
      nivel: v.nivel ?? '',
      anchoMetros: Number(v.anchoMetros) || 0,
      altoMetros: Number(v.altoMetros) || 0,
      areaMetrosCuadrados: Number(v.areaMetrosCuadrados) || 0,
      areaPoligonoJSON: v.areaPoligonoJSON ?? {},
      capacidadMaximaPersonas: Number(v.capacidadMaximaPersonas) || 0,
      capacidadMaximaMaquinas: Number(v.capacidadMaximaMaquinas) || 0,
      idSala: Number(v.idSala) || 0,
    };
  }

  @HostListener('document:click', ['$event'])
  onDocClickCloseSelects(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.select-sleek')) return;

    this.isTipoZonaOpen = false;
    this.isMaquinaOpen = false;
  }

  regresar() {
    if (this.modoDistribucionSala) {
      this.route.navigateByUrl('/salas');
      return;
    }
    this.route.navigateByUrl('/zonas');
  }

  cargarDistribucionLayout(): void {
    const id = this.idSalaDistribucion;
    if (id == null || id <= 0) {
      return;
    }
    this.salaService.obtenerLayoutMapaSala(id).subscribe({
      next: (resp) => this.hydrateFromDistribucionApi(resp),
      error: () => this.hydrateFromDistribucionApi(null),
    });
  }

  /**
   * GET layout/mapa puede traer `maquinasSinZona` dentro de `areaPoligonoJson` y otra vez en la raíz;
   * el diagrama debe mostrar la unión sin duplicar por id o número de serie.
   */
  private mergeMaquinasSinZonaLists(innerList: unknown[], rootList: unknown[]): any[] {
    const a = Array.isArray(innerList) ? innerList : [];
    const b = Array.isArray(rootList) ? rootList : [];
    if (b.length === 0) {
      return a;
    }
    const keys = new Set<string>();
    for (const p of a) {
      const k = this.maquinaLayoutDedupeKey(p);
      if (k) {
        keys.add(k);
      }
    }
    const out = [...a];
    for (const p of b) {
      const k = this.maquinaLayoutDedupeKey(p);
      if (k && keys.has(k)) {
        continue;
      }
      if (k) {
        keys.add(k);
      }
      out.push(p);
    }
    return out;
  }

  private maquinaLayoutDedupeKey(p: unknown): string | null {
    if (p == null || typeof p !== 'object') {
      return null;
    }
    const o = p as Record<string, unknown>;
    const id = o['id'];
    const serial = o['serial'];
    const x = o['x'];
    const y = o['y'];
    const pos =
      x != null && y != null && String(x).trim() !== '' && String(y).trim() !== ''
        ? `@${String(x)},${String(y)}`
        : '';
    if (id != null && String(id).trim() !== '') {
      return `id:${String(id)}${pos}`;
    }
    if (serial != null && String(serial).trim() !== '') {
      return `s:${String(serial)}${pos}`;
    }
    return null;
  }

  private hydrateFromDistribucionApi(resp: any): void {
    const raw = resp?.data ?? resp;
    const wrappedPoly = raw?.areaPoligonoJson ?? raw?.areaPoligonoJSON;
    const inner =
      wrappedPoly != null && typeof wrappedPoly === 'object'
        ? wrappedPoly
        : raw;
    const rootMaquinasSinZona =
      wrappedPoly != null &&
      typeof raw === 'object' &&
      raw !== inner &&
      Array.isArray(raw.maquinasSinZona)
        ? raw.maquinasSinZona
        : [];

    if (inner && typeof inner === 'object' && (inner.dimensiones || inner.maquinaTamano ||
      Array.isArray(inner.zonas) || Array.isArray(inner.maquinasSinZona))) {
      const dim = inner.dimensiones ?? {};
      this.canvasLogicalW = Number(dim.ancho) || this.canvasLogicalW;
      this.canvasLogicalH = Number(dim.alto) || this.canvasLogicalH;
      this.zoom = Number(dim.zoom) || this.zoom;
      this.zoom = this.clamp(this.zoom, this.zoomMin, this.zoomMax);

      const mt = inner.maquinaTamano ?? {};
      this.defaultMachineW = Number(mt.ancho) || this.defaultMachineW;
      this.defaultMachineH = Number(mt.alto) || this.defaultMachineH;

      const zonasApi = Array.isArray(inner.zonas) ? inner.zonas : [];
      const zones: ZoneItem[] = [];
      const machines: MachineItem[] = [];

      zonasApi.forEach((z: any, zi: number) => {
        const catalogZid = Number(z.id ?? zi + 1);
        const zoneInstanceId = this.nextId(zones.map((x) => x.id));
        const tipoZona = String(
          z.type ?? z.nombre ?? z.nombreTipoZona ?? z.tipo ?? 'Sala'
        ).trim();
        zones.push({
          id: zoneInstanceId,
          catalogZoneId: catalogZid > 0 ? catalogZid : undefined,
          type: (tipoZona || 'Sala') as ZoneType,
          x: Number(z.x ?? 0),
          y: Number(z.y ?? 0),
          w: Number(z.w ?? 260),
          h: Number(z.h ?? 160),
        });
        const mas = Array.isArray(z.maquinas) ? z.maquinas : [];
        mas.forEach((p: any) => {
          const instanceId = this.nextId(machines.map((x) => x.id));
          machines.push(this.mapApiMachineFromDistribucion(p, instanceId));
        });
      });

      const sin = this.mergeMaquinasSinZonaLists(inner.maquinasSinZona ?? [], rootMaquinasSinZona);
      sin.forEach((p: any) => {
        const instanceId = this.nextId(machines.map((x) => x.id));
        machines.push(this.mapApiMachineFromDistribucion(p, instanceId));
      });

      this.zones = zones.map((zz) => this.snapZone(zz));
      this.machines = machines.map((mm) => this.snapMachine(mm));
      this.entrada = inner.entrada ? this.safeParsePoint(inner.entrada) : null;
      this.salida = inner.salida ? this.safeParsePoint(inner.salida) : null;
      this.persistPlanoToForm();
      return;
    }

    if (inner && typeof inner === 'object' && (inner.machines || inner.zones)) {
      this.loadPlanoFromAreaPoligono(inner);
      return;
    }

    this.limpiarPlano();
    this.canvasLogicalW = 3048;
    this.canvasLogicalH = 3684;
    this.defaultMachineW = 80;
    this.defaultMachineH = 120;
  }

  private mapApiMachineFromDistribucion(p: any, instanceId: number): MachineItem {
    const type = this.inferMachineTypeFromApi(p);
    const catalogId = Number(p?.id ?? 0);
    const dw = Number(p?.w ?? this.defaultMachineW);
    const dh = Number(p?.h ?? this.defaultMachineH);
    const labelNum = Number(p?.label ?? (catalogId > 0 ? catalogId : instanceId));
    const name = String(p?.name ?? p?.nombre ?? `${type} ${catalogId || instanceId}`).trim();
    const serial = String(
      p?.serial ?? p?.numeroSerie ?? this.makeSerial(type, catalogId || instanceId)
    ).trim();
    const status = this.mapEstatusMaquinaApi(p);
    const img = this.resolveMachineDisplayImg(p, type);
    return {
      id: instanceId,
      label: labelNum,
      catalogMachineId: catalogId > 0 ? catalogId : undefined,
      type,
      name,
      status,
      serial,
      img,
      x: Number(p?.x ?? 60),
      y: Number(p?.y ?? 80),
      w: Math.max(dw, 40),
      h: Math.max(dh, 40),
      r: this.normalizeRotation(Number(p?.r ?? 0)),
    };
  }

  private maquinaCentroEnRect(
    m: MachineItem,
    rect: { x: number; y: number; w: number; h: number }
  ): boolean {
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2;
    return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
  }

  private maquinaCentroEnZona(m: MachineItem, z: ZoneItem): boolean {
    return this.maquinaCentroEnRect(m, z);
  }

  private doorCentroEnRect(
    d: DoorPoint,
    rect: { x: number; y: number; w: number; h: number }
  ): boolean {
    const cx = d.x + this.doorVisW / 2;
    const cy = d.y + this.doorVisH / 2;
    return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
  }

  /** Desplaza máquinas y puertas capturadas junto con la zona (mismo delta que el rectángulo). */
  private shiftMaquinasYPuertasConZona(
    machineIds: readonly number[],
    moveEntrada: boolean,
    moveSalida: boolean,
    dx: number,
    dy: number
  ): void {
    if (dx === 0 && dy === 0) {
      return;
    }
    const SW = this.logicalStageW();
    const SH = this.logicalStageH();
    const idSet = new Set(machineIds);
    if (idSet.size > 0) {
      this.machines = this.machines.map((m) => {
        if (!idSet.has(m.id)) {
          return m;
        }
        return this.snapMachine({
          ...m,
          x: this.clamp(m.x + dx, 0, Math.max(0, SW - m.w)),
          y: this.clamp(m.y + dy, 0, Math.max(0, SH - m.h)),
        });
      });
    }
    if (moveEntrada && this.entrada) {
      this.entrada = {
        ...this.entrada,
        x: this.clamp(this.entrada.x + dx, 0, Math.max(0, SW - this.doorVisW)),
        y: this.clamp(this.entrada.y + dy, 0, Math.max(0, SH - this.doorVisH)),
      };
    }
    if (moveSalida && this.salida) {
      this.salida = {
        ...this.salida,
        x: this.clamp(this.salida.x + dx, 0, Math.max(0, SW - this.doorVisW)),
        y: this.clamp(this.salida.y + dy, 0, Math.max(0, SH - this.doorVisH)),
      };
    }
  }

  private clearZoneMoveCaptures(): void {
    this.zoneDragCapturedMachineIds = [];
    this.zoneDragMoveEntrada = false;
    this.zoneDragMoveSalida = false;
    this.zoneResizeCapturedMachineIds = [];
    this.zoneResizeMoveEntrada = false;
    this.zoneResizeMoveSalida = false;
  }

  /** API: solo id + posición; dentro de zona no se envía idZona (la zona viene del padre). */
  private serializeMachineParaLayoutApi(m: MachineItem): Record<string, unknown> {
    return {
      id: m.catalogMachineId ?? m.id,
      x: m.x,
      y: m.y,
    };
  }

  private buildAreaPoligonoJsonForPut(): Record<string, unknown> {
    const zonas = this.zones.map((z) => ({
      id: z.catalogZoneId ?? z.id,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      maquinas: this.machines
        .filter((m) => this.maquinaCentroEnZona(m, z))
        .map((m) => this.serializeMachineParaLayoutApi(m)),
    }));
    const maquinasSinZona = this.machines
      .filter((m) => !this.zones.some((z) => this.maquinaCentroEnZona(m, z)))
      .map((m) => this.serializeMachineParaLayoutApi(m));

    const payload: Record<string, unknown> = {
      dimensiones: {
        ancho: this.canvasLogicalW,
        alto: this.canvasLogicalH,
        zoom: this.zoom,
      },
      maquinaTamano: {
        ancho: this.defaultMachineW,
        alto: this.defaultMachineH,
      },
      zonas,
      maquinasSinZona,
    };
    if (this.entrada) {
      payload['entrada'] = { ...this.entrada };
    }
    if (this.salida) {
      payload['salida'] = { ...this.salida };
    }
    return payload;
  }

  guardarDistribucionSala(): void {
    const id = this.idSalaDistribucion;
    if (id == null || id <= 0) {
      return;
    }
    this.loading = true;
    this.submitButton = 'Guardando...';
    const areaPoligonoJson = this.buildAreaPoligonoJsonForPut();
    this.salaService.guardarLayoutMapaSala(id, { areaPoligonoJson }).subscribe({
      next: () => {
        this.loading = false;
        this.submitButton = 'Guardar distribución';
        Swal.fire({
          title: 'Guardado',
          text: 'La distribución se guardó correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
        }).then(() => this.regresar());
      },
      error: (error) => {
        this.loading = false;
        this.submitButton = 'Guardar distribución';
        Swal.fire({
          title: 'Error',
          text: error?.error?.message ?? 'No se pudo guardar la distribución.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }

  private normalizarListaApi(resp: any): any[] {
    if (Array.isArray(resp)) {
      return resp;
    }
    if (Array.isArray(resp?.data)) {
      return resp.data;
    }
    return [];
  }

  /** Catálogos del diagrama: máquinas globales y zonas de esta sala. */
  cargarCatalogosDistribucionSala(idSala: number): void {
    this.maquinasService.obtenerMaquinas().subscribe({
      next: (resp: any) => {
        this.listaMaquinasDistribucion = this.normalizarListaApi(resp);
      },
      error: () => {
        this.listaMaquinasDistribucion = [];
      },
    });
    this.zonaService.obtenerZonasPorSala(idSala).subscribe({
      next: (resp: any) => {
        this.listaZonasPorSalaDistribucion = this.normalizarListaApi(resp);
      },
      error: () => {
        this.listaZonasPorSalaDistribucion = [];
      },
    });
  }

  private mapTipoMaquinaDesdeApi(row: any): MachineType {
    return this.inferMachineTypeFromApi(row);
  }

  private mapEstatusMaquinaApi(row: any): MachineStatus {
    const nombre = String(row?.estatusMaquinaNombre ?? '').toLowerCase();
    if (
      nombre.includes('manten') ||
      nombre.includes('inactiv') ||
      nombre.includes('repar') ||
      nombre.includes('baja')
    ) {
      return 'Mantenimiento';
    }
    const st = row?.estatusMaquina ?? row?.estatus ?? row?.idEstatusMaquina;
    if (st === 0 || st === '0' || String(st).toLowerCase() === 'mantenimiento') {
      return 'Mantenimiento';
    }
    return 'Activa';
  }

  agregarMaquinaDesdeCatalogo(row: any): void {
    const tipo = this.mapTipoMaquinaDesdeApi(row);
    const idBd = Number(row?.idMaquina ?? row?.id ?? 0);
    const instanceId = this.nextId(this.machines.map((x) => x.id));
    const nombre = String(row?.nombreMaquina ?? row?.nombre ?? `${tipo} ${idBd || instanceId}`).trim();
    const serial = String(
      row?.numeroSerie ?? row?.serial ?? this.makeSerial(tipo, idBd || instanceId)
    ).trim();
    const img = this.resolveMachineDisplayImg(row, tipo);
    const status = this.mapEstatusMaquinaApi(row);
    const label = idBd > 0 ? idBd : instanceId;
    const base: MachineItem = {
      id: instanceId,
      label,
      catalogMachineId: idBd > 0 ? idBd : undefined,
      type: tipo,
      name: nombre,
      status,
      serial,
      img,
      x: 60 + (this.machines.length % 10) * 58,
      y: 80 + (this.machines.length % 6) * 48,
      w: Math.max(this.defaultMachineW, 40),
      h: Math.max(this.defaultMachineH, 40),
      r: 0,
    };
    const placed = this.placeWithoutOverlap(base);
    this.machines = [...this.machines, placed];
    this.selectedMachineId = instanceId;
    this.selectedZoneId = null;
    this.placingDoor = null;
    this.persistPlanoToForm();
  }

  agregarZonaDesdeCatalogoSala(row: any): void {
    const nombreZona = String(row?.nombreZona ?? row?.nombre ?? 'Zona').trim();
    const tipoEtiqueta = String(row?.nombreTipoZona ?? row?.tipoZona ?? nombreZona ?? 'Sala').trim();
    const idBd = Number(row?.idZona ?? row?.id ?? 0);
    const instanceId = this.nextId(this.zones.map((x) => x.id));
    const z: ZoneItem = {
      id: instanceId,
      catalogZoneId: idBd > 0 ? idBd : undefined,
      type: (tipoEtiqueta || 'Sala') as ZoneType,
      x: 40 + (this.zones.length % 8) * 80,
      y: 40 + (this.zones.length % 5) * 60,
      w: 260,
      h: 160,
    };
    this.zones = [...this.zones, this.snapZone(z)];
    this.selectedZoneId = instanceId;
    this.selectedMachineId = null;
    this.placingDoor = null;
    this.persistPlanoToForm();
  }

  addMachine(type: any) {
    if (!type) return;
    const t = type as MachineType;
    const id = this.nextId(this.machines.map(x => x.id));
    const img = this.machineImg(t);
    const label = id;
    const base: MachineItem = {
      id,
      label,
      type: t,
      name: `${t} ${label}`,
      status: 'Activa',
      serial: this.makeSerial(t, id),
      img,
      x: 60 + (id % 10) * 58,
      y: 80 + (id % 6) * 48,
      w: Math.max(this.defaultMachineW, 40),
      h: Math.max(this.defaultMachineH, 40),
      r: 0
    };
    const placed = this.placeWithoutOverlap(base);
    this.machines = [...this.machines, placed];
    this.selectedMachineId = id;
    this.selectedZoneId = null;
    this.placingDoor = null;
    this.persistPlanoToForm();
  }

  addZone() {
    const idTipoZona = this.zonaForm.get('idTipoZona')?.value;
    if (!idTipoZona) return;
    const tipoZona = this.listaTipoZona?.find((tz: any) => Number(tz.id) === Number(idTipoZona));
    if (!tipoZona) return;
    const id = this.nextId(this.zones.map(x => x.id));
    const z: ZoneItem = {
      id,
      type: tipoZona.nombre as ZoneType,
      x: 40 + (id % 8) * 80,
      y: 40 + (id % 5) * 60,
      w: 260,
      h: 160
    };
    this.zones = [...this.zones, this.snapZone(z)];
    this.selectedZoneId = id;
    this.selectedMachineId = null;
    this.placingDoor = null;
    this.persistPlanoToForm();
  }

  getTipoZonaNombre(id: number): string {
    const tipoZona = this.listaTipoZona?.find((tz: any) => Number(tz.id) === Number(id));
    return tipoZona?.nombre || '';
  }

  removeSelectedZone() {
    if (!this.selectedZoneId) return;
    const id = this.selectedZoneId;
    this.zones = this.zones.filter(z => z.id !== id);
    this.selectedZoneId = null;
    this.persistPlanoToForm();
  }

  startPlacingDoor(type: DoorType) {
    this.placingDoor = type;
    this.selectedMachineId = null;
    this.selectedZoneId = null;
    this.editNameId = null;
    const w = this.logicalStageW();
    const h = this.logicalStageH();
    const doorW = 130;
    const doorH = 54;
    const cx = this.clamp(Math.round(((w - doorW) / 2) / this.grid) * this.grid, 0, Math.max(0, w - doorW));
    const cy = this.clamp(Math.round(((h - doorH) / 2) / this.grid) * this.grid, 0, Math.max(0, h - doorH));
    if (type === 'ENTRADA' && !this.entrada) {
      this.entrada = { x: cx, y: cy, r: 0 };
      this.persistPlanoToForm();
    }
    if (type === 'SALIDA' && !this.salida) {
      this.salida = { x: cx, y: cy, r: 0 };
      this.persistPlanoToForm();
    }
  }

  rotateDoor(type: DoorType, delta: number) {
    if (type === 'ENTRADA') {
      if (!this.entrada) return;
      this.entrada = { ...this.entrada, r: this.normalizeRotation(this.entrada.r + delta) };
    } else {
      if (!this.salida) return;
      this.salida = { ...this.salida, r: this.normalizeRotation(this.salida.r + delta) };
    }
    this.persistPlanoToForm();
  }

  placeDoorAt(x: number, y: number) {
    if (!this.placingDoor) return;
    const SW = this.logicalStageW();
    const SH = this.logicalStageH();
    const px = this.clamp(Math.round(x / this.grid) * this.grid, 0, Math.max(0, SW - 46));
    const py = this.clamp(Math.round(y / this.grid) * this.grid, 0, Math.max(0, SH - 46));
    const point: DoorPoint = { x: px, y: py, r: 0 };
    if (this.placingDoor === 'ENTRADA') this.entrada = point;
    else this.salida = point;
    this.placingDoor = null;
    this.persistPlanoToForm();
  }

  removeDoor(type: DoorType) {
    if (type === 'ENTRADA') this.entrada = null;
    else this.salida = null;
    this.persistPlanoToForm();
  }

  selectMachine(id: number) {
    this.selectedMachineId = id;
    this.selectedZoneId = null;
    this.placingDoor = null;
  }

  selectZone(id: number) {
    this.selectedZoneId = id;
    this.selectedMachineId = null;
    this.placingDoor = null;
  }

  clearSelection() {
    this.selectedMachineId = null;
    this.selectedZoneId = null;
    this.editNameId = null;
    this.placingDoor = null;
  }

  startEditName(id: number) {
    this.editNameId = id;
  }

  commitName(id: number, value: string) {
    this.editNameId = null;
    const v = (value ?? '').trim();
    if (!v) return;
    this.machines = this.machines.map(m => m.id === id ? { ...m, name: v } : m);
    this.persistPlanoToForm();
  }

  rotateSelected(delta: number) {
    if (!this.selectedMachineId) return;
    this.machines = this.machines.map(m => {
      if (m.id !== this.selectedMachineId) return m;
      return { ...m, r: this.normalizeRotation(m.r + delta) };
    });
    this.persistPlanoToForm();
  }

  removeSelectedMachine() {
    if (!this.selectedMachineId) return;
    const id = this.selectedMachineId;
    this.machines = this.machines.filter(m => m.id !== id);
    this.selectedMachineId = null;
    this.persistPlanoToForm();
  }

  removeZone(id: number) {
    this.zones = this.zones.filter(z => z.id !== id);
    if (this.selectedZoneId === id) this.selectedZoneId = null;
    this.persistPlanoToForm();
  }

  zoomIn() {
    this.applyZoomFactor(1.1);
  }

  zoomOut() {
    this.applyZoomFactor(1 / 1.1);
  }

  /** Zoom respecto al centro del viewport del lienzo. */
  private applyZoomFactor(factor: number) {
    const rect = this.stageRect();
    if (!rect) {
      this.zoom = this.clamp(this.zoom * factor, this.zoomMin, this.zoomMax);
      return;
    }
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const canvasX = (cx - this.viewPanX) / this.zoom;
    const canvasY = (cy - this.viewPanY) / this.zoom;
    const newZoom = this.clamp(this.zoom * factor, this.zoomMin, this.zoomMax);
    this.zoom = newZoom;
    this.viewPanX = cx - canvasX * this.zoom;
    this.viewPanY = cy - canvasY * this.zoom;
  }

  resetZoom() {
    this.zoom = 1;
    this.viewPanX = 0;
    this.viewPanY = 0;
  }

  onStageWheel(ev: WheelEvent): void {
    if (!this.modoDistribucionSala) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    const rect = this.stageRect();
    if (!rect || this.zoom <= 0) {
      return;
    }
    const delta = ev.deltaY;
    const factor = delta > 0 ? 1 / 1.1 : 1.1;
    const newZoom = this.clamp(this.zoom * factor, this.zoomMin, this.zoomMax);
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const canvasX = (mx - this.viewPanX) / this.zoom;
    const canvasY = (my - this.viewPanY) / this.zoom;
    this.zoom = newZoom;
    this.viewPanX = mx - canvasX * this.zoom;
    this.viewPanY = my - canvasY * this.zoom;
  }

  onStageBackgroundClick(ev: MouseEvent): void {
    if (this.suppressNextStageClick) {
      this.suppressNextStageClick = false;
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    this.clearSelection();
  }

  private clientToCanvas(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.stageRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    return {
      x: (clientX - rect.left - this.viewPanX) / this.zoom,
      y: (clientY - rect.top - this.viewPanY) / this.zoom,
    };
  }

  private onViewportPanMove = (ev: PointerEvent) => {
    if (!this.viewportPanning || ev.pointerId !== this.panPointerId) {
      return;
    }
    ev.preventDefault();
    const dx = ev.clientX - this.panLastClient.x;
    const dy = ev.clientY - this.panLastClient.y;
    this.panMovedSq += dx * dx + dy * dy;
    this.panLastClient = { x: ev.clientX, y: ev.clientY };
    this.viewPanX += dx;
    this.viewPanY += dy;
  };

  private onViewportPanEnd = (ev: PointerEvent) => {
    if (!this.viewportPanning) {
      return;
    }
    if (ev.pointerId !== this.panPointerId) {
      return;
    }
    this.viewportPanning = false;
    this.pointerActive = false;
    if (this.panMovedSq > 36) {
      this.suppressNextStageClick = true;
    }
    this.panMovedSq = 0;
    this.panPointerId = null;
    try {
      this.stageRef?.nativeElement?.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    window.removeEventListener('pointermove', this.onViewportPanMove);
    window.removeEventListener('pointerup', this.onViewportPanEnd);
    window.removeEventListener('pointercancel', this.onViewportPanEnd);
  };

  orientationLabel(r: number) {
    const rr = this.normalizeRotation(r);
    if (rr === 0) return 'N';
    if (rr === 90) return 'E';
    if (rr === 180) return 'S';
    return 'O';
  }

  onStagePointerDown(ev: PointerEvent) {
    if (ev.button !== 0) {
      return;
    }
    this.pointerActive = true;
    if (this.placingDoor) {
      const { x: px, y: py } = this.clientToCanvas(ev.clientX, ev.clientY);
      this.placeDoorAt(px, py);
      return;
    }
    this.viewportPanning = true;
    this.panPointerId = ev.pointerId;
    this.panLastClient = { x: ev.clientX, y: ev.clientY };
    this.panMovedSq = 0;
    const el = this.stageRef?.nativeElement;
    if (el) {
      try {
        el.setPointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('pointermove', this.onViewportPanMove, { passive: false });
    window.addEventListener('pointerup', this.onViewportPanEnd, { passive: false });
    window.addEventListener('pointercancel', this.onViewportPanEnd, { passive: false });
  }

  onMachinePointerDown(ev: PointerEvent, m: MachineItem) {
    ev.stopPropagation();
    this.pointerActive = true;
    this.draggingMachineId = m.id;
    this.selectedMachineId = m.id;
    this.selectedZoneId = null;
    this.placingDoor = null;
    const { x: px, y: py } = this.clientToCanvas(ev.clientX, ev.clientY);
    this.dragOffsetX = px - m.x;
    this.dragOffsetY = py - m.y;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  onZonePointerDown(ev: PointerEvent, z: ZoneItem) {
    ev.stopPropagation();
    this.pointerActive = true;
    this.draggingZoneId = z.id;
    this.selectedZoneId = z.id;
    this.selectedMachineId = null;
    this.placingDoor = null;
    this.zoneDragCapturedMachineIds = this.machines
      .filter((m) => this.maquinaCentroEnZona(m, z))
      .map((m) => m.id);
    this.zoneDragMoveEntrada = !!(this.entrada && this.doorCentroEnRect(this.entrada, z));
    this.zoneDragMoveSalida = !!(this.salida && this.doorCentroEnRect(this.salida, z));
    const { x: px, y: py } = this.clientToCanvas(ev.clientX, ev.clientY);
    this.dragOffsetX = px - z.x;
    this.dragOffsetY = py - z.y;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  onZoneResizePointerDown(
    ev: PointerEvent,
    z: ZoneItem,
    handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) {
    ev.stopPropagation();
    this.pointerActive = true;
    this.resizingZoneId = z.id;
    this.resizeHandle = handle;
    this.selectedZoneId = z.id;
    this.selectedMachineId = null;
    this.placingDoor = null;
    const { x: px, y: py } = this.clientToCanvas(ev.clientX, ev.clientY);
    this.resizeStart = { x: px, y: py };
    this.resizeStartRect = { x: z.x, y: z.y, w: z.w, h: z.h };
    const sr = this.resizeStartRect;
    this.zoneResizeCapturedMachineIds = this.machines
      .filter((m) => this.maquinaCentroEnRect(m, sr))
      .map((m) => m.id);
    this.zoneResizeMoveEntrada = !!(this.entrada && this.doorCentroEnRect(this.entrada, sr));
    this.zoneResizeMoveSalida = !!(this.salida && this.doorCentroEnRect(this.salida, sr));
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  private onPointerMove = (ev: PointerEvent) => {
    if (!this.pointerActive) return;
    ev.preventDefault();
    const { x: px, y: py } = this.clientToCanvas(ev.clientX, ev.clientY);
    const SW = this.logicalStageW();
    const SH = this.logicalStageH();
    this.snapGuide.showV = false;
    this.snapGuide.showH = false;
    if (this.draggingMachineId) {
      const idx = this.machines.findIndex(x => x.id === this.draggingMachineId);
      if (idx < 0) return;
      const m = this.machines[idx];
      const maxX = Math.max(0, SW - m.w);
      const maxY = Math.max(0, SH - m.h);
      const nx = this.clamp(px - this.dragOffsetX, 0, maxX);
      const ny = this.clamp(py - this.dragOffsetY, 0, maxY);
      const snapped = this.snapWithGuides(nx, ny);
      const candidate = { ...m, x: snapped.x, y: snapped.y };
      const placed = this.resolveOverlap(candidate);
      const next = [...this.machines];
      next[idx] = placed;
      this.machines = next;
      return;
    }

    if (this.draggingZoneId) {
      const idx = this.zones.findIndex(x => x.id === this.draggingZoneId);
      if (idx < 0) return;
      const z = this.zones[idx];
      const oldX = z.x;
      const oldY = z.y;
      const maxX = Math.max(0, SW - z.w);
      const maxY = Math.max(0, SH - z.h);
      const nx = this.clamp(px - this.dragOffsetX, 0, maxX);
      const ny = this.clamp(py - this.dragOffsetY, 0, maxY);
      const newZ = this.snapZone({ ...z, x: nx, y: ny });
      const dx = newZ.x - oldX;
      const dy = newZ.y - oldY;
      const next = [...this.zones];
      next[idx] = newZ;
      this.zones = next;
      this.shiftMaquinasYPuertasConZona(
        this.zoneDragCapturedMachineIds,
        this.zoneDragMoveEntrada,
        this.zoneDragMoveSalida,
        dx,
        dy
      );
      return;
    }

    if (this.resizingZoneId) {
      const idx = this.zones.findIndex(x => x.id === this.resizingZoneId);
      if (idx < 0) return;
      const z = this.zones[idx];
      const pdx = px - this.resizeStart.x;
      const pdy = py - this.resizeStart.y;
      const sr = this.resizeStartRect;
      const h = this.resizeHandle;
      let nx = sr.x;
      let ny = sr.y;
      let nw = sr.w;
      let nh = sr.h;
      if (h === 'e' || h === 'ne' || h === 'se') {
        nw = this.clamp(sr.w + pdx, 140, Math.max(140, SW - sr.x));
      }
      if (h === 'w' || h === 'nw' || h === 'sw') {
        nw = this.clamp(sr.w - pdx, 140, sr.x + sr.w);
        nx = sr.x + sr.w - nw;
      }
      if (h === 's' || h === 'se' || h === 'sw') {
        nh = this.clamp(sr.h + pdy, 90, Math.max(90, SH - sr.y));
      }
      if (h === 'n' || h === 'ne' || h === 'nw') {
        nh = this.clamp(sr.h - pdy, 90, sr.y + sr.h);
        ny = sr.y + sr.h - nh;
      }
      const oldX = z.x;
      const oldY = z.y;
      const newZ = this.snapZone({ ...z, x: nx, y: ny, w: nw, h: nh });
      const dx = newZ.x - oldX;
      const dy = newZ.y - oldY;
      const next = [...this.zones];
      next[idx] = newZ;
      this.zones = next;
      this.shiftMaquinasYPuertasConZona(
        this.zoneResizeCapturedMachineIds,
        this.zoneResizeMoveEntrada,
        this.zoneResizeMoveSalida,
        dx,
        dy
      );
    }
  };

  private onPointerUp = (_ev: PointerEvent) => {
    this.pointerActive = false;
    this.resizeHandle = null;
    this.draggingMachineId = null;
    this.draggingZoneId = null;
    this.resizingZoneId = null;
    this.clearZoneMoveCaptures();
    this.snapGuide.showV = false;
    this.snapGuide.showH = false;
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.persistPlanoToForm();
  };

  private snapWithGuides(x: number, y: number) {
    const gx = Math.round(x / this.grid) * this.grid;
    const gy = Math.round(y / this.grid) * this.grid;
    const showV = Math.abs(gx - x) <= 4;
    const showH = Math.abs(gy - y) <= 4;
    if (showV) { this.snapGuide.showV = true; this.snapGuide.v = gx; }
    if (showH) { this.snapGuide.showH = true; this.snapGuide.h = gy; }
    return { x: gx, y: gy };
  }

  private resolveOverlap(candidate: MachineItem) {
    const others = this.machines.filter(m => m.id !== candidate.id);
    if (!others.some(o => this.overlaps(candidate, o))) return this.snapMachine(candidate);
    const step = this.grid;
    for (let r = step; r <= 140; r += step) {
      const tries = [
        { x: candidate.x + r, y: candidate.y },
        { x: candidate.x - r, y: candidate.y },
        { x: candidate.x, y: candidate.y + r },
        { x: candidate.x, y: candidate.y - r },
        { x: candidate.x + r, y: candidate.y + r },
        { x: candidate.x - r, y: candidate.y + r },
        { x: candidate.x + r, y: candidate.y - r },
        { x: candidate.x - r, y: candidate.y - r }
      ];
      for (const t of tries) {
        const test = this.snapMachine({
          ...candidate,
          x: this.clamp(t.x, 0, Math.max(0, this.logicalStageW() - candidate.w)),
          y: this.clamp(t.y, 0, Math.max(0, this.logicalStageH() - candidate.h))
        });
        if (!others.some(o => this.overlaps(test, o))) return test;
      }
    }
    return this.snapMachine(candidate);
  }

  private placeWithoutOverlap(base: MachineItem) {
    return this.resolveOverlap(this.snapMachine(base));
  }

  private overlaps(a: MachineItem, b: MachineItem) {
    const ax1 = a.x, ay1 = a.y, ax2 = a.x + a.w, ay2 = a.y + a.h;
    const bx1 = b.x, by1 = b.y, bx2 = b.x + b.w, by2 = b.y + b.h;
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
  }

  private persistPlanoToForm() {
    const planoData = {
      machines: this.machines ?? [],
      zones: this.zones ?? [],
      entrada: this.entrada ?? null,
      salida: this.salida ?? null
    };
    this.zonaForm.patchValue({
      areaPoligonoJSON: planoData
    }, { emitEvent: false });
  }

  loadPlanoFromAreaPoligono(areaPoligonoJSON: any) {
    if (!areaPoligonoJSON) {
      this.machines = [];
      this.zones = [];
      this.entrada = null;
      this.salida = null;
      return;
    }

    const rawPlano = areaPoligonoJSON.machines ?? [];
    const rawZonas = areaPoligonoJSON.zones ?? [];
    const rawEntrada = areaPoligonoJSON.entrada ?? null;
    const rawSalida = areaPoligonoJSON.salida ?? null;

    const ms = this.safeParseArray(rawPlano).map((p: any, i: number) => {
      const type = this.inferMachineTypeFromApi(p);
      const id = Number(p.id ?? (i + 1));
      return {
        id,
        label: Number(p.label ?? id),
        type,
        name: String(p.name ?? p.nombre ?? `${type} ${id}`),
        status: this.mapEstatusMaquinaApi(p),
        serial: String(p.serial ?? p.numeroSerie ?? this.makeSerial(type, id)),
        img: this.resolveMachineDisplayImg(p, type),
        x: Number(p.x ?? 60),
        y: Number(p.y ?? 80),
        w: Math.max(Number(p.w ?? 180), 180),
        h: Math.max(Number(p.h ?? 130), 130),
        r: this.normalizeRotation(Number(p.r ?? 0))
      } as MachineItem;
    }).map(m => this.snapMachine(m));
    const zs = this.safeParseArray(rawZonas).map((p: any, i: number) => {
      const id = Number(p.id ?? (i + 1));
      return {
        id,
        type: String(p.type ?? p.nombre ?? 'VIP').trim() as ZoneType,
        x: Number(p.x ?? 40),
        y: Number(p.y ?? 40),
        w: Number(p.w ?? 260),
        h: Number(p.h ?? 160)
      } as ZoneItem;
    }).map(z => this.snapZone(z));
    this.machines = ms;
    this.zones = zs;
    this.entrada = this.safeParsePoint(rawEntrada);
    this.salida = this.safeParsePoint(rawSalida);
    this.persistPlanoToForm();
  }

  private machineHoverTimer: any = null;

  onMachineHoverEnter(id: number) {
    if (this.machineHoverTimer) {
      clearTimeout(this.machineHoverTimer);
      this.machineHoverTimer = null;
    }
    this.hoverId = id;
  }

  onMachineHoverLeave(id: number) {
    if (this.machineHoverTimer) clearTimeout(this.machineHoverTimer);

    this.machineHoverTimer = setTimeout(() => {
      if (this.hoverId === id && this.editNameId !== id) {
        this.hoverId = null;
      }
    }, 150);
  }

  onMachineTooltipEnter(id: number) {
    if (this.machineHoverTimer) {
      clearTimeout(this.machineHoverTimer);
      this.machineHoverTimer = null;
    }
    this.hoverId = id;
  }

  onMachineTooltipLeave(id: number) {
    this.onMachineHoverLeave(id);
  }

  private safeParseArray(raw: any) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private safeParsePoint(raw: any): DoorPoint | null {
    try {
      if (!raw) return null;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object') return null;
      const x = Number(parsed.x);
      const y = Number(parsed.y);
      const r = this.normalizeRotation(Number(parsed.r ?? 0));
      if (Number.isNaN(x) || Number.isNaN(y)) return null;
      return {
        x: this.clamp(Math.round(x / this.grid) * this.grid, 0, Math.max(0, this.logicalStageW() - 46)),
        y: this.clamp(Math.round(y / this.grid) * this.grid, 0, Math.max(0, this.logicalStageH() - 46)),
        r
      };
    } catch {
      return null;
    }
  }

  private stageRect() {
    const el = this.stageRef?.nativeElement;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!this.modoDistribucionSala) {
      this.stageW = rect.width;
      this.stageH = rect.height;
    }
    return rect;
  }

  private logicalStageW() {
    if (this.modoDistribucionSala) {
      return this.canvasLogicalW;
    }
    const rect = this.stageRect();
    return rect ? rect.width / this.zoom : this.stageW;
  }

  private logicalStageH() {
    if (this.modoDistribucionSala) {
      return this.canvasLogicalH;
    }
    const rect = this.stageRect();
    return rect ? rect.height / this.zoom : this.stageH;
  }

  private normalizeRotation(r: number) {
    return ((r % 360) + 360) % 360;
  }

  resetMachineRotation(id: number) {
    this.machines = this.machines.map(m => m.id === id ? { ...m, r: 0 } : m);
    this.persistPlanoToForm();
  }

  private snapMachine(m: MachineItem) {
    return {
      ...m,
      x: Math.round(m.x / this.grid) * this.grid,
      y: Math.round(m.y / this.grid) * this.grid
    };
  }

  private snapZone(z: ZoneItem) {
    return {
      ...z,
      x: Math.round(z.x / this.grid) * this.grid,
      y: Math.round(z.y / this.grid) * this.grid,
      w: Math.round(z.w / this.grid) * this.grid,
      h: Math.round(z.h / this.grid) * this.grid
    };
  }

  private nextId(ids: number[]) {
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  /** Texto normalizado para emparejar tipo/nombre de máquina con assets locales. */
  private normalizeMaquinaHaystack(p: any): string {
    const parts = [
      p?.nombre,
      p?.name,
      p?.nombreTipoMaquina,
      p?.tipoMaquina,
      p?.tipo,
      p?.modelo,
      p?.marca,
    ];
    return parts
      .filter((x) => x != null && String(x).trim() !== '')
      .map((x) =>
        String(x)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      )
      .join(' ');
  }

  /** Tipo interno del diagrama a partir del payload del API (nombre, tipo, etc.). */
  private inferMachineTypeFromApi(p: any): MachineType {
    const h = this.normalizeMaquinaHaystack(p);
    if ((h.includes('video') && h.includes('poker')) || h.includes('videopoker')) {
      return 'Poker';
    }
    if ((h.includes('video') && h.includes('slot')) || h.includes('videoslot')) {
      return 'Tragamonedas';
    }
    if (h.includes('keno')) {
      return 'Tragamonedas';
    }
    if (h.includes('ruleta')) {
      return 'Ruleta';
    }
    if (h.includes('blackjack') || h.includes('blackjac') || h.includes('black jack')) {
      return 'Blackjack';
    }
    if (h.includes('poker')) {
      return 'Poker';
    }
    const rawType = String(p?.type ?? p?.tipoMaquina ?? p?.nombreTipoMaquina ?? '').trim();
    if (rawType) {
      const x = rawType.toLowerCase();
      if (x.includes('ruleta')) {
        return 'Ruleta';
      }
      if (x.includes('black')) {
        return 'Blackjack';
      }
      if (x.includes('poker')) {
        return 'Poker';
      }
    }
    return 'Tragamonedas';
  }

  /**
   * Icono del plano: rutas bajo `assets/maquinas/` (PNG locales).
   * No se usan URLs remotas (iconoMaquina / imagenMaquina del servicio).
   */
  private maquinaImgFromApiPayload(p: any, type: MachineType): string {
    const h = this.normalizeMaquinaHaystack(p);
    if ((h.includes('video') && h.includes('poker')) || h.includes('videopoker')) {
      return 'assets/maquinas/VideoPoker.png';
    }
    if ((h.includes('video') && h.includes('slot')) || h.includes('videoslot')) {
      return 'assets/maquinas/VideoSlot.png';
    }
    if (h.includes('ruleta') && h.includes('electron')) {
      return 'assets/maquinas/RuletaElectronica.png';
    }
    if (h.includes('blackjac') || (h.includes('blackjack') && h.includes('electron'))) {
      return 'assets/maquinas/BlackJacElectronico.png';
    }
    if (h.includes('keno')) {
      return 'assets/maquinas/Keno.png';
    }
    if (h.includes('tragamoneda') || h.includes('tragaperr') || h.includes('slot machine')) {
      return 'assets/maquinas/Tragamonedas.png';
    }
    if (h.includes('ruleta')) {
      return 'assets/maquinas/RuletaElectronica.png';
    }
    return this.machineImg(type);
  }

  /** Ignora imágenes http(s) del API; conserva solo rutas locales ya guardadas. */
  private resolveMachineDisplayImg(p: any, type: MachineType): string {
    const local = this.maquinaImgFromApiPayload(p, type);
    const cand = p?.img;
    if (typeof cand === 'string' && cand.startsWith('assets/')) {
      return cand;
    }
    if (typeof cand === 'string' && /^https?:\/\//i.test(cand)) {
      return local;
    }
    if (typeof cand === 'string' && cand.length > 0 && !/^https?:\/\//i.test(cand)) {
      return cand;
    }
    return local;
  }

  /** Fallback por tipo cuando el texto del API no coincide: mismos PNG que en `assets/maquinas/`. */
  private machineImg(type: MachineType) {
    if (type === 'Tragamonedas') return 'assets/maquinas/Tragamonedas.png';
    if (type === 'Ruleta') return 'assets/maquinas/RuletaElectronica.png';
    if (type === 'Blackjack') return 'assets/maquinas/BlackJacElectronico.png';
    return 'assets/maquinas/VideoPoker.png';
  }

  private makeSerial(type: MachineType, id: number) {
    const t = type === 'Tragamonedas' ? 'TRG' : type === 'Ruleta' ? 'RLT' : type === 'Blackjack' ? 'BLJ' : 'PKR';
    const stamp = Date.now().toString().slice(-7);
    return `${t}-${stamp}-${id}`;
  }

  miniX(x: number) { return (x / this.logicalStageW()) * 100; }
  miniY(y: number) { return (y / this.logicalStageH()) * 100; }
  miniW(w: number) { return (w / this.logicalStageW()) * 100; }
  miniH(h: number) { return (h / this.logicalStageH()) * 100; }

  onDoorPointerDown(e: PointerEvent, type: DoorType) {
    const target = e.target as HTMLElement;
    if (target.closest('.door-pop') || target.closest('.door-pop-btn')) return;
    e.stopPropagation();
    this.clearSelection();
    this.selectedDoor = type;
    this.draggingDoor = type;
    const { x, y } = this.clientToCanvas(e.clientX, e.clientY);

    const d = type === 'ENTRADA' ? this.entrada : this.salida;
    if (!d) return;
    this.doorDragOffset = { x: x - d.x, y: y - d.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  onDoorHoverLeave(e: MouseEvent, type: DoorType) {
    const toEl = e.relatedTarget as HTMLElement | null;
    if (toEl && toEl.closest('.door-pop')) return;
    if (this.doorHover === type) this.doorHover = null;
  }

  @HostListener('window:pointermove', ['$event'])
  onDoorPointerMove(e: PointerEvent) {
    if (!this.draggingDoor) return;
    const { x, y } = this.clientToCanvas(e.clientX, e.clientY);
    const SW = this.logicalStageW();
    const SH = this.logicalStageH();
    const nx = this.clamp(x - this.doorDragOffset.x, 0, SW - this.doorVisW);
    const ny = this.clamp(y - this.doorDragOffset.y, 0, SH - this.doorVisH);
    if (this.draggingDoor === 'ENTRADA' && this.entrada) {
      this.entrada = { ...this.entrada, x: nx, y: ny };
    }
    if (this.draggingDoor === 'SALIDA' && this.salida) {
      this.salida = { ...this.salida, x: nx, y: ny };
    }
    this.persistPlanoToForm();
  }

  @HostListener('window:pointerup', ['$event'])
  onDoorPointerUp(_: PointerEvent) {
    this.draggingDoor = null;
    this.doorPointerId = null;
    this.stopHoldRotate();
  }

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  startHoldRotateDoor(type: DoorType, dir: number) {
    this.stopHoldRotate();
    this.rotateDir = dir >= 0 ? 1 : -1;
    this.rotateStep = 3;
    this.rotateDoorTarget = type;
    this.rotateMachineTarget = false;
    this.rotateTickId = setInterval(() => {
      if (!this.rotateDoorTarget) return;
      this.rotateDoor(this.rotateDoorTarget, this.rotateDir * this.rotateStep);
    }, 30);
    this.rotateAccelId = setInterval(() => {
      this.rotateStep = Math.min(this.rotateStep + 2, 22);
    }, 180);
  }

  startHoldRotateSelected(dir: number) {
    if (!this.selectedMachineId) return;
    this.stopHoldRotate();
    this.rotateDir = dir >= 0 ? 1 : -1;
    this.rotateStep = 3;
    this.rotateDoorTarget = null;
    this.rotateMachineTarget = true;
    this.rotateTickId = setInterval(() => {
      if (!this.selectedMachineId) return;
      this.rotateSelected(this.rotateDir * this.rotateStep);
    }, 30);
    this.rotateAccelId = setInterval(() => {
      this.rotateStep = Math.min(this.rotateStep + 2, 22);
    }, 180);
  }

  stopHoldRotate() {
    if (this.rotateTickId) {
      clearInterval(this.rotateTickId);
      this.rotateTickId = null;
    }
    if (this.rotateAccelId) {
      clearInterval(this.rotateAccelId);
      this.rotateAccelId = null;
    }
    this.rotateDoorTarget = null;
    this.rotateMachineTarget = false;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selectedZoneId) {
        e.preventDefault();
        this.removeSelectedZone();
      }
    }
  }

  limpiarPlano() {
    this.machines = [];
    this.zones = [];
    this.entrada = null;
    this.salida = null;
    this.selectedMachineId = null;
    this.selectedZoneId = null;
    this.editNameId = null;
    this.placingDoor = null;
    this.zoom = 1;
    this.viewPanX = 0;
    this.viewPanY = 0;
    this.snapGuide = { showV: false, showH: false, v: 0, h: 0 };
    this.persistPlanoToForm();
  }
}