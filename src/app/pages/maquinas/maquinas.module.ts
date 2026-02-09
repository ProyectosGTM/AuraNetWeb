import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaquinasRoutingModule } from './maquinas-routing.module';
import { ListaMaquinasComponent } from './lista-maquinas/lista-maquinas.component';
import { AgregarMaquinaComponent } from './agregar-maquina/agregar-maquina.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ListaMaquinasComponent,
    AgregarMaquinaComponent
  ],
  imports: [
    CommonModule,
    MaquinasRoutingModule,
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
export class MaquinasModule { }
