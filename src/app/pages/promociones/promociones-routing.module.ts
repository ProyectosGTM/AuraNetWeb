import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaPromocionesComponent } from './lista-promociones/lista-promociones.component';

const routes: Routes = [
  { path: '', component: ListaPromocionesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromocionesRoutingModule {}
