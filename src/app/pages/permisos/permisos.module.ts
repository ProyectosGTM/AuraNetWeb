import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PermisosRoutingModule } from './permisos-routing.module';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { ListaPermisosComponent } from './lista-permisos/lista-permisos.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormModule } from '../form/form.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { AgregarPermisoComponent } from './agregar-permiso/agregar-permiso.component';


@NgModule({
  declarations: [ListaPermisosComponent, AgregarPermisoComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    FormModule,
    PermisosRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class PermisosModule { }
