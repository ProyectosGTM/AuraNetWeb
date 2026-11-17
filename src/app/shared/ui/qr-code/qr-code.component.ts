import { Component, Input, OnChanges } from '@angular/core';
import * as QRCode from 'qrcode';

/** QR generado en el navegador (el contenido nunca sale a un servicio externo). */
@Component({
  selector: 'app-qr-code',
  template: `
    <div class="qr" [style.width.px]="size" [style.height.px]="size">
      <img *ngIf="src; else cargando" [src]="src" alt="Código QR" [width]="size" [height]="size" />
      <ng-template #cargando><span class="qr-sk"></span></ng-template>
    </div>
  `,
  styles: [`
    .qr { padding: 10px; border-radius: 16px; background: #fff; box-shadow: 0 10px 30px -10px rgba(228,0,65,.55); display: grid; place-items: center; box-sizing: content-box; }
    .qr img { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
    .qr-sk { width: 100%; height: 100%; border-radius: 8px; background: linear-gradient(90deg,#eee,#f8f8f8,#eee); background-size: 200% 100%; animation: qr 1.2s linear infinite; }
    @keyframes qr { to { background-position: -200% 0; } }
  `],
})
export class QrCodeComponent implements OnChanges {
  @Input() data = '';
  @Input() size = 200;
  src: string | null = null;

  ngOnChanges(): void {
    this.src = null;
    if (!this.data) return;
    QRCode.toDataURL(this.data, { margin: 0, width: this.size * 2, errorCorrectionLevel: 'M' })
      .then((url) => (this.src = url))
      .catch(() => (this.src = null));
  }
}
