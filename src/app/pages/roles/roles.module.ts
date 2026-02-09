import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RolesRoutingModule } from './roles-routing.module';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaRolesComponent } from './lista-roles/lista-roles.component';
import { AgregarRolComponent } from './agregar-rol/agregar-rol.component';


@NgModule({
  declarations: [
    ListaRolesComponent,
    AgregarRolComponent
  ],
  imports: [
    CommonModule,
    RolesRoutingModule,
    NgbTooltipModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class RolesModule { }
