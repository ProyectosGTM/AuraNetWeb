import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { SalaService } from 'src/app/shared/services/salas.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

type Tool = 'pen' | 'rect' | 'eraser';
type Pt = { x: number; y: number };
type Stroke = { id: number; pts: Pt[]; w: number };
type RectShape = { id: number; x: number; y: number; w: number; h: number; sw: number };
type Snapshot = { strokes: Stroke[]; rects: RectShape[] };
type PenAttach = { strokeIndex: number; side: 'start' | 'end' } | null;

type PlanoJsonV1 = {
  v: 1;
  worldW: number;
  worldH: number;
  strokes: Stroke[];
  rects: RectShape[];
};

@Component({
  selector: 'app-agregar-sala',
  templateUrl: './agregar-sala.component.html',
  styleUrl: './agregar-sala.component.scss',
  animations: [fadeInRightAnimation],
})
export class AgregarSalaComponent implements OnInit, OnDestroy {
  tool: Tool = 'pen';
  worldW = 1320;
  worldH = 520;
  zoom = 1;
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public idSala: number;

  strokes: Stroke[] = [];
  rects: RectShape[] = [];

  draftStroke: Stroke | null = null;
  draftRect: RectShape | null = null;

  undoStack: Snapshot[] = [];
  redoStack: Snapshot[] = [];

  private drawing = false;
  private activePointerId: number | null = null;

  private startX = 0;
  private startY = 0;

  private nextStrokeId = 1;
  private nextRectId = 1;

  private penAttach: PenAttach = null;
  private penStart: Pt | null = null;

  private erasing = false;
  private lastEraseTs = 0;

  zonaForm: FormGroup;

  selectedStrokeId: number | null = null;
  selectedRectId: number | null = null;

  private draggingStrokeIndex: number | null = null;
  private draggingRectIndex: number | null = null;

  private lastDragPt: Pt | null = null;

  hoveredEndpoint: { strokeIndex: number; side: 'start' | 'end' } | null = null;
  private draggingEndpoint: { strokeIndex: number; side: 'start' | 'end' } | null = null;

  constructor(private fb: FormBuilder, private route: Router, private usuaService: UsuariosService, private salasService: SalaService) { }

