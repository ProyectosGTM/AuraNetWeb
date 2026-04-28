import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TicketCaja } from '../models/ticket-caja.model';

@Component({
  selector: 'app-ticket-card',
  templateUrl: './ticket-card.component.html',
  styleUrl: './ticket-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCardComponent {
  @Input({ required: true }) ticket!: TicketCaja;
  @Input() selected = false;
  @Output() selectTicket = new EventEmitter<TicketCaja>();

  onClick(): void {
    this.selectTicket.emit(this.ticket);
  }
}
