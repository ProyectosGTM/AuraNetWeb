import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTesoreriaComponent } from './lista-tesoreria/lista-tesoreria.component';
import { AgregarTesoreriaComponent } from './agregar-tesoreria/agregar-tesoreria.component';
import { AbrirBovedaComponent } from './abrir-boveda/abrir-boveda.component';

const routes: Routes = [
  { path: '',
    component: ListaTesoreriaComponent
  },
  { path: 'agregar-tesoreria',
    component: AgregarTesoreriaComponent
  },
  {
    path: 'editar-tesoreria/:idTesoreria',
    component: AgregarTesoreriaComponent,
  },
  { path: 'abrir-boveda',
    component: AbrirBovedaComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TesoreriaRoutingModule { }
