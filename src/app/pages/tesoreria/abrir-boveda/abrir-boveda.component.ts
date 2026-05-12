import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import Swal from 'sweetalert2';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import {
  aplicarMontoBlurEnCampo,
  aplicarMontoInputEnCampo,
  textoMontoDesdeValorControl,
} from 'src/app/shared/utils/monto-input-formato.util';

@Component({
  selector: 'app-abrir-boveda',
  templateUrl: './abrir-boveda.component.html',
  styleUrl: './abrir-boveda.component.scss',
  animations: [fadeInRightAnimation],
})
export class AbrirBovedaComponent implements OnInit, AfterViewInit {
  /** Popup al body: evita listas cortadas por overflow en la tarjeta de turnos. */
  readonly selectDropDownOptions = { container: 'body', hideOnParentScroll: false };

  abrirTesoreriaForm: FormGroup;
  public listaSalas: any[] = [];
  /** Cajas filtradas por la sala seleccionada (origen: GET /cajas/list). */
  public listaCajas: any[] = [];
  private listaCajasTodas: any[] = [];
  public listaUsuarios: any[] = [];
  public mapaUsuarios: Map<string, any> = new Map();

  @ViewChild('inpFondoInicialBoveda', { static: false }) inpFondoInicialBoveda?: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private tesoreriaService: TesoreriaService,
    private fb: FormBuilder,
    private salasService: SalaService,
    private cajasService: CajasService,
    private usuService: UsuariosService,
    private authService: AuthenticationService,
    private rolAcceso: RolAccesoService,
  ) {
    this.abrirTesoreriaForm = this.fb.group({
      idSala: [null, Validators.required],
      fondoInicial: [null as number | null, [Validators.required, Validators.min(0.01)]],
      observaciones: [''],
      turnosAbrir: this.fb.array([], this.minLengthArray(1))
    });
  }

  // Validador personalizado para requerir al menos un elemento en el array
  minLengthArray(min: number) {
    return (control: any) => {
      if (!control.value || control.value.length < min) {
        return { minLengthArray: { requiredLength: min, actualLength: control.value?.length || 0 } };
      }
      return null;
    };
  }

  ngOnInit() {
    this.cargarListas();
    this.abrirTesoreriaForm.get('idSala')?.valueChanges.subscribe((idSala) => {
      this.refrescarOpcionesCajasPorSala(idSala);
    });
    // Agregar un turno inicial automáticamente
    this.agregarTurnoAbrir();
    this.obtenerUsuarios();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.refrescarVistaFondoInicialBoveda();
      for (let i = 0; i < this.turnosAbrirArray.length; i++) {
        this.refrescarVistaMontoTurno(i);
      }
    });
  }

  /**
   * Misma lógica que en monederos (`mapearCajasDisponiblesParaSelect`): /cajas/list puede traer
   * "Disponible" con id numérico distinto de 1/2 (p. ej. 5); sin esto el select queda vacío.
   */
  private esCajaDisponibleParaAbrirBoveda(c: any): boolean {
    const estatus = Number(c.idEstatusCaja ?? c.IdEstatusCaja ?? NaN);
    if (estatus === 1 || estatus === 2 || estatus === 5) {
      return true;
    }
    const cod = String(
      c.codigoEstatusCaja ??
        c.CodigoEstatusCaja ??
        c.nombreEstatusCaja ??
        c.NombreEstatusCaja ??
        '',
    )
      .trim()
      .toUpperCase();
    return cod === 'DISPONIBLE';
  }

  /**
   * Actualiza el select de cajas según la sala (mismo listado que recarga /cajas/list).
   */
  private refrescarOpcionesCajasPorSala(idSala: number | string | null | undefined): void {
    const sid = idSala === null || idSala === undefined || idSala === '' ? null : Number(idSala);
    if (sid === null || Number.isNaN(sid)) {
      // Sin sala: mostrar todas las cajas cargadas para que el select tenga datos (al elegir sala se acota).
      this.listaCajas = [...this.listaCajasTodas];
      this.limpiarCajasInvalidasEnTurnos(new Set(this.listaCajasTodas.map((c: any) => Number(c.id))));
      return;
    }
    this.listaCajas = this.listaCajasTodas.filter((c: any) => Number(c.idSala) === sid);
    const validIds = new Set(this.listaCajas.map((c: any) => Number(c.id)));
    this.limpiarCajasInvalidasEnTurnos(validIds);
  }

  private limpiarCajasInvalidasEnTurnos(validIds: Set<number>): void {
    this.turnosAbrirArray.controls.forEach((ctrl) => {
      const idCaja = ctrl.get('idCaja')?.value;
      if (idCaja == null || idCaja === '') {
        return;
      }
      if (validIds.size === 0 || !validIds.has(Number(idCaja))) {
        ctrl.get('idCaja')?.setValue(null, { emitEvent: false });
      }
    });
  }

  obtenerUsuarios() {
    const user = this.authService.getUser();
    const idCliente = Number(user?.idCliente);
    if (!Number.isFinite(idCliente) || idCliente <= 0) {
      this.listaUsuarios = [];
      this.mapaUsuarios = new Map();
      return;
    }

    this.usuService.obtenerUsuariosRolOperador(idCliente).subscribe((response) => {
      const data = response.data || [];
      this.listaUsuarios = data.map((u: any) => {
        const idRaw = u.id ?? u.Id;
        const id = Number(idRaw);
        const nombre = u.Nombre || u.nombre || '';
        const apellidoPaterno = u.ApellidoPaterno || u.apellidoPaterno || '';
        const apellidoMaterno = u.ApellidoMaterno || u.apellidoMaterno || '';
        const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();

        return {
          id,
          text: nombreCompleto || u.usuario || u.correo || String(id)
        };
      });
      this.mapaUsuarios = new Map(
        (this.listaUsuarios || []).map((u: any) => [String(u.id), u])
      );
    });
  }

  cargarListas() {
    forkJoin({
      salas: this.salasService.obtenerSalas(),
      cajas: this.cajasService.obtenerCajas()
    }).subscribe({
      next: (responses) => {
        this.listaSalas = (responses.salas.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id ?? s.idSala ?? s.IdSala ?? 0),
          text: `${s.nombreSala || ''}${s.nombreComercialSala ? ' - ' + s.nombreComercialSala : ''}`.trim() || 'Sala sin nombre'
        }));

        const cajasData = responses.cajas?.data ?? responses.cajas ?? [];
        const cajasArray = Array.isArray(cajasData) ? cajasData : [];
        const cajasDisponibles = cajasArray.filter((c: any) => this.esCajaDisponibleParaAbrirBoveda(c));
        this.listaCajasTodas = cajasDisponibles.map((c: any) => ({
          ...c,
          id: Number(c.id ?? c.Id),
          idSala: Number(c.idSala ?? c.IdSala ?? 0),
          text: `${c.codigo || c.Codigo || ''} - ${c.nombre || c.Nombre || ''}`.trim() || 'Caja sin nombre',
        }));
        this.refrescarOpcionesCajasPorSala(this.abrirTesoreriaForm.get('idSala')?.value);
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

  get turnosAbrirArray(): FormArray {
    return this.abrirTesoreriaForm.get('turnosAbrir') as FormArray;
  }

  agregarTurnoAbrir() {
    const turnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      fondoInicial: [null as number | null, [Validators.required, Validators.min(0.01)]],
      /** Opcional: si no se elige, el backend asigna al usuario que abre la bóveda (Swagger). */
      idUsuario: [null],
    });
    this.turnosAbrirArray.push(turnoForm);
    const idx = this.turnosAbrirArray.length - 1;
    setTimeout(() => this.refrescarVistaMontoTurno(idx), 0);
  }

  eliminarTurnoAbrir(index: number) {
    if (this.turnosAbrirArray.length <= 1) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Debe haber al menos un turno de caja. No se puede eliminar el último turno.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    this.turnosAbrirArray.removeAt(index);
  }

  guardarAbrirTesoreria() {
    const raw = this.abrirTesoreriaForm.getRawValue();
    const idSala = Number(raw.idSala);
    if (!Number.isFinite(idSala) || idSala <= 0) {
      Swal.fire({
        title: 'Elige la sala',
        text: 'Indica en qué sala vas a abrir la bóveda. Es el primer dato que debes elegir.',
        icon: 'info',
        background: '#0d121d',
        color: '#e2e8f0',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const fondoBoveda = Number(raw.fondoInicial);
    if (!Number.isFinite(fondoBoveda) || fondoBoveda <= 0) {
      Swal.fire({
        title: 'Dinero de la bóveda',
        text: 'Escribe cuánto dinero hay en la bóveda al abrirla. Debe ser un número mayor que cero.',
        icon: 'info',
        background: '#0d121d',
        color: '#e2e8f0',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const turnosArray = this.turnosAbrirArray;
    if (turnosArray.length === 0) {
      Swal.fire({
        title: 'Faltan turnos de caja',
        text: 'Agrega al menos un turno: cada uno es una caja con su dinero inicial.',
        icon: 'info',
        background: '#0d121d',
        color: '#e2e8f0',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    for (let i = 0; i < turnosArray.length; i++) {
      const g = turnosArray.at(i) as FormGroup;
      const idCaja = Number(g.get('idCaja')?.value);
      if (!Number.isFinite(idCaja) || idCaja <= 0) {
        Swal.fire({
          title: 'Revisa la caja',
          text: `En el turno ${i + 1}, elige la caja que corresponde.`,
          icon: 'info',
          background: '#0d121d',
          color: '#e2e8f0',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
        return;
      }
      const fondoTurno = Number(g.get('fondoInicial')?.value);
      if (!Number.isFinite(fondoTurno) || fondoTurno <= 0) {
        Swal.fire({
          title: 'Revisa el dinero del turno',
          text: `En el turno ${i + 1}, escribe el dinero con el que abre la caja. Debe ser mayor que cero.`,
          icon: 'info',
          background: '#0d121d',
          color: '#e2e8f0',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
        return;
      }
      const idUsuarioRaw = g.get('idUsuario')?.value;
      if (idUsuarioRaw != null && idUsuarioRaw !== '') {
        const idUsuario = Number(idUsuarioRaw);
        if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
          Swal.fire({
            title: 'Usuario del turno',
            text: `En el turno ${i + 1}, si eliges usuario debe ser uno válido. Si no, deja el campo vacío y el sistema lo asigna solo.`,
            icon: 'info',
            background: '#0d121d',
            color: '#e2e8f0',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Entendido',
          });
          return;
        }
      }
    }

    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('abrirTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('abrirTesoreriaDelDia');
      return;
    }

    const observacionesTrim = (raw.observaciones ?? '').toString().trim();
    const turnosAbrir = turnosArray.controls.map((control) => {
      const idUsuarioRaw = control.get('idUsuario')?.value;
      const idUsuarioNum =
        idUsuarioRaw != null && idUsuarioRaw !== '' ? Number(idUsuarioRaw) : NaN;
      const item: { idCaja: number; fondoInicial: number; idUsuario?: number } = {
        idCaja: Number(control.get('idCaja')?.value),
        fondoInicial: Number(control.get('fondoInicial')?.value ?? 0),
      };
      if (Number.isFinite(idUsuarioNum) && idUsuarioNum > 0) {
        item.idUsuario = Math.trunc(idUsuarioNum);
      }
      return item;
    });

    const payload: {
      idSala: number;
      fondoInicial: number;
      turnosAbrir: { idCaja: number; fondoInicial: number; idUsuario?: number }[];
      observaciones?: string;
    } = {
      idSala: Math.trunc(idSala),
      fondoInicial: fondoBoveda,
      turnosAbrir,
    };
    if (observacionesTrim) {
      payload.observaciones = observacionesTrim;
    }

    this.tesoreriaService.abrirTesoreria(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha abierto la boveda de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.router.navigate(['/tesoreria']);
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error?.message || error.error || 'No se pudo abrir la boveda.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cancelar() {
    this.router.navigate(['/tesoreria']);
  }

  /** Control numérico del monto (misma fuente que el body); `null` = bóveda principal. */
  private controlMonto(indexTurno: number | null) {
    if (indexTurno === null) {
      return this.abrirTesoreriaForm.get('fondoInicial');
    }
    const g = this.turnosAbrirArray.at(indexTurno) as FormGroup | null;
    return g?.get('fondoInicial') ?? null;
  }

  onMontoCampoInput(ev: Event, indexTurno: number | null): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, this.controlMonto(indexTurno));
  }

  onMontoCampoBlur(ev: Event, indexTurno: number | null): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, this.controlMonto(indexTurno));
  }

  private refrescarVistaFondoInicialBoveda(): void {
    const el = this.inpFondoInicialBoveda?.nativeElement;
    if (!el) {
      return;
    }
    el.value = textoMontoDesdeValorControl(this.abrirTesoreriaForm.get('fondoInicial')?.value);
  }

  /** Sincroniza el texto del input de monto de un turno tras agregar filas al array. */
  private refrescarVistaMontoTurno(indexTurno: number): void {
    const host = document.querySelector(
      `[data-turno-monto-index="${indexTurno}"]`,
    ) as HTMLInputElement | null;
    if (!host) {
      return;
    }
    host.value = textoMontoDesdeValorControl(this.controlMonto(indexTurno)?.value);
  }
}