import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PromocionesRoutingModule } from './promociones-routing.module';
import { CatalogoPromocionesComponent } from './catalogo-promociones/catalogo-promociones.component';
import { DetallePromocionComponent } from './detalle-promocion/detalle-promocion.component';
import { PromocionesPorAfiliadoComponent } from './por-afiliado/por-afiliado.component';
import { PromocionesPorMonederoComponent } from './por-monedero/por-monedero.component';
import { RolloverPromocionesComponent } from './rollover/rollover.component';
import { PendientesConversionComponent } from './pendientes-conversion/pendientes-conversion.component';
import { ReportesPromocionesComponent } from './reportes/reportes.component';

import { DxDataGridModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    CatalogoPromocionesComponent,
    DetallePromocionComponent,
    PromocionesPorAfiliadoComponent,
    PromocionesPorMonederoComponent,
    RolloverPromocionesComponent,
    PendientesConversionComponent,
    ReportesPromocionesComponent,
  ],
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
