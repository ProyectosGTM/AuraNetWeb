import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTurnosComponent } from './lista-turnos/lista-turnos.component';
import { AbrirTurnoComponent } from './abrir-turno/abrir-turno.component';

const routes: Routes = [
  { path: '',
    component: ListaTurnosComponent
  },
  { path: 'abrir-turno',
    component: AbrirTurnoComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnosRoutingModule { }
