import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

export type StatTone = 'red' | 'green' | 'gold' | 'blue' | 'pink';

/**
 * Totalizador homologado de AuraNet.
 * Uso:    <app-stat-card label="Registrados" icon="fas fa-database" tone="red" [value]="total"></app-stat-card>
 * Página: <app-stat-card label="Página" icon="fas fa-layer-group" tone="gold" [value]="pag" [total]="totalPag"></app-stat-card>
 */
@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardComponent implements OnChanges, OnDestroy {
  @Input() label = '';
  @Input() icon = 'fas fa-chart-bar';
  @Input() tone: StatTone = 'red';
  @Input() value: number | string | null | undefined = 0;
  /** Si se indica, muestra "valor/total" y una barra de progreso. */
  @Input() total: number | null | undefined;
  @Input() loading = false;

  display = '0';
  private raf = 0;
  private shown = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  get hasTotal(): boolean { return this.total !== undefined; }
  get totalSafe(): number { return Math.max(Number(this.total) || 1, 1); }
  get progress(): number {
    const v = Number(this.value) || 0;
    return Math.min(100, Math.max(0, (v / this.totalSafe) * 100));
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (!ch['value']) { return; }
    const target = Number(this.value);
    if (this.value === null || this.value === undefined || this.value === '' || isNaN(target)) {
      cancelAnimationFrame(this.raf);
      this.display = this.value == null ? '0' : String(this.value);
      return;
    }
    this.animate(target);
  }

  private animate(target: number): void {
    cancelAnimationFrame(this.raf);
    const from = this.shown;
    const start = performance.now();
    const dur = 700;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      this.shown = Math.round(from + (target - from) * e);
      this.display = this.shown.toLocaleString('es-MX');
      this.cdr.markForCheck();
      if (p < 1) { this.raf = requestAnimationFrame(step); }
    };
    this.raf = requestAnimationFrame(step);
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); }
}
