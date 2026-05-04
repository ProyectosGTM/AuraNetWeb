import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgregarPromocionComponent } from './agregar-promocion/agregar-promocion.component';
import { ListaPromocionesComponent } from './lista-promociones/lista-promociones.component';

const routes: Routes = [
  { path: '', component: ListaPromocionesComponent },
  { path: 'agregar-promocion', component: AgregarPromocionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromocionesRoutingModule {}
