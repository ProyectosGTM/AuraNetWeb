import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import Swal from 'sweetalert2';
type MachineType = 'Tragamonedas' | 'Ruleta' | 'Blackjack' | 'Poker';
type ZoneType = 'VIP' | 'Caja' | 'Baños' | 'Sala';
type MachineStatus = 'Activa' | 'Mantenimiento';
type DoorType = 'ENTRADA' | 'SALIDA';

interface MachineItem {
  id: number;
  label: number;
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
  public idModulo: number;
  public title = 'Agregar Sala';
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
  snapGuide = { showV: false, showH: false, v: 0, h: 0 };
  private draggingMachineId: number | null = null;
  private draggingZoneId: number | null = null;
  private resizingZoneId: number | null = null;
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
  private rotateTickId: any = null;
  private rotateAccelId: any = null;
  private rotateStep = 3;
  private rotateDir = 1;
  private rotateDoorTarget: DoorType | null = null;
  private rotateMachineTarget = false;

  constructor(
    private fb: FormBuilder,
    private moduService: ModulosService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idModulo = params['idModulo'];
      if (this.idModulo) {
        this.title = 'Actualizar Módulo';
        this.obtenerModulo();
      }
    });
  }

  initForm(): void {
    this.zonaForm = this.formBuilder.group({
      nombre: [''],
      descripcion: [''],
      idTipoZona: [0],
      nivel: [''],
      nivelNumerico: [0],
      anchoMetros: [0],
      altoMetros: [0],
      areaMetrosCuadrados: [0],
      areaPoligonoJSON: [{}],
      capacidadMaximaPersonas: [0],
      capacidadMaximaMaquinas: [0],
      idSala: [0]
    });
  }


  obtenerModulo() {
    this.moduService.obtenerModulo(this.idModulo).subscribe(
      (response: any) => {
        this.zonaForm.patchValue({
          nombre: response.data.nombre,
          descripcion: response.data.descripcion,
          idModulo: response.data.idModulo,
        });

        this.loadPlano(
          response.data?.plano,
          response.data?.zonas,
          response.data?.entrada,
          response.data?.salida
        );
      }, (error: any) => {
        console.log(error.error);
      }
    );
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (!this.entrada || !this.salida) {
      this.submitButton = this.idModulo ? 'Actualizar' : 'Guardar';
      this.loading = false;

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#0d121d',
        html: `
          <p style="text-align:center; font-size:15px; margin-bottom:16px; color:white">
            Debes colocar <strong>Entrada</strong> y <strong>Salida</strong> dentro del plano antes de continuar.
          </p>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' }
      });
      return;
    }

    this.persistPlanoToForm();

    if (this.idModulo) {
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

      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idModulo: 'Módulo',
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

    this.zonaForm.removeControl('id');
    this.moduService.agregarModulo(this.zonaForm.value).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: `Se agregó un nuevo módulo de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: `Ocurrió un error al agregar el módulo.`,
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

      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idModulo: 'Módulo',
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

    this.moduService.actualizarModulo(this.idModulo, this.zonaForm.value).subscribe(
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: `Los datos del módulo se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: `Ocurrió un error al actualizar el módulo.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/modulos');
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
      w: 180,
      h: 130,
      r: 0
    };
    const placed = this.placeWithoutOverlap(base);
    this.machines = [...this.machines, placed];
    this.selectedMachineId = id;
    this.selectedZoneId = null;
    this.placingDoor = null;
    this.persistPlanoToForm();
  }

  addZone(type: any) {
    if (!type) return;
    const t = type as ZoneType;
    const id = this.nextId(this.zones.map(x => x.id));
    const z: ZoneItem = {
      id,
      type: t,
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
    const rect = this.stageRect();
    const w = rect ? rect.width / this.zoom : this.stageW;
    const h = rect ? rect.height / this.zoom : this.stageH;
    const doorW = 130;
    const doorH = 54;
    const cx = this.clamp(Math.round(((w - doorW) / 2) / this.grid) * this.grid, 10, w - doorW - 10);
    const cy = this.clamp(Math.round(((h - doorH) / 2) / this.grid) * this.grid, 10, h - doorH - 10);
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
    const px = this.clamp(Math.round(x / this.grid) * this.grid, 10, SW - 46);
    const py = this.clamp(Math.round(y / this.grid) * this.grid, 10, SH - 46);
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
    this.zoom = this.clamp(this.zoom + 0.1, 0.6, 1.8);
  }

  zoomOut() {
    this.zoom = this.clamp(this.zoom - 0.1, 0.6, 1.8);
  }

  resetZoom() {
    this.zoom = 1;
  }

  orientationLabel(r: number) {
    const rr = this.normalizeRotation(r);
    if (rr === 0) return 'N';
    if (rr === 90) return 'E';
    if (rr === 180) return 'S';
    return 'O';
  }

  onStagePointerDown(ev: PointerEvent) {
    this.pointerActive = true;
    if (this.placingDoor) {
      const rect = this.stageRect();
      if (!rect) return;
      const px = (ev.clientX - rect.left) / this.zoom;
      const py = (ev.clientY - rect.top) / this.zoom;
      this.placeDoorAt(px, py);
    }
  }

  onMachinePointerDown(ev: PointerEvent, m: MachineItem) {
    ev.stopPropagation();
    this.pointerActive = true;
    this.draggingMachineId = m.id;
    this.selectedMachineId = m.id;
    this.selectedZoneId = null;
    this.placingDoor = null;
    const rect = this.stageRect();
    if (!rect) return;
    const px = (ev.clientX - rect.left) / this.zoom;
    const py = (ev.clientY - rect.top) / this.zoom;
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
    const rect = this.stageRect();
    if (!rect) return;
    const px = (ev.clientX - rect.left) / this.zoom;
    const py = (ev.clientY - rect.top) / this.zoom;
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
    const rect = this.stageRect();
    if (!rect) return;
    const px = (ev.clientX - rect.left) / this.zoom;
    const py = (ev.clientY - rect.top) / this.zoom;
    this.resizeStart = { x: px, y: py };
    this.resizeStartRect = { x: z.x, y: z.y, w: z.w, h: z.h };
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  private onPointerMove = (ev: PointerEvent) => {
    if (!this.pointerActive) return;
    const rect = this.stageRect();
    if (!rect) return;
    ev.preventDefault();
    const px = (ev.clientX - rect.left) / this.zoom;
    const py = (ev.clientY - rect.top) / this.zoom;
    const SW = this.logicalStageW();
    const SH = this.logicalStageH();
    this.snapGuide.showV = false;
    this.snapGuide.showH = false;
    if (this.draggingMachineId) {
      const idx = this.machines.findIndex(x => x.id === this.draggingMachineId);
      if (idx < 0) return;
      const m = this.machines[idx];
      const maxX = SW - m.w - 10;
      const maxY = SH - m.h - 10;
      const nx = this.clamp(px - this.dragOffsetX, 10, maxX);
      const ny = this.clamp(py - this.dragOffsetY, 10, maxY);
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
      const maxX = SW - z.w - 10;
      const maxY = SH - z.h - 10;
      const nx = this.clamp(px - this.dragOffsetX, 10, maxX);
      const ny = this.clamp(py - this.dragOffsetY, 10, maxY);
      const next = [...this.zones];
      next[idx] = this.snapZone({ ...z, x: nx, y: ny });
      this.zones = next;
      return;
    }

    if (this.resizingZoneId) {
      const idx = this.zones.findIndex(x => x.id === this.resizingZoneId);
      if (idx < 0) return;
      const z = this.zones[idx];
      const nw = this.clamp((px - z.x) - this.dragOffsetX, 140, SW - z.x - 10);
      const nh = this.clamp((py - z.y) - this.dragOffsetY, 90, SH - z.y - 10);
      const next = [...this.zones];
      next[idx] = this.snapZone({ ...z, w: nw, h: nh });
      this.zones = next;
    }
  };

  private onPointerUp = (_ev: PointerEvent) => {
    this.pointerActive = false;
    this.resizeHandle = null;
    this.draggingMachineId = null;
    this.draggingZoneId = null;
    this.resizingZoneId = null;
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
          x: this.clamp(t.x, 10, this.stageW - candidate.w - 10),
          y: this.clamp(t.y, 10, this.stageH - candidate.h - 10)
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
    this.zonaForm.patchValue({
      plano: JSON.stringify(this.machines ?? []),
      zonas: JSON.stringify(this.zones ?? []),
      entrada: this.entrada ? JSON.stringify(this.entrada) : '',
      salida: this.salida ? JSON.stringify(this.salida) : ''
    }, { emitEvent: false });
  }

  loadPlano(rawPlano: any, rawZonas: any, rawEntrada: any, rawSalida: any) {
    const ms = this.safeParseArray(rawPlano).map((p: any, i: number) => {
      const type = (p.type as MachineType) ?? 'Tragamonedas';
      const id = Number(p.id ?? (i + 1));
      return {
        id,
        label: Number(p.label ?? id),
        type,
        name: String(p.name ?? `${type} ${id}`),
        status: (p.status as MachineStatus) ?? 'Activa',
        serial: String(p.serial ?? this.makeSerial(type, id)),
        img: String(p.img ?? this.machineImg(type)),
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
        type: (p.type as ZoneType) ?? 'VIP',
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
        x: this.clamp(Math.round(x / this.grid) * this.grid, 10, this.stageW - 46),
        y: this.clamp(Math.round(y / this.grid) * this.grid, 10, this.stageH - 46),
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
    this.stageW = rect.width;
    this.stageH = rect.height;
    return rect;
  }

  private logicalStageW() {
    const rect = this.stageRect();
    return rect ? rect.width / this.zoom : this.stageW;
  }

  private logicalStageH() {
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

  private machineImg(type: MachineType) {
    if (type === 'Tragamonedas') return 'assets/maquinas/tragamonedas.svg';
    if (type === 'Ruleta') return 'assets/maquinas/ruleta.svg';
    if (type === 'Blackjack') return 'assets/maquinas/blackjack.svg';
    return 'assets/maquinas/poker.svg';
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
    const rect = this.stageRef.nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;

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
    const rect = this.stageRef.nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;
    const SW = this.logicalStageW();
    const SH = this.logicalStageH();
    const nx = this.clamp(x - this.doorDragOffset.x, 0, SW - 130);
    const ny = this.clamp(y - this.doorDragOffset.y, 0, SH - 54);
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
    this.snapGuide = { showV: false, showH: false, v: 0, h: 0 };
    this.persistPlanoToForm();
  }
}