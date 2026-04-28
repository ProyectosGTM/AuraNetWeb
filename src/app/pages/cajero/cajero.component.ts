import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { CajeroService } from './cajero.service';
import { TicketCaja } from './models/ticket-caja.model';

@Component({
  selector: 'app-cajero',
  templateUrl: './cajero.component.html',
  styleUrl: './cajero.component.scss',
  animations: [fadeInRightAnimation],
})
export class CajeroComponent implements OnInit, OnDestroy {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid?: DxDataGridComponent;

  tickets: TicketCaja[] = [];
  selectedTicket: TicketCaja | null = null;
  gruposExpandidos = true;
  saldado = 0;
  faltante = 0;
  dtoVista: Record<string, unknown> | null = null;
  readonly mensajeAgrupar =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly cajeroService: CajeroService) {}

  ngOnInit(): void {
    this.recargarTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  recargarTickets(): void {
    this.cajeroService
      .cargarTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rows) => {
        this.tickets = rows;
        this.selectedTicket = null;
        this.dtoVista = null;
        setTimeout(() => this.syncGridSelection(), 0);
      });
  }

  toggleExpandGroups(): void {
    const inst = this.dataGrid?.instance;
    if (!inst) {
      return;
    }
    if (this.gruposExpandidos) {
      inst.collapseAll();
    } else {
      inst.expandAll();
    }
    this.gruposExpandidos = !this.gruposExpandidos;
  }

  onSelectionChanged(e: { selectedRowsData?: TicketCaja[] }): void {
    const row = e.selectedRowsData?.[0] ?? null;
    this.applySelection(row);
  }

  onCardSelected(ticket: TicketCaja): void {
    this.applySelection(ticket);
    setTimeout(() => this.syncGridSelection(), 0);
  }

  seleccionarMetodoPago(codigo: string): void {
    this.dtoVista = {
      metodo: codigo,
      ticketId: this.selectedTicket?.id ?? null,
      ts: new Date().toISOString(),
    };
    // Valores de demostración; enlazar a lógica real de cobro cuando exista.
    this.saldado = this.selectedTicket ? 1280.5 : 0;
    this.faltante = this.selectedTicket ? 0 : 320;
  }

  cancelarOperacion(): void {
    this.selectedTicket = null;
    this.dtoVista = null;
    this.saldado = 0;
    this.faltante = 0;
    this.syncGridSelection();
  }

  trackById(_: number, t: TicketCaja): number {
    return t.id;
  }

  private applySelection(row: TicketCaja | null): void {
    this.selectedTicket = row;
    if (row) {
      this.dtoVista = { ticket: row, subcuentas: [] };
      this.saldado = 0;
      this.faltante = 0;
    } else {
      this.dtoVista = null;
      this.saldado = 0;
      this.faltante = 0;
    }
  }

  private syncGridSelection(): void {
    const inst = this.dataGrid?.instance;
    if (!inst) {
      return;
    }
    const key = this.selectedTicket?.id;
    if (key != null) {
      inst.selectRows([key], false);
    } else {
      inst.deselectAll();
    }
  }
}
