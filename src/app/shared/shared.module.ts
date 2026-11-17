import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UIModule } from './ui/ui.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UIModule
  ],
  exports: [UIModule]
})

export class SharedModule { }