  ngOnInit(): void {
    this.initForm();
    document.addEventListener('mousedown', this.onDocMouseDownIds);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.onDocMouseDownIds);
  }

  initForm(): void {
    this.zonaForm = this.fb.group({
      nombre: [''],
      nombreComercial: [''],
      descripcion: [''],
      logotipo: [''],
      direccion: [''],
      pais: [''],
      estado: [''],
      municipio: [''],
      colonia: [''],
      calle: [''],
      numeroExterior: [''],
      numeroInterior: [''],
      codigoPostal: [''],
      referencias: [''],
      latitud: [0],
      longitud: [0],
      geocercaJSON: [{}],
      rfcFacturacion: [''],
      razonSocialFacturacion: [''],
      regimenFiscal: [''],
      usoCFDI: [''],
      lugarExpedicion: [''],
      metrosCuadrados: [0],
      numeroNiveles: [0],
      capacidadPersonas: [0],
      estructuraJSON: [{}],
      planoArquitectonico: [''],
      planoDistribucion: [''],
      licenciaOperacion: [''],
      fechaVencimientoLicencia: [null],
      idMonedaPrincipal: [0],
      fechaInicioContrato: [null],
      fechaFinContrato: [null],
      idEstatusLicencia: [0],
      motivoSuspension: [''],
      idCliente: [0],
    });
  }

  get toolLabel(): string {
    if (this.tool === 'pen') return 'Pluma';
    if (this.tool === 'rect') return 'Rect';
    return 'Borrar';
  }

  setTool(t: Tool): void {
    this.tool = t;
    this.selectedStrokeId = null;
    this.selectedRectId = null;
    this.cancelDraft();
  }

  clearSelection(): void {
    this.selectedStrokeId = null;
    this.selectedRectId = null;
  }

  strokePath(s: Stroke): string {
    const p = s.pts;
    if (!p.length) return '';
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 1; i < p.length; i++) d += ` L ${p[i].x} ${p[i].y}`;
    return d;
  }

  zoomIn(): void {
    this.zoom = Math.min(2.4, this.round2(this.zoom + 0.1));
  }

  zoomOut(): void {
    this.zoom = Math.max(0.35, this.round2(this.zoom - 0.1));
  }

  resetZoom(): void {
    this.zoom = 1;
  }

  onCanvasWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    if (delta > 0) this.zoomOut();
    else this.zoomIn();
  }

  private hitStroke(p: Pt, tol: number): number | null {
    const t2 = tol * tol;

    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      const pts = s.pts;
      if (pts.length < 2) continue;

      for (let j = 0; j < pts.length - 1; j++) {
        const d2 = this.pointSegDist2(p, pts[j], pts[j + 1]);
        if (d2 <= t2) return i;
      }
    }

    return null;
  }

  private hitRect(p: Pt, tol: number): number | null {
    for (let i = this.rects.length - 1; i >= 0; i--) {
      const r = this.rects[i];
      const x1 = r.x - tol;
      const y1 = r.y - tol;
      const x2 = r.x + r.w + tol;
      const y2 = r.y + r.h + tol;

      if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return i;
    }
    return null;
  }

  private pointSegDist2(p: Pt, a: Pt, b: Pt): number {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;

    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return this.dist2(p, a);

    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));

    const cx = a.x + t * abx;
    const cy = a.y + t * aby;

    const dx = p.x - cx;
    const dy = p.y - cy;
    return dx * dx + dy * dy;
  }

  // reemplaza COMPLETO tu onCanvasPointerDown por este (mantiene tu lógica y agrega mover rect en cualquier herramienta salvo eraser)
  onCanvasPointerDown(e: PointerEvent): void {
    const stage = e.currentTarget as HTMLElement;
    stage.setPointerCapture(e.pointerId);
    this.activePointerId = e.pointerId;

    const pos = this.toWorld(e);
    this.drawing = true;

    if (this.tool !== 'eraser') {
      const hitR = this.hitRect(pos, 10);
      if (hitR !== null) {
        this.pushUndo();
        this.redoStack = [];
        this.selectedRectId = this.rects[hitR].id;
        this.selectedStrokeId = null;
        this.draggingRectIndex = hitR;
        this.lastDragPt = pos;
        return;
      }
    }

    if (this.tool === 'pen') {
      const ep = this.hitEndpoint(pos, 14);
      if (ep) {
        this.pushUndo();
        this.redoStack = [];
        this.selectedStrokeId = this.strokes[ep.strokeIndex].id;
        this.selectedRectId = null;
        this.draggingEndpoint = { strokeIndex: ep.strokeIndex, side: ep.side };
        return;
      }

      const hit = this.hitStroke(pos, 10);
      if (hit !== null) {
        this.pushUndo();
        this.redoStack = [];
        this.selectedStrokeId = this.strokes[hit].id;
        this.selectedRectId = null;
        this.draggingStrokeIndex = hit;
        this.lastDragPt = pos;
        return;
      }

      this.pushUndo();
      this.redoStack = [];
      this.selectedStrokeId = null;
      this.selectedRectId = null;

      const snap = this.findNearestEndpoint(pos, 14);
      if (snap) {
        this.penAttach = { strokeIndex: snap.strokeIndex, side: snap.side };
        this.penStart = { x: snap.pt.x, y: snap.pt.y };
      } else {
        this.penAttach = null;
        this.penStart = { x: pos.x, y: pos.y };
      }

      this.draftStroke = {
        id: -1,
        w: 4,
        pts: [
          { x: this.penStart.x, y: this.penStart.y },
          { x: this.penStart.x, y: this.penStart.y },
        ],
      };
      return;
    }

    this.startX = pos.x;
    this.startY = pos.y;

    if (this.tool === 'rect') {
      this.pushUndo();
      this.redoStack = [];
      this.draftRect = { id: this.nextRectId++, x: pos.x, y: pos.y, w: 0, h: 0, sw: 2 };
      this.selectedStrokeId = null;
      this.selectedRectId = null;
      return;
    }

    if (this.tool === 'eraser') {
      this.pushUndo();
      this.redoStack = [];
      this.erasing = true;
      this.eraseAt(pos.x, pos.y);
      this.lastEraseTs = performance.now();
      this.selectedStrokeId = null;
      this.selectedRectId = null;
      return;
    }
  }

  // reemplaza COMPLETO tu onCanvasPointerMove por este (mantiene tu lógica y agrega hover + cursor)
  onCanvasPointerMove(e: PointerEvent): void {
    if (this.activePointerId !== null && this.drawing && e.pointerId !== this.activePointerId) return;

    const pos = this.toWorld(e);

    if (!this.drawing) {
      this.hoveredRectIndex = this.tool !== 'eraser' ? this.hitRect(pos, 10) : null;
      return;
    }

    if (this.draggingEndpoint) {
      const idx = this.draggingEndpoint.strokeIndex;
      const side = this.draggingEndpoint.side;
      const s = this.strokes[idx];

      if (s && s.pts.length) {
        const pts = s.pts.map(p => ({ x: p.x, y: p.y }));
        if (side === 'start') pts[0] = { x: pos.x, y: pos.y };
        else pts[pts.length - 1] = { x: pos.x, y: pos.y };
        this.strokes = this.strokes.map((x, i) => (i === idx ? { ...x, pts } : x));
      }
      return;
    }

    if (this.draggingStrokeIndex !== null && this.lastDragPt) {
      const dx = pos.x - this.lastDragPt.x;
      const dy = pos.y - this.lastDragPt.y;

      const idx = this.draggingStrokeIndex;
      const s = this.strokes[idx];
      if (s) {
        const pts = s.pts.map(p => ({ x: p.x + dx, y: p.y + dy }));
        this.strokes = this.strokes.map((x, i) => (i === idx ? { ...x, pts } : x));
      }

      this.lastDragPt = pos;
      return;
    }

    if (this.draggingRectIndex !== null && this.lastDragPt) {
      const dx = pos.x - this.lastDragPt.x;
      const dy = pos.y - this.lastDragPt.y;

      const idx = this.draggingRectIndex;
      const r = this.rects[idx];
      if (r) {
        const x = this.clamp(r.x + dx, 0, this.worldW - r.w);
        const y = this.clamp(r.y + dy, 0, this.worldH - r.h);
        this.rects = this.rects.map((rr, i) => (i === idx ? { ...rr, x, y } : rr));
      }

      this.lastDragPt = pos;
      return;
    }

    if (this.tool === 'pen' && this.draftStroke && this.penStart) {
      this.draftStroke = {
        ...this.draftStroke,
        pts: [{ x: this.penStart.x, y: this.penStart.y }, { x: pos.x, y: pos.y }],
      };
      return;
    }

    if (this.tool === 'rect' && this.draftRect) {
      const x1 = this.startX;
      const y1 = this.startY;
      const x2 = pos.x;
      const y2 = pos.y;
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      this.draftRect = { ...this.draftRect, x, y, w, h };
      return;
    }

    if (this.tool === 'eraser' && this.erasing) {
      const now = performance.now();
      if (now - this.lastEraseTs < 12) return;
      this.lastEraseTs = now;
      this.eraseAt(pos.x, pos.y);
      return;
    }
  }


  onCanvasPointerUp(e: PointerEvent): void {
    if (!this.drawing) return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.hoveredRectIndex = null;

    this.drawing = false;
    this.activePointerId = null;

    if (this.draggingEndpoint) {
      this.draggingEndpoint = null;
      this.hoveredEndpoint = null;
      this.syncPlanoToForm();
      return;
    }

    if (this.draggingStrokeIndex !== null) {
      this.draggingStrokeIndex = null;
      this.lastDragPt = null;
      this.syncPlanoToForm();
      return;
    }

    if (this.draggingRectIndex !== null) {
      this.draggingRectIndex = null;
      this.lastDragPt = null;
      this.syncPlanoToForm();
      return;
    }

    if (this.tool === 'pen' && this.draftStroke && this.penStart) {
      const a = { x: this.penStart.x, y: this.penStart.y };
      const b = this.draftStroke.pts[1];

      if (this.dist2(a, b) >= 16) {
        this.commitPenSegment(a, b, this.draftStroke.w);
        this.syncPlanoToForm();
      }

      this.draftStroke = null;
      this.penStart = null;
      this.penAttach = null;
      return;
    }

    if (this.tool === 'rect' && this.draftRect) {
      if (this.draftRect.w >= 6 && this.draftRect.h >= 6) {
        this.rects = [...this.rects, this.draftRect];
        this.syncPlanoToForm();
      }
      this.draftRect = null;
      return;
    }

    if (this.tool === 'eraser') {
      this.erasing = false;
      this.syncPlanoToForm();
      return;
    }
  }

  onCanvasPointerCancel(e: PointerEvent): void {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.cancelDraft();
  }

  undo(): void {
    if (!this.undoStack.length) return;
    const prev = this.undoStack.pop() as Snapshot;
    this.redoStack.push(this.snapshot());
    this.strokes = prev.strokes;
    this.rects = prev.rects;
    this.cancelDraft();
    this.syncPlanoToForm();
  }

  redo(): void {
    if (!this.redoStack.length) return;
    const next = this.redoStack.pop() as Snapshot;
    this.undoStack.push(this.snapshot());
    this.strokes = next.strokes;
    this.rects = next.rects;
    this.cancelDraft();
    this.syncPlanoToForm();
  }

  clearPlan(): void {
    if (!this.strokes.length && !this.rects.length && !this.draftStroke && !this.draftRect) return;
    this.pushUndo();
    this.redoStack = [];
    this.strokes = [];
    this.rects = [];
    this.cancelDraft();
    this.syncPlanoToForm();
  }

  verPlanoJson(): void {
    const json = this.getPlanoJsonString();
    console.log('PLANO JSON:', json);
  }

  private commitPenSegment(a: Pt, b: Pt, w: number): void {
    if (this.penAttach) {
      const i = this.penAttach.strokeIndex;
      const s = this.strokes[i];
      if (!s || !s.pts.length) {
        this.strokes = [...this.strokes, { id: this.nextStrokeId++, pts: [a, b], w }];
        return;
      }

      if (this.penAttach.side === 'end') {
        const last = s.pts[s.pts.length - 1];
        const pts = this.dist2(last, a) <= 1 ? [...s.pts, b] : [...s.pts, a, b];
        this.strokes = this.strokes.map((x, idx) => (idx === i ? { ...x, pts, w } : x));
        return;
      }

      if (this.penAttach.side === 'start') {
        const first = s.pts[0];
        const pts = this.dist2(first, a) <= 1 ? [b, ...s.pts] : [b, a, ...s.pts];
        this.strokes = this.strokes.map((x, idx) => (idx === i ? { ...x, pts, w } : x));
        return;
      }
    }

    this.strokes = [...this.strokes, { id: this.nextStrokeId++, pts: [a, b], w }];
  }

  private findNearestEndpoint(p: Pt, tol: number): { strokeIndex: number; side: 'start' | 'end'; pt: Pt } | null {
    const t2 = tol * tol;
    let bestStroke = -1;
    let bestSide: 'start' | 'end' = 'end';
    let bestPt: Pt | null = null;
    let bestD2 = Infinity;

    for (let i = 0; i < this.strokes.length; i++) {
      const s = this.strokes[i];
      if (!s.pts.length) continue;

      const a = s.pts[0];
      const b = s.pts[s.pts.length - 1];

      const d2a = this.dist2(p, a);
      if (d2a <= t2 && d2a < bestD2) {
        bestD2 = d2a;
        bestStroke = i;
        bestSide = 'start';
        bestPt = a;
      }

      const d2b = this.dist2(p, b);
      if (d2b <= t2 && d2b < bestD2) {
        bestD2 = d2b;
        bestStroke = i;
        bestSide = 'end';
        bestPt = b;
      }
    }

    if (bestStroke === -1 || !bestPt) return null;
    return { strokeIndex: bestStroke, side: bestSide, pt: bestPt };
  }

  private eraseAt(x: number, y: number): void {
    const r = 18;
    const r2 = r * r;

    if (this.strokes.length) {
      const keep: Stroke[] = [];
      for (const s of this.strokes) {
        let hit = false;
        for (const p of s.pts) {
          const dx = p.x - x;
          const dy = p.y - y;
          if (dx * dx + dy * dy <= r2) {
            hit = true;
            break;
          }
        }
        if (!hit) keep.push(s);
      }
      this.strokes = keep;
    }

    if (this.rects.length) {
      const keepR: RectShape[] = [];
      for (const rr of this.rects) {
        const inside = x >= rr.x - r && x <= rr.x + rr.w + r && y >= rr.y - r && y <= rr.y + rr.h + r;
        if (!inside) keepR.push(rr);
      }
      this.rects = keepR;
    }
  }

  private pushUndo(): void {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > 60) this.undoStack.shift();
  }

  private snapshot(): Snapshot {
    return {
      strokes: this.strokes.map(s => ({
        id: s.id,
        w: s.w,
        pts: s.pts.map(p => ({ x: p.x, y: p.y })),
      })),
      rects: this.rects.map(r => ({
        id: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        sw: r.sw,
      })),
    };
  }

  private cancelDraft(): void {
    this.drawing = false;
    this.activePointerId = null;

    this.draftStroke = null;
    this.draftRect = null;

    this.penStart = null;
    this.penAttach = null;

    this.erasing = false;
    this.hoveredRectIndex = null;

    this.draggingStrokeIndex = null;
    this.draggingRectIndex = null;
    this.lastDragPt = null;

    this.draggingEndpoint = null;
    this.hoveredEndpoint = null;
  }

  private toWorld(e: PointerEvent): Pt {
    const stage = e.currentTarget as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = this.clamp(px / this.zoom, 0, this.worldW);
    const y = this.clamp(py / this.zoom, 0, this.worldH);
    return { x, y };
  }

  private dist2(a: Pt, b: Pt): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private round2(v: number): number {
    return Math.round(v * 100) / 100;
  }

  private hitEndpoint(p: Pt, tol: number): { strokeIndex: number; side: 'start' | 'end' } | null {
    const t2 = tol * tol;

    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      if (!s.pts.length) continue;

      const a = s.pts[0];
      const b = s.pts[s.pts.length - 1];

      if (this.dist2(p, a) <= t2) return { strokeIndex: i, side: 'start' };
      if (this.dist2(p, b) <= t2) return { strokeIndex: i, side: 'end' };
    }

    return null;
  }

  onEndpointEnter(strokeIndex: number, side: 'start' | 'end'): void {
    this.hoveredEndpoint = { strokeIndex, side };
  }

  onEndpointLeave(strokeIndex: number, side: 'start' | 'end'): void {
    if (!this.hoveredEndpoint) return;
    if (this.hoveredEndpoint.strokeIndex === strokeIndex && this.hoveredEndpoint.side === side) {
      this.hoveredEndpoint = null;
    }
  }

  buildPlanoJson(): PlanoJsonV1 {
    return {
      v: 1,
      worldW: this.worldW,
      worldH: this.worldH,
      strokes: this.strokes.map(s => ({
        id: s.id,
        w: s.w,
        pts: s.pts.map(p => ({ x: p.x, y: p.y })),
      })),
      rects: this.rects.map(r => ({
        id: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        sw: r.sw,
      })),
    };
  }

  getPlanoJsonString(): string {
    return JSON.stringify(this.buildPlanoJson());
  }

  loadPlanoFromJson(json: string): void {
    if (!json) return;

    const parsed = JSON.parse(json) as PlanoJsonV1;

    if (!parsed || parsed.v !== 1) return;
    if (!Array.isArray(parsed.strokes) || !Array.isArray(parsed.rects)) return;

    this.worldW = Number(parsed.worldW) || this.worldW;
    this.worldH = Number(parsed.worldH) || this.worldH;

    this.strokes = parsed.strokes
      .map(s => ({
        id: Number(s.id),
        w: Number(s.w) || 4,
        pts: Array.isArray(s.pts) ? s.pts.map(p => ({ x: Number(p.x), y: Number(p.y) })) : [],
      }))
      .filter(s => s.pts.length >= 2);

    this.rects = parsed.rects
      .map(r => ({
        id: Number(r.id),
        x: Number(r.x),
        y: Number(r.y),
        w: Number(r.w),
        h: Number(r.h),
        sw: Number(r.sw) || 2,
      }))
      .filter(r => r.w >= 0 && r.h >= 0);

    this.nextStrokeId = this.strokes.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    this.nextRectId = this.rects.reduce((m, r) => Math.max(m, r.id), 0) + 1;

    this.undoStack = [];
    this.redoStack = [];
    this.cancelDraft();
    this.syncPlanoToForm();
  }

  syncPlanoToForm(): void {
    if (!this.zonaForm) return;
    const json = this.getPlanoJsonString();
    const ctrl = this.zonaForm.get('planoJson');
    if (ctrl) ctrl.setValue(json);
  }

  @ViewChild('logotipoFileInput') logotipoFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('licenciaFileInput') licenciaFileInput!: ElementRef<HTMLInputElement>;

  logotipoPreviewUrl: string | ArrayBuffer | null = null;
  logotipoDragging = false;
  logotipoFileName: string | null = null;
  private logotipoFile: File | null = null;

  licenciaPreviewUrl: string | ArrayBuffer | null = null;
  licenciaDragging = false;
  licenciaFileName: string | null = null;
  private licenciaFile: File | null = null;

  private readonly MAX_LOGO_MB = 3;
  private readonly MAX_LIC_MB = 5;

  private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

  private isPdf(file: File) {
    return /^application\/pdf$/i.test(file.type);
  }

  private isAllowedLogotipo(file: File) {
    return this.isImage(file) && file.size <= this.MAX_LOGO_MB * 1024 * 1024;
  }

  private isAllowedLicencia(file: File) {
    const ok = this.isImage(file) || this.isPdf(file);
    return ok && file.size <= this.MAX_LIC_MB * 1024 * 1024;
  }

  private loadPreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
    if (!this.isImage(file)) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  }

  private uploadLogotipoAuto(): void {
    const fd = new FormData();
    if (this.logotipoFile) fd.append('file', this.logotipoFile, this.logotipoFile.name);
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.zonaForm.patchValue({ logotipo: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.logotipoPreviewUrl = url;
          }
        }
      },
      error: (err) => console.error('Error al subir logotipo', err),
    });
  }

  private uploadLicenciaAuto(): void {
    const fd = new FormData();
    if (this.licenciaFile) fd.append('file', this.licenciaFile, this.licenciaFile.name);
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';
        if (url) {
          this.zonaForm.patchValue({ licenciaOperacion: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.licenciaPreviewUrl = url;
          } else {
            this.licenciaPreviewUrl = null;
          }
        }
      },
      error: (err) => console.error('Error al subir licencia', err),
    });
  }

  openLogotipoFilePicker() {
    this.logotipoFileInput.nativeElement.click();
  }

  onLogotipoDragOver(e: DragEvent) {
    e.preventDefault();
    this.logotipoDragging = true;
  }

  onLogotipoDragLeave(_e: DragEvent) {
    this.logotipoDragging = false;
  }

  onLogotipoDrop(e: DragEvent) {
    e.preventDefault();
    this.logotipoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLogotipoFile(f);
  }

  onLogotipoSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleLogotipoFile(f);
    input.value = '';
  }

  clearLogotipo(e: Event) {
    e.stopPropagation();
    this.logotipoPreviewUrl = null;
    this.logotipoFileName = null;
    this.logotipoFileInput.nativeElement.value = '';
    this.logotipoFile = null;
    this.zonaForm.patchValue({ logotipo: '' });
    this.zonaForm.get('logotipo')?.setErrors(null);
  }

  private handleLogotipoFile(file: File) {
    if (!this.isAllowedLogotipo(file)) {
      this.zonaForm.get('logotipo')?.setErrors({ invalid: true });
      return;
    }

    this.logotipoFileName = file.name;
    this.loadPreview(file, (url) => (this.logotipoPreviewUrl = url));
    this.logotipoFile = file;
    this.zonaForm.patchValue({ logotipo: file });
    this.zonaForm.get('logotipo')?.setErrors(null);
    this.uploadLogotipoAuto();
  }

  openLicenciaFilePicker() {
    this.licenciaFileInput.nativeElement.click();
  }

  onLicenciaDragOver(e: DragEvent) {
    e.preventDefault();
    this.licenciaDragging = true;
  }

  onLicenciaDragLeave(_e: DragEvent) {
    this.licenciaDragging = false;
  }

  onLicenciaDrop(e: DragEvent) {
    e.preventDefault();
    this.licenciaDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLicenciaFile(f);
  }

  onLicenciaSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleLicenciaFile(f);
    input.value = '';
  }

  clearLicencia(e: Event) {
    e.stopPropagation();
    this.licenciaPreviewUrl = null;
    this.licenciaFileName = null;
    this.licenciaFileInput.nativeElement.value = '';
    this.licenciaFile = null;
    this.zonaForm.patchValue({ licenciaOperacion: '' });
    this.zonaForm.get('licenciaOperacion')?.setErrors(null);
  }

  private handleLicenciaFile(file: File) {
    if (!this.isAllowedLicencia(file)) {
      this.zonaForm.get('licenciaOperacion')?.setErrors({ invalid: true });
      return;
    }

    this.licenciaFileName = file.name;
    this.loadPreview(file, (url) => (this.licenciaPreviewUrl = url));
    this.licenciaFile = file;
    this.zonaForm.patchValue({ licenciaOperacion: file });
    this.zonaForm.get('licenciaOperacion')?.setErrors(null);
    this.uploadLicenciaAuto();
  }

  isIdClienteOpen = false;
  idClienteLabel = '';
  idClienteItems: SelectItem[] = [];

  isIdMonedaOpen = false;
  idMonedaLabel = '';
  idMonedaItems: SelectItem[] = [];

  isIdEstatusLicOpen = false;
  idEstatusLicLabel = '';
  idEstatusLicItems: SelectItem[] = [];

  toggleIdCliente(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isIdClienteOpen = !this.isIdClienteOpen;
    if (this.isIdClienteOpen) {
      this.isIdMonedaOpen = false;
      this.isIdEstatusLicOpen = false;
    }
  }

  setIdCliente(id: number, text: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.zonaForm.patchValue({ idCliente: id });
    this.idClienteLabel = text;
    this.isIdClienteOpen = false;
  }

  toggleIdMoneda(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isIdMonedaOpen = !this.isIdMonedaOpen;
    if (this.isIdMonedaOpen) {
      this.isIdClienteOpen = false;
      this.isIdEstatusLicOpen = false;
    }
  }

  setIdMoneda(id: number, text: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.zonaForm.patchValue({ idMonedaPrincipal: id });
    this.idMonedaLabel = text;
    this.isIdMonedaOpen = false;
  }

  toggleIdEstatusLic(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isIdEstatusLicOpen = !this.isIdEstatusLicOpen;
    if (this.isIdEstatusLicOpen) {
      this.isIdClienteOpen = false;
      this.isIdMonedaOpen = false;
    }
  }

  setIdEstatusLic(id: number, text: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.zonaForm.patchValue({ idEstatusLicencia: id });
    this.idEstatusLicLabel = text;
    this.isIdEstatusLicOpen = false;
  }

  private onDocMouseDownIds = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest('.select-sleek') || target.closest('.plano-btn') || target.closest('.mini')) {
      return;
    }

    this.isIdClienteOpen = false;
    this.isIdMonedaOpen = false;
    this.isIdEstatusLicOpen = false;
  };

  setIdClienteItems(items: SelectItem[]): void {
    this.idClienteItems = items || [];
    const current = this.zonaForm.get('idCliente')?.value;
    const found = this.idClienteItems.find(x => x.id === current);
    this.idClienteLabel = found ? found.text : '';
  }

  setIdMonedaItems(items: SelectItem[]): void {
    this.idMonedaItems = items || [];
    const current = this.zonaForm.get('idMonedaPrincipal')?.value;
    const found = this.idMonedaItems.find(x => x.id === current);
    this.idMonedaLabel = found ? found.text : '';
  }

  setIdEstatusLicItems(items: SelectItem[]): void {
    this.idEstatusLicItems = items || [];
    const current = this.zonaForm.get('idEstatusLicencia')?.value;
    const found = this.idEstatusLicItems.find(x => x.id === current);
    this.idEstatusLicLabel = found ? found.text : '';
  }

  @HostListener('document:click', ['$event'])
  onDocClickCloseIds(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.select-sleek')) return;

    this.isIdClienteOpen = false;
    this.isIdMonedaOpen = false;
    this.isIdEstatusLicOpen = false;
  }

  // agrega estas props (junto a selectedStrokeId / dragging...)
  hoveredRectIndex: number | null = null;

  get canvasCursor(): string {
    if (this.draggingRectIndex !== null) return 'grabbing';
    if (this.hoveredRectIndex !== null) return 'grab';
    return 'crosshair';
  }

  submit(): void {
    this.submitButton = this.idSala ? 'Actualizando...' : 'Guardando...';
    this.loading = true;

    if (this.zonaForm.invalid) {
      this.submitButton = this.idSala ? 'Actualizar' : 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        nombre: 'Nombre',
        nombreComercial: 'Nombre Comercial',
        descripcion: 'Descripción',
        direccion: 'Dirección',
        pais: 'País',
        estado: 'Estado',
        municipio: 'Municipio',
        colonia: 'Colonia',
        calle: 'Calle',
        numeroExterior: 'Número Exterior',
        codigoPostal: 'Código Postal',
        rfcFacturacion: 'RFC Facturación',
        razonSocialFacturacion: 'Razón Social',
        regimenFiscal: 'Régimen Fiscal',
        usoCFDI: 'Uso CFDI',
        lugarExpedicion: 'Lugar Expedición',
        idMonedaPrincipal: 'Moneda Principal',
        idEstatusLicencia: 'Estatus Licencia',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.zonaForm.controls).forEach((key) => {
        const control = this.zonaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>
      `
        )
        .join('');

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
        customClass: { popup: 'swal2-padding swal2-border' },
      });

      return;
    }

    if (this.idSala) this.actualizarSala();
    else this.agregarSala();
  }

  private buildSalaPayload() {
    const v = this.zonaForm.getRawValue();

    return {
      nombre: v.nombre ?? '',
      nombreComercial: v.nombreComercial ?? '',
      descripcion: v.descripcion ?? '',
      logotipo: v.logotipo ?? '',
      direccion: v.direccion ?? '',
      pais: v.pais ?? '',
      estado: v.estado ?? '',
      municipio: v.municipio ?? '',
      colonia: v.colonia ?? '',
      calle: v.calle ?? '',
      numeroExterior: v.numeroExterior ?? '',
      numeroInterior: v.numeroInterior ?? '',
      codigoPostal: v.codigoPostal ?? '',
      referencias: v.referencias ?? '',
      latitud: Number(v.latitud) || 0,
      longitud: Number(v.longitud) || 0,
      geocercaJSON: v.geocercaJSON ?? {},
      rfcFacturacion: v.rfcFacturacion ?? '',
      razonSocialFacturacion: v.razonSocialFacturacion ?? '',
      regimenFiscal: v.regimenFiscal ?? '',
      usoCFDI: v.usoCFDI ?? '',
      lugarExpedicion: v.lugarExpedicion ?? '',
      metrosCuadrados: Number(v.metrosCuadrados) || 0,
      numeroNiveles: Number(v.numeroNiveles) || 0,
      capacidadPersonas: Number(v.capacidadPersonas) || 0,
      estructuraJSON: v.estructuraJSON ?? {},
      planoArquitectonico: v.planoArquitectonico ?? '',
      planoDistribucion: v.planoDistribucion ?? '',
      licenciaOperacion: v.licenciaOperacion ?? '',
      fechaVencimientoLicencia: v.fechaVencimientoLicencia ?? null,
      idMonedaPrincipal: Number(v.idMonedaPrincipal) || 0,
      fechaInicioContrato: v.fechaInicioContrato ?? null,
      fechaFinContrato: v.fechaFinContrato ?? null,
      idEstatusLicencia: Number(v.idEstatusLicencia) || 0,
      motivoSuspension: v.motivoSuspension ?? '',
      idCliente: Number(v.idCliente) || 0,
    };
  }
  private buildPayloadSala(): any {
    const payload = { ...this.zonaForm.getRawValue() };

    delete payload.planoJson;

    return payload;
  }


  agregarSala(): void {
    const payload = this.buildPayloadSala();

    this.salasService.agregarSala(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;

        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: 'Se agregó una nueva sala de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });

        this.regresar();
      },
      error: () => {
        this.submitButton = 'Guardar';
        this.loading = false;

        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: 'Ocurrió un error al agregar la sala.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  actualizarSala(): void {
    const payload = this.buildPayloadSala();

    this.salasService.actualizarSala(this.idSala, payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;

        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#0d121d',
          text: 'Los datos de la sala se actualizaron correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });

        this.regresar();
      },
      error: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;

        Swal.fire({
          title: '¡Ops!',
          background: '#0d121d',
          text: 'Ocurrió un error al actualizar la sala.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  public regresar() {
    this.route.navigateByUrl('/salas')
  }

  verPayloadSala(): void {
    const payload = {
      ...this.zonaForm.getRawValue(),
      estructuraJSON: this.buildPlanoJson()
    };

    console.log(payload);
  }
}