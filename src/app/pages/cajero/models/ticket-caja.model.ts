/** Fila de ticket / cuenta para vista cajero (grid y cards comparten el mismo modelo). */
export interface TicketCaja {
  id: number;
  cxp: string;
  ubicacion: string;
  mesa: string;
  mesero: string;
}
