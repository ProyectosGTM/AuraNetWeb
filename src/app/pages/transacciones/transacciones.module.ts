import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransaccionesRoutingModule } from './transacciones-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaTransaccionesComponent } from './lista-transacciones/lista-transacciones.component';

@NgModule({
  declarations: [
    ListaTransaccionesComponent
  ],
  imports: [
    CommonModule,
    TransaccionesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class TransaccionesModule { }
