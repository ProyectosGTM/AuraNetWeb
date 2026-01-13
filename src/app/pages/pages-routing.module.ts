import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefaultComponent } from './dashboards/default/default.component';
import { CalendarComponent } from './calendar/calendar.component';
import { ChatComponent } from './chat/chat.component';
import { FileManagerComponent } from './file-manager/file-manager.component';

const routes: Routes = [
  // { path: '', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DefaultComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'chat', component: ChatComponent },
  { path:'file-manager',component:FileManagerComponent},
  { path: 'dashboards', loadChildren: () => import('./dashboards/dashboards.module').then(m => m.DashboardsModule) },
  { path: 'ecommerce', loadChildren: () => import('./ecommerce/ecommerce.module').then(m => m.EcommerceModule) },
  { path: 'email', loadChildren: () => import('./email/email.module').then(m => m.EmailModule) },
  { path: 'invoices', loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule) },
  { path: 'contacts', loadChildren: () => import('./contacts/contacts.module').then(m => m.ContactsModule) },  
  { path: 'pages', loadChildren: () => import('./utility/utility.module').then(m => m.UtilityModule) },
  { path: 'ui', loadChildren: () => import('./ui/ui.module').then(m => m.UiModule) },  
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'tables', loadChildren: () => import('./tables/tables.module').then(m => m.TablesModule) },
  { path: 'charts', loadChildren: () => import('./chart/chart.module').then(m => m.ChartModule) },
  { path: 'icons', loadChildren: () => import('./icons/icons.module').then(m => m.IconsModule) },
  { path: 'maps', loadChildren: () => import('./maps/maps.module').then(m => m.MapsModule) },

  { path: 'recarga', loadChildren: () => import('./recarga/recarga.module').then(m => m.RecargaModule)},
  { path: 'modulos', loadChildren: () => import('./modulos/modulos.module').then(m => m.ModulosModule)},
  { path: 'permisos', loadChildren: () => import('./permisos/permisos.module').then(m => m.PermisosModule)},
  { path: 'roles', loadChildren: () => import('./roles/roles.module').then(m => m.RolesModule)},
  { path: 'usuarios', loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule)},
  { path: 'bitacora', loadChildren: () => import('./bitacora/bitacora.module').then(m => m.BitacoraModule)},
  { path: 'clientes', loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesModule)},
  { path: 'salas', loadChildren: () => import('./salas/salas.module').then(m => m.SalasModule)},
  { path: 'monitoreo', loadChildren: () => import('./monitoreo/monitoreo.module').then(m => m.MonitoreoModule)},
  { path: 'zonas', loadChildren: () => import('./zonas/zonas.module').then(m => m.ZonasModule)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
