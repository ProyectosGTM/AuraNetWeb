import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SegundoFactorService } from 'src/app/shared/services/segundo-factor.service';
import { mensajeError } from 'src/app/shared/utils/api-error';

/**
 * Alta obligatoria del segundo factor (ESPECIFICACION_FRONT §13.2).
 * 1) POST /segundo-factor/alta → QR de `uri` + `secreto` manual.
 * 2) POST /segundo-factor/activar { codigo } → 10 códigos de respaldo que se muestran UNA sola vez.
 */
@Component({
  selector: 'app-segundo-factor',
  templateUrl: './segundo-factor.component.html',
  styleUrls: ['./segundo-factor.component.scss'],
})
export class SegundoFactorComponent implements OnInit, OnDestroy {
  paso: 'cargando' | 'escanear' | 'respaldo' | 'error' = 'cargando';
  uri = '';
  secreto = '';
  emisor = '';
  codigo = '';
  activando = false;
  error: string | null = null;
  codigosRespaldo: string[] = [];
  copiado = false;
  confirmoGuardado = false;

  constructor(private sf: SegundoFactorService, private router: Router) { }

  ngOnDestroy(): void {
    document.body.classList.remove('authentication-bg');
  }

  ngOnInit(): void {
    document.body.classList.add('authentication-bg');
    this.iniciar();
  }

  iniciar(): void {
    this.paso = 'cargando';
    this.sf.alta().subscribe({
      next: (r: any) => {
        const d = r?.data ?? r;
        this.uri = d?.uri ?? '';
        this.secreto = d?.secreto ?? '';
        this.emisor = d?.emisor ?? 'AuraNet';
        this.paso = 'escanear';
      },
      error: (e) => {
        this.error = mensajeError(e, 'No se pudo iniciar el alta del segundo factor.');
        this.paso = 'error';
      },
    });
  }

  get secretoAgrupado(): string {
    return (this.secreto || '').replace(/(.{4})/g, '$1 ').trim();
  }

  get codigoValido(): boolean {
    return /^\d{6}$/.test((this.codigo || '').trim());
  }

  activar(): void {
    if (!this.codigoValido || this.activando) return;
    this.activando = true;
    this.error = null;
    this.sf.activar(this.codigo.trim()).subscribe({
      next: (r: any) => {
        this.activando = false;
        this.codigosRespaldo = (r?.data ?? r)?.codigosRespaldo ?? [];
        this.codigo = '';
        this.paso = 'respaldo';
      },
      error: (e) => {
        this.activando = false;
        this.codigo = '';
        this.error = mensajeError(e, 'Código incorrecto. Revisa la hora de tu teléfono e intenta con el siguiente código.');
      },
    });
  }

  copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).then(() => {
      this.copiado = true;
      setTimeout(() => (this.copiado = false), 1800);
    });
  }

  copiarCodigos(): void {
    this.copiar(this.codigosRespaldo.join('\n'));
  }

  imprimirCodigos(): void {
    const w = window.open('', '_blank', 'width=420,height=600');
    if (!w) return;
    const filas = this.codigosRespaldo.map((c) => `<li>${c}</li>`).join('');
    w.document.write(`<html><head><title>Códigos de Respaldo AuraNet</title>
      <style>body{font-family:monospace;padding:24px}h3{font-family:sans-serif}li{font-size:18px;margin:6px 0}</style>
      </head><body><h3>Códigos de Respaldo AuraNet</h3><p style="font-family:sans-serif">Cada código sirve una sola vez.</p>
      <ol>${filas}</ol></body></html>`);
    w.document.close();
    w.print();
  }

  continuar(): void {
    this.codigosRespaldo = [];
    Swal.fire({ background: '#0d121d', icon: 'success', title: '¡Segundo Factor Activo!', text: 'Tu cuenta quedó protegida.', confirmButtonText: 'Entrar' });
    this.router.navigate(['/dashboard']);
  }
}
