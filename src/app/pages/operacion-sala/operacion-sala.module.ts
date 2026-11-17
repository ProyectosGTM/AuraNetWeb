import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { OperacionSalaComponent } from './operacion-sala.component';

@NgModule({
  declarations: [OperacionSalaComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild([{ path: '', component: OperacionSalaComponent }])],
})
export class OperacionSalaModule { }
