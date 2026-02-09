import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonederosRoutingModule } from './monederos-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaMonederosComponent } from './lista-monederos/lista-monederos.component';
import { AgregarMonederoComponent } from './agregar-monedero/agregar-monedero.component';


@NgModule({
  declarations: [ListaMonederosComponent, AgregarMonederoComponent],
  imports: [
    CommonModule,
    MonederosRoutingModule,
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
export class MonederosModule { }
