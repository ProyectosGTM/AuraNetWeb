import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PromocionesRoutingModule } from './promociones-routing.module';
import { ListaPromocionesComponent } from './lista-promociones/lista-promociones.component';

import { DxDataGridModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [ListaPromocionesComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PromocionesRoutingModule,
    DxDataGridModule,
    SharedModule,
  ],
})
export class PromocionesModule {}
