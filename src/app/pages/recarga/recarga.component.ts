

import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { slideDownFadeAnimation, staggerFadeInAnimation } from 'src/app/core/slide-down-fade.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { TurnosService } from 'src/app/shared/services/turnos.service';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { PinSalaService } from 'src/app/shared/services/pin-sala.service';
import { mensajeError } from 'src/app/shared/utils/api-error';
import { AccionesSeguridadService } from 'src/app/shared/services/acciones-seguridad.service';

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

  private clockInterval: any;

  @ViewChild('resumenElement', { static: false }) resumenElement!: ElementRef;
  @ViewChild('modalAbrirTurno', { static: false }) modalAbrirTurno!: TemplateRef<any>;
  @ViewChild('modalCerrarTurno', { static: false }) modalCerrarTurno!: TemplateRef<any>;
  @ViewChild('modalDescargarMonedero', { static: false }) modalDescargarMonedero!: TemplateRef<any>;
  @ViewChild('modalConsultarSaldo', { static: false }) modalConsultarSaldo!: TemplateRef<any>;
  private modalRef?: NgbModalRef;

  // Formularios y listas para modales POS
  abrirTurnoForm: FormGroup;
  listaCajasAbrir: any[] = [];
  listaTesoreria: any[] = [];
  listaEstatusTurno: { id: number; text: string }[] = [];

  cerrarTurnoForm: FormGroup;
  listaTurnosActivos: any[] = [];

  descargarMonederoForm: FormGroup;
  listaTurnosDescargar: any[] = [];
  listaMonederosDescargar: any[] = [];

  consultarSaldoForm: FormGroup;
  saldoConsultado: any = null;
  consultandoSaldo = false;

  /** Cajero cierra el suyo; Gerente usa el cierre forzado (§6). */
  modoCierre: 'propio' | 'forzado' = 'propio';
  miTurno: any = null;
  saldoEsperadoCierre: number | null = null;
  /** La sala exige PIN del monedero (§13.4). */
  exigePin = true;

  /** Montos con 2 decimales como máximo (§6). */
  static dosDecimales(c: AbstractControl): ValidationErrors | null {
    const v = c.value;
    if (v === null || v === undefined || v === '') return null;
    return /^\d+(\.\d{1,2})?$/.test(String(v)) ? null : { decimales: true };
  }

  get diferenciaCierre(): number {
    const contado = Number(this.cerrarTurnoForm?.value?.fondoContado || 0);
    return Math.round((contado - Number(this.saldoEsperadoCierre || 0)) * 100) / 100;
  }

  /** Monedero digital: el QR del teléfono resuelve el idMonedero y sigue el flujo de siempre (§13.7). */
  leerQrTelefono() {
    this.seg.leerQrMonedero().then((id) => {
      if (!id) return;
      if (!this.listaMonederos.some((m: any) => Number(m.id) === id)) {
        Swal.fire({ title: '¡Atención!', text: 'El monedero del QR no está en la lista de esta sala.', icon: 'warning', background: '#0d121d', confirmButtonColor: '#3085d6' });
        return;
      }
      this.recargaForm.patchValue({ idMonedero: id });
      this.onMonederoChanged({ value: id });
    });
  }

  private alertaError(e: any, porDefecto: string) {
    Swal.fire({ title: '¡Ops!', text: mensajeError(e, porDefecto), icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
  }

  constructor(
    private fb: FormBuilder,
    private cajasService: CajasService,
    private monederosService: MonederosServices,
    private turnosService: TurnosService,
    private tesoreriaService: TesoreriaService,
    private modalService: NgbModal,
    private router: Router,
    private rolAcceso: RolAccesoService,
    private pinSala: PinSalaService,
    private seg: AccionesSeguridadService
  ) {
    this.recargaForm = this.fb.group({
      idCaja: [null, Validators.required],
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });

    this.abrirTurnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      idTesoreria: [null, Validators.required],
      idEstatusTurno: [null, Validators.required],
      fondoInicial: ['', [Validators.required, Validators.min(0)]]
    });

    this.cerrarTurnoForm = this.fb.group({
      idTurno: [null],
      fondoContado: ['', [Validators.required, Validators.min(0)]],
      motivo: [''],
      observaciones: ['']
    });

    this.descargarMonederoForm = this.fb.group({
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01), RecargaComponent.dosDecimales]],
      pin: ['']
    });

    this.consultarSaldoForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.cargarListas();
    this.startClock();
  }

  ngOnDestroy(): void {
    // ... tu código existente ...
    if (this.clockInterval) clearInterval(this.clockInterval);
  }
  
  private startClock(): void {
    const update = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const str = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const el = document.getElementById('vtClock');
      if (el) el.textContent = str;
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }
  

  cargarListas() {
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      monederos: this.monederosService.obtenerMonederos()
    }).subscribe({
      next: (responses) => {
        const cajasData = responses.cajas.data || [];
        // Para recarga mostramos todas las cajas activas (estatus 1 o 2)
        const cajasDisponibles = cajasData.filter((c: any) => {
          const estatus = Number(c.idEstatusCaja);
          return estatus === 1 || estatus === 2;
        });
        this.listaCajas = cajasDisponibles.map((c: any) => ({
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

  /** True si Caja o Monedero tienen valor (para mostrar el botón Limpiar). */
  get hayDatosEnSelectsRecarga(): boolean {
    const idCaja = this.recargaForm.get('idCaja')?.value;
    const idMonedero = this.recargaForm.get('idMonedero')?.value;
    const tiene = (v: unknown) => v != null && v !== '';
    return tiene(idCaja) || tiene(idMonedero);
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


  cerrarModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.abrirTurnoForm.reset();
      this.cerrarTurnoForm.reset();
      this.descargarMonederoForm.reset();
      this.consultarSaldoForm.reset();
      this.saldoConsultado = null;
    }
  }

  abrirModalAbrirTurno() {
    if (!this.rolAcceso.validar('abrirTurno')) return;
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      tesoreria: this.tesoreriaService.obtenerTesoreriaData(1, 100),
      estatusTurno: this.turnosService.obtenerEstatusTurno()
    }).subscribe({
      next: (r) => {
        const cajasData = r.cajas?.data || [];
        const cajasAbiertas = cajasData.filter((c: any) => Number(c.idEstatusCaja) === 2);
        this.listaCajasAbrir = cajasAbiertas.map((c: any) => ({
          ...c, id: Number(c.id), text: `${c.codigo || ''} - ${c.nombre || ''}`.trim()
        }));
        this.listaTesoreria = (r.tesoreria?.data || []).map((t: any) => ({
          ...t, id: Number(t.id), text: `${t.nombreComercialSala || ''} - ${this.formatearFecha(t.fecha)} - ${this.formatearMoneda(t.fondoInicial)}`.trim()
        }));
        this.listaEstatusTurno = (r.estatusTurno?.data || []).map((e: any) => ({
          id: Number(e.id), text: e.nombre || e.nombreEstatusTurno || ''
        }));
        this.abrirTurnoForm.reset();
        this.modalRef = this.modalService.open(this.modalAbrirTurno, {
          size: 'lg', windowClass: 'modal-holder modal-abrir-turno',
          centered: true, backdrop: 'static', keyboard: true
        });
      },
      error: () => Swal.fire({ title: 'Error', text: 'No se pudieron cargar las listas.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' })
    });
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return ''; }
  }

  guardarAbrirTurno() {
    if (this.abrirTurnoForm.invalid) return;
    const payload = {
      idCaja: this.abrirTurnoForm.value.idCaja,
      idTesoreria: this.abrirTurnoForm.value.idTesoreria,
      idEstatusTurno: this.abrirTurnoForm.value.idEstatusTurno,
      fondoInicial: Number(this.abrirTurnoForm.value.fondoInicial)
    };
    this.turnosService.abrirTurno(payload).subscribe({
      next: () => {
        Swal.fire({ title: '¡Éxito!', text: 'Turno abierto correctamente.', icon: 'success', background: '#0d121d', confirmButtonColor: '#3085d6' });
        this.cerrarModal();
        this.cargarListas();
      },
      error: (e) => Swal.fire({ title: 'Error', text: e?.error || 'No se pudo abrir el turno.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' })
    });
  }

  /** Saldo esperado del turno (para mostrar la diferencia del arqueo antes de confirmar). */
  private saldoEsperadoDe(t: any): number | null {
    const v = t?.saldoEsperado ?? t?.efectivoEsperado ?? t?.saldoActual ?? t?.saldo ?? null;
    return v === null || v === undefined || isNaN(Number(v)) ? null : Number(v);
  }

  abrirModalCerrarTurno() {
    const forzado = this.rolAcceso.puede('cerrarTurnoForzado');
    if (!forzado && !this.rolAcceso.validar('cerrarTurnoPropio')) return;
    this.modoCierre = forzado ? 'forzado' : 'propio';
    this.saldoEsperadoCierre = null;
    this.cerrarTurnoForm.reset({ idTurno: null, fondoContado: '', motivo: '', observaciones: '' });

    const motivo = this.cerrarTurnoForm.get('motivo')!;
    const idTurno = this.cerrarTurnoForm.get('idTurno')!;
    if (forzado) {
      motivo.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(500)]);
      idTurno.setValidators([Validators.required]);
    } else {
      motivo.clearValidators();
      idTurno.clearValidators();
    }
    motivo.updateValueAndValidity();
    idTurno.updateValueAndValidity();

    const abrir = () => {
      this.modalRef = this.modalService.open(this.modalCerrarTurno, {
        size: 'lg', windowClass: 'modal-holder modal-cerrar-turno',
        centered: true, backdrop: 'static', keyboard: true
      });
    };

    if (forzado) {
      this.turnosService.obtenerTurnosActivos().subscribe({
        next: (r) => {
          const data = r?.data ?? r ?? [];
          this.listaTurnosActivos = (Array.isArray(data) ? data : []).map((t: any) => ({
            ...t, id: Number(t.id ?? t.idTurno),
            text: `Turno #${t.id ?? t.idTurno} - ${t.codigoCaja || t.caja || ''} - ${t.nombreCajero || t.cajero || ''}`.trim()
          }));
          idTurno.valueChanges.subscribe((id) => {
            const t = this.listaTurnosActivos.find((x: any) => Number(x.id) === Number(id));
            this.saldoEsperadoCierre = this.saldoEsperadoDe(t);
          });
          abrir();
        },
        error: (e) => this.alertaError(e, 'No se pudieron cargar los turnos.')
      });
    } else {
      this.turnosService.obtenerMiTurnoActivo().subscribe({
        next: (r) => {
          this.miTurno = r?.data ?? r ?? null;
          if (!this.miTurno) {
            Swal.fire({ title: '¡Atención!', text: 'No tienes un turno activo.', icon: 'info', background: '#0d121d', confirmButtonColor: '#3085d6' });
            return;
          }
          this.saldoEsperadoCierre = this.saldoEsperadoDe(this.miTurno);
          abrir();
        },
        error: (e) => this.alertaError(e, 'No se pudo consultar tu turno activo.')
      });
    }
  }

  guardarCerrarTurno() {
    if (this.cerrarTurnoForm.invalid) return;
    const v = this.cerrarTurnoForm.value;
    const fondoContado = Number(v.fondoContado);
    const observaciones = (v.observaciones || '').trim() || null;

    const confirmarDiferencia = (): Promise<boolean> => {
      if (this.saldoEsperadoCierre === null || this.diferenciaCierre === 0) return Promise.resolve(true);
      return Swal.fire({
        title: '¡Turno Descuadrado!',
        html: `La diferencia es de <strong>${this.formatearMoneda(this.diferenciaCierre)}</strong>. El turno quedará <strong>Descuadrado</strong>. ¿Continuar?`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, Cerrar', cancelButtonText: 'Revisar',
        background: '#0d121d', confirmButtonColor: '#e40041'
      }).then((r) => !!r.isConfirmed);
    };

    confirmarDiferencia().then((ok) => {
      if (!ok) return;
      let peticion;
      if (this.modoCierre === 'forzado') {
        const turno = this.listaTurnosActivos.find((t: any) => Number(t.id) === Number(v.idTurno));
        const idCaja = Number(turno?.idCaja);
        if (!idCaja) { this.alertaError(null, 'No se pudo obtener la caja del turno seleccionado.'); return; }
        peticion = this.turnosService.cerrarTurnoForzado({ idCaja, fondoContado, motivo: (v.motivo || '').trim(), observaciones });
      } else {
        peticion = this.turnosService.cerrarTurno({ fondoContado, observaciones });
      }
      peticion.subscribe({
        next: () => {
          Swal.fire({ title: '¡Éxito!', text: 'Turno cerrado correctamente.', icon: 'success', background: '#0d121d', confirmButtonColor: '#3085d6' });
          this.cerrarModal();
          this.cargarListas();
        },
        error: (e) => this.alertaError(e, 'No se pudo cerrar el turno.')
      });
    });
  }

  abrirModalDescargarMonedero() {
    if (!this.rolAcceso.validar('descargarEfectivoMonedero')) return;
    forkJoin({
      monederos: this.monederosService.obtenerMonederos(),
      exigePin: this.pinSala.exigePin()
    }).subscribe({
      next: (r) => {
        this.exigePin = r.exigePin;
        const pin = this.descargarMonederoForm.get('pin')!;
        pin.setValidators(this.exigePin ? [Validators.required, Validators.pattern(/^\d{4,6}$/)] : [Validators.pattern(/^\d{4,6}$/)]);
        pin.updateValueAndValidity();
        this.listaMonederosDescargar = (r.monederos?.data || []).map((m: any) => {
          const nombreAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return { ...m, id: Number(m.id), text: `${m.numeroMonedero || ''} - ${m.alias || ''}`.trim(), nombreCompletoAfiliado: nombreAfiliado };
        });
        this.descargarMonederoForm.reset();
        this.modalRef = this.modalService.open(this.modalDescargarMonedero, {
          size: 'lg', windowClass: 'modal-holder modal-descargar',
          centered: true, backdrop: 'static', keyboard: true
        });
      },
      error: () => Swal.fire({ title: 'Error', text: 'No se pudieron cargar las listas.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' })
    });
  }

  guardarDescargarMonedero() {
    if (this.descargarMonederoForm.invalid) return;
    const v = this.descargarMonederoForm.value;
    const payload: { idMonedero: number; monto: number; pin?: string } = {
      idMonedero: Number(v.idMonedero),
      monto: Number(v.monto),
    };
    if (v.pin) payload.pin = String(v.pin);
    // El PIN no se conserva: se borra después de cada intento (§3).
    this.descargarMonederoForm.patchValue({ pin: '' });
    this.monederosService.descargarMonedero(payload).subscribe({
      next: () => {
        Swal.fire({ title: '¡Éxito!', text: 'Se descargó efectivo del monedero.', icon: 'success', background: '#0d121d', confirmButtonColor: '#3085d6' });
        this.cerrarModal();
        this.cargarListas();
      },
      error: (e) => this.alertaError(e, 'No se pudo descargar.')
    });
  }

  abrirModalConsultarSaldo() {
    this.consultarSaldoForm.reset();
    this.saldoConsultado = null;
    this.modalRef = this.modalService.open(this.modalConsultarSaldo, {
      size: 'md', windowClass: 'modal-holder modal-consultar-saldo',
      centered: true, backdrop: 'static', keyboard: true
    });
  }

  buscarSaldoMonedero() {
    if (this.consultarSaldoForm.invalid) return;
    const numero = (this.consultarSaldoForm.value.numero || '').trim();
    this.consultandoSaldo = true;
    this.monederosService.consultarSaldoMonedero(numero).subscribe({
      next: (r) => {
        this.consultandoSaldo = false;
        this.saldoConsultado = r?.data ?? r ?? r;
      },
      error: (e) => {
        this.consultandoSaldo = false;
        this.saldoConsultado = null;
        Swal.fire({ title: 'Error', text: e?.error?.message || e?.error || 'No se encontró el monedero.', icon: 'error', background: '#0d121d', confirmButtonColor: '#3085d6' });
      }
    });
  }
}
