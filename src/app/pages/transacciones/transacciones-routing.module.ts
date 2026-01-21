import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTransaccionesComponent } from './lista-transacciones/lista-transacciones.component';

const routes: Routes = [
  { 
    path: '',
    component: ListaTransaccionesComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransaccionesRoutingModule { }
