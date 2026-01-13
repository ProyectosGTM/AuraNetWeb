import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ZonasRoutingModule } from './zonas-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaZonasComponent } from './lista-zonas/lista-zonas.component';
import { AgregarZonaComponent } from './agregar-zona/agregar-zona.component';


@NgModule({
  declarations: [ListaZonasComponent, AgregarZonaComponent],
  imports: [
    CommonModule,
    ZonasRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class ZonasModule { }
