import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurnosRoutingModule } from './turnos-routing.module';
import { ListaTurnosComponent } from './lista-turnos/lista-turnos.component';
import { AbrirTurnoComponent } from './abrir-turno/abrir-turno.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    ListaTurnosComponent,
    AbrirTurnoComponent
  ],
  imports: [
    CommonModule,
    TurnosRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NgbTooltipModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class TurnosModule { }
