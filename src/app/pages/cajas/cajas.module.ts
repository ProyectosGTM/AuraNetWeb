import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CajasRoutingModule } from './cajas-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaCajasComponent } from './lista-cajas/lista-cajas.component';
import { AgregarCajaComponent } from './agregar-caja/agregar-caja.component';


@NgModule({
  declarations: [ListaCajasComponent, AgregarCajaComponent],
  imports: [
    CommonModule,
    CajasRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class CajasModule { }
