import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { CajeroRoutingModule } from './cajero-routing.module';
import { CajeroComponent } from './cajero.component';
import { TicketCardComponent } from './ticket-card/ticket-card.component';

@NgModule({
  declarations: [CajeroComponent, TicketCardComponent],
  imports: [CommonModule, CajeroRoutingModule, DxDataGridModule],
})
export class CajeroModule {}
