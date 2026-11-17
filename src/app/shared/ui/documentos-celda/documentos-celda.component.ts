import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface DocumentoCelda {
  titulo: string;
  /** Nombre corto que se ve en la ficha. */
  corto: string;
  url: string | null | undefined;
  icono: string;
  /** Color del documento. */
  color: string;
}

/** Varios documentos en una sola celda del grid, con avance y acceso directo al visor. */
@Component({
  selector: 'app-documentos-celda',
  template: `
    <div class="dc">
      <div class="dc-head">
        <span class="dc-ring" [style.--p]="pct">
          <span>{{ cargados }}/{{ docs.length }}</span>
        </span>
        <div class="dc-head-txt">
          <strong>{{ cargados === docs.length ? 'Expediente Completo' : (cargados ? 'Expediente Parcial' : 'Sin Documentos') }}</strong>
          <small>{{ docs.length - cargados ? (docs.length - cargados) + ' pendiente' + (docs.length - cargados > 1 ? 's' : '') : 'Todo en orden' }}</small>
        </div>
      </div>
      <div class="dc-list">
        <button type="button" class="dc-doc" *ngFor="let d of docs" [style.--c]="d.color"
          [class.dc-doc--off]="!tiene(d)" [disabled]="!tiene(d)" (click)="ver.emit(d)"
          [attr.aria-label]="tiene(d) ? 'Ver ' + d.titulo : d.titulo + ' sin cargar'" [title]="d.titulo">
          <span class="dc-doc-ico">
            <i [class]="d.icono"></i>
            <em class="dc-ext" *ngIf="tiene(d)">{{ extension(d) }}</em>
          </span>
          <span class="dc-doc-txt">
            <strong>{{ d.corto }}</strong>
            <small>{{ tiene(d) ? 'Ver' : 'Pendiente' }}<i class="fas" [class.fa-eye]="tiene(d)" [class.fa-clock]="!tiene(d)"></i></small>
          </span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./documentos-celda.component.scss'],
})
export class DocumentosCeldaComponent {
  @Input() docs: DocumentoCelda[] = [];
  @Output() ver = new EventEmitter<DocumentoCelda>();

  tiene(d: DocumentoCelda): boolean {
    const u = String(d?.url ?? '').trim();
    return !!u && u !== 'null' && u !== 'undefined';
  }

  get cargados(): number { return this.docs.filter((d) => this.tiene(d)).length; }
  get pct(): number { return this.docs.length ? Math.round((this.cargados / this.docs.length) * 100) : 0; }

  extension(d: DocumentoCelda): string {
    const m = String(d.url || '').split(/[?#]/)[0].match(/\.([a-z0-9]{2,4})$/i);
    return (m?.[1] || 'doc').toUpperCase();
  }
}
