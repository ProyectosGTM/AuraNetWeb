import { SharedModule } from 'src/app/shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BitacoraRoutingModule } from './bitacora-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { BitacoraComponent } from './bitacora.component';


@NgModule({
  declarations: [BitacoraComponent],
  imports: [
    SharedModule,
    CommonModule,
    BitacoraRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule
  ]
})
export class BitacoraModule { }
