import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

export interface PreviewItem {
  label: string;
  value: any;
  icon?: string;
  /** Ocupa todo el ancho de la sección. */
  full?: boolean;
  /** Muestra el valor oculto (contraseñas). */
  masked?: boolean;
  /** Botón en lugar del valor (por ejemplo, ver un documento). */
  action?: { label: string; icon?: string; run: () => void };
}

export interface PreviewSection {
  title: string;
  icon: string;
  items?: PreviewItem[];
  /** Lista de etiquetas (por ejemplo, permisos). */
  chips?: string[];
  /** Etiquetas agrupadas (por ejemplo, permisos por módulo). */
  groups?: { title: string; items: string[] }[];
}

/**
 * Vista previa homologada antes de guardar un registro.
 * El formulario conserva sus datos: "Regresar" solo cierra la vista previa.
 */
@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.scss'],
})
export class FormPreviewComponent {
  @Input() open = false;
  @Input() entity = 'Registro';
  @Input() editing = false;
  @Input() name = '';
  @Input() subtitle = '';
  @Input() image: string | null = null;
  @Input() icon = 'fas fa-user';
  @Input() badges: string[] = [];
  @Input() sections: PreviewSection[] = [];
  @Input() loading = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() regresar = new EventEmitter<void>();

  get iniciales(): string {
    return (this.name || '')
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(p => p[0]).join('').toUpperCase() || '?';
  }

  get totalCampos(): number {
    return this.sections.reduce((n, s) => n + (s.items?.length || 0), 0);
  }

  get camposCapturados(): number {
    return this.sections.reduce((n, s) => n + (s.items || []).filter(i => this.tieneValor(i.value)).length, 0);
  }

  /** Anillo de progreso (circunferencia r=19). */
  get ringOffset(): number {
    const c = 2 * Math.PI * 19;
    return this.totalCampos ? c * (1 - this.camposCapturados / this.totalCampos) : c;
  }

  cardTransform = '';

  tilt(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    this.cardTransform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  }

  resetTilt(): void {
    this.cardTransform = '';
  }

  totalGrupos(s: PreviewSection): number {
    return (s.groups || []).reduce((n, g) => n + g.items.length, 0);
  }

  /** "CambiarEstatus_Afiliados" → "Cambiar Estatus". */
  accionLegible(p: string, modulo: string): string {
    let t = String(p || '');
    const m = String(modulo || '').replace(/\s+/g, '');
    if (m && t.toLowerCase().endsWith(m.toLowerCase())) t = t.slice(0, t.length - m.length);
    t = t.replace(/[_-]+/g, ' ').replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2').trim();
    return t || p;
  }

  iconoAccion(p: string): string {
    const t = (p || '').toLowerCase();
    if (t.includes('estatus')) return 'fas fa-toggle-on';
    if (t.includes('crear') || t.includes('agregar')) return 'fas fa-plus';
    if (t.includes('actualizar') || t.includes('editar')) return 'fas fa-pen';
    if (t.includes('listado') || t.includes('consultar') || t.includes('ver')) return 'fas fa-list';
    if (t.includes('eliminar')) return 'fas fa-trash';
    return 'fas fa-check';
  }

  capturadosDe(s: PreviewSection): number {
    return (s.items || []).filter((i) => this.tieneValor(i.value)).length;
  }

  pctDe(s: PreviewSection): number {
    const t = s.items?.length || 0;
    return t ? Math.round((this.capturadosDe(s) / t) * 100) : ((s.chips?.length || this.totalGrupos(s)) ? 100 : 0);
  }

  tieneValor(v: any): boolean {
    return v !== null && v !== undefined && String(v).trim() !== '';
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    // Si hay un visor de documento abierto encima, Esc solo cierra ese visor.
    if (document.querySelector('.dm-fondo')) return;
    if (this.open && !this.loading) { this.regresar.emit(); }
  }
}
