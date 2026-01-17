import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TesoreriaRoutingModule } from './tesoreria-routing.module';
import { ListaTesoreriaComponent } from './lista-tesoreria/lista-tesoreria.component';
import { AgregarTesoreriaComponent } from './agregar-tesoreria/agregar-tesoreria.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    ListaTesoreriaComponent,
    AgregarTesoreriaComponent
  ],
  imports: [
    CommonModule,
    TesoreriaRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class TesoreriaModule { }
