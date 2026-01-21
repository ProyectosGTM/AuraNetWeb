import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTurnosComponent } from './lista-turnos/lista-turnos.component';

const routes: Routes = [
  { path: '',
    component: ListaTurnosComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnosRoutingModule { }
