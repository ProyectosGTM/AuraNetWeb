import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PagetitleComponent } from './pagetitle/pagetitle.component';
import { LoaderComponent } from './loader/loader.component';
import { StatCardComponent } from './stat-card/stat-card.component';
import { FormPreviewComponent } from './form-preview/form-preview.component';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { MediaAvatarComponent } from './media-avatar/media-avatar.component';
import { CargandoComponent } from './cargando/cargando.component';
import { DocumentosCeldaComponent } from './documentos-celda/documentos-celda.component';

@NgModule({
  declarations: [PagetitleComponent, LoaderComponent, StatCardComponent, FormPreviewComponent, QrCodeComponent, MediaAvatarComponent, DocumentosCeldaComponent, CargandoComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [PagetitleComponent, LoaderComponent, StatCardComponent, FormPreviewComponent, QrCodeComponent, MediaAvatarComponent, DocumentosCeldaComponent, CargandoComponent]
})
export class UIModule { }
