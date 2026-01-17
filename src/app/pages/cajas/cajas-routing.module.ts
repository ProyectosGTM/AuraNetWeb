import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaCajasComponent } from './lista-cajas/lista-cajas.component';
import { AgregarCajaComponent } from './agregar-caja/agregar-caja.component';

const routes: Routes = [
  { path: '',
    component: ListaCajasComponent
  },
  { path: 'agregar-caja',
    component: AgregarCajaComponent
  },
  {
    path: 'editar-caja/:idCaja',
    component: AgregarCajaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CajasRoutingModule { }
