import { Component, Input } from '@angular/core';

/**
 * Imagen homologada para grids (clientes y usuarios).
 * - `modo="logo"`: marco cuadrado claro con la imagen completa (contain), ideal para logotipos.
 * - `modo="persona"`: círculo con la foto recortada (cover).
 * - `modo="auto"`: decide según el tipo de persona (Moral → logo, Física → persona).
 * Sin imagen o si falla la carga: iniciales con degradado. Al pasar el cursor se muestra una vista ampliada.
 */
@Component({
  selector: 'app-media-avatar',
  template: `
    <div class="ma" [class.ma--sin-img]="!srcValido || error" [class.ma--logo]="esLogo" [class.ma--persona]="!esLogo" [style.--s.px]="size" (mouseenter)="mostrarZoom($event)" (mouseleave)="zoom = null">
      <div class="ma-frame">
        <img *ngIf="srcValido && !error" [src]="src" [alt]="nombre" (error)="error = true" loading="lazy" />
        <span *ngIf="!srcValido || error" class="ma-ini">{{ iniciales }}</span>
      </div>
      <span class="ma-tag" *ngIf="etiqueta"><i class="fas" [class.fa-building]="esLogo" [class.fa-user]="!esLogo"></i>{{ etiqueta }}</span>

      <div class="ma-zoom" *ngIf="srcValido && !error && zoom" aria-hidden="true" [style.left.px]="zoom.x" [style.top.px]="zoom.y" [class.ma-zoom--abajo]="zoom.abajo">
        <img [src]="src" alt="" />
        <span>{{ nombre }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./media-avatar.component.scss'],
})
export class MediaAvatarComponent {
  @Input() src: string | null | undefined;
  @Input() nombre = '';
  @Input() modo: 'logo' | 'persona' | 'auto' = 'auto';
  /** Para `auto`: 'Moral' / 2 → logo. */
  @Input() tipoPersona: any;
  @Input() size = 52;
  /** Texto pequeño debajo (por ejemplo, "Moral" o el rol). */
  @Input() etiqueta = '';

  error = false;
  /** Posición de la vista ampliada (fija en pantalla para que la celda no la recorte). */
  zoom: { x: number; y: number; abajo: boolean } | null = null;

  mostrarZoom(e: MouseEvent): void {
    if (!this.srcValido || this.error) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const abajo = r.top < 230;
    this.zoom = { x: r.left + r.width / 2, y: abajo ? r.bottom + 10 : r.top - 10, abajo };
  }

  /** Imágenes genéricas de "sin foto" se tratan como vacías para mostrar iniciales. */
  get srcValido(): boolean {
    const s = String(this.src ?? '').trim();
    return !!s && s !== 'null' && s !== 'undefined' && !/user_default|default_logo|sin[-_]?imagen/i.test(s);
  }

  get esLogo(): boolean {
    if (this.modo !== 'auto') return this.modo === 'logo';
    const t = String(this.tipoPersona ?? '').toLowerCase();
    return t === '2' || t.startsWith('moral');
  }

  get iniciales(): string {
    return (this.nombre || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }
}
