import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalasRoutingModule } from './salas-routing.module';
import { ListaSalasComponent } from './lista-salas/lista-salas.component';
import { AgregarSalaComponent } from './agregar-sala/agregar-sala.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ListaSalasComponent,
    AgregarSalaComponent
  ],
  imports: [
    CommonModule,
    SalasRoutingModule,
    NgbTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class SalasModule { }
