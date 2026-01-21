import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AfiliadosRoutingModule } from './afiliados-routing.module';
import { ListaAfiliadosComponent } from './lista-afiliados/lista-afiliados.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { AgregarAfiliadoComponent } from './agregar-afiliado/agregar-afiliado.component';

@NgModule({
  declarations: [ListaAfiliadosComponent, AgregarAfiliadoComponent],
  imports: [
    CommonModule,
    AfiliadosRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class AfiliadosModule { }
