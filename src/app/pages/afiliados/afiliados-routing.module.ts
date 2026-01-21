import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaAfiliadosComponent } from './lista-afiliados/lista-afiliados.component';
import { AgregarAfiliadoComponent } from './agregar-afiliado/agregar-afiliado.component';

const routes: Routes = [
  { path: '', component: ListaAfiliadosComponent },
  { path: 'agregar-afiliado', component: AgregarAfiliadoComponent },
  { path: 'editar-afiliado/:idAfiliado', component: AgregarAfiliadoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AfiliadosRoutingModule { }
