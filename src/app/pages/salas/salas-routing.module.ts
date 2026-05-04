import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaSalasComponent } from './lista-salas/lista-salas.component';
import { AgregarSalaComponent } from './agregar-sala/agregar-sala.component';
import { AgregarZonaComponent } from '../zonas/agregar-zona/agregar-zona.component';

const routes: Routes = 
[
  { path: '',
    component: ListaSalasComponent
  },
  { path: 'agregar-sala',
    component: AgregarSalaComponent
  },
  {
    path: 'distribucion/:idSala',
    component: AgregarZonaComponent,
    data: { modoDistribucionSala: true },
  },
  {
    path: 'editar-sala/:idSala',
    component: AgregarSalaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalasRoutingModule { }
