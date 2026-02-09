import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModulosRoutingModule } from './modulos-routing.module';
import { ListaModulosComponent } from './lista-modulos/lista-modulos.component';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { AgregarModuloComponent } from './agregar-modulo/agregar-modulo.component';


@NgModule({
  declarations: [ListaModulosComponent, AgregarModuloComponent],
  imports: [
    CommonModule,
    ModulosRoutingModule,
    NgbTooltipModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class ModulosModule { }
