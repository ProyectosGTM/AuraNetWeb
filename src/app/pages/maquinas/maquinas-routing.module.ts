import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaMaquinasComponent } from './lista-maquinas/lista-maquinas.component';
import { AgregarMaquinaComponent } from './agregar-maquina/agregar-maquina.component';

const routes: Routes = 
[
  { path: '',
    component: ListaMaquinasComponent
  },
  { path: 'agregar-maquina',
    component: AgregarMaquinaComponent
  },
  {
    path: 'editar-maquina/:idMaquina',
    component: AgregarMaquinaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaquinasRoutingModule { }
