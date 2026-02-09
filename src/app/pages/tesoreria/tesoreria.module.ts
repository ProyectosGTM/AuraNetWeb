import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TesoreriaRoutingModule } from './tesoreria-routing.module';
import { ListaTesoreriaComponent } from './lista-tesoreria/lista-tesoreria.component';
import { AgregarTesoreriaComponent } from './agregar-tesoreria/agregar-tesoreria.component';
import { AbrirBovedaComponent } from './abrir-boveda/abrir-boveda.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    ListaTesoreriaComponent,
    AgregarTesoreriaComponent,
    AbrirBovedaComponent
  ],
  imports: [
    CommonModule,
    TesoreriaRoutingModule,
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
export class TesoreriaModule { }
