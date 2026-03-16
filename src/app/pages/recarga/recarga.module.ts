import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecargaRoutingModule } from './recarga-routing.module';
import { RecargaComponent } from './recarga.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UIModule } from 'src/app/shared/ui/ui.module';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { NgStepperModule } from 'angular-ng-stepper';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { DxSelectBoxModule } from 'devextreme-angular';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [RecargaComponent],
  imports: [
    CommonModule,
    RecargaRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    UIModule,
    CdkStepperModule,
    NgStepperModule,
    NgSelectModule,
    SharedModule,
    DxSelectBoxModule,
    NgbModalModule,
    NgbTooltipModule
  ]
})
export class RecargaModule { }
