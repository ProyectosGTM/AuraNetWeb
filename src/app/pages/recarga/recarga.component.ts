import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { slideDownFadeAnimation, staggerFadeInAnimation } from 'src/app/core/slide-down-fade.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recarga',
  templateUrl: './recarga.component.html',
  styleUrl: './recarga.component.scss',
  animations: [fadeInRightAnimation, slideDownFadeAnimation, staggerFadeInAnimation],
})
export class RecargaComponent implements OnInit {

  recargaForm: FormGroup;
  public listaCajas: any[] = [];
  public listaMonederos: any[] = [];

  // Datos seleccionados para mostrar información adicional
  cajaSeleccionada: any = null;
  monederoSeleccionado: any = null;

  procesando: boolean = false;
  mostrarResumen: boolean = false;
  montoFocused: boolean = false;

  @ViewChild('resumenElement', { static: false }) resumenElement!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private cajasService: CajasService,
    private monederosService: MonederosServices,
    private router: Router
  ) {
    this.recargaForm = this.fb.group({
      idCaja: [null, Validators.required],
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.cargarListas();
  }

  cargarListas() {
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      monederos: this.monederosService.obtenerMonederos()
    }).subscribe({
      next: (responses) => {
        const cajasData = responses.cajas.data || [];
        const cajasAbiertas = cajasData.filter((c: any) => Number(c.idEstatusCaja) === 2);
        this.listaCajas = cajasAbiertas.map((c: any) => ({
          ...c,
          id: Number(c.id),
          text: `${c.codigo || ''} - ${c.nombre || ''}`.trim() || 'Caja sin nombre'
        }));

        this.listaMonederos = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: `${m.numeroMonedero || ''} - ${m.alias || ''}`.trim()
          };
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las listas necesarias.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  onCajaChanged(event: any) {
    const selectedId = event.value;
    if (selectedId) {
      const caja = this.listaCajas.find(c => c.id === selectedId);
      if (caja) {
        this.cajaSeleccionada = caja;
        this.verificarYMostrarResumen();
      }
    } else {
      this.cajaSeleccionada = null;
      this.mostrarResumen = false;
    }
  }

  onMonederoChanged(event: any) {
    const selectedId = event.value;
    if (selectedId) {
      const monedero = this.listaMonederos.find(m => m.id === selectedId);
      if (monedero) {
        this.monederoSeleccionado = monedero;
        this.verificarYMostrarResumen();
      }
    } else {
      this.monederoSeleccionado = null;
      this.mostrarResumen = false;
    }
  }

  verificarYMostrarResumen() {
    // Verificar si ambos están seleccionados y hay monto
    if (this.cajaSeleccionada && this.monederoSeleccionado && this.recargaForm.get('monto')?.value) {
      // Primero mostrar el resumen con animación
      this.mostrarResumen = true;
      
      // Esperar a que la animación comience y luego hacer scroll
      setTimeout(() => {
        this.scrollToResumen();
      }, 300); // Esperar a que la animación de entrada comience
    } else {
      this.mostrarResumen = false;
    }
  }

  scrollToResumen() {
    // Esperar a que el elemento esté disponible
    setTimeout(() => {
      if (this.resumenElement && this.resumenElement.nativeElement) {
        const element = this.resumenElement.nativeElement;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px de offset desde arriba

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  setMontoRapido(monto: number) {
    this.recargaForm.patchValue({ monto: monto });
    // Verificar si ya hay caja y monedero seleccionados
    setTimeout(() => {
      this.verificarYMostrarResumen();
    }, 100);
  }

  onMontoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = this.parseMontoInput(input.value);
    this.recargaForm.patchValue({ monto: raw }, { emitEvent: false });
    const formatted = this.formatMontoWhileTyping(raw);
    if (input.value !== formatted) {
      input.value = formatted;
      const len = formatted.length;
      setTimeout(() => input.setSelectionRange(len, len), 0);
    }
    this.verificarYMostrarResumen();
  }

  onMontoBlur(event: Event): void {
    this.montoFocused = false;
    const input = event.target as HTMLInputElement;
    const raw = this.parseMontoInput(input.value);
    this.recargaForm.patchValue({ monto: raw }, { emitEvent: false });
    if (raw > 0) {
      input.value = this.formatMontoFull(raw);
    }
    this.recargaForm.get('monto')?.markAsTouched();
    this.verificarYMostrarResumen();
  }

  onMontoChanged() {
    this.verificarYMostrarResumen();
  }

  private parseMontoInput(texto: string): number {
    if (!texto || texto.trim() === '') return 0;
    const limpio = texto.replace(/\$/g, '').replace(/,/g, '').replace(/[^\d.]/g, '');
    const partes = limpio.split('.');
    const parteEntera = partes[0] || '0';
    const parteDecimal = partes.length > 1 ? '.' + partes.slice(1).join('').slice(0, 2) : '';
    const num = parseFloat(parteEntera + parteDecimal);
    return isNaN(num) ? 0 : num;
  }

  private formatMontoWhileTyping(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined || valor === '' || valor === 0) return '';
    const n = Number(valor);
    if (isNaN(n)) return '';
    const partes = n.toString().split('.');
    const entera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimal = partes[1] !== undefined ? '.' + partes[1].slice(0, 2) : '';
    return '$' + entera + decimal;
  }

  private formatMontoFull(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const n = Number(valor);
    if (isNaN(n) || n === 0) return '';
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  get montoDisplay(): string {
    const val = this.recargaForm.get('monto')?.value;
    if (val === null || val === undefined || val === '' || val === 0) return '';
    return this.montoFocused ? this.formatMontoWhileTyping(val) : this.formatMontoFull(val);
  }

  formatearFechaHora(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return 'Sin registro';
    }
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '$0.00';
    return `$${Number(valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  procesarRecarga() {
    if (this.recargaForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor complete todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    const payload = {
      idCaja: this.recargaForm.value.idCaja,
      idMonedero: this.recargaForm.value.idMonedero,
      monto: Number(this.recargaForm.value.monto)
    };

    this.procesando = true;
    this.monederosService.cargarMonedero(payload).subscribe({
      next: (response) => {
        this.procesando = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha procesado la recarga de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/transacciones']);
          }
        });
        this.limpiarFormulario();
      },
      error: (error) => {
        this.procesando = false;
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo procesar la recarga.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  limpiarFormulario() {
    this.recargaForm.reset();
    this.cajaSeleccionada = null;
    this.monederoSeleccionado = null;
    this.mostrarResumen = false;
  }
}
