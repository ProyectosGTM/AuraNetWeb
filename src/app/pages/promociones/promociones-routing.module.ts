import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatalogoPromocionesComponent } from './catalogo-promociones/catalogo-promociones.component';
import { DetallePromocionComponent } from './detalle-promocion/detalle-promocion.component';
import { PendientesConversionComponent } from './pendientes-conversion/pendientes-conversion.component';
import { PromocionesPorAfiliadoComponent } from './por-afiliado/por-afiliado.component';
import { PromocionesPorMonederoComponent } from './por-monedero/por-monedero.component';
import { ReportesPromocionesComponent } from './reportes/reportes.component';
import { RolloverPromocionesComponent } from './rollover/rollover.component';

const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'catalogo', component: CatalogoPromocionesComponent },
  { path: 'catalogo/:id', component: DetallePromocionComponent },
  { path: 'por-afiliado', component: PromocionesPorAfiliadoComponent },
  { path: 'por-monedero', component: PromocionesPorMonederoComponent },
  { path: 'rollover', component: RolloverPromocionesComponent },
  { path: 'rollover/:id', component: RolloverPromocionesComponent },
  { path: 'pendientes-conversion', component: PendientesConversionComponent },
  { path: 'reportes', component: ReportesPromocionesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromocionesRoutingModule {}
